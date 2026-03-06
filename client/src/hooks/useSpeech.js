import { useState, useRef, useCallback, useEffect } from 'react';
import { speakText } from '../utils/api';

const LANG_MAP = {
  English: 'en-IN', Kannada: 'kn-IN',
  Hindi: 'hi-IN', Telugu: 'te-IN', Tamil: 'ta-IN',
};

export function useTTS() {
  const [speaking,        setSpeaking]     = useState(false);
  const [loadingAudio,    setLoadingAudio] = useState(false);
  const [elevenAvailable, setEleven]       = useState(false);

  const $ = useRef({ audio: null, blobUrl: null, aborted: false, eleven: false });

  // Check ElevenLabs status on mount
  useEffect(() => {
    const BACKEND = process.env.REACT_APP_API_URL
      ? process.env.REACT_APP_API_URL.replace(/\/api$/, '')
      : 'http://localhost:5000';
    fetch(`${BACKEND}/api/tts/status`)
      .then(r => r.json())
      .then(data => {
        console.log('[TTS] Status:', data);
        $.current.eleven = !!data.available;
        setEleven(!!data.available);
      })
      .catch(() => { $.current.eleven = false; setEleven(false); });
  }, []);

  useEffect(() => { $.current.eleven = elevenAvailable; }, [elevenAvailable]);

  // ── STOP ─────────────────────────────────────────────────────────────────
  const stop = useCallback(() => {
    $.current.aborted = true;
    const audio = $.current.audio;
    if (audio) {
      audio.onplay = audio.onended = audio.onerror = audio.oncanplaythrough = null;
      audio.pause();
      audio.currentTime = 0;
      audio.src = '';
      try { audio.load(); } catch(_) {}
      $.current.audio = null;
    }
    if ($.current.blobUrl) {
      URL.revokeObjectURL($.current.blobUrl);
      $.current.blobUrl = null;
    }
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    setLoadingAudio(false);
  }, []);

  // ── Browser TTS fallback ──────────────────────────────────────────────────
  const speakWithBrowser = useCallback((text, language) => {
    console.log('[TTS] Browser TTS, lang:', language);
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/[*_`#]/g, '').replace(/\n+/g, ' ').slice(0, 2000);
    const utt = new SpeechSynthesisUtterance(clean);
    utt.lang = LANG_MAP[language] || 'en-IN';
    utt.rate = 0.92; utt.pitch = 1.05;
    utt.onstart = () => setSpeaking(true);
    utt.onend   = () => setSpeaking(false);
    utt.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utt);
  }, []);

  // ── ElevenLabs TTS ────────────────────────────────────────────────────────
  // MOBILE FIX: Must call audio.play() synchronously inside a user-gesture
  // handler. We create and start the Audio element BEFORE the async fetch,
  // then swap in the blob URL once data arrives.
  const speakWithElevenLabs = useCallback(async (text, language) => {
    stop();
    $.current.aborted = false;
    setLoadingAudio(true);
    console.log('[TTS] ElevenLabs, lang:', language);

    // Create audio element immediately (inside the click handler = user gesture)
    const audio = new Audio();
    $.current.audio = audio;

    // Start a silent play immediately to "unlock" audio on iOS/Android
    // This keeps the user gesture chain alive through the async fetch
    audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
    try { await audio.play(); } catch(_) {}

    try {
      const { data: arrayBuffer } = await speakText({ text, language });
      if ($.current.aborted) { setLoadingAudio(false); audio.src = ''; return; }

      console.log('[TTS] Audio bytes:', arrayBuffer.byteLength);

      const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
      const url  = URL.createObjectURL(blob);
      $.current.blobUrl = url;

      audio.onended = () => {
        setSpeaking(false);
        URL.revokeObjectURL(url);
        $.current.blobUrl = null;
        $.current.audio   = null;
      };
      audio.onerror = (e) => {
        console.error('[TTS] audio error:', e);
        setSpeaking(false);
        setLoadingAudio(false);
        $.current.audio = null;
        speakWithBrowser(text, language);
      };

      // Swap in the real audio src and play
      audio.src = url;
      setLoadingAudio(false);
      setSpeaking(true);

      await audio.play();

    } catch (err) {
      if ($.current.aborted) { setLoadingAudio(false); return; }
      console.error('[TTS] ElevenLabs error:', err.message);
      setLoadingAudio(false);
      speakWithBrowser(text, language);
    }
  }, [stop, speakWithBrowser]);

  // ── Public speak ──────────────────────────────────────────────────────────
  const speak = useCallback((text, language = 'English') => {
    if (!text?.trim()) return;
    console.log('[TTS] speak() | eleven:', $.current.eleven, '| lang:', language);
    if ($.current.eleven) {
      speakWithElevenLabs(text, language);
    } else {
      speakWithBrowser(text, language);
    }
  }, [speakWithElevenLabs, speakWithBrowser]);

  return { speaking, loadingAudio, elevenAvailable, speak, stop };
}

// ── Speech Recognition ────────────────────────────────────────────────────────
export function useSpeechRecognition(onResult, lang = 'en-IN') {
  const recRef = useRef(null);
  const [listening, setListening] = useState(false);

  const start = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return alert('Speech recognition not supported. Please use Chrome.');
    const rec = new SR();
    rec.continuous = false; rec.interimResults = false; rec.lang = lang;
    rec.onresult   = (e) => onResult(e.results[0][0].transcript);
    rec.onend      = () => setListening(false);
    rec.onerror    = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  }, [onResult, lang]);

  const stop = useCallback(() => {
    recRef.current?.stop();
    setListening(false);
  }, []);

  return { listening, start, stop };
}
