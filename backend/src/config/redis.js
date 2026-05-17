const Redis = require('ioredis');

let redis;

function getRedis() {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const isTLS    = redisUrl.startsWith('rediss://');

    redis = new Redis(redisUrl, {
      tls:                  isTLS ? {} : undefined,
      // ✅ Kurangi retry untuk serverless — gagal cepat daripada tunggu lama
      maxRetriesPerRequest: 1,
      connectTimeout:       3000,  // 3 detik max tunggu koneksi
      commandTimeout:       3000,  // 3 detik max per command
      retryStrategy(times) {
        if (times > 1) return null; // berhenti setelah 1 retry
        return 200;
      },
      reconnectOnError(err) {
        return err.message.includes('READONLY');
      },
      lazyConnect: true, // ✅ tidak konek sampai benar-benar dipakai
    });

    redis.on('connect',      () => console.log('[Redis] Connected'));
    redis.on('error',    (err) => console.error('[Redis] Error:', err.message));
    redis.on('reconnecting', () => console.log('[Redis] Reconnecting...'));
  }
  return redis;
}

module.exports = { getRedis };