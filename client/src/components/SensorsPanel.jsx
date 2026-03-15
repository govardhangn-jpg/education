/**
 * SensorsPanel — SamarthaaEdu
 *
 * A single component that surfaces all sensor features:
 * - Permission request cards (explain WHY before asking)
 * - Step counter with goal ring
 * - Sedentary alert
 * - Screen time tracker
 * - Weather card with fitness advice
 * - Notification scheduler
 * - Camera food analyser
 * - Voice input button (used inline in journals/coach)
 *
 * This file also exports smaller composable pieces:
 * - <VoiceButton> — mic button for text inputs
 * - <SedentaryBanner> — floating "time to move" prompt
 * - <FitnessStats> — steps + weather card for FitnessModule
 * - <ScreenTimeWidget> — for LifestyleModule
 * - <NotificationSettings> — for the settings panel
 * - <FoodCamera> — camera + Claude Vision analysis
 */

import { useState, useRef, useEffect } from 'react';

const BACKEND = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace(/\/api$/, '')
  : 'http://localhost:5000';

// ── Permission Card ────────────────────────────────────────────────────────
function PermissionCard({ icon, title, why, onGrant, status, color }) {
  const [asking, setAsking] = useState(false);
  if (status === 'granted') return null;
  if (status === 'denied') return (
    <div style={{ padding:'12px 14px', background:'rgba(231,76,60,0.08)', border:'1px solid rgba(231,76,60,0.2)', borderRadius:12, display:'flex', gap:10, alignItems:'center' }}>
      <span style={{ fontSize:20 }}>{icon}</span>
      <div>
        <div style={{ color:'rgba(255,255,255,0.6)', fontSize:12, fontWeight:700 }}>{title} — blocked</div>
        <div style={{ color:'rgba(255,255,255,0.4)', fontSize:11, marginTop:2 }}>Go to browser Settings → Site permissions to enable</div>
      </div>
    </div>
  );
  if (status === 'unavailable') return null;
  return (
    <div style={{ padding:'14px 16px', background:`rgba(${color},0.08)`, border:`1px solid rgba(${color},0.25)`, borderRadius:14 }}>
      <div style={{ display:'flex', gap:10, alignItems:'flex-start', marginBottom:10 }}>
        <span style={{ fontSize:24, flexShrink:0 }}>{icon}</span>
        <div>
          <div style={{ color:'white', fontSize:13, fontWeight:800, marginBottom:4 }}>{title}</div>
          <div style={{ color:'rgba(255,255,255,0.6)', fontSize:12, lineHeight:1.6 }}>{why}</div>
        </div>
      </div>
      <button onClick={async () => { setAsking(true); await onGrant(); setAsking(false); }}
        disabled={asking}
        style={{ background:`rgba(${color},0.2)`, border:`1.5px solid rgba(${color},0.5)`, borderRadius:10, padding:'9px 18px', color:'white', fontFamily:'inherit', fontSize:12, fontWeight:800, cursor:asking?'wait':'pointer', width:'100%' }}>
        {asking ? '⏳ Requesting...' : `Enable ${title}`}
      </button>
    </div>
  );
}

// ── Voice Button ───────────────────────────────────────────────────────────
export function VoiceButton({ onText, onPartial, sensors, size = 36, accent = '#4cc9f0', disabled }) {
  const { permissions, listening, startListening, stopListening, requestMic } = sensors;
  const [interim, setInterim] = useState('');

  const handleClick = async () => {
    if (listening) { stopListening(); setInterim(''); return; }
    if (permissions.mic !== 'granted') {
      const ok = await requestMic();
      if (!ok) return;
    }
    startListening(
      (text, isFinal) => {
        if (isFinal) { onText(text); setInterim(''); }
        else { setInterim(text); onPartial?.(text); }
      },
      () => setInterim('')
    );
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
      <button onClick={handleClick} disabled={disabled}
        title={listening ? 'Tap to stop' : 'Tap to speak'}
        style={{
          width:size, height:size, borderRadius:'50%',
          background: listening ? `rgba(231,76,60,0.2)` : `rgba(${accent.replace('#','')},0.15)`,
          border: `2px solid ${listening ? '#e74c3c' : accent}`,
          display:'flex', alignItems:'center', justifyContent:'center',
          cursor:'pointer', fontSize:size*0.45, flexShrink:0,
          animation: listening ? 'pulse 1s infinite' : 'none',
          transition:'all 0.2s',
        }}>
        {listening ? '⏹' : '🎤'}
      </button>
      {interim && (
        <div style={{ position:'absolute', bottom:'100%', left:'50%', transform:'translateX(-50%)', background:'rgba(0,0,0,0.85)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:8, padding:'6px 10px', color:'rgba(255,255,255,0.8)', fontSize:11, whiteSpace:'nowrap', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', zIndex:100 }}>
          {interim}
        </div>
      )}
    </div>
  );
}

// ── Sedentary Alert Banner ────────────────────────────────────────────────
export function SedentaryBanner({ sensors }) {
  const { sedentaryAlert, setSedentary, steps } = sensors;
  if (!sedentaryAlert) return null;
  return (
    <div style={{ position:'fixed', top:70, left:'50%', transform:'translateX(-50%)', zIndex:500, maxWidth:340, width:'90%', background:'linear-gradient(135deg,#1a1a2e,#0d1117)', border:'1.5px solid rgba(76,201,240,0.5)', borderRadius:16, padding:'14px 18px', display:'flex', gap:12, alignItems:'center', boxShadow:'0 8px 32px rgba(0,0,0,0.6)', animation:'slidein 0.4s ease' }}>
      <span style={{ fontSize:28, animation:'bounce 1s infinite' }}>🚶</span>
      <div style={{ flex:1 }}>
        <div style={{ color:'#4cc9f0', fontSize:13, fontWeight:800, marginBottom:3 }}>Time to move!</div>
        <div style={{ color:'rgba(255,255,255,0.65)', fontSize:12, lineHeight:1.5 }}>You have been still for 45 minutes. Even a 5-minute walk makes a difference. {steps} steps today so far.</div>
      </div>
      <button onClick={() => setSedentary(false)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontSize:18, padding:'0 4px', flexShrink:0 }}>✕</button>
    </div>
  );
}

// ── Fitness Stats Card (steps + weather) ──────────────────────────────────
export function FitnessStats({ sensors, accent, accentDim, accentBorder }) {
  const { steps, stepGoal, stepsPct, weather, permissions, requestMotion, requestLocation, refreshWeather } = sensors;

  useEffect(() => { refreshWeather(); }, []); // eslint-disable-line

  const getWeatherAdvice = (w) => {
    if (!w) return null;
    if (w.temp > 36) return { icon:'🥵', text:`It's ${w.temp}°C outside — workout indoors or very early morning. Hydrate every 15 minutes.` };
    if (w.temp > 30) return { icon:'☀️', text:`Warm day (${w.temp}°C). Exercise before 8am or after 6pm. Carry water.` };
    if (w.temp < 15) return { icon:'🧥', text:`Cool weather (${w.temp}°C) — great for outdoor runs! Warm up for 5–10 minutes first.` };
    if (w.desc?.toLowerCase().includes('rain')) return { icon:'🌧️', text:`Rain today — perfect for a home workout or gym session.` };
    return { icon:'✅', text:`Good conditions (${w.temp}°C, ${w.desc}) — great day for outdoor exercise!` };
  };

  const advice = getWeatherAdvice(weather);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {/* Step counter */}
      <div style={{ padding:'16px 18px', background:accentDim, border:`1.5px solid ${accentBorder}`, borderRadius:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div>
            <div style={{ color:'rgba(255,255,255,0.5)', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px' }}>Steps Today</div>
            <div style={{ display:'flex', alignItems:'baseline', gap:6, marginTop:4 }}>
              <span style={{ color:'white', fontSize:32, fontWeight:900 }}>{steps.toLocaleString()}</span>
              <span style={{ color:'rgba(255,255,255,0.4)', fontSize:14 }}>/ {stepGoal.toLocaleString()}</span>
            </div>
          </div>
          {/* Ring */}
          <svg width={60} height={60} style={{ transform:'rotate(-90deg)' }}>
            <circle cx={30} cy={30} r={24} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={6} />
            <circle cx={30} cy={30} r={24} fill="none" stroke={accent} strokeWidth={6}
              strokeDasharray={`${2*Math.PI*24 * stepsPct/100} ${2*Math.PI*24 * (1-stepsPct/100)}`}
              strokeLinecap="round" style={{ transition:'stroke-dasharray 0.8s ease' }} />
          </svg>
        </div>
        {/* Progress bar */}
        <div style={{ height:6, background:'rgba(255,255,255,0.07)', borderRadius:6, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${stepsPct}%`, background:accent, borderRadius:6, transition:'width 0.8s ease' }} />
        </div>
        <div style={{ color:'rgba(255,255,255,0.4)', fontSize:11, marginTop:6 }}>
          {stepsPct >= 100 ? '🎉 Daily goal reached!' : `${stepGoal - steps} steps to goal`} — carry your phone while walking
        </div>
        {permissions.motion !== 'granted' && (
          <PermissionCard
            icon="🦶" title="Step Counting" color="76,201,240"
            why="Counts your steps using your phone's accelerometer while you carry it. No GPS used."
            onGrant={requestMotion}
            status={permissions.motion}
          />
        )}
      </div>

      {/* Weather */}
      {weather && advice ? (
        <div style={{ padding:'14px 16px', background:'rgba(255,255,255,0.03)', border:`1px solid ${accentBorder}`, borderRadius:14, display:'flex', gap:12, alignItems:'flex-start' }}>
          <span style={{ fontSize:28, flexShrink:0 }}>{advice.icon}</span>
          <div>
            <div style={{ color:'rgba(255,255,255,0.5)', fontSize:11, fontWeight:700, textTransform:'uppercase', marginBottom:4 }}>
              {weather.city || 'Local'} Weather
            </div>
            <div style={{ color:'rgba(255,255,255,0.8)', fontSize:13, lineHeight:1.6 }}>{advice.text}</div>
            <div style={{ color:'rgba(255,255,255,0.35)', fontSize:11, marginTop:6 }}>
              {weather.temp}°C • Feels like {weather.feelsLike}°C • Humidity {weather.humidity}%
            </div>
          </div>
        </div>
      ) : permissions.location !== 'granted' ? (
        <PermissionCard
          icon="🌤️" title="Weather" color="76,201,240"
          why="Checks current weather to give relevant outdoor exercise advice. Location is not stored."
          onGrant={requestLocation}
          status={permissions.location}
        />
      ) : (
        <div style={{ padding:'12px 14px', background:'rgba(255,255,255,0.02)', borderRadius:12, color:'rgba(255,255,255,0.4)', fontSize:12 }}>
          ⏳ Fetching weather...
        </div>
      )}
    </div>
  );
}

// ── Screen Time Widget ────────────────────────────────────────────────────
export function ScreenTimeWidget({ sensors, accent, accentDim, accentBorder }) {
  const { screenTimeMinutes, screenTimeGoal } = sensors;
  const h = Math.floor(screenTimeMinutes / 60);
  const m = screenTimeMinutes % 60;
  const label = h > 0 ? `${h}h ${m}m` : `${m}m`;
  const pct = Math.min(100, Math.round((screenTimeMinutes / screenTimeGoal) * 100));
  const status = screenTimeMinutes > 120
    ? { color:'#e74c3c', msg:'More than 2 hours today. Time for a break — eyes, posture, and mind all need it.' }
    : screenTimeMinutes > 60
    ? { color:'#f4a261', msg:'You have had a good productive session. Consider a 5-minute screen break soon.' }
    : { color:accent, msg:'Healthy usage so far today. Keep it intentional.' };

  return (
    <div style={{ padding:'16px 18px', background:accentDim, border:`1.5px solid ${accentBorder}`, borderRadius:16 }}>
      <div style={{ color:'rgba(255,255,255,0.5)', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:10 }}>
        App Screen Time Today
      </div>
      <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:10 }}>
        <span style={{ color:status.color, fontSize:36, fontWeight:900 }}>{label}</span>
        <span style={{ color:'rgba(255,255,255,0.35)', fontSize:13 }}>on SamarthaaEdu</span>
      </div>
      <div style={{ height:6, background:'rgba(255,255,255,0.07)', borderRadius:6, overflow:'hidden', marginBottom:10 }}>
        <div style={{ height:'100%', width:`${pct}%`, background:status.color, borderRadius:6, transition:'width 0.8s ease' }} />
      </div>
      <div style={{ color:'rgba(255,255,255,0.6)', fontSize:12, lineHeight:1.6 }}>{status.msg}</div>
      <div style={{ marginTop:12, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
        {[['📵','No phone first 30 min of day'],['⏱️','20-20-20 rule: every 20 min, look 20ft away for 20 sec'],['🚶','Stand up every hour']].map(([ic,tip]) => (
          <div key={tip} style={{ padding:'8px', background:'rgba(255,255,255,0.03)', borderRadius:8, textAlign:'center' }}>
            <div style={{ fontSize:18, marginBottom:4 }}>{ic}</div>
            <div style={{ color:'rgba(255,255,255,0.5)', fontSize:10, lineHeight:1.5 }}>{tip}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Notification Settings ─────────────────────────────────────────────────
export function NotificationSettings({ sensors, modules, accent, accentDim, accentBorder }) {
  const { permissions, requestNotifications, notifPrefs, scheduleNotification, cancelNotification } = sensors;

  if (permissions.notifications === 'unavailable') return null;

  return (
    <div style={{ padding:'16px 18px', background:'rgba(255,255,255,0.02)', border:`1.5px solid ${accentBorder}`, borderRadius:16 }}>
      <div style={{ color:accent, fontSize:13, fontWeight:800, marginBottom:4 }}>🔔 Daily Reminders</div>
      <div style={{ color:'rgba(255,255,255,0.5)', fontSize:12, marginBottom:14, lineHeight:1.6 }}>
        Get reminded at a specific time each day to complete your practice. The reminder appears even when the app is closed.
      </div>

      {permissions.notifications !== 'granted' ? (
        <PermissionCard
          icon="🔔" title="Daily Reminders" color="181,228,140"
          why="Sends a notification at a time you choose to remind you to do your daily practice. You can turn it off any time."
          onGrant={requestNotifications}
          status={permissions.notifications}
        />
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {modules.map(m => {
            const pref = notifPrefs[m.id];
            return (
              <div key={m.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'rgba(255,255,255,0.03)', borderRadius:12 }}>
                <span style={{ fontSize:20 }}>{m.icon}</span>
                <span style={{ color:'rgba(255,255,255,0.7)', fontSize:12, fontWeight:700, flex:1 }}>{m.label}</span>
                {pref?.active ? (
                  <>
                    <span style={{ color:accent, fontSize:11, fontWeight:700 }}>{pref.time}</span>
                    <button onClick={() => cancelNotification(m.id)}
                      style={{ background:'rgba(231,76,60,0.15)', border:'1px solid rgba(231,76,60,0.3)', borderRadius:8, padding:'4px 10px', color:'#e74c3c', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                      Off
                    </button>
                  </>
                ) : (
                  <input type="time" defaultValue="07:00"
                    onChange={e => scheduleNotification(m.id, e.target.value, m.label)}
                    style={{ background:'rgba(255,255,255,0.07)', border:`1px solid ${accentBorder}`, borderRadius:8, padding:'5px 10px', color:'white', fontSize:12, fontFamily:'inherit', outline:'none', cursor:'pointer' }} />
                )}
              </div>
            );
          })}
          <div style={{ color:'rgba(255,255,255,0.3)', fontSize:11, marginTop:4 }}>
            Reminders fire while the app tab is open. For background notifications, save this app to your home screen.
          </div>
        </div>
      )}
    </div>
  );
}

// ── Food Camera ───────────────────────────────────────────────────────────
export function FoodCamera({ sensors, accent, accentDim, accentBorder }) {
  const { permissions, requestCamera, stopCamera, cameraStream, capturePhoto } = sensors;
  const videoRef    = useRef(null);
  const [photo,     setPhoto]    = useState(null);
  const [analysing, setAnalysing]= useState(false);
  const [result,    setResult]   = useState(null);
  const [error,     setError]    = useState(null);

  useEffect(() => {
    if (cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play();
    }
  }, [cameraStream]);

  useEffect(() => () => stopCamera(), []); // eslint-disable-line

  const handleCapture = () => {
    if (!videoRef.current) return;
    const dataUrl = capturePhoto(videoRef.current);
    setPhoto(dataUrl);
    stopCamera();
  };

  const analyseFood = async () => {
    if (!photo) return;
    setAnalysing(true); setResult(null); setError(null);
    try {
      const base64 = photo.split(',')[1];
      const token = localStorage.getItem('samarthaa_token');
      const res = await fetch(`${BACKEND}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify({
          message: 'Analyse this meal photo. Tell me: 1) What food items you can see 2) Estimated calories 3) Protein/carbs/fat estimate 4) Is this a healthy choice? 5) One specific improvement suggestion. Be concise and practical.',
          imageBase64: base64,
          imageMime: 'image/jpeg',
          systemPrompt: 'You are a nutritionist analysing food photos for Indian users. Give practical, specific, non-judgmental advice. Use Indian food context (roti, dal, sabzi, rice, etc.). Keep response under 200 words.',
          subject: 'Nutrition',
          grade: 'Life Skills',
          syllabus: 'General',
        }),
      });
      const data = await res.json();
      setResult(data.reply || data.message);
    } catch (e) {
      setError('Analysis failed. Try again.');
    }
    setAnalysing(false);
  };

  return (
    <div style={{ padding:'16px 18px', background:accentDim, border:`1.5px solid ${accentBorder}`, borderRadius:16 }}>
      <div style={{ color:'rgba(255,255,255,0.5)', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:10 }}>
        📷 Food Analyser
      </div>
      <div style={{ color:'rgba(255,255,255,0.6)', fontSize:12, lineHeight:1.6, marginBottom:14 }}>
        Take a photo of your meal to get an instant nutrition breakdown and advice from your coach.
      </div>

      {!cameraStream && !photo && (
        permissions.camera !== 'granted' ? (
          <PermissionCard
            icon="📷" title="Food Camera" color="76,201,240"
            why="Takes a single photo of your meal for nutrition analysis. Photos are not stored on any server."
            onGrant={requestCamera}
            status={permissions.camera}
          />
        ) : (
          <button onClick={requestCamera}
            style={{ width:'100%', padding:'14px', background:'rgba(76,201,240,0.15)', border:'1.5px solid rgba(76,201,240,0.4)', borderRadius:12, color:'#4cc9f0', fontFamily:'inherit', fontSize:13, fontWeight:800, cursor:'pointer' }}>
            📷 Open Camera
          </button>
        )
      )}

      {cameraStream && (
        <div style={{ borderRadius:12, overflow:'hidden', position:'relative', marginBottom:12 }}>
          <video ref={videoRef} playsInline muted style={{ width:'100%', maxHeight:280, objectFit:'cover', display:'block' }} />
          <button onClick={handleCapture}
            style={{ position:'absolute', bottom:12, left:'50%', transform:'translateX(-50%)', background:'white', border:'none', borderRadius:'50%', width:52, height:52, fontSize:24, cursor:'pointer', boxShadow:'0 4px 16px rgba(0,0,0,0.4)' }}>
            📸
          </button>
        </div>
      )}

      {photo && (
        <div style={{ marginBottom:12 }}>
          <img src={photo} alt="meal" style={{ width:'100%', maxHeight:220, objectFit:'cover', borderRadius:12, display:'block', marginBottom:10 }} />
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={analyseFood} disabled={analysing}
              style={{ flex:1, padding:'11px', background:accent, border:'none', borderRadius:10, color:'#0d0d0d', fontFamily:'inherit', fontSize:13, fontWeight:800, cursor:analysing?'wait':'pointer' }}>
              {analysing ? '⏳ Analysing...' : '🔍 Analyse Meal'}
            </button>
            <button onClick={() => { setPhoto(null); setResult(null); requestCamera(); }}
              style={{ padding:'11px 14px', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, color:'rgba(255,255,255,0.6)', fontFamily:'inherit', fontSize:13, cursor:'pointer' }}>
              Retake
            </button>
          </div>
        </div>
      )}

      {result && (
        <div style={{ padding:'14px 16px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, color:'rgba(255,255,255,0.8)', fontSize:13, lineHeight:1.8, whiteSpace:'pre-wrap' }}>
          {result}
        </div>
      )}

      {error && <div style={{ color:'#e74c3c', fontSize:12, marginTop:8 }}>{error}</div>}
    </div>
  );
}

// ── Main Sensors Panel (shown on Sensors tab) ─────────────────────────────
export default function SensorsPanel({ sensors, modules, accent = '#4cc9f0', accentDim = 'rgba(76,201,240,0.12)', accentBorder = 'rgba(76,201,240,0.3)' }) {
  const { permissions, steps, stepsPct, stepGoal, screenTimeMinutes, weather } = sensors;

  const granted = Object.values(permissions).filter(v => v === 'granted').length;
  const total   = 4; // mic, motion, location, notifications

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* Overview */}
      <div style={{ padding:'16px 18px', background:accentDim, border:`1.5px solid ${accentBorder}`, borderRadius:16 }}>
        <div style={{ color:accent, fontSize:13, fontWeight:800, marginBottom:6 }}>Sensors & Tracking</div>
        <div style={{ color:'rgba(255,255,255,0.6)', fontSize:12, lineHeight:1.7, marginBottom:12 }}>
          These features use your phone's sensors to make the app smarter and more personal. Each requires your explicit consent and you can revoke any time.
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {[
            { icon:'🎤', label:'Mic',       status:permissions.mic },
            { icon:'🦶', label:'Motion',    status:permissions.motion },
            { icon:'📍', label:'Location',  status:permissions.location },
            { icon:'🔔', label:'Alerts',    status:permissions.notifications },
            { icon:'📷', label:'Camera',    status:permissions.camera },
          ].map(s => (
            <div key={s.label} style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:20, background:s.status==='granted'?'rgba(82,183,136,0.12)':'rgba(255,255,255,0.05)', border:`1px solid ${s.status==='granted'?'rgba(82,183,136,0.3)':'rgba(255,255,255,0.1)'}` }}>
              <span style={{ fontSize:14 }}>{s.icon}</span>
              <span style={{ color:s.status==='granted'?'#52b788':'rgba(255,255,255,0.4)', fontSize:11, fontWeight:700 }}>{s.label}</span>
              <span style={{ fontSize:10 }}>{s.status==='granted'?'✓':s.status==='denied'?'✗':'○'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Step counter request */}
      <PermissionCard icon="🦶" title="Step Counting" color="76,201,240"
        why="Counts your steps automatically while you carry your phone. Uses the accelerometer only — no GPS. Helps auto-complete the Fitness check-in."
        onGrant={sensors.requestMotion}
        status={permissions.motion}
      />

      {/* Mic request */}
      <PermissionCard icon="🎤" title="Voice Input" color="76,201,240"
        why="Lets you speak your journal entries and AI coach messages instead of typing. Nothing is recorded or stored — voice is converted to text instantly."
        onGrant={sensors.requestMic}
        status={permissions.mic}
      />

      {/* Location request */}
      <PermissionCard icon="📍" title="Weather & Location" color="76,201,240"
        why="Gets your current weather so the app can suggest whether to exercise outdoors or indoors. Your location is used only once per hour and never stored."
        onGrant={sensors.requestLocation}
        status={permissions.location}
      />

      {/* Notifications */}
      <NotificationSettings sensors={sensors} modules={modules} accent={accent} accentDim={accentDim} accentBorder={accentBorder} />

      {/* Live stats */}
      {(permissions.motion === 'granted' || permissions.location === 'granted') && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:10 }}>
          {permissions.motion === 'granted' && (
            <div style={{ padding:'14px', background:'rgba(255,255,255,0.03)', border:`1px solid ${accentBorder}`, borderRadius:14, textAlign:'center' }}>
              <div style={{ fontSize:28, marginBottom:4 }}>🦶</div>
              <div style={{ color:'white', fontSize:24, fontWeight:900 }}>{steps.toLocaleString()}</div>
              <div style={{ color:'rgba(255,255,255,0.4)', fontSize:11 }}>steps today</div>
              <div style={{ color:accent, fontSize:11, marginTop:4 }}>{stepsPct}% of {stepGoal.toLocaleString()} goal</div>
            </div>
          )}
          {screenTimeMinutes > 0 && (
            <div style={{ padding:'14px', background:'rgba(255,255,255,0.03)', border:`1px solid ${accentBorder}`, borderRadius:14, textAlign:'center' }}>
              <div style={{ fontSize:28, marginBottom:4 }}>🖥️</div>
              <div style={{ color:'white', fontSize:24, fontWeight:900 }}>{screenTimeMinutes}m</div>
              <div style={{ color:'rgba(255,255,255,0.4)', fontSize:11 }}>screen time today</div>
              <div style={{ color:screenTimeMinutes>120?'#e74c3c':accent, fontSize:11, marginTop:4 }}>{screenTimeMinutes>120?'Take a break':'Looking good'}</div>
            </div>
          )}
          {weather && (
            <div style={{ padding:'14px', background:'rgba(255,255,255,0.03)', border:`1px solid ${accentBorder}`, borderRadius:14, textAlign:'center' }}>
              <div style={{ fontSize:28, marginBottom:4 }}>🌤️</div>
              <div style={{ color:'white', fontSize:24, fontWeight:900 }}>{weather.temp}°C</div>
              <div style={{ color:'rgba(255,255,255,0.4)', fontSize:11 }}>{weather.city || 'Local'}</div>
              <div style={{ color:'rgba(255,255,255,0.5)', fontSize:11, marginTop:4 }}>{weather.desc}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
