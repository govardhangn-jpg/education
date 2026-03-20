import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({ baseURL: BASE, timeout: 60000 }); // 60s — covers Render cold starts + AI generation

api.interceptors.request.use(config => {
  const token = localStorage.getItem('samarthaa_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    const url = err.config?.url || '';
    const is401 = err.response?.status === 401;
    const isTTS = url.includes('/tts/');
    const isAuth = url.includes('/auth/login') || url.includes('/auth/register');
    const isTimeout = err.code === 'ECONNABORTED' || err.message?.includes('timeout');
    const isNetwork = err.code === 'ERR_NETWORK' || !err.response;

    // Attach a friendly message so UI can display it
    if (isTimeout) err.friendlyMessage = 'Request timed out. The server may be starting up — please try again.';
    else if (isNetwork) err.friendlyMessage = 'Cannot reach the server. Check your connection.';

    // Only redirect to login on actual 401, not on timeouts/network errors
    if (is401 && !isTTS && !isAuth && !isTimeout && !isNetwork) {
      localStorage.removeItem('samarthaa_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const login = (data) => api.post('/auth/login', data);
export const register = (data) => api.post('/auth/register', data);
export const getMe = () => api.get('/auth/me');
export const updatePreferences = (data) => api.patch('/auth/preferences', data);
export const logoutServer = () => api.post('/auth/logout');

// Session management
export const getSessions = () => api.get('/auth/sessions');
export const revokeSession = (id) => api.delete(`/auth/sessions/${id}`);
export const revokeAllOtherSessions = () => api.delete('/auth/sessions');

// Chat
export const sendMessage = (data) => api.post('/chat/message', data);
export const getChatSessions = (params) => api.get('/chat/sessions', { params });
export const getChatSession = (id) => api.get(`/chat/sessions/${id}`);
export const deleteChatSession = (id) => api.delete(`/chat/sessions/${id}`);

// Quiz
export const generateQuiz = (data) => api.post('/quiz/generate', data);
export const submitQuiz = (data) => api.post('/quiz/submit', data);
export const getQuizHistory = (params) => api.get('/quiz/history', { params });
export const getLeaderboard = (params) => api.get('/quiz/leaderboard', { params });

// Curriculum
export const getCurriculum = (params) => api.get('/curriculum', { params });
export const getProgress = (params) => api.get('/curriculum/progress', { params });
export const getDashboard = () => api.get('/curriculum/dashboard');

// Admin
export const getStudents = (params) => api.get('/admin/students', { params });
export const bulkCreateStudents = (data) => api.post('/admin/students/bulk', data);
export const toggleStudent = (id) => api.patch(`/admin/students/${id}/toggle`);
export const getAdminStats = () => api.get('/admin/stats');

// ── TTS — plain fetch, never goes through axios interceptor ──────────────────
const BACKEND = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace(/\/api$/, '')
  : 'http://localhost:5000';

export const getTTSStatus = async () => {
  const url = `${BACKEND}/api/tts/status`;
  console.log('[API] getTTSStatus fetching:', url);
  const r = await fetch(url);
  const data = await r.json();
  console.log('[API] getTTSStatus response:', data);
  return { data };
};

export const speakText = async ({ text, language }) => {
  const token = localStorage.getItem('samarthaa_token');
  const url = `${BACKEND}/api/tts/speak`;
  console.log('[API] speakText fetching:', url, '| lang:', language, '| token:', token ? 'present' : 'MISSING');
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ text, language }),
  });
  console.log('[API] speakText response status:', r.status);
  if (!r.ok) {
    const err = await r.json().catch(() => ({ error: 'TTS failed with status ' + r.status }));
    console.error('[API] speakText error:', err);
    throw new Error(err.error || `TTS error ${r.status}`);
  }
  const arrayBuffer = await r.arrayBuffer();
  console.log('[API] speakText audio bytes:', arrayBuffer.byteLength);
  return { data: arrayBuffer };
};

export default api;

// ── Keep-alive ping — prevents Render free tier cold starts ─────────────────
// Render spins down free services after 15 min inactivity.
// A cold start adds 30-50s to the FIRST request, making it look "stuck".
// We ping /health every 9 minutes to keep the server warm.
const HEALTH_URL = (process.env.REACT_APP_API_URL || '/api').replace(/\/api$/, '') + '/health';

function pingServer() {
  fetch(HEALTH_URL, { method: 'GET', cache: 'no-store' })
    .then(() => console.log('[keep-alive] server warm'))
    .catch(() => {}); // silent — don't bother user if ping fails
}

// Ping immediately on app load, then every 9 minutes
if (typeof window !== 'undefined') {
  setTimeout(pingServer, 3000);           // 3s after app loads
  setInterval(pingServer, 9 * 60 * 1000); // every 9 minutes
}
