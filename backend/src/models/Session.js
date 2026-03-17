const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  question:     { type: String, required: true },
  answer:       { type: String, required: true },
  score:        { type: Number, min: 0, max: 10 },
  verdict:      { type: String, enum: ['Strong', 'Good', 'Needs Work'] },
  strengths:    [String],
  improvements: [String],
  criteria:     [{ name: String, score: Number, passed: Boolean }],
  timeTaken:    { type: Number }, // seconds
});

const sessionSchema = new mongoose.Schema(
  {
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role:     { type: String, required: true },
    company:  { type: String, required: true },
    type:     { type: String, enum: ['Behavioral', 'Technical', 'Mixed'], required: true },
    level:    { type: String, enum: ['Entry', 'Mid', 'Senior', 'Staff'], required: true },
    answers:  [answerSchema],
    avgScore: { type: Number, default: 0 },
    duration: { type: Number, default: 0 }, // total seconds
    status:   { type: String, enum: ['in_progress', 'completed'], default: 'in_progress' },
  },
  { timestamps: true }
);

// Calculate avgScore before save
sessionSchema.pre('save', function (next) {
  if (this.answers && this.answers.length > 0) {
    const total = this.answers.reduce((s, a) => s + (a.score || 0), 0);
    this.avgScore = +(total / this.answers.length).toFixed(1);
  }
  next();
});

module.exports = mongoose.model('Session', sessionSchema);
