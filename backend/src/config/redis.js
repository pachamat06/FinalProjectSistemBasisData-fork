const Redis = require('ioredis');

let redis;

function getRedis() {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL || 'redis://default:gQAAAAAAAfL5AAIgcDIxZDlkOGU2ZTk3NWU0NTM5YjU2MjY1OTBjNTY0Mjg0Yw@main-reindeer-127737.upstash.io:6379';

    // ✅ Upstash pakai rediss:// (TLS) — ioredis butuh tls: {} untuk ini
    const isTLS = redisUrl.startsWith('rediss://');

    redis = new Redis(redisUrl, {
      tls:                  isTLS ? {} : undefined,
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        return Math.min(times * 100, 3000);
      },
      reconnectOnError(err) {
        return err.message.includes('READONLY');
      },
    });

    redis.on('connect',      () => console.log('[Redis] Connected'));
    redis.on('error',    (err) => console.error('[Redis] Error:', err.message));
    redis.on('reconnecting', () => console.log('[Redis] Reconnecting...'));
  }
  return redis;
}

module.exports = { getRedis };