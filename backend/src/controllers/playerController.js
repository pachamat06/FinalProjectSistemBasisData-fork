const prisma = require('../config/prisma');

const getPlayer = async (req, res) => {
  try {
    const { id } = req.params;
    const player = await prisma.player.findUnique({ where: { id }, include: { rtpProfile: true } });
    if (!player) return res.status(404).json({ error: 'Player not found' });
    res.json(player);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const getPlayerHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const rounds = await prisma.gameRound.findMany({
      where: { playerId: id }, orderBy: { createdAt: 'desc' }, take: limit,
    });
    res.json(rounds);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const getPlayerStats = async (req, res) => {
  try {
    const { id } = req.params;
    const [player, sessions, rtpProfile] = await Promise.all([
      prisma.player.findUnique({ where: { id } }),
      prisma.gameSession.findMany({ where: { playerId: id }, orderBy: { startedAt: 'desc' }, take: 20 }),
      prisma.rTPProfile.findUnique({ where: { playerId: id } }),
    ]);
    if (!player) return res.status(404).json({ error: 'Player not found' });
    const totalRounds = player.totalWins + player.totalLosses;
    const winRate = totalRounds > 0 ? player.totalWins / totalRounds : 0;
    res.json({
      player, sessions, rtpProfile,
      stats: {
        totalRounds,
        winRate: parseFloat(winRate.toFixed(4)),
        avgBet: totalRounds > 0 ? parseFloat((player.totalBetAmount / totalRounds).toFixed(2)) : 0,
        roi: player.totalBetAmount > 0
          ? parseFloat(((player.totalProfit / player.totalBetAmount) * 100).toFixed(2)) : 0,
      },
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const getAllPlayers = async (req, res) => {
  try {
    let players;
    try {
      // Coba dengan user.isBanned (butuh db:push sudah dijalankan)
      players = await prisma.player.findMany({
        orderBy: { totalProfit: 'desc' },
        take: 100,
        include: {
          user: {
            select: {
              id: true, isBanned: true, bannedAt: true,
              email: true, guestAccount: true, createdAt: true,
            },
          },
        },
      });
    } catch {
      // Fallback jika kolom isBanned belum ada
      players = await prisma.player.findMany({
        orderBy: { totalProfit: 'desc' },
        take: 100,
      });
    }
    res.json(players);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = { getPlayer, getPlayerHistory, getPlayerStats, getAllPlayers };