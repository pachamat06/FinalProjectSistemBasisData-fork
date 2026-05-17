import { create } from 'zustand';
import api, { fetchPlayer, fetchPlayers, fetchPlayerHistory } from '../services/api';

// ─────────────────────────────────────────────────────────────────────────────
// AUTH STORE
// ─────────────────────────────────────────────────────────────────────────────
export const useAuthStore = create((set, get) => ({
  user:            null,
  token:           null,
  isAuthenticated: false,
  loading:         false,
  error:           null,

  login: async (usernameOrEmail, password) => {
    set({ loading: true, error: null });
    try {
      // ✅ Pakai axios api instance (pakai VITE_API_URL), bukan fetch manual
      const data = await api.post('/auth/login', { usernameOrEmail, password });

      localStorage.setItem('token', data.token);
      set({ user: { ...data.user, player: data.player }, token: data.token, isAuthenticated: true, loading: false });
      if (data.player) usePlayerStore.getState().loadPlayerFromAuth(data.player);
      return data;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  register: async (username, email, password) => {
    set({ loading: true, error: null });
    try {
      const data = await api.post('/auth/register', { username, email, password });

      localStorage.setItem('token', data.token);
      set({ user: { ...data.user, player: data.player }, token: data.token, isAuthenticated: true, loading: false });
      if (data.player) usePlayerStore.getState().loadPlayerFromAuth(data.player);
      return data;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  guestLogin: async () => {
    set({ loading: true, error: null });
    try {
      const data = await api.post('/auth/guest');

      localStorage.setItem('token', data.token);
      set({
        user:            { ...data.user, player: data.player, guestAccount: true },
        token:           data.token,
        isAuthenticated: true,
        loading:         false,
      });
      if (data.player) usePlayerStore.getState().loadPlayerFromAuth(data.player);
      return data;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  logout: async () => {
    const { user, token } = get();
    const isGuest = user?.guestAccount;

    localStorage.removeItem('token');
    usePlayerStore.getState().clearPlayer();
    set({ user: null, token: null, isAuthenticated: false });

    // Auto-delete akun guest dari DB
    if (isGuest && token) {
      try {
        await api.delete('/auth/me');
      } catch {
        // Tidak perlu handle error
      }
    }
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const data = await api.get('/auth/me');
      set({ user: data.user, token, isAuthenticated: true });
      const player = data.player ?? data.user?.player;
      if (player) usePlayerStore.getState().loadPlayerFromAuth(player);
      return data;
    } catch (err) {
      localStorage.removeItem('token');
    }
  },
}));

// ─────────────────────────────────────────────────────────────────────────────
// PLAYER STORE
// ─────────────────────────────────────────────────────────────────────────────
export const usePlayerStore = create((set, get) => ({
  currentPlayer: null,
  players:       [],
  loading:       false,
  error:         null,

  setCurrentPlayer: (player) => set({ currentPlayer: player }),

  loadPlayers: async () => {
    set({ loading: true });
    try {
      const players = await fetchPlayers();
      set({ players, loading: false });
      if (!get().currentPlayer && players.length > 0) {
        set({ currentPlayer: players[0] });
      }
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  loadPlayerFromAuth: (player) => set({ currentPlayer: player }),

  clearPlayer: () => set({ currentPlayer: null }),

  refreshPlayer: async (id) => {
    try {
      const player = await fetchPlayer(id);
      set({ currentPlayer: player });
      set((state) => ({
        players: state.players.map((p) => (p.id === id ? { ...p, ...player } : p)),
      }));
    } catch (err) {
      console.error('refreshPlayer:', err.message);
    }
  },

  updateBalance: (newBalance) => {
    set((state) => ({
      currentPlayer: state.currentPlayer
        ? { ...state.currentPlayer, balance: newBalance }
        : null,
    }));
  },
}));

// ─────────────────────────────────────────────────────────────────────────────
// GAME STORE
// ─────────────────────────────────────────────────────────────────────────────
export const useGameStore = create((set) => ({
  isSpinning:   false,
  lastResult:   null,
  history:      [],
  spinCount:    0,
  notification: null,

  setSpinning: (v) => set({ isSpinning: v }),

  addResult: (result) => set((state) => ({
    lastResult: result,
    history:    [result, ...state.history].slice(0, 100),
    spinCount:  state.spinCount + 1,
  })),

  setNotification: (msg) => {
    set({ notification: msg });
    setTimeout(() => set({ notification: null }), 3000);
  },

  loadHistory: async (playerId) => {
    try {
      const history = await fetchPlayerHistory(playerId, 50);
      set({ history });
    } catch (err) {
      console.error('loadHistory:', err.message);
    }
  },
}));

// ─────────────────────────────────────────────────────────────────────────────
// LEADERBOARD STORE
// ─────────────────────────────────────────────────────────────────────────────
export const useLeaderboardStore = create((set) => ({
  leaderboard: [],
  recentWins:  [],
  hotStreaks:  [],
  metric:      'profit',

  setLeaderboard: (data)   => set({ leaderboard: data }),
  setRecentWins:  (data)   => set({ recentWins: data }),
  setHotStreaks:  (data)   => set({ hotStreaks: data }),
  setMetric:      (metric) => set({ metric }),

  updateFromSocket: (data) => {
    if (Array.isArray(data)) set({ leaderboard: data });
  },
}));

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM STORE
// ─────────────────────────────────────────────────────────────────────────────
export const useSystemStore = create((set) => ({
  onlineCount: 0,
  recentFeed:  [],

  setOnlineCount: (count) => set({ onlineCount: count }),
  addFeedItem:    (item)  => set((state) => ({
    recentFeed: [item, ...state.recentFeed].slice(0, 30),
  })),
}));