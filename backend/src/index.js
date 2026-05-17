require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const playerRoutes    = require('./routes/playerRoutes');
const gameRoutes      = require('./routes/gameRoutes');
const rtpRoutes       = require('./routes/rtpRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const adminRoutes     = require('./routes/adminRoutes');
const authRoutes      = require('./routes/authRoutes');
const { apiLimiter, errorHandler } = require('./middleware');
const prisma          = require('./config/prisma');

const app = express();

// ✅ Trust proxy — diperlukan untuk rate-limit di Vercel/Render
app.set('trust proxy', 1);

const allowedOrigins = [
  process.env.CORS_ORIGIN,
  'http://localhost:5173',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

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

// ✅ Deteksi environment:
// - Vercel (VERCEL=1): export app saja, tidak perlu listen & Socket.io
// - Local dev: jalankan server + Socket.io seperti biasa
const isVercel = process.env.VERCEL === '1';

if (!isVercel) {
  // ── Local / Render: jalankan Socket.io + server.listen ────────────────────
  const http              = require('http');
  const { Server }        = require('socket.io');
  const { initSockets }   = require('./sockets/socketHandler');
  const { getRedis }      = require('./config/redis');

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin:      allowedOrigins,
      methods:     ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  app.set('io', io);
  initSockets(io);
  getRedis(); // eager connect Redis

  const PORT = process.env.PORT || 3001;
  server.listen(PORT, () => {
    console.log(`[Server] Running on port ${PORT}`);
  });

  process.on('SIGTERM', async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
} else {
  // ── Vercel serverless: Socket.io tidak tersedia ────────────────────────────
  // io = null → semua if (io) di gameService.js akan dilewati otomatis
  app.set('io', null);

  // Inisialisasi Redis untuk session & cooldown
  try {
    const { getRedis } = require('./config/redis');
    getRedis();
  } catch {
    // Redis gagal konek — tidak crash app
  }
}

// ✅ Export app untuk Vercel serverless
module.exports = app;