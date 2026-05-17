require('dotenv').config();
const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');
const cors    = require('cors');

const playerRoutes    = require('./routes/playerRoutes');
const gameRoutes      = require('./routes/gameRoutes');
const rtpRoutes       = require('./routes/rtpRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const adminRoutes     = require('./routes/adminRoutes');
const authRoutes      = require('./routes/authRoutes');
const { apiLimiter, errorHandler } = require('./middleware');
const { initSockets } = require('./sockets/socketHandler');
const { getRedis }    = require('./config/redis');
const prisma          = require('./config/prisma');

const app    = express();
const server = http.createServer(app);

// ✅ Trust proxy — diperlukan untuk rate-limit & IP detection di Railway/Vercel
app.set('trust proxy', 1);

// CORS — izinkan frontend Vercel dan local dev
const allowedOrigins = [
  process.env.CORS_ORIGIN,
  'http://localhost:5173',
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
});

app.set('io', io);

app.use(cors({
  origin: (origin, callback) => {
    // Izinkan request tanpa origin (mobile, Postman) atau origin yang terdaftar
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(apiLimiter);

// Routes
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

initSockets(io);
getRedis(); // eager connect

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`[Server] Running on port ${PORT}`);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});