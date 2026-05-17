/**
 * redisService.js — Implementasi tanpa Redis
 *
 * Data sementara (session, cooldown, feed, streak, online)
 * disimpan di memori (reset saat server restart).
 *
 * Data ranking (leaderboard) diambil langsung dari PostgreSQL.
 */

const prisma = require('../config/prisma');

// ─────────────────────────────────────────────────────────────────────────────
// In-memory stores
// ─────────────────────────────────────────────────────────────────────────────
const sessions     = new Map();   // playerId → { sessionId, startedAt }
const cooldowns    = new Map();   // playerId → expiry timestamp (ms)
const onlinePlayers= new Set();   // Set<playerId>
const winFeed      = [];          // Array of win entries (max 50)
const hotStreaks   = new Map();   // playerId → streak count

const COOLDOWN_MS  = 1500;

// ─────────────────────────────────────────────────────────────────────────────
// Leaderboard — dari PostgreSQL langsung
// ─────────────────────────────────────────────────────────────────────────────
async function getLeaderboard(metric = 'profit', limit = 20) {
  const players = await prisma.player.findMany({
    take: 200,
    select: {
      id: true,
      totalProfit:     true,
      highestSingleWin:true,
      totalWins:       true,
      totalLosses:     true,
    },
  });

  let sorted;
  if (metric === 'highestWin') {
    sorted = players.sort((a, b) => b.highestSingleWin - a.highestSingleWin);
  } else if (metric === 'mostActive') {
    sorted = players.sort((a, b) =>
      (b.totalWins + b.totalLosses) - (a.totalWins + a.totalLosses)
    );
  } else {
    // default: profit
    sorted = players.sort((a, b) => b.totalProfit - a.totalProfit);
  }

  return sorted.slice(0, limit).map((p, i) => ({
    playerId: p.id,
    score:
      metric === 'highestWin' ? p.highestSingleWin
      : metric === 'mostActive' ? p.totalWins + p.totalLosses
      : p.totalProfit,
    rank: i + 1,
  }));
}

// updateLeaderboard tidak perlu melakukan apa-apa —
// data sudah langsung tersimpan ke Player di DB oleh gameService
async function updateLeaderboard() {
  // no-op: leaderboard dibaca langsung dari DB
}

// ─────────────────────────────────────────────────────────────────────────────
// Spin cooldown — in-memory
// ─────────────────────────────────────────────────────────────────────────────
async function checkAndSetCooldown(playerId) {
  const now    = Date.now();
  const expiry = cooldowns.get(playerId);
  if (expiry && now < expiry) return false; // masih cooldown
  cooldowns.set(playerId, now + COOLDOWN_MS);
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Player session — in-memory
// ─────────────────────────────────────────────────────────────────────────────
async function setPlayerSession(playerId, sessionData) {
  sessions.set(playerId, { ...sessionData, _savedAt: Date.now() });
}

async function getPlayerSession(playerId) {
  const s = sessions.get(playerId);
  if (!s) return null;
  // Expire setelah 1 jam
  if (Date.now() - s._savedAt > 3600_000) {
    sessions.delete(playerId);
    return null;
  }
  return s;
}

async function deletePlayerSession(playerId) {
  sessions.delete(playerId);
}

// ─────────────────────────────────────────────────────────────────────────────
// Online players — in-memory
// ─────────────────────────────────────────────────────────────────────────────
async function playerConnected(playerId) {
  if (playerId) onlinePlayers.add(playerId);
}

async function playerDisconnected(playerId) {
  onlinePlayers.delete(playerId);
}

async function getOnlineCount() {
  return onlinePlayers.size;
}

// ─────────────────────────────────────────────────────────────────────────────
// Recent win feed — in-memory (max 50 item)
// ─────────────────────────────────────────────────────────────────────────────
async function pushWinFeed(entry) {
  winFeed.unshift(entry);
  if (winFeed.length > 50) winFeed.length = 50;
}

async function getWinFeed(limit = 20) {
  return winFeed.slice(0, limit);
}

// ─────────────────────────────────────────────────────────────────────────────
// Hot streaks — in-memory
// ─────────────────────────────────────────────────────────────────────────────
async function updateHotStreak(playerId, streak) {
  if (streak > 0) hotStreaks.set(playerId, streak);
  else hotStreaks.delete(playerId);
}

async function getHotStreaks(limit = 10) {
  return [...hotStreaks.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([playerId, streak]) => ({ playerId, streak }));
}

// ─────────────────────────────────────────────────────────────────────────────
// RTP cache — no-op (query langsung ke DB, cukup cepat dengan Prisma)
// ─────────────────────────────────────────────────────────────────────────────
async function cacheRTPProfile()    {}
async function getCachedRTPProfile(){ return null; }
async function invalidateRTPCache() {}

// ─────────────────────────────────────────────────────────────────────────────
// System stats — dari DB + in-memory
// ─────────────────────────────────────────────────────────────────────────────
async function getSystemStats() {
  return {
    onlineCount: onlinePlayers.size,
    redisKeys:   0,
  };
}

module.exports = {
  // Leaderboard
  getLeaderboard,
  updateLeaderboard,

  // Cooldown
  checkAndSetCooldown,

  // Session
  setPlayerSession,
  getPlayerSession,
  deletePlayerSession,

  // Online
  playerConnected,
  playerDisconnected,
  getOnlineCount,

  // Win feed
  pushWinFeed,
  getWinFeed,

  // Hot streaks
  updateHotStreak,
  getHotStreaks,

  // RTP cache (no-op)
  cacheRTPProfile,
  getCachedRTPProfile,
  invalidateRTPCache,

  // Stats
  getSystemStats,
};