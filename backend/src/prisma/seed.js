const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const USERNAMES = [
  'NeonKing', 'GoldRush', 'CryptoShark', 'LuckyAce', 'DiamondHands',
  'VolcanoBet', 'ShadowRoller', 'QuantumSpin', 'VortexGambler', 'PhoenixDice',
  'CobaltBlaze', 'NightOwlBet', 'TitanWager', 'StarlightJack', 'EliteRoller',
  'SilverFox', 'IronChance', 'MysticWheel', 'StormCrafter', 'ZenithBet',
];

function rand(min, max)    { return Math.random() * (max - min) + min; }
function randInt(min, max) { return Math.floor(rand(min, max)); }

async function seed() {
  console.log('🌱 Seeding database...');

  // Clear semua data lama
  await prisma.gameRound.deleteMany();
  await prisma.gameSession.deleteMany();
  await prisma.rTPProfile.deleteMany();
  await prisma.player.deleteMany();
  await prisma.user.deleteMany();

  const seedPasswordHash = await bcrypt.hash('password', 10);
  const players = [];

  for (let i = 0; i < 20; i++) {
    const baseUsername = USERNAMES[i];
    const email        = `${baseUsername.toLowerCase()}@seed.local`;

    const wins        = randInt(50, 500);
    const losses      = randInt(50, 600);
    const totalBet    = (wins + losses) * rand(100, 500);
    const totalWon    = wins * rand(150, 800);
    const totalProfit = totalWon - totalBet;
    const balance     = Math.max(500, 10000 + totalProfit * rand(0.1, 0.3));

    const { player } = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username:     baseUsername,
          email,
          passwordHash: seedPasswordHash,
          guestAccount: false,
        },
      });

      const createdPlayer = await tx.player.create({
        data: {
          userId:          user.id,
          username:        user.username,
          balance:         parseFloat(balance.toFixed(2)),
          level:           randInt(1, 50),
          totalWins:       wins,
          totalLosses:     losses,
          totalProfit:     parseFloat(totalProfit.toFixed(2)),
          totalBetAmount:  parseFloat(totalBet.toFixed(2)),
          highestSingleWin:parseFloat(rand(500, 10000).toFixed(2)),
        },
      });

      return { player: createdPlayer };
    });

    // RTP Profile
    await prisma.rTPProfile.create({
      data: {
        playerId:       player.id,
        currentWinRate: parseFloat(rand(0.3, 0.6).toFixed(4)),
        winModifier:    parseFloat(rand(-0.05, 0.05).toFixed(4)),
        losingStreak:   randInt(0, 5),
        winningStreak:  randInt(0, 4),
        sessionFatigue: parseFloat(rand(0, 0.08).toFixed(4)),
        pityCounter:    randInt(0, 8),
        volatilityLevel:1.0,
      },
    });

    // Game Session
    const session = await prisma.gameSession.create({
      data: {
        playerId:          player.id,
        endedAt:           new Date(),
        totalRounds:       wins + losses,
        totalBet:          parseFloat(totalBet.toFixed(2)),
        totalWon:          parseFloat(totalWon.toFixed(2)),
        averageBet:        parseFloat((totalBet / (wins + losses)).toFixed(2)),
        sessionProfit:     parseFloat(totalProfit.toFixed(2)),
        longestWinStreak:  randInt(2, 8),
        longestLoseStreak: randInt(2, 10),
      },
    });

    // Recent Rounds
    const roundCount = randInt(10, 30);
    let runningBalance = balance;
    for (let r = 0; r < roundCount; r++) {
      const bet    = parseFloat(rand(50, 500).toFixed(2));
      const isWin  = Math.random() < 0.45;
      const payout = isWin ? parseFloat((bet * rand(1.5, 5)).toFixed(2)) : 0;
      runningBalance += payout - bet;

      await prisma.gameRound.create({
        data: {
          sessionId:        session.id,
          playerId:         player.id,
          betAmount:        bet,
          payout,
          outcome:          isWin ? 'win' : 'lose',
          resultingBalance: parseFloat(Math.max(0, runningBalance).toFixed(2)),
          winRateUsed:      parseFloat(rand(0.3, 0.6).toFixed(4)),
          streakBefore:     randInt(0, 3),
          streakAfter:      randInt(0, 4),
        },
      });
    }

    players.push(player);
    process.stdout.write(`  ✓ ${baseUsername}\n`);
  }

  console.log(`\n✅ Seed complete — ${players.length} players created`);
  console.log('   Login: email @seed.local, password: password');

  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});