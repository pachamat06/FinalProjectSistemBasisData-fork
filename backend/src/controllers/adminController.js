const prisma = require('../config/prisma');
const { processSpin }   = require('../services/gameService');
const {
  getPlayerSession, setPlayerSession,
  invalidateRTPCache, deletePlayerSession,
  getOnlineCount,
} = require('../services/redisService');

const simulateSpins = async (req, res) => {
  try {
    const { playerId, count = 100 } = req.body;
    let sessionData = await getPlayerSession(playerId);
    let sessionId   = sessionData?.sessionId;
    if (!sessionId) {
      const session = await prisma.gameSession.create({ data: { playerId } });
      sessionId     = session.id;
      await setPlayerSession(playerId, { sessionId, startedAt: Date.now() });
    }
    const results   = [];
    const spinCount = Math.min(count, 500);
    for (let i = 0; i < spinCount; i++) {
      const player = await prisma.player.findUnique({ where: { id: playerId } });
      if (!player || player.balance < 100) break;
      const result = await processSpin(playerId, 100, sessionId, null);
      results.push(result);
    }
    const wins = results.filter((r) => r.outcome === 'win').length;
    res.json({
      totalSpins:    results.length,
      wins,
      losses:        results.length - wins,
      actualWinRate: parseFloat((wins / results.length).toFixed(4)),
      lastResult:    results[results.length - 1],
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const getSystemStatsAdmin = async (req, res) => {
  try {
    const [playerCount, roundCount, sessionCount, bannedCount] = await Promise.all([
      prisma.player.count(),
      prisma.gameRound.count(),
      prisma.gameSession.count(),
      prisma.user.count({ where: { isBanned: true } }).catch(() => 0),
    ]);

    res.json({
      playerCount,
      totalRounds:   roundCount,
      totalSessions: sessionCount,
      bannedUsers:   bannedCount,
      onlineCount:   await getOnlineCount(),
      redisStatus:   'disabled',
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const forceWinStreak = async (req, res) => {
  try {
    const { playerId, streakLength = 5 } = req.body;
    await prisma.rTPProfile.upsert({
      where:  { playerId },
      update: { winningStreak: streakLength, losingStreak: 0, winModifier: 0.2 },
      create: { playerId, winningStreak: streakLength, losingStreak: 0, winModifier: 0.2 },
    });
    res.json({ success: true, message: `Win streak of ${streakLength} set` });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const forceLoseStreak = async (req, res) => {
  try {
    const { playerId, streakLength = 5 } = req.body;
    await prisma.rTPProfile.upsert({
      where:  { playerId },
      update: { losingStreak: streakLength, winningStreak: 0, winModifier: -0.15 },
      create: { playerId, losingStreak: streakLength, winningStreak: 0, winModifier: -0.15 },
    });
    res.json({ success: true, message: `Lose streak of ${streakLength} set` });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// Redis tidak digunakan — kembalikan pesan informatif
const inspectRedis = async (req, res) => {
  res.json({ _status: 'Redis tidak digunakan pada deployment ini.' });
};

// ── Ban / Unban ───────────────────────────────────────────────────────────────
const banUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user)         return res.status(404).json({ error: 'User tidak ditemukan' });
    if (user.isBanned) return res.status(400).json({ error: 'User sudah di-ban' });

    await prisma.user.update({
      where: { id: userId },
      data:  { isBanned: true, bannedAt: new Date() },
    });

    // Hapus session in-memory
    const player = await prisma.player.findUnique({ where: { userId } });
    if (player) await deletePlayerSession(player.id);

    res.json({ success: true, message: `User ${user.username} berhasil di-ban` });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const unbanUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user)          return res.status(404).json({ error: 'User tidak ditemukan' });
    if (!user.isBanned) return res.status(400).json({ error: 'User tidak dalam status ban' });

    await prisma.user.update({ where: { id: userId }, data: { isBanned: false, bannedAt: null } });
    res.json({ success: true, message: `User ${user.username} berhasil di-unban` });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { player: true } });
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });
    await _deleteUserCascade(user);
    res.json({ success: true, message: `User ${user.username} berhasil dihapus` });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

async function _deleteUserCascade(user) {
  const player = user.player ??
    await prisma.player.findUnique({ where: { userId: user.id } });

  await prisma.$transaction(async (tx) => {
    if (player) {
      await tx.gameRound.deleteMany({ where: { playerId: player.id } });
      await tx.gameSession.deleteMany({ where: { playerId: player.id } });
      await tx.rTPProfile.deleteMany({ where: { playerId: player.id } });
      await tx.player.delete({ where: { id: player.id } });
    }
    await tx.user.delete({ where: { id: user.id } });
  });

  // Bersihkan session in-memory
  if (player) await deletePlayerSession(player.id);
}

module.exports = {
  simulateSpins, getSystemStatsAdmin, forceWinStreak, forceLoseStreak,
  inspectRedis, banUser, unbanUser, deleteUser, _deleteUserCascade,
};