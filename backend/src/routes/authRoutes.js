const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const router = express.Router();

// Ambil secret sekali, log peringatan jika tidak diset
const JWT_SECRET = process.env.JWT_SECRET || 'changeme_set_JWT_SECRET_in_env';
if (!process.env.JWT_SECRET) {
  console.warn('[Auth] ⚠️  JWT_SECRET tidak diset di .env — gunakan nilai aman di production!');
}

const signToken = (userId, expiresIn = '7d') =>
  jwt.sign({ userId }, JWT_SECRET, { expiresIn });

// ── Register ─────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ error: 'username, email, dan password wajib diisi' });

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });
    if (existingUser)
      return res.status(400).json({ error: 'Username atau email sudah digunakan' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, email, passwordHash },
    });
    const player = await prisma.player.create({
      data: { userId: user.id, username: user.username, balance: 10000 },
    });

    const token = signToken(user.id);
    res.json({ token, user: { id: user.id, username, email }, player });
  } catch (error) {
    console.error('[Auth] register error:', error.message);
    res.status(500).json({ error: 'Registrasi gagal' });
  }
});

// ── Login ─────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;
    if (!usernameOrEmail || !password)
      return res.status(400).json({ error: 'usernameOrEmail dan password wajib diisi' });

    const user = await prisma.user.findFirst({
      where: { OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }] },
    });
    if (!user) return res.status(400).json({ error: 'Kredensial tidak valid' });

    // Guest tidak bisa login dengan password
    if (user.guestAccount)
      return res.status(400).json({ error: 'Akun guest tidak bisa login dengan password' });

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) return res.status(400).json({ error: 'Kredensial tidak valid' });

    const player = await prisma.player.findUnique({ where: { userId: user.id } });
    const token  = signToken(user.id);

    res.json({ token, user: { id: user.id, username: user.username, email: user.email }, player });
  } catch (error) {
    console.error('[Auth] login error:', error.message);
    res.status(500).json({ error: 'Login gagal' });
  }
});

// ── Guest Login ───────────────────────────────────────────────────────────────
router.post('/guest', async (req, res) => {
  try {
    // Pastikan username unik dengan timestamp
    const guestUsername = `Guest${Date.now().toString().slice(-6)}`;

    const user = await prisma.user.create({
      data: {
        username:     guestUsername,
        email:        `${guestUsername}@guest.com`,
        passwordHash: '',
        guestAccount: true,
      },
    });
    const player = await prisma.player.create({
      data: { userId: user.id, username: user.username, balance: 10000 },
    });

    const token = signToken(user.id, '1d');
    res.json({ token, user: { id: user.id, username: user.username, email: user.email }, player });
  } catch (error) {
    console.error('[Auth] guest error:', error.message);
    res.status(500).json({ error: 'Guest login gagal' });
  }
});

// ── Middleware: verify token ──────────────────────────────────────────────────
const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Akses ditolak — token tidak ada' });
  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.userId = verified.userId;
    next();
  } catch {
    res.status(400).json({ error: 'Token tidak valid atau sudah expired' });
  }
};

// ── GET /me ───────────────────────────────────────────────────────────────────
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where:   { id: req.userId },
      include: { player: true },
    });
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });
    res.json({ user, player: user.player });
  } catch (error) {
    console.error('[Auth] /me error:', error.message);
    res.status(500).json({ error: 'Gagal mengambil data user' });
  }
});

module.exports = router;