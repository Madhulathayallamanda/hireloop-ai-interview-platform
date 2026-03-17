const express = require('express');
const router = express.Router();
const Session = require('../models/Session');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/sessions — get current user's sessions
router.get('/', protect, async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.user._id }).sort('-createdAt');
    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sessions/all — admin: get all sessions
router.get('/all', protect, adminOnly, async (req, res) => {
  try {
    const sessions = await Session.find().populate('userId', 'name email').sort('-createdAt');
    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sessions — start a new session
router.post('/', protect, async (req, res) => {
  try {
    const { role, company, type, level } = req.body;
    const session = await Session.create({
      userId: req.user._id, role, company, type, level,
    });
    res.status(201).json({ session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/sessions/:id — add answer & complete session
router.patch('/:id', protect, async (req, res) => {
  try {
    const session = await Session.findOne({ _id: req.params.id, userId: req.user._id });
    if (!session) return res.status(404).json({ error: 'Session not found.' });

    if (req.body.answer) session.answers.push(req.body.answer);
    if (req.body.status) session.status = req.body.status;
    if (req.body.duration) session.duration = req.body.duration;

    await session.save();

    // Update user's stats when session completes
    if (session.status === 'completed') {
      const allSessions = await Session.find({ userId: req.user._id, status: 'completed' });
      const totalAvg = allSessions.reduce((s, x) => s + x.avgScore, 0);
      await User.findByIdAndUpdate(req.user._id, {
        totalSessions: allSessions.length,
        avgScore: +(totalAvg / allSessions.length).toFixed(1),
      });
    }

    res.json({ session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/sessions/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    await Session.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ message: 'Session deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
