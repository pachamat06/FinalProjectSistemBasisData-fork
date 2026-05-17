import axios from 'axios';

const api = axios.create({
  // ✅ Pakai env variable — set VITE_API_URL di Vercel dashboard
  // Local dev: bisa pakai /api (Vite proxy) atau http://localhost:3001/api
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg = err.response?.data?.error || err.message || 'Request failed';
    return Promise.reject(new Error(msg));
  }
);

// Player
export const fetchPlayers       = ()              => api.get('/player');
export const fetchPlayer        = (id)            => api.get(`/player/${id}`);
export const fetchPlayerHistory = (id, limit=50)  => api.get(`/player/${id}/history?limit=${limit}`);
export const fetchPlayerStats   = (id)            => api.get(`/player/${id}/stats`);

// Game
export const spinGame     = (playerId, betAmount) => api.post('/game/spin', { playerId, betAmount });
export const startSession = (playerId)            => api.post('/game/start-session', { playerId });
export const endSession   = (playerId, sessionId) => api.post('/game/end-session', { playerId, sessionId });

// RTP
export const fetchRTPProfile = (playerId) => api.get(`/rtp/${playerId}`);
export const resetRTP        = (playerId) => api.post(`/rtp/reset/${playerId}`);

// Leaderboard
export const fetchLeaderboard = (metric = 'profit') => api.get(`/leaderboard?metric=${metric}`);

// Admin — tools
export const simulateSpins   = (playerId, count)        => api.post('/admin/simulate-spins', { playerId, count });
export const fetchSystemStats= ()                       => api.get('/admin/system-stats');
export const forceWinStreak  = (playerId, streakLength) => api.post('/admin/force-win-streak', { playerId, streakLength });
export const forceLoseStreak = (playerId, streakLength) => api.post('/admin/force-lose-streak', { playerId, streakLength });
export const inspectRedis    = ()                       => api.get('/admin/inspect-redis');

// Admin — user management
export const banUser    = (userId) => api.post(`/admin/ban/${userId}`);
export const unbanUser  = (userId) => api.post(`/admin/unban/${userId}`);
export const deleteUser = (userId) => api.delete(`/admin/user/${userId}`);

// Auth — self-delete
export const deleteSelfAccount = () => api.delete('/auth/me');

export default api;