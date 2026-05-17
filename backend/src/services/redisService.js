const { getRedis } = require('../config/redis');

const COOLDOWN_MS    = 1500;
const RTP_CACHE_TTL  = 60;    // detik

// ── Leaderboard ───────────────────────────────────────────────────────────────
async function updateLeaderboard(playerId, scores) {
  const redis    = getRedis();
  const pipeline = redis.pipeline();
  if (scores.totalProfit      !== undefined) pipeline.zadd('leaderboard:profit',     scores.totalProfit,      playerId);
  if (scores.highestSingleWin !== undefined) pipeline.zadd('leaderboard:highestWin', scores.highestSingleWin, playerId);
  if (scores.totalRounds      !== undefined) pipeline.zadd('leaderboard:mostActive', scores.totalRounds,      playerId);
  await pipeline.exec();
}

async function getLeaderboard(metric = 'profit', limit = 20) {
  const redis   = getRedis();
  const key     = `leaderboard:${metric}`;
  const results = await redis.zrevrange(key, 0, limit - 1, 'WITHSCORES');
  const parsed  = [];
  for (let i = 0; i < results.length; i += 2) {
    parsed.push({
      playerId: results[i],
      score:    parseFloat(results[i + 1]),
      rank:     Math.floor(i / 2) + 1,
    });
  }
  return parsed;
}

// ── Spin cooldown ─────────────────────────────────────────────────────────────
async function checkAndSetCooldown(playerId) {
  const redis  = getRedis();
  const key    = `cooldown:${playerId}`;
  const exists = await redis.get(key);
  if (exists) return false;
  await redis.set(key, '1', 'PX', COOLDOWN_MS);
  return true;
}

// ── Session management ────────────────────────────────────────────────────────
async function setPlayerSession(playerId, sessionData) {
  const redis = getRedis();
  await redis.setex(`session:${playerId}`, 3600, JSON.stringify(sessionData));
}

async function getPlayerSession(playerId) {
  const redis = getRedis();
  const data  = await redis.get(`session:${playerId}`);
  return data ? JSON.parse(data) : null;
}

async function deletePlayerSession(playerId) {
  const redis = getRedis();
  await redis.del(`session:${playerId}`);
}

// ── Online players ────────────────────────────────────────────────────────────
async function playerConnected(playerId) {
  const redis = getRedis();
  await redis.sadd('online:players', playerId);
}

async function playerDisconnected(playerId) {
  const redis = getRedis();
  await redis.srem('online:players', playerId);
}

async function getOnlineCount() {
  const redis = getRedis();
  return await redis.scard('online:players');
}

// ── Recent win feed ───────────────────────────────────────────────────────────
async function pushWinFeed(entry) {
  const redis = getRedis();
  await redis.lpush('feed:wins', JSON.stringify(entry));
  await redis.ltrim('feed:wins', 0, 49);
  await redis.expire('feed:wins', 3600);
}

async function getWinFeed(limit = 20) {
  const redis = getRedis();
  const items = await redis.lrange('feed:wins', 0, limit - 1);
  return items.map((i) => JSON.parse(i));
}

// ── Hot streaks ───────────────────────────────────────────────────────────────
async function updateHotStreak(playerId, streak) {
  const redis = getRedis();
  await redis.zadd('feed:streaks', streak, playerId);
}

async function getHotStreaks(limit = 10) {
  const redis   = getRedis();
  const results = await redis.zrevrange('feed:streaks', 0, limit - 1, 'WITHSCORES');
  const parsed  = [];
  for (let i = 0; i < results.length; i += 2) {
    parsed.push({ playerId: results[i], streak: parseInt(results[i + 1]) });
  }
  return parsed;
}

// ── RTP cache ─────────────────────────────────────────────────────────────────
async function cacheRTPProfile(playerId, profile) {
  const redis = getRedis();
  await redis.setex(`rtp:${playerId}`, RTP_CACHE_TTL, JSON.stringify(profile));
}

async function getCachedRTPProfile(playerId) {
  const redis = getRedis();
  const data  = await redis.get(`rtp:${playerId}`);
  return data ? JSON.parse(data) : null;
}

async function invalidateRTPCache(playerId) {
  const redis = getRedis();
  await redis.del(`rtp:${playerId}`);
}

// ── System stats ──────────────────────────────────────────────────────────────
async function getSystemStats() {
  const redis      = getRedis();
  const onlineCount= await getOnlineCount();
  const dbSize     = await redis.dbsize();
  return { onlineCount, redisKeys: dbSize };
}

module.exports = {
  updateLeaderboard,
  getLeaderboard,
  checkAndSetCooldown,
  setPlayerSession,
  getPlayerSession,
  deletePlayerSession,
  playerConnected,
  playerDisconnected,
  getOnlineCount,
  pushWinFeed,
  getWinFeed,
  updateHotStreak,
  getHotStreaks,
  cacheRTPProfile,
  getCachedRTPProfile,
  invalidateRTPCache,
  getSystemStats,
};