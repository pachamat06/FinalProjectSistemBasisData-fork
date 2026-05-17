const prisma = require('../config/prisma');
const { processSpin } = require('../services/gameService');
const { checkAndSetCooldown, setPlayerSession, getPlayerSession, deletePlayerSession } = require('../services/redisService');

const startSession = async (req, res) => {
  try {
    const { playerId } = req.body;
    if (!playerId) return res.status(400).json({ error: 'playerId required' });

    const player = await prisma.player.findUnique({ where: { id: playerId } });
    if (!player) return res.status(404).json({ error: 'Player not found' });

    // End any existing active session
    const existing = await getPlayerSession(playerId);
    if (existing?.sessionId) {
      await prisma.gameSession.update({
        where: { id: existing.sessionId },
        data: { endedAt: new Date() },
      }).catch(() => {});
    }

    const session = await prisma.gameSession.create({ data: { playerId } });
    await setPlayerSession(playerId, { sessionId: session.id, startedAt: Date.now() });
    res.json({ session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const endSession = async (req, res) => {
  try {
    const { playerId, sessionId } = req.body;
    if (!playerId || !sessionId) return res.status(400).json({ error: 'playerId and sessionId required' });

    // Ambil data session dulu untuk hitung averageBet
    const existing = await prisma.gameSession.findUnique({ where: { id: sessionId } });

    const averageBet = existing && existing.totalRounds > 0
      ? parseFloat((existing.totalBet / existing.totalRounds).toFixed(2))
      : 0;

    const session = await prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        endedAt: new Date(),
        averageBet,
      },
    });

    await deletePlayerSession(playerId);
    res.json({ session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const spin = async (req, res) => {
  try {
    const { playerId, betAmount } = req.body;
    if (!playerId || !betAmount) return res.status(400).json({ error: 'playerId and betAmount required' });
    if (betAmount <= 0) return res.status(400).json({ error: 'Invalid bet amount' });

    // Cooldown check
    const allowed = await checkAndSetCooldown(playerId);
    if (!allowed) return res.status(429).json({ error: 'Spin cooldown active. Wait 1.5 seconds.' });

    // Get or create session
    let sessionData = await getPlayerSession(playerId);
    let sessionId = sessionData?.sessionId;

    if (!sessionId) {
      const session = await prisma.gameSession.create({ data: { playerId } });
      sessionId = session.id;
      await setPlayerSession(playerId, { sessionId, startedAt: Date.now() });
    }

    const io = req.app.get('io');
    const result = await processSpin(playerId, parseFloat(betAmount), sessionId, io);

    res.json(result);
  } catch (err) {
    if (err.message === 'Insufficient balance') return res.status(400).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
};

module.exports = { startSession, endSession, spin };