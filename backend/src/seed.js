// Run with: node src/seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Question = require('./models/Question');

const questions = [
  // SWE Behavioral
  { text: 'Tell me about a time you delivered a project under extreme time pressure.', category: 'Behavioral', role: 'swe', difficulty: 'Medium' },
  { text: 'Describe a disagreement with your tech lead. How did you handle it?', category: 'Behavioral', role: 'swe', difficulty: 'Medium' },
  { text: 'Walk me through a critical production incident you resolved.', category: 'Behavioral', role: 'swe', difficulty: 'Hard' },
  // SWE Technical
  { text: 'Design a URL shortener like bit.ly. Scale to 10M users.', category: 'Technical', role: 'swe', difficulty: 'Hard' },
  { text: 'Implement a distributed rate limiter for 100K req/sec.', category: 'Technical', role: 'swe', difficulty: 'Hard' },
  { text: 'Design a distributed cache. What consistency guarantees do you provide?', category: 'Technical', role: 'swe', difficulty: 'Hard' },
  { text: 'Walk me through designing a real-time notification system.', category: 'Technical', role: 'swe', difficulty: 'Medium' },
  // SWE Coding
  { text: 'Implement an LRU Cache with O(1) get and put operations.', category: 'Coding', role: 'swe', difficulty: 'Medium' },
  { text: 'Find two numbers in an array that sum to a target. Optimize for time and space.', category: 'Coding', role: 'swe', difficulty: 'Easy' },
  { text: 'Serialize and deserialize a binary tree.', category: 'Coding', role: 'swe', difficulty: 'Medium' },
  // PM
  { text: 'Tell me about a product you shipped that failed. What did you learn?', category: 'Behavioral', role: 'pm', difficulty: 'Medium' },
  { text: 'How would you improve Google Maps? Walk through your process.', category: 'Technical', role: 'pm', difficulty: 'Hard' },
  { text: 'How would you measure success of a new onboarding flow?', category: 'Technical', role: 'pm', difficulty: 'Medium' },
  // ML
  { text: 'Explain the transformer architecture. Why did attention replace RNNs?', category: 'Technical', role: 'ml', difficulty: 'Hard' },
  { text: 'How would you reduce inference latency of a 70B LLM by 10x?', category: 'Technical', role: 'ml', difficulty: 'Hard' },
  // DS
  { text: 'Explain bias-variance tradeoff with a concrete example.', category: 'Technical', role: 'ds', difficulty: 'Medium' },
  { text: 'Build a churn prediction model for a subscription service.', category: 'Technical', role: 'ds', difficulty: 'Hard' },
  // DevOps
  { text: 'Design a zero-downtime deployment pipeline for 50 microservices.', category: 'Technical', role: 'devops', difficulty: 'Hard' },
  { text: 'Architect a Kubernetes cluster for a multi-tenant SaaS platform.', category: 'Technical', role: 'devops', difficulty: 'Hard' },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Clear existing
  await User.deleteMany({});
  await Question.deleteMany({});

  // Seed admin user
  await User.create({
    name: 'Admin',
    email: 'admin@intrvw.ai',
    password: 'admin123',
    role: 'admin',
    avatar: 'AD',
  });

  // Seed demo user
  await User.create({
    name: 'Alex Johnson',
    email: 'alex@dev.io',
    password: 'pass123',
    role: 'user',
    avatar: 'AJ',
  });

  // Seed questions
  await Question.insertMany(questions);

  console.log('✅ Seeded: 2 users, ' + questions.length + ' questions');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
