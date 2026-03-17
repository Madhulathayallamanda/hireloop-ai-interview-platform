const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const sessionRoutes = require('./routes/sessions');
const questionRoutes = require('./routes/questions');
const userRoutes = require('./routes/users');
const evaluateRoutes = require('./routes/evaluate');

const app = express();

// ─── Middleware ────────────────────────────────────────────
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/sessions',  sessionRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/users',     userRoutes);
app.use('/api/evaluate',  evaluateRoutes);

app.get('/', (req, res) => res.json({ message: 'HIRELOOP API running ✅' }));

// ─── Error Handler ─────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// ─── Database + Start ──────────────────────────────────────
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(process.env.PORT, () =>
      console.log(`🚀 Server running on http://localhost:${process.env.PORT}`)
    );
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
