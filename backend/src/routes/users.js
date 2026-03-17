const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/users — admin: list all users
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find().sort('-createdAt');
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/users/:id/role — admin: change role
router.patch('/:id/role', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id, { role: req.body.role }, { new: true }
    );
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/users/:id — admin: delete user
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/stats — admin dashboard stats
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const Session = require('../models/Session');
    const totalUsers    = await User.countDocuments({ role: 'user' });
    const totalSessions = await Session.countDocuments();
    const allSessions   = await Session.find({ status: 'completed' });
    const avgScore = allSessions.length
      ? +(allSessions.reduce((s, x) => s + x.avgScore, 0) / allSessions.length).toFixed(1)
      : 0;
    const totalQuestions = await require('../models/Question').countDocuments();
    res.json({ totalUsers, totalSessions, avgScore, totalQuestions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
