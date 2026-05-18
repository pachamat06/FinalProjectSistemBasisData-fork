require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const playerRoutes      = require('./routes/playerRoutes');
const gameRoutes        = require('./routes/gameRoutes');
const rtpRoutes         = require('./routes/rtpRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const adminRoutes       = require('./routes/adminRoutes');
const authRoutes        = require('./routes/authRoutes');
const { apiLimiter, errorHandler } = require('./middleware');
const prisma            = require('./config/prisma');

const app = express();
app.set('trust proxy', 1);

// CORS — izinkan semua *.vercel.app + localhost + CORS_ORIGIN yang dikonfigurasi
app.use(cors({
  origin: (origin, callback) => {
    // Izinkan: tanpa origin (mobile/Postman), localhost, semua *.vercel.app
    if (
      !origin ||
      origin.includes('localhost') ||
      origin.endsWith('.vercel.app') ||
      origin === process.env.CORS_ORIGIN
    ) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} tidak diizinkan`));
    }
  },
  credentials:  true,
  methods:      ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Handle preflight OPTIONS untuk semua route
app.options('*', cors());

app.use(express.json());
app.use(apiLimiter);

app.use('/api/auth',        authRoutes);
app.use('/api/player',      playerRoutes);
app.use('/api/game',        gameRoutes);
app.use('/api/rtp',         rtpRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/admin',       adminRoutes);

app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', time: new Date().toISOString() })
);

app.use(errorHandler);

const isVercel = process.env.VERCEL === '1';

if (!isVercel) {
  const http            = require('http');
  const { Server }      = require('socket.io');
  const { initSockets } = require('./sockets/socketHandler');
  const { getRedis }    = require('./config/redis');

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin:      (origin, cb) => cb(null, true), // sama dengan atas
      methods:     ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  app.set('io', io);
  initSockets(io);
  getRedis();

  const PORT = process.env.PORT || 3001;
  server.listen(PORT, () => console.log(`[Server] Running on port ${PORT}`));

  process.on('SIGTERM', async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
} else {
  app.set('io', null);
  try {
    const { getRedis } = require('./config/redis');
    getRedis();
  } catch { /* Redis gagal konek */ }
}

module.exports = app;
