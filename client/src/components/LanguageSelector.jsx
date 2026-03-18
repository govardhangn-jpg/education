/**
 * LanguageSelector — compact language switcher
 * Used in AppLayout nav (desktop) and mobile menu
 */
import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';

export default function LanguageSelector({ compact = false }) {
  const { lang, setLang, languages } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = languages.find(l => l.code === lang) || languages[0];

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const groups = [
    { label: 'Global', langs: languages.filter(l => ['en','zh','es','ar','fr','pt','ru','ja','de'].includes(l.code)) },
    { label: 'Indian', langs: languages.filter(l => ['hi','bn','kn','te','ta','mr'].includes(l.code)) },
  ];

  return (
    <div ref={ref} style={{ position: 'relative', zIndex: 300 }}>
      <button
        onClick={() => setOpen(o => !o)}
        title="Change language"
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: compact ? '5px 8px' : '6px 12px',
          borderRadius: 10,
          background: open ? 'rgba(255,215,0,0.12)' : 'rgba(255,255,255,0.06)',
          border: `1px solid ${open ? 'rgba(255,215,0,0.3)' : 'rgba(255,255,255,0.1)'}`,
          color: open ? '#ffd700' : 'rgba(255,255,255,0.7)',
          cursor: 'pointer', fontFamily: 'inherit',
          fontSize: compact ? 11 : 13, fontWeight: 700,
          transition: 'all 0.2s', whiteSpace: 'nowrap',
        }}
      >
        <span style={{ fontSize: compact ? 14 : 16 }}>🌐</span>
        {!compact && (
          <>
            <span style={{ fontSize: 14 }}>{current.flag}</span>
            <span>{current.native}</span>
          </>
        )}
        {compact && <span style={{ fontSize: 12 }}>{current.flag}</span>}
        <span style={{ fontSize: 9, opacity: 0.6 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)',
          right: 0, width: 320,
          background: 'rgba(13,13,26,0.98)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16, padding: '12px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          maxHeight: 420, overflowY: 'auto',
        }}>
          {groups.map(group => (
            <div key={group.label} style={{ marginBottom: 12 }}>
              <div style={{
                color: 'rgba(255,255,255,0.3)', fontSize: 10,
                fontWeight: 800, letterSpacing: 1.5,
                textTransform: 'uppercase', marginBottom: 6, paddingLeft: 4,
              }}>
                {group.label}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
                {group.langs.map(l => (
                  <button key={l.code} onClick={() => { setLang(l.code); setOpen(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 10px', borderRadius: 10,
                      background: lang === l.code ? 'rgba(255,215,0,0.12)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${lang === l.code ? 'rgba(255,215,0,0.3)' : 'rgba(255,255,255,0.06)'}`,
                      color: lang === l.code ? '#ffd700' : 'rgba(255,255,255,0.7)',
                      cursor: 'pointer', fontFamily: 'inherit',
                      fontSize: 11, fontWeight: lang === l.code ? 800 : 600,
                      transition: 'all 0.15s', textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: 15 }}>{l.flag}</span>
                    <div>
                      <div style={{ fontSize: 11, lineHeight: 1.2 }}>{l.native}</div>
                      <div style={{ fontSize: 9, opacity: 0.4, lineHeight: 1 }}>{l.label}</div>
                    </div>
                    {lang === l.code && <span style={{ marginLeft: 'auto', fontSize: 10 }}>✓</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
