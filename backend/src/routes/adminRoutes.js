const express = require('express');
const router  = express.Router();
const {
  simulateSpins, getSystemStatsAdmin, forceWinStreak, forceLoseStreak,
  inspectRedis, banUser, unbanUser, deleteUser,
} = require('../controllers/adminController');

router.post('/simulate-spins',        simulateSpins);
router.get('/system-stats',           getSystemStatsAdmin);
router.post('/force-win-streak',      forceWinStreak);
router.post('/force-lose-streak',     forceLoseStreak);
router.get('/inspect-redis',          inspectRedis);

router.post('/ban/:userId',           banUser);
router.post('/unban/:userId',         unbanUser);
router.delete('/user/:userId',        deleteUser);

module.exports = router;