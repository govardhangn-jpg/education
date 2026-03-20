import { useState, useRef, useCallback, useEffect } from 'react';

const BACKEND = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace(/\/api$/, '')
  : 'http://localhost:5000';

const LANG_MAP = {
  English: 'en-IN', Kannada: 'kn-IN',
  Hindi: 'hi-IN', Telugu: 'te-IN', Tamil: 'ta-IN',
};

// Detect iOS Safari
const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export function useTTS() {
  const [speaking,        setSpeaking]     = useState(false);
  const [loadingAudio,    setLoadingAudio] = useState(false);
  const [elevenAvailable, setEleven]       = useState(false);

  const $ = useRef({
    generation: 0,
    eleven:     false,
    audio:      null,   // HTMLAudioElement
    blobUrl:    null,
  });

  // Check ElevenLabs on mount
  useEffect(() => {
    fetch(`${BACKEND}/api/tts/status`)
      .then(r => r.json())
      .then(d => { $.current.eleven = !!d.available; setEleven(!!d.available); })
      .catch(() => { $.current.eleven = false; setEleven(false); });
  }, []);

  // ── STOP ────────────────────────────────────────────────────────────────
  const stop = useCallback(() => {
    $.current.generation += 1;
    const a = $.current.audio;
    if (a) {
      a.oncanplaythrough = a.onended = a.onerror = null;
      try { a.pause(); } catch(_) {}
      try { a.src = ''; } catch(_) {}
      try { a.load(); } catch(_) {}
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

  // ── Browser TTS fallback ─────────────────────────────────────────────────
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
    setSpeaking(true);
    setLoadingAudio(false);
  }, []);

  // ── ElevenLabs TTS ───────────────────────────────────────────────────────
  // iOS-safe approach:
  // 1. Create Audio element and call play() SYNCHRONOUSLY in the gesture handler
  //    (before any await). iOS grants audio permission at this point.
  // 2. Fetch audio data asynchronously.
  // 3. When data arrives, create a blob URL and set audio.src.
  //    iOS keeps the audio permission because play() was already called.
  const speakWithElevenLabs = useCallback(async (text, language, gen) => {
    setLoadingAudio(true);
    setSpeaking(false);

    const token = localStorage.getItem('samarthaa_token');

    if (isIOS()) {
      // ── iOS path: HTMLAudioElement with early play() ──────────────────
      // Step 1: Create audio element and call play() NOW (inside gesture)
      const audio = new Audio();
      audio.preload = 'auto';
      $.current.audio = audio;

      // play() must be called synchronously before any await on iOS
      // This "unlocks" audio for this element permanently
      audio.play().catch(() => {}); // may fail silently — that's OK at this point

      if (gen !== $.current.generation) { setLoadingAudio(false); return; }

      try {
        // Step 2: Fetch the audio data
        const r = await fetch(`${BACKEND}/api/tts/speak`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ text, language }),
        });

        if (gen !== $.current.generation) { setLoadingAudio(false); return; }
        if (!r.ok) throw new Error(`HTTP ${r.status}`);

        const buf  = await r.arrayBuffer();
        if (gen !== $.current.generation) { setLoadingAudio(false); return; }

        // Step 3: Create blob URL and assign to audio element
        const blob   = new Blob([buf], { type: 'audio/mpeg' });
        const url    = URL.createObjectURL(blob);
        $.current.blobUrl = url;

        audio.src = url;
        audio.onended = () => {
          if (gen === $.current.generation) { setSpeaking(false); setLoadingAudio(false); }
          URL.revokeObjectURL(url);
          $.current.blobUrl = null;
          $.current.audio   = null;
        };
        audio.onerror = () => {
          if (gen === $.current.generation) { setSpeaking(false); setLoadingAudio(false); }
          speakWithBrowser(text, language, gen);
        };

        setLoadingAudio(false);
        setSpeaking(true);

        // Step 4: play() again now that src is set — this is the actual playback
        await audio.play();

      } catch (err) {
        if (gen !== $.current.generation) return;
        console.warn('[TTS iOS]', err.message);
        setLoadingAudio(false);
        setSpeaking(false);
        speakWithBrowser(text, language, gen);
      }

    } else {
      // ── Non-iOS path: AudioContext (better for Android/Desktop) ──────
      let actx = $.current.actx;
      if (!actx || actx.state === 'closed') {
        actx = new (window.AudioContext || window.webkitAudioContext)();
        $.current.actx = actx;
      }
      // Play silent buffer synchronously to unlock AudioContext
      const silentBuf = actx.createBuffer(1, 1, 22050);
      const silentSrc = actx.createBufferSource();
      silentSrc.buffer = silentBuf;
      silentSrc.connect(actx.destination);
      silentSrc.start(0);
      if (actx.state === 'suspended') {
        try { await actx.resume(); } catch(_) {}
      }

      if (gen !== $.current.generation) { setLoadingAudio(false); return; }

      try {
        const r = await fetch(`${BACKEND}/api/tts/speak`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ text, language }),
        });

        if (gen !== $.current.generation) { setLoadingAudio(false); return; }
        if (!r.ok) throw new Error(`HTTP ${r.status}`);

        const arrayBuffer = await r.arrayBuffer();
        if (gen !== $.current.generation) { setLoadingAudio(false); return; }

        const audioBuffer = await new Promise((res, rej) =>
          actx.decodeAudioData(arrayBuffer.slice(0), res, rej)
        );

        if (gen !== $.current.generation) { setLoadingAudio(false); return; }

        if ($.current.sourceNode) {
          try { $.current.sourceNode.stop(); } catch(_) {}
          $.current.sourceNode.disconnect();
        }
        const source = actx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(actx.destination);
        $.current.sourceNode = source;

        source.onended = () => {
          if (gen === $.current.generation) setSpeaking(false);
          $.current.sourceNode = null;
        };

        setLoadingAudio(false);
        setSpeaking(true);
        source.start(0);

      } catch (err) {
        if (gen !== $.current.generation) return;
        console.warn('[TTS]', err.message);
        setLoadingAudio(false);
        speakWithBrowser(text, language, gen);
      }
    }
  }, [speakWithBrowser]);

  // ── Public speak ─────────────────────────────────────────────────────────
  const speak = useCallback((text, language = 'English') => {
    if (!text?.trim()) return;
    stop();
    const gen = $.current.generation;
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
    rec.onresult = (e) => onResult(e.results[0][0].transcript);
    rec.onend    = () => setListening(false);
    rec.onerror  = () => setListening(false);
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
