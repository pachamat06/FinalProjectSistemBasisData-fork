const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const USERNAMES = [
  'NeonKing', 'GoldRush', 'CryptoShark', 'LuckyAce', 'DiamondHands',
  'VolcanoBet', 'ShadowRoller', 'QuantumSpin', 'VortexGambler', 'PhoenixDice',
  'CobaltBlaze', 'NightOwlBet', 'TitanWager', 'StarlightJack', 'EliteRoller',
  'SilverFox', 'IronChance', 'MysticWheel', 'StormCrafter', 'ZenithBet',
];

// Password default untuk semua seed player: "seed1234"
const SEED_PASSWORD_HASH = bcrypt.hashSync('seed1234', 10);

function rand(min, max)    { return Math.random() * (max - min) + min; }
function randInt(min, max) { return Math.floor(rand(min, max)); }

async function seed() {
  console.log('🌱 Seeding database...');

  // Clear semua data lama (urutan penting — child dulu)
  await prisma.gameRound.deleteMany();
  await prisma.gameSession.deleteMany();
  await prisma.rTPProfile.deleteMany();
  await prisma.player.deleteMany();
  await prisma.user.deleteMany();

  const players = [];

  const seedPasswordHash = await bcrypt.hash('password', 10);

  for (let i = 0; i < 20; i++) {
    const username = USERNAMES[i];
    const wins        = randInt(50, 500);
    const losses      = randInt(50, 600);
    const totalBet    = (wins + losses) * rand(100, 500);
    const totalWon    = wins * rand(150, 800);
    const totalProfit = totalWon - totalBet;
    const balance     = Math.max(500, 10000 + totalProfit * rand(0.1, 0.3));

    // Buat User dulu — schema mengharuskan Player.userId (FK ke User)
    const user = await prisma.user.create({
      data: {
        username,
        email:        `${username.toLowerCase()}@seed.com`,
        passwordHash: SEED_PASSWORD_HASH,
        guestAccount: false,
      },
    });

    const baseUsername = USERNAMES[i];
    const email = `${baseUsername.toLowerCase()}@seed.local`;

    const { player } = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: baseUsername,
          email,
          passwordHash: seedPasswordHash,
          guestAccount: false,
        },
      });

      const createdPlayer = await tx.player.create({
        data: {
          userId: user.id,
          username: user.username,
          balance: parseFloat(balance.toFixed(2)),
          level: randInt(1, 50),
          totalWins: wins,
          totalLosses: losses,
          totalProfit: parseFloat(totalProfit.toFixed(2)),
          totalBetAmount: parseFloat(totalBet.toFixed(2)),
          highestSingleWin: parseFloat((rand(500, 10000)).toFixed(2)),
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
        volatilityLevel: 1.0,
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
    process.stdout.write(`  ✓ ${username} (user: ${username.toLowerCase()}@seed.com)\n`);
  }

  console.log('\n✅ Seed complete — 20 players created');
  console.log('   Login dengan email @seed.com dan password: seed1234');

  // Seed Redis leaderboard
  try {
    const { getRedis } = require('../config/redis');
    const redis = getRedis();
    for (const p of players) {
      await redis.zadd('leaderboard:profit',    p.totalProfit,                    p.id);
      await redis.zadd('leaderboard:highestWin', p.highestSingleWin,              p.id);
      await redis.zadd('leaderboard:mostActive', p.totalWins + p.totalLosses,     p.id);
    }
    console.log('✅ Redis leaderboard seeded');
    await redis.quit();
  } catch (e) {
    console.warn('⚠️  Redis seed skipped (not connected):', e.message);
  }

  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});