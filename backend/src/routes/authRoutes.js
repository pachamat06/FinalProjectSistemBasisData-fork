const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] }
    });
    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: { username, email, passwordHash }
    });

    // Create player profile
    const player = await prisma.player.create({
      data: {
        userId: user.id,
        username: user.username,
        balance: 10000
      }
    });

    // Generate JWT
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

    res.json({ token, user: { id: user.id, username, email }, player });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;

    // Find user
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: usernameOrEmail },
          { email: usernameOrEmail }
        ]
      }
    });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Get player
    const player = await prisma.player.findUnique({
      where: { userId: user.id }
    });

    // Generate JWT
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

    res.json({ token, user: { id: user.id, username: user.username, email: user.email }, player });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Guest login
router.post('/guest', async (req, res) => {
  try {
    const MAX_GUEST_ATTEMPTS = 5;
    let user = null;
    let player = null;

    for (let attempt = 0; attempt < MAX_GUEST_ATTEMPTS; attempt++) {
      const guestSuffix = `${Date.now().toString(36)}${Math.floor(Math.random() * 1000).toString(36)}`;
      const guestUsername = `Guest${guestSuffix}`;

      try {
        const result = await prisma.$transaction(async (tx) => {
          const createdUser = await tx.user.create({
            data: {
              username: guestUsername,
              email: `${guestUsername}@guest.com`,
              passwordHash: '', // No password for guests
              guestAccount: true
            }
          });

          const createdPlayer = await tx.player.create({
            data: {
              userId: createdUser.id,
              username: createdUser.username,
              balance: 10000
            }
          });

          return { user: createdUser, player: createdPlayer };
        });

        user = result.user;
        player = result.player;
        break;
      } catch (error) {
        if (error.code === 'P2002' && attempt < MAX_GUEST_ATTEMPTS - 1) {
          continue;
        }
        throw error;
      }
    }

    if (!user || !player) {
      return res.status(500).json({ error: 'Guest login failed' });
    }

    // Generate JWT
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });

    res.json({ token, user: { id: user.id, username: user.username, email: user.email }, player });
  } catch (error) {
    res.status(500).json({ error: 'Guest login failed' });
  }
});

// Verify token middleware
const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Access denied' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.userId = verified.userId;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { player: true }
    });
    res.json({ user, player: user.player });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user' });
  }
});

module.exports = router;