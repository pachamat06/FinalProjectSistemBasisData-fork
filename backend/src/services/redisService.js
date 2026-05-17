const { getRedis } = require('../config/redis');

// Helper — jalankan Redis call, return fallback jika gagal (tidak throw)
async function safeRedis(fn, fallback = null) {
  try {
    const redis = getRedis();
    return await fn(redis);
  } catch (err) {
    console.warn('[Redis] Operation failed (non-fatal):', err.message);
    return fallback;
  }
}

// ── Leaderboard ───────────────────────────────────────────────────────────────
async function updateLeaderboard(playerId, scores) {
  await safeRedis(async (redis) => {
    const pipeline = redis.pipeline();
    if (scores.totalProfit      !== undefined) pipeline.zadd('leaderboard:profit',     scores.totalProfit,      playerId);
    if (scores.highestSingleWin !== undefined) pipeline.zadd('leaderboard:highestWin', scores.highestSingleWin, playerId);
    if (scores.totalRounds      !== undefined) pipeline.zadd('leaderboard:mostActive', scores.totalRounds,      playerId);
    await pipeline.exec();
  });
}

async function getLeaderboard(metric = 'profit', limit = 20) {
  const results = await safeRedis(async (redis) => {
    return await redis.zrevrange(`leaderboard:${metric}`, 0, limit - 1, 'WITHSCORES');
  }, []);

  const parsed = [];
  for (let i = 0; i < results.length; i += 2) {
    parsed.push({ playerId: results[i], score: parseFloat(results[i + 1]), rank: Math.floor(i / 2) + 1 });
  }
  return parsed;
}

// ── Spin cooldown ─────────────────────────────────────────────────────────────
async function checkAndSetCooldown(playerId) {
  const result = await safeRedis(async (redis) => {
    const key    = `cooldown:${playerId}`;
    const exists = await redis.get(key);
    if (exists) return false;
    await redis.set(key, '1', 'PX', 1500);
    return true;
  }, true); // ✅ fallback true = izinkan spin jika Redis gagal
  return result;
}

// ── Session ───────────────────────────────────────────────────────────────────
async function setPlayerSession(playerId, sessionData) {
  await safeRedis((redis) =>
    redis.setex(`session:${playerId}`, 3600, JSON.stringify(sessionData))
  );
}

async function getPlayerSession(playerId) {
  const data = await safeRedis((redis) => redis.get(`session:${playerId}`));
  return data ? JSON.parse(data) : null;
}

async function deletePlayerSession(playerId) {
  await safeRedis((redis) => redis.del(`session:${playerId}`));
}

// ── Online players ────────────────────────────────────────────────────────────
async function playerConnected(playerId) {
  await safeRedis((redis) => redis.sadd('online:players', playerId));
}

async function playerDisconnected(playerId) {
  await safeRedis((redis) => redis.srem('online:players', playerId));
}

async function getOnlineCount() {
  return await safeRedis((redis) => redis.scard('online:players'), 0);
}

// ── Win feed ──────────────────────────────────────────────────────────────────
async function pushWinFeed(entry) {
  await safeRedis(async (redis) => {
    await redis.lpush('feed:wins', JSON.stringify(entry));
    await redis.ltrim('feed:wins', 0, 49);
    await redis.expire('feed:wins', 3600);
  });
}

async function getWinFeed(limit = 20) {
  const items = await safeRedis((redis) => redis.lrange('feed:wins', 0, limit - 1), []);
  return items.map((i) => JSON.parse(i));
}

// ── Hot streaks ───────────────────────────────────────────────────────────────
async function updateHotStreak(playerId, streak) {
  await safeRedis((redis) => redis.zadd('feed:streaks', streak, playerId));
}

async function getHotStreaks(limit = 10) {
  const results = await safeRedis(
    (redis) => redis.zrevrange('feed:streaks', 0, limit - 1, 'WITHSCORES'),
    []
  );
  const parsed = [];
  for (let i = 0; i < results.length; i += 2) {
    parsed.push({ playerId: results[i], streak: parseInt(results[i + 1]) });
  }
  return parsed;
}

// ── RTP cache ─────────────────────────────────────────────────────────────────
async function cacheRTPProfile(playerId, profile) {
  await safeRedis((redis) => redis.setex(`rtp:${playerId}`, 60, JSON.stringify(profile)));
}

async function getCachedRTPProfile(playerId) {
  const data = await safeRedis((redis) => redis.get(`rtp:${playerId}`));
  return data ? JSON.parse(data) : null;
}

async function invalidateRTPCache(playerId) {
  await safeRedis((redis) => redis.del(`rtp:${playerId}`));
}

// ── System stats ──────────────────────────────────────────────────────────────
async function getSystemStats() {
  const onlineCount = await getOnlineCount();
  const redisKeys   = await safeRedis((redis) => redis.dbsize(), 0);
  return { onlineCount, redisKeys };
}

module.exports = {
  updateLeaderboard, getLeaderboard,
  checkAndSetCooldown,
  setPlayerSession, getPlayerSession, deletePlayerSession,
  playerConnected, playerDisconnected, getOnlineCount,
  pushWinFeed, getWinFeed,
  updateHotStreak, getHotStreaks,
  cacheRTPProfile, getCachedRTPProfile, invalidateRTPCache,
  getSystemStats,
};