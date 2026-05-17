const prisma = require('../config/prisma');
const { calculateWinRate, generateOutcome } = require('./rtpEngine');
const redisService = require('./redisService');

async function getOrCreateRTPProfile(playerId) {
  let profile = await prisma.rTPProfile.findUnique({ where: { playerId } });
  if (!profile) {
    profile = await prisma.rTPProfile.create({ data: { playerId } });
  }
  return profile;
}

async function processSpin(playerId, betAmount, sessionId, io) {
  const [player, session, rtpProfile] = await Promise.all([
    prisma.player.findUnique({ where: { id: playerId } }),
    prisma.gameSession.findUnique({ where: { id: sessionId } }),
    getOrCreateRTPProfile(playerId),
  ]);

  if (!player)  throw new Error('Player not found');
  if (!session) throw new Error('Session not found');
  if (player.balance < betAmount) throw new Error('Insufficient balance');

  const sessionData = {
    totalRounds: session.totalRounds,
    isNewPlayer: player.totalWins + player.totalLosses < 10,
  };

  const winRate = calculateWinRate(rtpProfile, sessionData, player);
  const outcome = generateOutcome(winRate);

  const payout        = outcome.isWin ? parseFloat((betAmount * outcome.multiplier).toFixed(2)) : 0;
  const balanceDelta  = payout - betAmount;
  const newBalance    = parseFloat((player.balance + balanceDelta).toFixed(2));
  const streakBefore  = outcome.isWin ? rtpProfile.winningStreak : rtpProfile.losingStreak;
  const newLosingStreak  = outcome.isWin ? 0 : rtpProfile.losingStreak + 1;
  const newWinningStreak = outcome.isWin ? rtpProfile.winningStreak + 1 : 0;
  const newPityCounter   = outcome.isWin ? 0 : rtpProfile.pityCounter + 1;
  const streakAfter      = outcome.isWin ? newWinningStreak : newLosingStreak;

  // ✅ Hitung nilai yang akan dipakai Redis SEBELUM transaction
  // Sehingga tidak perlu query DB lagi setelah transaction
  const updatedTotalProfit      = player.totalProfit + balanceDelta;
  const updatedHighestSingleWin = outcome.isWin && payout > player.highestSingleWin
    ? payout : player.highestSingleWin;
  const updatedTotalRounds = (player.totalWins + player.totalLosses) + 1;

  // ── DB transaction ────────────────────────────────────────────────────────
  await prisma.$transaction([
    prisma.gameRound.create({
      data: {
        sessionId, playerId, betAmount, payout,
        outcome:          outcome.isWin ? 'win' : 'lose',
        resultingBalance: newBalance,
        winRateUsed:      winRate,
        streakBefore,     streakAfter,
      },
    }),
    prisma.player.update({
      where: { id: playerId },
      data: {
        balance:          newBalance,
        totalWins:        outcome.isWin ? { increment: 1 } : undefined,
        totalLosses:      !outcome.isWin ? { increment: 1 } : undefined,
        totalProfit:      { increment: balanceDelta },
        totalBetAmount:   { increment: betAmount },
        highestSingleWin: outcome.isWin && payout > player.highestSingleWin ? payout : undefined,
      },
    }),
    prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        totalRounds:       { increment: 1 },
        totalBet:          { increment: betAmount },
        totalWon:          { increment: payout },
        sessionProfit:     { increment: balanceDelta },
        longestWinStreak:  newWinningStreak > session.longestWinStreak  ? newWinningStreak  : undefined,
        longestLoseStreak: newLosingStreak  > session.longestLoseStreak ? newLosingStreak   : undefined,
      },
    }),
    prisma.rTPProfile.update({
      where: { playerId },
      data: {
        losingStreak:   newLosingStreak,
        winningStreak:  newWinningStreak,
        pityCounter:    newPityCounter,
        currentWinRate: winRate,
        sessionFatigue: Math.min(rtpProfile.sessionFatigue + 0.002, 0.1),
      },
    }),
  ]);

  // ── Redis (opsional, fire-and-forget — tidak tunggu, tidak block response) ─
  // ✅ Tidak pakai await → response langsung dikembalikan ke client
  //    Redis update jalan di background
  Promise.all([
    redisService.updateLeaderboard(playerId, {
      totalProfit:      updatedTotalProfit,
      highestSingleWin: updatedHighestSingleWin,
      totalRounds:      updatedTotalRounds,
    }),
    outcome.isWin && redisService.pushWinFeed({
      playerId, username: player.username, payout,
      multiplier: outcome.multiplier, timestamp: Date.now(),
    }),
    outcome.isWin && redisService.updateHotStreak(playerId, newWinningStreak),
    redisService.invalidateRTPCache(playerId),
  ]).catch((err) => {
    console.warn('[Redis] Background update failed:', err.message);
  });

  const result = {
    outcome:       outcome.isWin ? 'win' : 'lose',
    payout,
    multiplier:    outcome.multiplier,
    newBalance,
    winRateUsed:   winRate,
    betAmount,
    winningStreak: newWinningStreak,
    losingStreak:  newLosingStreak,
    pityCounter:   newPityCounter,
    roll:          outcome.roll,
    isBigWin:      payout >= betAmount * 5,
  };

  if (io) {
    io.emit('player:spin', { playerId, username: player.username, outcome: result.outcome, betAmount });
    io.emit('player:balance', { playerId, newBalance });
    if (result.outcome === 'win') {
      io.to(`player:${playerId}`).emit('player:win', result);
      if (result.isBigWin) {
        io.emit('system:bigWin', { username: player.username, payout, multiplier: outcome.multiplier });
      }
    } else {
      io.to(`player:${playerId}`).emit('player:lose', result);
    }
    if (newWinningStreak >= 3 || newLosingStreak >= 3) {
      io.to(`player:${playerId}`).emit('player:streak', {
        type:  newWinningStreak >= 3 ? 'win' : 'lose',
        count: newWinningStreak >= 3 ? newWinningStreak : newLosingStreak,
      });
    }
    redisService.getLeaderboard('profit', 10)
      .then((lb) => io.emit('leaderboard:update', lb))
      .catch(() => {});
  }

  return result;
}

module.exports = { processSpin, getOrCreateRTPProfile };