/**
 * redisService.js — Hybrid implementation
 *
 * CRITICAL PATH (spin, session, cooldown):
 *   → In-memory (Map/Set) — instant, zero latency, tidak perlu Redis
 *
 * NON-CRITICAL (leaderboard, win feed, streaks):
 *   → Redis jika tersedia, in-memory fallback jika tidak
 *
 * Ini memastikan spin TIDAK PERNAH timeout karena Redis.
 */

// ─────────────────────────────────────────────────────────────────────────────
// In-memory stores (selalu tersedia, instant)
// ─────────────────────────────────────────────────────────────────────────────
const _sessions      = new Map();  // playerId → { sessionId, startedAt }
const _cooldowns     = new Map();  // playerId → expiry ms
const _onlinePlayers = new Set();  // Set<playerId>
const _winFeed       = [];         // recent wins (max 50)
const _hotStreaks    = new Map();  // playerId → streak

const COOLDOWN_MS    = 1500;
const SESSION_TTL_MS = 3_600_000; // 1 jam

// ─────────────────────────────────────────────────────────────────────────────
// Redis helper — dipakai hanya untuk leaderboard/feed (non-critical)
// ─────────────────────────────────────────────────────────────────────────────
function tryGetRedis() {
  try {
    const { getRedis } = require('../config/redis');
    return getRedis();
  } catch {
    return null;
  }
}

async function safeRedis(fn, fallback = null) {
  try {
    const redis = tryGetRedis();
    if (!redis) return fallback;
    // Beri max 2 detik untuk Redis, jangan tunggu lebih lama
    return await Promise.race([
      fn(redis),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Redis timeout')), 2000)
      ),
    ]);
  } catch {
    return fallback;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ✅ CRITICAL — Spin Cooldown (in-memory, instant)
// ─────────────────────────────────────────────────────────────────────────────
async function checkAndSetCooldown(playerId) {
  const now    = Date.now();
  const expiry = _cooldowns.get(playerId);
  if (expiry && now < expiry) return false;
  _cooldowns.set(playerId, now + COOLDOWN_MS);
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// ✅ CRITICAL — Session (in-memory, instant)
// ─────────────────────────────────────────────────────────────────────────────
async function setPlayerSession(playerId, sessionData) {
  _sessions.set(playerId, { ...sessionData, _savedAt: Date.now() });
}

async function getPlayerSession(playerId) {
  const s = _sessions.get(playerId);
  if (!s) return null;
  if (Date.now() - s._savedAt > SESSION_TTL_MS) {
    _sessions.delete(playerId);
    return null;
  }
  return s;
}

async function deletePlayerSession(playerId) {
  _sessions.delete(playerId);
}

// ─────────────────────────────────────────────────────────────────────────────
// ✅ CRITICAL — Online players (in-memory, instant)
// ─────────────────────────────────────────────────────────────────────────────
async function playerConnected(playerId) {
  if (playerId) _onlinePlayers.add(playerId);
}

async function playerDisconnected(playerId) {
  _onlinePlayers.delete(playerId);
}

async function getOnlineCount() {
  return _onlinePlayers.size;
}

// ─────────────────────────────────────────────────────────────────────────────
// NON-CRITICAL — Leaderboard (Redis with in-memory fallback)
// ─────────────────────────────────────────────────────────────────────────────
async function updateLeaderboard(playerId, scores) {
  // Fire-and-forget — tidak ditunggu oleh caller
  safeRedis(async (redis) => {
    const pipeline = redis.pipeline();
    if (scores.totalProfit      !== undefined) pipeline.zadd('leaderboard:profit',     scores.totalProfit,      playerId);
    if (scores.highestSingleWin !== undefined) pipeline.zadd('leaderboard:highestWin', scores.highestSingleWin, playerId);
    if (scores.totalRounds      !== undefined) pipeline.zadd('leaderboard:mostActive', scores.totalRounds,      playerId);
    await pipeline.exec();
  }).catch(() => {});
}

async function getLeaderboard(metric = 'profit', limit = 20) {
  // Coba Redis dulu, fallback ke DB query via prisma
  const results = await safeRedis(async (redis) => {
    return await redis.zrevrange(`leaderboard:${metric}`, 0, limit - 1, 'WITHSCORES');
  }, null);

  if (results && results.length > 0) {
    const parsed = [];
    for (let i = 0; i < results.length; i += 2) {
      parsed.push({ playerId: results[i], score: parseFloat(results[i + 1]), rank: Math.floor(i / 2) + 1 });
    }
    return parsed;
  }

  // Fallback: query dari DB
  try {
    const prisma  = require('../config/prisma');
    const players = await prisma.player.findMany({
      take:   limit,
      select: { id: true, totalProfit: true, highestSingleWin: true, totalWins: true, totalLosses: true },
    });
    let sorted;
    if      (metric === 'highestWin')  sorted = players.sort((a, b) => b.highestSingleWin - a.highestSingleWin);
    else if (metric === 'mostActive')  sorted = players.sort((a, b) => (b.totalWins + b.totalLosses) - (a.totalWins + a.totalLosses));
    else                               sorted = players.sort((a, b) => b.totalProfit - a.totalProfit);
    return sorted.map((p, i) => ({
      playerId: p.id,
      score:    metric === 'highestWin' ? p.highestSingleWin : metric === 'mostActive' ? p.totalWins + p.totalLosses : p.totalProfit,
      rank:     i + 1,
    }));
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// NON-CRITICAL — Win feed (in-memory + Redis background)
// ─────────────────────────────────────────────────────────────────────────────
async function pushWinFeed(entry) {
  _winFeed.unshift(entry);
  if (_winFeed.length > 50) _winFeed.length = 50;

  safeRedis(async (redis) => {
    await redis.lpush('feed:wins', JSON.stringify(entry));
    await redis.ltrim('feed:wins', 0, 49);
    await redis.expire('feed:wins', 3600);
  }).catch(() => {});
}

async function getWinFeed(limit = 20) {
  if (_winFeed.length > 0) return _winFeed.slice(0, limit);

  const items = await safeRedis((redis) => redis.lrange('feed:wins', 0, limit - 1), []);
  return items.map((i) => JSON.parse(i));
}

// ─────────────────────────────────────────────────────────────────────────────
// NON-CRITICAL — Hot streaks (in-memory + Redis background)
// ─────────────────────────────────────────────────────────────────────────────
async function updateHotStreak(playerId, streak) {
  if (streak > 0) _hotStreaks.set(playerId, streak);
  else _hotStreaks.delete(playerId);

  safeRedis((redis) => redis.zadd('feed:streaks', streak, playerId)).catch(() => {});
}

async function getHotStreaks(limit = 10) {
  if (_hotStreaks.size > 0) {
    return [..._hotStreaks.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([playerId, streak]) => ({ playerId, streak }));
  }
  const results = await safeRedis((redis) => redis.zrevrange('feed:streaks', 0, limit - 1, 'WITHSCORES'), []);
  const parsed  = [];
  for (let i = 0; i < results.length; i += 2) {
    parsed.push({ playerId: results[i], streak: parseInt(results[i + 1]) });
  }
  return parsed;
}

// ─────────────────────────────────────────────────────────────────────────────
// NON-CRITICAL — RTP cache (no-op — query DB langsung lebih reliable)
// ─────────────────────────────────────────────────────────────────────────────
async function cacheRTPProfile()     {}
async function getCachedRTPProfile() { return null; }
async function invalidateRTPCache()  {}

// ─────────────────────────────────────────────────────────────────────────────
// System stats
// ─────────────────────────────────────────────────────────────────────────────
async function getSystemStats() {
  const redisKeys = await safeRedis((redis) => redis.dbsize(), 0);
  return { onlineCount: _onlinePlayers.size, redisKeys };
}

module.exports = {
  checkAndSetCooldown,
  setPlayerSession, getPlayerSession, deletePlayerSession,
  playerConnected, playerDisconnected, getOnlineCount,
  updateLeaderboard, getLeaderboard,
  pushWinFeed, getWinFeed,
  updateHotStreak, getHotStreaks,
  cacheRTPProfile, getCachedRTPProfile, invalidateRTPCache,
  getSystemStats,
};