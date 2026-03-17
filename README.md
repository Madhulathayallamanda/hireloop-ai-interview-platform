# ⚡ INTRVW.AI — Full-Stack AI Mock Interview Platform

A complete fullstack project with React frontend, Node/Express backend, MongoDB database,
JWT authentication, role-based access control, AI evaluation engine, and analytics dashboard.

---

## 🗂 Project Structure

```
intrvw-ai/
├── backend/
│   ├── src/
│   │   ├── server.js           ← Express app entry point
│   │   ├── seed.js             ← Database seeder
│   │   ├── models/
│   │   │   ├── User.js         ← MongoDB User schema
│   │   │   ├── Session.js      ← Interview session schema
│   │   │   └── Question.js     ← Question bank schema
│   │   ├── middleware/
│   │   │   └── auth.js         ← JWT protect + adminOnly
│   │   └── routes/
│   │       ├── auth.js         ← POST /login, /register, GET /me
│   │       ├── sessions.js     ← CRUD interview sessions
│   │       ├── questions.js    ← CRUD question bank
│   │       ├── users.js        ← Admin user management
│   │       └── evaluate.js     ← AI scoring logic
│   ├── .env                    ← Environment variables
│   └── package.json
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── index.js            ← React entry point
    │   ├── App.jsx             ← All screens + UI
    │   └── api.js              ← Axios API service
    └── package.json
```

---

## 🖥 Prerequisites — Install These First

### 1. Node.js (v18 or higher)
Download from: https://nodejs.org
Verify: `node --version`  →  should show v18+

### 2. MongoDB Community Edition
Download from: https://www.mongodb.com/try/download/community
Install and start the service:

**Windows:**
```
net start MongoDB
```
**Mac:**
```
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```
**Linux (Ubuntu):**
```
sudo systemctl start mongod
sudo systemctl enable mongod
```
Verify: `mongosh`  →  should open MongoDB shell. Type `exit` to quit.

### 3. Git (optional but recommended)
Download from: https://git-scm.com

---

## 🚀 Step-by-Step Setup

### STEP 1 — Get the project folder on your laptop

Move the `intrvw-ai` folder somewhere convenient, e.g.:
```
C:\Projects\intrvw-ai        (Windows)
~/Projects/intrvw-ai         (Mac/Linux)
```

---

### STEP 2 — Setup the Backend

Open a terminal and navigate to the backend folder:

```bash
cd intrvw-ai/backend
```

Install all Node.js dependencies:
```bash
npm install
```

The `.env` file is already created. Open it and confirm these values:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/intrvw_ai
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d
```
⚠️  Change `JWT_SECRET` to something random before deploying to production.

Seed the database with demo users and questions:
```bash
node src/seed.js
```
You should see:
```
Connected to MongoDB
✅ Seeded: 2 users, 19 questions
```

Start the backend server:
```bash
npm run dev
```
You should see:
```
✅ MongoDB connected
🚀 Server running on http://localhost:5000
```

Test it works — open your browser and go to:
```
http://localhost:5000
```
You should see: `{ "message": "INTRVW.AI API running ✅" }`

---

### STEP 3 — Setup the Frontend

Open a **NEW terminal** (keep backend running) and go to the frontend folder:
```bash
cd intrvw-ai/frontend
```

Install React dependencies:
```bash
npm install
```

Start the React development server:
```bash
npm start
```

Your browser will automatically open at:
```
http://localhost:3000
```

---

### STEP 4 — Log In and Use the App

The app opens to the login screen. Use these demo credentials:

| Role  | Email              | Password   | Access                        |
|-------|--------------------|------------|-------------------------------|
| User  | alex@dev.io        | pass123    | Dashboard, Interview, Results |
| Admin | admin@intrvw.ai    | admin123   | Everything + Admin Panel      |

---

## ✅ All 6 Features Explained

### 1. Frontend (React) — `frontend/src/App.jsx`
- **AuthScreen** — Login / Register with form validation
- **Dashboard** — Score trend chart, session history, role stats
- **Setup** — Configure role, company, type, and level
- **Interview** — Real-time chat UI, AI typing avatar, countdown timer
- **Results** — Skill breakdown, per-question analysis, score rings
- **Admin** — Users, Questions, Sessions, Platform stats

### 2. Backend (Node + Express) — `backend/src/`
REST API endpoints:
```
POST   /api/auth/register      Register new user
POST   /api/auth/login         Login + get JWT token
GET    /api/auth/me            Get current user (protected)

GET    /api/sessions           Get my sessions
POST   /api/sessions           Start new session
PATCH  /api/sessions/:id       Add answer / complete session
DELETE /api/sessions/:id       Delete session

GET    /api/questions          List questions (filter by role/category)
POST   /api/questions          Add question (admin only)
PATCH  /api/questions/:id      Edit question (admin only)
DELETE /api/questions/:id      Delete question (admin only)

GET    /api/users              List all users (admin only)
GET    /api/users/stats        Platform stats (admin only)
PATCH  /api/users/:id/role     Change user role (admin only)

POST   /api/evaluate           AI scoring for an answer
```

### 3. Database (MongoDB) — `backend/src/models/`
- **User** — name, email, hashed password, role, avatar, stats
- **Session** — userId, role, company, type, level, answers[], avgScore
- **Question** — text, category, role, difficulty, tags

### 4. AI Evaluation Logic — `backend/src/routes/evaluate.js`
Scores answers on 4 criteria (0–10 each):
- STAR Framework detection (situation/task/action/result keywords)
- Specific Metrics (%, $, Xs, user counts)
- Answer Depth (word count analysis)
- Clarity & Impact (leadership/technical language)

To upgrade to real AI: replace the `evaluateAnswer()` function with an OpenAI or Claude API call.

### 5. Analytics Dashboard — `frontend/src/App.jsx → Dashboard`
- Score trend line chart across all sessions
- Per-role performance bars
- Session history with color-coded scores
- Skill breakdown (STAR, Metrics, Depth, Clarity)

### 6. Authentication & Security — `backend/src/middleware/auth.js`
- Passwords hashed with **bcrypt** (salt rounds: 12)
- **JWT tokens** signed with secret, expire in 7 days
- `protect` middleware validates Bearer token on every protected route
- `adminOnly` middleware blocks non-admin users with 403
- Auto-logout on 401 in the frontend axios interceptor

---

## 🔧 Common Issues & Fixes

**"MongoDB connection failed"**
→ Make sure MongoDB is running: `mongosh` should connect

**"Cannot find module 'express'"**
→ Run `npm install` inside the `backend/` folder

**"Network Error" in browser**
→ Make sure backend is running on port 5000
→ Check `"proxy": "http://localhost:5000"` in `frontend/package.json`

**Port 5000 already in use**
→ Change `PORT=5001` in `backend/.env`
→ Update proxy in `frontend/package.json` to `http://localhost:5001`

**Login says "Invalid credentials"**
→ Run the seed script again: `node src/seed.js`

---

## 🌐 Running Both Servers (Quick Reference)

Terminal 1 — Backend:
```bash
cd intrvw-ai/backend
npm run dev
```

Terminal 2 — Frontend:
```bash
cd intrvw-ai/frontend
npm start
```

Open browser: http://localhost:3000

---

## 🚀 Upgrading to Real AI Evaluation

Replace the scoring function in `backend/src/routes/evaluate.js`:

```javascript
const Anthropic = require('@anthropic-ai/sdk');
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function evaluateAnswer(question, answer) {
  const msg = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Interview question: "${question}"\n\nCandidate answer: "${answer}"\n\nEvaluate this answer and return JSON with: score (0-10), verdict (Strong/Good/Needs Work), criteria (array of {name, score, passed}), strengths (array), improvements (array), tip (string).`
    }]
  });
  return JSON.parse(msg.content[0].text);
}
```

Add to `.env`:
```
ANTHROPIC_API_KEY=your_key_here
```

Install:
```bash
npm install @anthropic-ai/sdk
```

---

## 📦 Tech Stack Summary

| Layer      | Technology                                |
|------------|-------------------------------------------|
| Frontend   | React 18, Axios, CSS-in-JS                |
| Backend    | Node.js, Express 4                        |
| Database   | MongoDB, Mongoose                         |
| Auth       | JWT (jsonwebtoken), bcryptjs              |
| AI Engine  | Custom scoring (upgradeable to Claude/GPT)|
| Dev Tools  | nodemon, dotenv                           |
