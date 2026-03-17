const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/questions?role=swe&category=Behavioral
router.get('/', protect, async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.query.role)     filter.role = req.query.role;
    if (req.query.category) filter.category = req.query.category;
    const questions = await Question.find(filter);
    res.json({ questions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/questions — admin add question
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const q = await Question.create(req.body);
    res.status(201).json({ question: q });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/questions/:id — admin edit
router.patch('/:id', protect, adminOnly, async (req, res) => {
  try {
    const q = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ question: q });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/questions/:id — admin delete
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Question.findByIdAndDelete(req.params.id);
    res.json({ message: 'Question deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
