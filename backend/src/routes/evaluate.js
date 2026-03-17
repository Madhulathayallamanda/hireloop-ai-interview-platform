const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// ── AI Scoring Logic ───────────────────────────────────────
// In production: replace with OpenAI/Claude API call
function evaluateAnswer(question, answer) {
  const text  = answer.trim();
  const words = text.split(/\s+/).filter(Boolean).length;

  const hasStar    = /situation|context|background|task|action|result|outcome|impact/i.test(text);
  const hasMetrics = /\d+%|\$[\d,]+|\d+x|\d+ (users|teams|engineers|days|weeks|ms|seconds)/i.test(text);
  const hasDepth   = words > 100;
  const hasTech    = /architect|system|scale|performance|database|api|deploy|latency|throughput/i.test(text);
  const hasLeader  = /led|drove|owned|coordinated|mentored|aligned|stakeholder/i.test(text);

  // Score each criterion 0–10
  const criteria = [
    {
      name: 'Structure (STAR)',
      score: hasStar ? Math.min(7 + (words > 80 ? 2 : 0) + (words > 150 ? 1 : 0), 10) : Math.min(3 + (words > 50 ? 1 : 0), 5),
      passed: hasStar,
    },
    {
      name: 'Specific Metrics',
      score: hasMetrics ? Math.min(8 + Math.floor(Math.random() * 2), 10) : Math.max(2, Math.floor(Math.random() * 4)),
      passed: hasMetrics,
    },
    {
      name: 'Answer Depth',
      score: Math.min(Math.round((words / 200) * 10), 10),
      passed: words > 80,
    },
    {
      name: 'Clarity & Impact',
      score: (hasTech || hasLeader) ? Math.min(7 + Math.floor(Math.random() * 3), 10) : Math.min(4 + Math.floor(Math.random() * 3), 7),
      passed: words > 30,
    },
  ];

  const score = +Math.min(
    criteria.reduce((s, c) => s + c.score, 0) / criteria.length,
    10
  ).toFixed(1);

  const verdict = score >= 8 ? 'Strong' : score >= 6 ? 'Good' : 'Needs Work';

  const strengths = [];
  if (hasStar)    strengths.push('Strong use of the STAR framework — interviewers love structured storytelling.');
  if (hasMetrics) strengths.push('Excellent use of quantifiable metrics — makes your impact concrete and memorable.');
  if (hasLeader)  strengths.push('Good demonstration of ownership and leadership language.');

  const improvements = [];
  if (!hasMetrics) improvements.push('Add quantifiable metrics: % improvement, users impacted, latency in ms, revenue effect.');
  if (!hasStar)    improvements.push('Structure using STAR: Situation → Task → Action → Result.');
  if (words < 80)  improvements.push('Expand your answer — aim for 150–200 words for behavioral, 250+ for technical.');
  if (!hasLeader && words > 80) improvements.push('Emphasize personal ownership: use "I led", "I drove", "I owned" to show impact.');

  const tips = [
    'Prepare 6 "anchor stories" that flex across multiple question types.',
    'Quantify everything — "faster" means nothing; "40% latency reduction" does.',
    'Mirror seniority level: senior roles need cross-team impact, not just individual execution.',
    'End every behavioral answer with what you learned or would do differently.',
  ];

  return {
    score,
    verdict,
    criteria,
    strengths,
    improvements: improvements.slice(0, 2),
    tip: tips[Math.floor(Math.random() * tips.length)],
  };
}

// POST /api/evaluate
router.post('/', protect, async (req, res) => {
  try {
    const { question, answer } = req.body;
    if (!question || !answer)
      return res.status(400).json({ error: 'Question and answer are required.' });

    // Simulate processing delay (remove in production with real AI)
    await new Promise(r => setTimeout(r, 800));

    const result = evaluateAnswer(question, answer);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
