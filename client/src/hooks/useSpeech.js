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

  // generation: incremented on every speak() call.
  // Every async step captures its gen at start and checks it before proceeding —
  // if the generation has moved on, a newer speak() won the race and this one exits.
  const $ = useRef({
    audio:      null,
    blobUrl:    null,
    generation: 0,
    eleven:     false,
  });

  // ── Check ElevenLabs on mount ─────────────────────────────────────────────
  useEffect(() => {
    const BACKEND = process.env.REACT_APP_API_URL
      ? process.env.REACT_APP_API_URL.replace(/\/api$/, '')
      : 'http://localhost:5000';
    fetch(`${BACKEND}/api/tts/status`)
      .then(r => r.json())
      .then(data => {
        $.current.eleven = !!data.available;
        setEleven(!!data.available);
      })
      .catch(() => { $.current.eleven = false; setEleven(false); });
  }, []);

  useEffect(() => { $.current.eleven = elevenAvailable; }, [elevenAvailable]);

  // ── STOP ─────────────────────────────────────────────────────────────────
  // Bumping generation is the key: any in-flight async speak() that checks
  // `myGen !== $.current.generation` will bail out immediately.
  const stop = useCallback(() => {
    $.current.generation += 1;
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
  const speakWithBrowser = useCallback((text, language, gen) => {
    if (gen !== $.current.generation) return;
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/[*_`#]/g, '').replace(/\n+/g, ' ').slice(0, 2000);
    const utt = new SpeechSynthesisUtterance(clean);
    utt.lang  = LANG_MAP[language] || 'en-IN';
    utt.rate  = 0.92; utt.pitch = 1.05;
    utt.onstart = () => { if (gen === $.current.generation) setSpeaking(true); };
    utt.onend   = () => { if (gen === $.current.generation) setSpeaking(false); };
    utt.onerror = () => { if (gen === $.current.generation) setSpeaking(false); };
    window.speechSynthesis.speak(utt);
  }, []);

  // ── ElevenLabs TTS ────────────────────────────────────────────────────────
  // Mobile note: audio.play() must be called inside a synchronous user-gesture
  // handler. We create the Audio element and run a silent play BEFORE the async
  // fetch to keep the iOS/Android audio permission chain alive.
  const speakWithElevenLabs = useCallback(async (text, language, gen) => {
    setLoadingAudio(true);

    const audio = new Audio();
    $.current.audio = audio;

    // Silent unlock play (keeps user-gesture chain alive on iOS/Android)
    audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
    try { await audio.play(); } catch(_) {}

    // Check after the silent-play await
    if (gen !== $.current.generation) { audio.src = ''; setLoadingAudio(false); return; }

    try {
      const { data: arrayBuffer } = await speakText({ text, language });

      // Check after the network round-trip
      if (gen !== $.current.generation) { audio.src = ''; setLoadingAudio(false); return; }

      const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
      const url  = URL.createObjectURL(blob);
      $.current.blobUrl = url;

      audio.onended = () => {
        if (gen === $.current.generation) setSpeaking(false);
        URL.revokeObjectURL(url);
        $.current.blobUrl = null;
        $.current.audio   = null;
      };
      audio.onerror = (e) => {
        console.error('[TTS] audio error:', e);
        if (gen !== $.current.generation) return;
        setSpeaking(false);
        setLoadingAudio(false);
        $.current.audio = null;
        speakWithBrowser(text, language, gen);
      };

      // Final check before playing real audio
      if (gen !== $.current.generation) {
        URL.revokeObjectURL(url);
        $.current.blobUrl = null;
        audio.src = '';
        setLoadingAudio(false);
        return;
      }

      audio.src = url;
      setLoadingAudio(false);
      setSpeaking(true);
      await audio.play();

    } catch (err) {
      if (gen !== $.current.generation) { setLoadingAudio(false); return; }
      console.error('[TTS] ElevenLabs error:', err.message);
      setLoadingAudio(false);
      speakWithBrowser(text, language, gen);
    }
  }, [speakWithBrowser]);

  // ── Public speak ──────────────────────────────────────────────────────────
  // stop() bumps generation first — every prior async flow will detect the
  // mismatch on its next await and exit without playing anything.
  const speak = useCallback((text, language = 'English') => {
    if (!text?.trim()) return;
    stop();                             // bumps generation, kills current audio
    const gen = $.current.generation;  // capture the new generation AFTER stop()
    if ($.current.eleven) {
      speakWithElevenLabs(text, language, gen);
    } else {
      speakWithBrowser(text, language, gen);
    }
  }, [stop, speakWithElevenLabs, speakWithBrowser]);

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
