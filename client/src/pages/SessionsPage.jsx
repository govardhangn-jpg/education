/**
 * SessionsPage.jsx
 * ────────────────
 * Shows all active sessions (devices) for the logged-in user.
 * User can:
 *   - See which devices are currently logged in
 *   - Sign out a specific device
 *   - Sign out all other devices at once
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getSessions, revokeSession, revokeAllOtherSessions, logoutServer } from '../utils/api';
import { useNavigate } from 'react-router-dom';

const DEVICE_ICONS = {
  mobile:  '📱',
  tablet:  '📟',
  web:     '💻',
};

const formatDate = (iso) => {
  if (!iso) return 'Never';
  const d = new Date(iso);
  const now = new Date();
  const diff = now - d;
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 2)   return 'Just now';
  if (mins < 60)  return `${mins} minutes ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 7)   return `${days} day${days > 1 ? 's' : ''} ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function SessionsPage() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [revoking, setRevoking]   = useState(null); // id of session being revoked
  const [revokeAll, setRevokeAll] = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const r = await getSessions();
      setSessions(r.data.sessions || []);
    } catch (e) {
      setError('Could not load sessions. ' + (e.response?.data?.error || e.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRevoke = async (session) => {
    if (session.isCurrent) {
      // Sign out self
      try {
        await logoutServer();
      } catch {}
      logoutUser();
      navigate('/login');
      return;
    }
    setRevoking(session.id);
    try {
      await revokeSession(session.id);
      setSessions(s => s.filter(x => x.id !== session.id));
      setSuccess('Device signed out.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to sign out device.');
    } finally {
      setRevoking(null);
    }
  };

  const handleRevokeAll = async () => {
    setRevokeAll(true);
    try {
      await revokeAllOtherSessions();
      setSessions(s => s.filter(x => x.isCurrent));
      setSuccess('All other devices have been signed out.');
      setTimeout(() => setSuccess(''), 4000);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to sign out other devices.');
    } finally {
      setRevokeAll(false);
    }
  };

  const otherSessions = sessions.filter(s => !s.isCurrent);
  const currentSession = sessions.find(s => s.isCurrent);

  return (
    <div style={{ padding: '16px', maxWidth: 700, margin: '0 auto', fontFamily: "'Nunito',sans-serif", paddingBottom: 80 }}>
      <style>{`@keyframes fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,215,0,0.1)', border: '1.5px solid rgba(255,215,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
          🔐
        </div>
        <div>
          <div style={{ color: 'white', fontSize: 20, fontWeight: 900 }}>Active Sessions</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>
            Devices where you're currently logged in to {user?.name}'s account
          </div>
        </div>
      </div>

      {/* Feedback banners */}
      {error && (
        <div style={{ padding: '10px 14px', background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.25)', borderRadius: 10, color: '#e74c3c', fontSize: 13, marginBottom: 14 }}>
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div style={{ padding: '10px 14px', background: 'rgba(82,183,136,0.1)', border: '1px solid rgba(82,183,136,0.25)', borderRadius: 10, color: '#52b788', fontSize: 13, marginBottom: 14 }}>
          ✓ {success}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
          Loading sessions…
        </div>
      ) : (
        <>
          {/* Current session */}
          {currentSession && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                This Device
              </div>
              <SessionCard
                session={currentSession}
                onRevoke={handleRevoke}
                revoking={revoking === currentSession.id}
              />
            </div>
          )}

          {/* Other sessions */}
          {otherSessions.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Other Devices ({otherSessions.length})
                </div>
                <button
                  onClick={handleRevokeAll}
                  disabled={revokeAll}
                  style={{ padding: '5px 12px', background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)', borderRadius: 8, color: '#e74c3c', fontSize: 11, fontWeight: 800, cursor: revokeAll ? 'wait' : 'pointer', fontFamily: 'inherit' }}
                >
                  {revokeAll ? 'Signing out…' : '🚪 Sign out all others'}
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {otherSessions.map(s => (
                  <SessionCard
                    key={s.id}
                    session={s}
                    onRevoke={handleRevoke}
                    revoking={revoking === s.id}
                  />
                ))}
              </div>
            </div>
          )}

          {sessions.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
              No active sessions found.
            </div>
          )}

          {/* Security tip */}
          <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14 }}>
            <div style={{ color: 'rgba(255,215,0,0.7)', fontSize: 12, fontWeight: 800, marginBottom: 6 }}>🛡️ Security tips</div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, lineHeight: 1.7 }}>
              If you see a device you don't recognise, sign it out immediately and change your password.
              Sessions automatically expire after 30 days of inactivity.
              Each login from a new browser or device creates a separate session.
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SessionCard({ session, onRevoke, revoking }) {
  const icon = DEVICE_ICONS[session.deviceType] || '💻';

  return (
    <div style={{ padding: '14px 16px', background: session.isCurrent ? 'rgba(255,215,0,0.04)' : 'rgba(255,255,255,0.03)', border: `1px solid ${session.isCurrent ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 14, display: 'flex', alignItems: 'center', gap: 14, animation: 'fadein 0.25s ease' }}>
      {/* Device icon */}
      <div style={{ width: 42, height: 42, borderRadius: 10, background: session.isCurrent ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
        {icon}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ color: 'white', fontSize: 13, fontWeight: 800 }}>{session.deviceName}</span>
          {session.isCurrent && (
            <span style={{ padding: '2px 8px', background: 'rgba(255,215,0,0.15)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: 8, color: '#ffd700', fontSize: 10, fontWeight: 800 }}>
              THIS DEVICE
            </span>
          )}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 3, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <span>🕐 Last seen {formatDate(session.lastSeen)}</span>
          {session.ipAddress && <span>📍 {session.ipAddress}</span>}
          <span>📅 Signed in {formatDate(session.createdAt)}</span>
        </div>
      </div>

      {/* Sign out button */}
      <button
        onClick={() => onRevoke(session)}
        disabled={revoking}
        style={{ flexShrink: 0, padding: '7px 12px', background: session.isCurrent ? 'rgba(231,76,60,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${session.isCurrent ? 'rgba(231,76,60,0.3)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 9, color: session.isCurrent ? '#e74c3c' : 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, cursor: revoking ? 'wait' : 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
      >
        {revoking ? '…' : session.isCurrent ? 'Sign out' : '🚪 Sign out'}
      </button>
    </div>
  );
}
