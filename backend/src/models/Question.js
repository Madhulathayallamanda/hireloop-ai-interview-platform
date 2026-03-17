const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    text:       { type: String, required: true },
    category:   { type: String, enum: ['Behavioral', 'Technical', 'Coding'], required: true },
    role:       { type: String, required: true },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
    company:    { type: String, default: 'General' },
    tags:       [String],
    isActive:   { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Question', questionSchema);
