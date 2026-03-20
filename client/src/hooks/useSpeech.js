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
    actx:       null,   // AudioContext — persists across calls, unlocked once
    sourceNode: null,   // current AudioBufferSourceNode
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
    // Stop AudioBufferSourceNode (iOS AudioContext path)
    if ($.current.sourceNode) {
      try { $.current.sourceNode.stop(); } catch(_) {}
      $.current.sourceNode.disconnect();
      $.current.sourceNode = null;
    }
    // Stop Audio element (Android / desktop fallback path)
    const audio = $.current.audio;
    if (audio) {
      audio.onplay = audio.onended = audio.onerror = audio.oncanplaythrough = null;
      try { audio.pause(); } catch(_) {}
      try { audio.currentTime = 0; } catch(_) {}
      try { audio.src = ''; } catch(_) {}
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
  // iOS Safari fix: we cannot reassign audio.src after an await — iOS revokes
  // the user-gesture audio unlock when .src changes asynchronously.
  // Solution: use AudioContext (unlocked once by the silent play, stays unlocked)
  // then decode the MP3 ArrayBuffer and play it through AudioBufferSourceNode.
  const speakWithElevenLabs = useCallback(async (text, language, gen) => {
    setLoadingAudio(true);

    // ── Step 1: Unlock AudioContext synchronously inside the user gesture ──
    // This must happen before any await. The AudioContext stays unlocked for
    // the entire session once resumed, even across async boundaries.
    let actx = $.current.actx;
    if (!actx || actx.state === 'closed') {
      actx = new (window.AudioContext || window.webkitAudioContext)();
      $.current.actx = actx;
    }

    // iOS Safari: play silent buffer SYNCHRONOUSLY first (before any await)
    // This satisfies iOS's "user gesture required" check.
    // ONLY THEN do we await resume() — order matters critically on iOS.
    const silentBuf = actx.createBuffer(1, 1, 22050);
    const silentSrc = actx.createBufferSource();
    silentSrc.buffer = silentBuf;
    silentSrc.connect(actx.destination);
    silentSrc.start(0); // synchronous — unlocks audio on iOS

    // Now safe to await — iOS audio is already unlocked
    if (actx.state === 'suspended') {
      try { await actx.resume(); } catch(_) {}
    }

    // Check generation after unlock
    if (gen !== $.current.generation) { setLoadingAudio(false); return; }

    try {
      const { data: arrayBuffer } = await speakText({ text, language });

      if (gen !== $.current.generation) { setLoadingAudio(false); return; }

      // ── Step 2: Decode the MP3 ArrayBuffer ──────────────────────────────
      // decodeAudioData works with MP3 on all modern iOS Safari versions
      let audioBuffer;
      try {
        // Use callback form of decodeAudioData — more reliable on iOS Safari
        audioBuffer = await new Promise((res, rej) =>
          actx.decodeAudioData(arrayBuffer.slice(0), res, rej)
        );
      } catch (decodeErr) {
        console.error('[TTS] decodeAudioData failed:', decodeErr);
        // Fallback: try playing via Audio element (non-iOS or older devices)
        const audio2 = new Audio();
        const blob2  = new Blob([arrayBuffer], { type:'audio/mpeg' });
        const url2   = URL.createObjectURL(blob2);
        $.current.blobUrl = url2;
        $.current.audio   = audio2;
        audio2.src = url2;
        audio2.onended = () => {
          if (gen === $.current.generation) setSpeaking(false);
          URL.revokeObjectURL(url2);
          $.current.blobUrl = null; $.current.audio = null;
        };
        audio2.onerror = () => { if (gen === $.current.generation) { setSpeaking(false); setLoadingAudio(false); } };
        setLoadingAudio(false); setSpeaking(true);
        try { await audio2.play(); } catch(_) { speakWithBrowser(text, language, gen); }
        return;
      }

      if (gen !== $.current.generation) { setLoadingAudio(false); return; }

      // ── Step 3: Play via AudioBufferSourceNode ───────────────────────────
      // Stop any previous source node
      if ($.current.sourceNode) {
        try { $.current.sourceNode.stop(); } catch(_) {}
        $.current.sourceNode.disconnect();
        $.current.sourceNode = null;
      }

      const source = actx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(actx.destination);
      $.current.sourceNode = source;
      $.current.audio = { pause:()=>{ try{source.stop();}catch(_){} }, currentTime:0, src:'', onplay:null, onended:null, onerror:null, oncanplaythrough:null, load:()=>{} };

      source.onended = () => {
        if (gen === $.current.generation) setSpeaking(false);
        $.current.sourceNode = null;
        $.current.audio = null;
      };

      setLoadingAudio(false);
      setSpeaking(true);
      source.start(0);

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
