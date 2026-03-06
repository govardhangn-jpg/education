import { useState, useRef, useCallback, useEffect } from 'react';
import { speakText, getTTSStatus } from '../utils/api';

const LANG_MAP = {
  English: 'en-IN', Kannada: 'kn-IN',
  Hindi: 'hi-IN', Telugu: 'te-IN', Tamil: 'ta-IN',
};

export function useTTS() {
  const [speaking,        setSpeaking]     = useState(false);
  const [loadingAudio,    setLoadingAudio] = useState(false);
  const [elevenAvailable, setEleven]       = useState(false);

  // Single stable ref — avoids ALL stale closure problems
  const $ = useRef({ audio: null, blobUrl: null, aborted: false, eleven: false });

  // ── Check ElevenLabs on mount ─────────────────────────────────────────────
  useEffect(() => {
    getTTSStatus()
      .then(({ data }) => {
        console.log('[TTS] Status:', data);
        $.current.eleven = !!data.available;
        setEleven(!!data.available);
      })
      .catch(err => {
        console.warn('[TTS] Status check error:', err.message);
        $.current.eleven = false;
        setEleven(false);
      });
  }, []);

  // Keep ref in sync
  useEffect(() => { $.current.eleven = elevenAvailable; }, [elevenAvailable]);

  // ── STOP ──────────────────────────────────────────────────────────────────
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
    console.log('[TTS] Using browser TTS, lang:', language);
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
  const speakWithElevenLabs = useCallback(async (text, language) => {
    stop();
    $.current.aborted = false;
    setLoadingAudio(true);
    console.log('[TTS] Calling ElevenLabs, language:', language);

    try {
      const { data: arrayBuffer } = await speakText({ text, language });
      if ($.current.aborted) { setLoadingAudio(false); return; }

      console.log('[TTS] Audio received:', arrayBuffer.byteLength, 'bytes');

      const blob  = new Blob([arrayBuffer], { type: 'audio/mpeg' });
      const url   = URL.createObjectURL(blob);
      const audio = new Audio();

      $.current.blobUrl = url;
      $.current.audio   = audio;

      audio.oncanplaythrough = () => {
        if ($.current.aborted) { audio.src = ''; return; }
        setLoadingAudio(false);
        setSpeaking(true);
        audio.play().catch(e => {
          console.error('[TTS] play() error:', e.message);
          setSpeaking(false);
        });
      };
      audio.onended = () => {
        console.log('[TTS] Finished playing');
        setSpeaking(false);
        URL.revokeObjectURL(url);
        $.current.blobUrl = null;
        $.current.audio   = null;
      };
      audio.onerror = () => {
        console.error('[TTS] Audio element error — falling back to browser TTS');
        setSpeaking(false);
        setLoadingAudio(false);
        $.current.audio = null;
        speakWithBrowser(text, language);
      };

      audio.src = url;
      audio.load();

    } catch (err) {
      if ($.current.aborted) { setLoadingAudio(false); return; }
      console.error('[TTS] ElevenLabs failed:', err.message, '— falling back to browser TTS');
      setLoadingAudio(false);
      speakWithBrowser(text, language);
    }
  }, [stop, speakWithBrowser]);

  // ── Public speak ──────────────────────────────────────────────────────────
  const speak = useCallback((text, language = 'English') => {
    if (!text?.trim()) return;
    console.log('[TTS] speak() | ElevenLabs:', $.current.eleven, '| lang:', language);
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
