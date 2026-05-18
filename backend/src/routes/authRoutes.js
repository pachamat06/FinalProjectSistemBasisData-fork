const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'changeme_set_JWT_SECRET_in_env';
if (!process.env.JWT_SECRET) {
  console.warn('[Auth] ⚠️  JWT_SECRET tidak diset di .env');
}
const signToken = (userId, expiresIn = '7d') =>
  jwt.sign({ userId }, JWT_SECRET, { expiresIn });

// ── Register ──────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ error: 'username, email, dan password wajib diisi' });

    const existing = await prisma.user.findFirst({ where: { OR: [{ username }, { email }] } });
    if (existing) return res.status(400).json({ error: 'Username atau email sudah digunakan' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user   = await prisma.user.create({ data: { username, email, passwordHash } });
    const player = await prisma.player.create({
      data: { userId: user.id, username, balance: 10000 },
    });

    res.json({ token: signToken(user.id), user: { id: user.id, username, email }, player });
  } catch (err) {
    console.error('[Auth] register:', err.message);
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

    // Cek banned
    if (user.isBanned)
      return res.status(403).json({ error: 'Akun ini telah di-ban. Hubungi administrator.' });

    if (user.guestAccount)
      return res.status(400).json({ error: 'Akun guest tidak bisa login dengan password' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(400).json({ error: 'Kredensial tidak valid' });

    const player = await prisma.player.findUnique({ where: { userId: user.id } });
    res.json({
      token: signToken(user.id),
      user:  { id: user.id, username: user.username, email: user.email },
      player,
    });
  } catch (err) {
    console.error('[Auth] login:', err.message);
    res.status(500).json({ error: 'Login gagal' });
  }
});

// Guest Login
router.post('/guest', async (req, res) => {
  const MAX_GUEST_ATTEMPTS = 5;
  let user   = null;
  let player = null;

  for (let attempt = 0; attempt < MAX_GUEST_ATTEMPTS; attempt++) {
    const guestSuffix   = `${Date.now().toString(36)}${Math.floor(Math.random() * 1000).toString(36)}`;
    const guestUsername = `Guest${guestSuffix}`;

    try {
      const result = await prisma.$transaction(async (tx) => {
        const createdUser = await tx.user.create({
          data: {
            username:     guestUsername,
            email:        `${guestUsername}@guest.com`,
            passwordHash: '',
            guestAccount: true,
          },
        });
        const createdPlayer = await tx.player.create({
          data: {
            userId:   createdUser.id,
            username: createdUser.username,
            balance:  5000, 
          },
        });
        return { user: createdUser, player: createdPlayer };
      });

      user   = result.user;
      player = result.player;
      break;
    } catch (error) {
      if (error.code === 'P2002' && attempt < MAX_GUEST_ATTEMPTS - 1) continue;
      throw error;
    }
  }

  if (!user || !player)
    return res.status(500).json({ error: 'Guest login gagal' });

  const token = signToken(user.id, '1d');
  res.json({
    token,
    user:   { id: user.id, username: user.username, email: user.email, guestAccount: true },
    player,
  });
});

// Middleware auth 
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

// GET /me 
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where:   { id: req.userId },
      include: { player: true },
    });
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });

    if (user.isBanned)
      return res.status(403).json({ error: 'Akun ini telah di-ban.' });

    res.json({ user, player: user.player });
  } catch (err) {
    console.error('[Auth] /me:', err.message);
    res.status(500).json({ error: 'Gagal mengambil data user' });
  }
});

// DELETE /me — hapus akun sendiri / auto-delete guest saat logout 
router.delete('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where:   { id: req.userId },
      include: { player: true },
    });
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });

    const { _deleteUserCascade } = require('../controllers/adminController');
    await _deleteUserCascade(user);

    res.json({ success: true, message: 'Akun berhasil dihapus' });
  } catch (err) {
    console.error('[Auth] delete /me:', err.message);
    res.status(500).json({ error: 'Gagal menghapus akun' });
  }
});

module.exports = router;
