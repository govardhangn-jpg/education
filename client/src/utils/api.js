import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({ baseURL: BASE, timeout: 30000 });

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
    if (is401 && !isTTS && !isAuth) {
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
// In production REACT_APP_API_URL = https://your-server.onrender.com/api
// In dev it falls back to localhost:5000
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
