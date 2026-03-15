/**
 * useSensors — SamarthaaEdu
 *
 * Manages all browser sensor APIs with explicit user consent.
 * NEVER requests a permission without first explaining why.
 *
 * Sensors managed:
 * - 🎤 Microphone   — voice input for journals & AI coach
 * - 🦶 Motion       — step counting via DeviceMotionEvent
 * - 📍 Location     — weather-aware fitness suggestions
 * - 🔔 Notifications— daily habit reminders
 * - 📷 Camera       — food photo → nutrition analysis
 * - 🖥️ Screen time  — Page Visibility API (no permission needed)
 */

import { useState, useEffect, useRef, useCallback } from 'react';

const LS_PERMISSIONS = 'samarthaa_sensor_permissions';
const LS_STEPS       = 'samarthaa_steps_';        // + YYYY-MM-DD
const LS_SCREENTIME  = 'samarthaa_screentime_';    // + YYYY-MM-DD
const LS_NOTIF_PREFS = 'samarthaa_notif_prefs';
const LS_WEATHER     = 'samarthaa_weather_cache';

function today() { return new Date().toISOString().slice(0, 10); }

// ── Step Counter ─────────────────────────────────────────────────────────
// Peak-detection algorithm on DeviceMotion accelerometer magnitude.
// A step is detected when the magnitude crosses THRESHOLD after a DEBOUNCE gap.
const STEP_THRESHOLD = 11.5; // m/s² — crossing this counts as a step peak
const STEP_DEBOUNCE  = 380;  // ms minimum between steps

class StepCounter {
  constructor(onStep) {
    this.onStep      = onStep;
    this.lastStep    = 0;
    this.lastMag     = 0;
    this.rising      = false;
    this.handler     = null;
  }
  start() {
    this.handler = (e) => {
      const a  = e.accelerationIncludingGravity || e.acceleration || {};
      const x  = a.x || 0, y = a.y || 0, z = a.z || 0;
      const mag = Math.sqrt(x*x + y*y + z*z);
      const now = Date.now();
      // Peak detection: rising then falling above threshold
      if (this.rising && mag < this.lastMag && this.lastMag > STEP_THRESHOLD) {
        if (now - this.lastStep > STEP_DEBOUNCE) {
          this.lastStep = now;
          this.onStep();
        }
      }
      this.rising  = mag > this.lastMag;
      this.lastMag = mag;
    };
    window.addEventListener('devicemotion', this.handler);
  }
  stop() {
    if (this.handler) window.removeEventListener('devicemotion', this.handler);
  }
}

// ── Screen Time Tracker ──────────────────────────────────────────────────
// Uses Page Visibility API — no permission needed.
class ScreenTimeTracker {
  constructor(onUpdate) {
    this.onUpdate = onUpdate;
    this.start    = null;
    this.handler  = null;
  }
  begin() {
    this.start = Date.now();
    this.handler = () => {
      if (document.hidden) {
        const elapsed = Math.floor((Date.now() - this.start) / 1000);
        this._save(elapsed);
      } else {
        this.start = Date.now();
      }
    };
    document.addEventListener('visibilitychange', this.handler);
    window.addEventListener('beforeunload', () => {
      if (this.start) {
        const elapsed = Math.floor((Date.now() - this.start) / 1000);
        this._save(elapsed);
      }
    });
  }
  _save(seconds) {
    const key  = LS_SCREENTIME + today();
    const prev = parseInt(localStorage.getItem(key) || '0');
    const next = prev + seconds;
    localStorage.setItem(key, String(next));
    this.onUpdate(next);
  }
  getToday() {
    return parseInt(localStorage.getItem(LS_SCREENTIME + today()) || '0');
  }
  stop() {
    if (this.handler) document.removeEventListener('visibilitychange', this.handler);
  }
}

// ── Main Hook ────────────────────────────────────────────────────────────
export function useSensors() {
  // Permission states: null = not asked, 'granted', 'denied', 'unavailable'
  const [permissions, setPermissions] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_PERMISSIONS) || '{}'); }
    catch { return {}; }
  });

  const [steps,        setSteps]       = useState(() => parseInt(localStorage.getItem(LS_STEPS + today()) || '0'));
  const [screenTime,   setScreenTime]  = useState(0); // seconds today
  const [weather,      setWeather]     = useState(() => { try { return JSON.parse(localStorage.getItem(LS_WEATHER) || 'null'); } catch { return null; } });
  const [notifPrefs,   setNotifPrefs]  = useState(() => { try { return JSON.parse(localStorage.getItem(LS_NOTIF_PREFS) || '{}'); } catch { return {}; } });
  const [sedentaryAlert, setSedentary] = useState(false);
  const [listening,    setListening]   = useState(false); // mic speech recognition active
  const [cameraStream, setCameraStream]= useState(null);

  const stepCounter   = useRef(null);
  const screenTracker = useRef(null);
  const recRef        = useRef(null);
  const sedentaryTimer= useRef(null);
  const lastStepTime  = useRef(Date.now());

  // ── Persist permissions ────────────────────────────────────────────────
  const savePerms = (p) => {
    setPermissions(p);
    localStorage.setItem(LS_PERMISSIONS, JSON.stringify(p));
  };

  // ── Screen time — always on (no permission needed) ─────────────────────
  useEffect(() => {
    const tracker = new ScreenTimeTracker((secs) => setScreenTime(secs));
    tracker.begin();
    setScreenTime(tracker.getToday());
    screenTracker.current = tracker;
    return () => tracker.stop();
  }, []);

  // ── Step counter — starts when motion permission granted ───────────────
  const startStepCounting = useCallback(() => {
    if (stepCounter.current) return;
    const counter = new StepCounter(() => {
      lastStepTime.current = Date.now();
      setSedentary(false);
      clearTimeout(sedentaryTimer.current);
      // Alert if no steps for 45 minutes
      sedentaryTimer.current = setTimeout(() => setSedentary(true), 45 * 60 * 1000);

      setSteps(prev => {
        const next = prev + 1;
        localStorage.setItem(LS_STEPS + today(), String(next));
        return next;
      });
    });
    counter.start();
    stepCounter.current = counter;
    // Start sedentary timer
    sedentaryTimer.current = setTimeout(() => setSedentary(true), 45 * 60 * 1000);
  }, []);

  useEffect(() => {
    return () => {
      stepCounter.current?.stop();
      clearTimeout(sedentaryTimer.current);
    };
  }, []);

  // ── Request microphone ─────────────────────────────────────────────────
  const requestMic = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const p = { ...permissions, mic: 'granted' };
      savePerms(p);
      return true;
    } catch {
      const p = { ...permissions, mic: 'denied' };
      savePerms(p);
      return false;
    }
  }, [permissions]);

  // ── Request motion (step counting) ────────────────────────────────────
  const requestMotion = useCallback(async () => {
    if (!window.DeviceMotionEvent) {
      savePerms({ ...permissions, motion: 'unavailable' });
      return false;
    }
    // iOS 13+ requires explicit permission request
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const result = await DeviceMotionEvent.requestPermission();
        const status = result === 'granted' ? 'granted' : 'denied';
        const p = { ...permissions, motion: status };
        savePerms(p);
        if (status === 'granted') startStepCounting();
        return status === 'granted';
      } catch {
        savePerms({ ...permissions, motion: 'denied' });
        return false;
      }
    } else {
      // Android / desktop — no permission needed, just start
      savePerms({ ...permissions, motion: 'granted' });
      startStepCounting();
      return true;
    }
  }, [permissions, startStepCounting]);

  // Auto-resume step counting if already granted
  useEffect(() => {
    if (permissions.motion === 'granted') startStepCounting();
  }, []); // eslint-disable-line

  // ── Request location + fetch weather ──────────────────────────────────
  const requestLocation = useCallback(() => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        savePerms({ ...permissions, location: 'unavailable' });
        resolve(false);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          savePerms({ ...permissions, location: 'granted' });
          const { latitude, longitude } = pos.coords;
          // wttr.in — free weather API, no key needed
          try {
            const r = await fetch(`https://wttr.in/${latitude},${longitude}?format=j1`);
            const d = await r.json();
            const current = d.current_condition?.[0] || {};
            const w = {
              temp:    parseInt(current.temp_C || 25),
              desc:    current.weatherDesc?.[0]?.value || 'Clear',
              humidity:parseInt(current.humidity || 60),
              feelsLike:parseInt(current.FeelsLikeC || 25),
              city:    d.nearest_area?.[0]?.areaName?.[0]?.value || '',
              time:    Date.now(),
            };
            setWeather(w);
            localStorage.setItem(LS_WEATHER, JSON.stringify(w));
          } catch {
            // Fallback: just store that location was granted
          }
          resolve(true);
        },
        () => {
          savePerms({ ...permissions, location: 'denied' });
          resolve(false);
        },
        { timeout: 10000 }
      );
    });
  }, [permissions]);

  // ── Request notifications ──────────────────────────────────────────────
  const requestNotifications = useCallback(async () => {
    if (!('Notification' in window)) {
      savePerms({ ...permissions, notifications: 'unavailable' });
      return false;
    }
    const result = await Notification.requestPermission();
    const status = result === 'granted' ? 'granted' : 'denied';
    savePerms({ ...permissions, notifications: status });
    return status === 'granted';
  }, [permissions]);

  // Schedule a daily reminder notification
  const scheduleNotification = useCallback((moduleId, timeHHMM, label) => {
    const prefs = { ...notifPrefs, [moduleId]: { time: timeHHMM, label, active: true } };
    setNotifPrefs(prefs);
    localStorage.setItem(LS_NOTIF_PREFS, JSON.stringify(prefs));
    // For web apps: use a polling approach since service workers require HTTPS + registration
    // We'll check every minute via setInterval when the page is open
    return prefs;
  }, [notifPrefs]);

  const cancelNotification = useCallback((moduleId) => {
    const prefs = { ...notifPrefs, [moduleId]: { ...notifPrefs[moduleId], active: false } };
    setNotifPrefs(prefs);
    localStorage.setItem(LS_NOTIF_PREFS, JSON.stringify(prefs));
  }, [notifPrefs]);

  // Notification polling — check every minute if it's time to fire
  useEffect(() => {
    if (permissions.notifications !== 'granted') return;
    const interval = setInterval(() => {
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      Object.entries(notifPrefs).forEach(([moduleId, pref]) => {
        if (pref.active && pref.time === hhmm) {
          const lastFired = localStorage.getItem(`notif_fired_${moduleId}_${today()}`);
          if (!lastFired) {
            new Notification(`SamarthaaEdu — ${pref.label}`, {
              body: `Time for your ${pref.label} practice. Keep the streak going! 🔥`,
              icon: '/favicon.ico',
              badge: '/favicon.ico',
              tag: `samarthaa_${moduleId}`,
            });
            localStorage.setItem(`notif_fired_${moduleId}_${today()}`, '1');
          }
        }
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [permissions.notifications, notifPrefs]);

  // ── Request camera ─────────────────────────────────────────────────────
  const requestCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      savePerms({ ...permissions, camera: 'granted' });
      setCameraStream(stream);
      return stream;
    } catch {
      savePerms({ ...permissions, camera: 'denied' });
      return null;
    }
  }, [permissions]);

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
    }
  }, [cameraStream]);

  // ── Speech recognition (uses existing mic permission) ─────────────────
  const startListening = useCallback((onResult, onEnd, language = 'en-IN') => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { onEnd?.('Speech recognition not supported on this browser.'); return; }
    const rec = new SR();
    rec.continuous    = false;
    rec.interimResults = true;
    rec.lang          = language;
    recRef.current    = rec;
    rec.onresult = (e) => {
      let interim = '', final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      onResult(final || interim, !!final);
    };
    rec.onend  = () => { setListening(false); onEnd?.(); };
    rec.onerror = (e) => { setListening(false); onEnd?.(e.error); };
    rec.start();
    setListening(true);
  }, []);

  const stopListening = useCallback(() => {
    recRef.current?.stop();
    setListening(false);
  }, []);

  // ── Capture photo from camera stream ──────────────────────────────────
  const capturePhoto = useCallback((videoElement) => {
    const canvas = document.createElement('canvas');
    canvas.width  = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    canvas.getContext('2d').drawImage(videoElement, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.8);
  }, []);

  // ── Refresh weather (re-fetch if cache > 1 hour old) ──────────────────
  const refreshWeather = useCallback(() => {
    if (permissions.location !== 'granted') return;
    const cached = weather;
    if (cached && Date.now() - cached.time < 3600000) return; // 1 hour cache
    requestLocation();
  }, [permissions.location, weather, requestLocation]);

  // ── Step goal progress ────────────────────────────────────────────────
  const stepGoal  = 8000;
  const stepsPct  = Math.min(100, Math.round((steps / stepGoal) * 100));

  // ── Screen time helpers ───────────────────────────────────────────────
  const screenTimeMinutes = Math.floor(screenTime / 60);
  const screenTimeGoal    = 60; // 60 min/day recommended for this app
  const screenTimePct     = Math.min(100, Math.round((screenTimeMinutes / screenTimeGoal) * 100));

  return {
    // Permission states
    permissions,
    // Actions
    requestMic,
    requestMotion,
    requestLocation,
    requestNotifications,
    requestCamera,
    stopCamera,
    // Mic / speech
    listening,
    startListening,
    stopListening,
    // Steps
    steps,
    stepGoal,
    stepsPct,
    sedentaryAlert,
    setSedentary,
    // Screen time
    screenTimeMinutes,
    screenTimeGoal,
    screenTimePct,
    // Weather
    weather,
    refreshWeather,
    // Notifications
    notifPrefs,
    scheduleNotification,
    cancelNotification,
    // Camera
    cameraStream,
    capturePhoto,
  };
}
