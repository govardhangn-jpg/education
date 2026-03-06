# 🎓 SamarthaaEdu — ಸಮರ್ಥ ಶಿಕ್ಷಣ

> AI-Powered Two-Way Voice & Chat Tutoring Platform for Indian School Students

**CBSE • ICSE • Karnataka State | Class 1–10 | English • Kannada • Hindi • Telugu • Tamil**

---

## ✨ Features

### For Students
- 🤖 **AI Chat Tutor** — Powered by Claude AI (Anthropic), explains concepts in simple language
- 🎙️ **Two-Way Voice** — Speak questions via microphone, listen to AI responses
- 📚 **Chapter-wise Curriculum** — All chapters mapped for CBSE, ICSE, Karnataka State syllabi
- 🌐 **Multilingual** — English, Kannada, Hindi, Telugu, Tamil
- 📝 **AI-Generated Quizzes** — Custom MCQs per chapter with explanations
- 📊 **Progress Tracking** — Chapter mastery: Not Started → Started → Learning → Mastered
- 🏆 **Achievements & Streaks** — Gamification to keep students motivated
- 🔍 **Deep Dive** — Ask follow-up questions on any topic

### For Teachers/Admins
- 👥 **Student Management** — View all students, filter by grade/syllabus
- 📋 **Bulk Import** — Create 100s of student accounts via CSV upload
- 📊 **Platform Statistics** — Usage, quiz scores, active students
- 🔐 **Role-Based Access** — Student, Teacher, Admin roles
- ✅/❌ **Account Toggle** — Activate/deactivate student accounts

### Subjects Covered
| Grade | Subjects |
|-------|----------|
| Class 1–5 | English, Kannada, Mathematics, Environmental Studies |
| Class 6–10 | English, Kannada, Mathematics, Science, Social Studies, Computer Science |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB 6+ (local) OR MongoDB Atlas (cloud)
- Anthropic API key

### 1. Clone & Install

```bash
git clone <repo-url>
cd samarthaa

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 2. Configure Environment

```bash
cd server
cp .env.example .env
# Edit .env with your values:
# MONGODB_URI=mongodb://localhost:27017/samarthaa
# JWT_SECRET=your_very_secret_key_here
# ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Seed Database

```bash
cd server
npm run seed
```

This creates demo accounts:
| Username | Password | Role | Grade |
|----------|----------|------|-------|
| arjun_k | learn123 | Student | Class 7, CBSE |
| priya_s | study456 | Student | Class 5, ICSE |
| ravi_m | learn789 | Student | Class 9, Karnataka State |
| ananya_r | study123 | Student | Class 6, CBSE |
| kiran_b | learn456 | Student | Class 10, CBSE |
| teacher1 | teacher@123 | Teacher | — |
| admin | admin@samarthaa | Admin | — |

### 4. Run Development

```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm start
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Health check: http://localhost:5000/health

---

## 🐳 Docker Deployment

```bash
# Create .env file in project root
echo "JWT_SECRET=your_secret_here" > .env
echo "ANTHROPIC_API_KEY=sk-ant-..." >> .env
echo "CLIENT_URL=http://yourdomain.com" >> .env

# Build and start all services
docker-compose up -d

# Seed the database
docker-compose exec server node seed.js

# View logs
docker-compose logs -f
```

---

## 🏗️ Architecture

```
samarthaa/
├── server/                 # Node.js + Express backend
│   ├── models/
│   │   ├── User.js         # Student/teacher/admin model
│   │   ├── ChatSession.js  # Conversation history
│   │   └── QuizAttempt.js  # Quiz results & answers
│   ├── routes/
│   │   ├── auth.js         # Login, register, JWT
│   │   ├── chat.js         # Anthropic API proxy + sessions
│   │   ├── quiz.js         # AI quiz generation + submission
│   │   ├── curriculum.js   # Chapter data + progress
│   │   └── admin.js        # Student management
│   ├── data/
│   │   └── curriculum.js   # All chapters: CBSE/ICSE/Karnataka
│   ├── middleware/
│   │   └── auth.js         # JWT verification
│   └── index.js            # Express app entry point
│
└── client/                 # React frontend
    └── src/
        ├── pages/
        │   ├── LoginPage.jsx     # Login + Registration
        │   ├── DashboardPage.jsx # Home with stats
        │   ├── ChatPage.jsx      # AI Chat + Voice
        │   ├── QuizPage.jsx      # Quiz center
        │   ├── ProgressPage.jsx  # Chapter progress
        │   └── AdminPage.jsx     # Admin panel
        ├── hooks/
        │   ├── useAuth.js        # Auth context
        │   └── useSpeech.js      # TTS + STT hooks
        └── utils/
            ├── api.js            # Axios API client
            └── constants.js      # Subjects, colors, etc.
```

---

## 🔌 API Reference

### Auth
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | Login with username/password |
| `/api/auth/register` | POST | Create new student account |
| `/api/auth/me` | GET | Get current user |
| `/api/auth/preferences` | PATCH | Update language/grade/avatar |

### Chat
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat/message` | POST | Send message, get AI response |
| `/api/chat/sessions` | GET | List chat history |
| `/api/chat/sessions/:id` | GET | Load a session |
| `/api/chat/sessions/:id` | DELETE | Delete a session |

### Quiz
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/quiz/generate` | POST | Generate AI quiz questions |
| `/api/quiz/submit` | POST | Submit answers, get results |
| `/api/quiz/history` | GET | Student quiz history |
| `/api/quiz/leaderboard` | GET | Top scorers |

### Curriculum
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/curriculum` | GET | Get chapters for grade/subject |
| `/api/curriculum/progress` | GET | Student's chapter progress |
| `/api/curriculum/dashboard` | GET | Full dashboard stats |

---

## 🗺️ Roadmap

- [ ] Parent dashboard with child's progress reports
- [ ] Teacher can assign specific chapters/quizzes
- [ ] PDF/worksheet generation per chapter
- [ ] Video lesson links integration (YouTube)
- [ ] Offline mode (PWA)
- [ ] Push notifications for study reminders
- [ ] Peer leaderboards per school/class
- [ ] Custom question banks by teachers
- [ ] Regional language UI (full Kannada UI)
- [ ] Mobile app (React Native)

---

## 🛡️ Security

- JWT authentication with 7-day expiry
- Passwords hashed with bcrypt (12 rounds)
- Rate limiting: 200 req/15min global, 30 msg/min chat
- Helmet.js security headers
- CORS configured for specific origins
- Anthropic API key never exposed to client

---

## 📄 License

MIT — Built with ❤️ for Indian students

---

*"Every child deserves a patient, knowledgeable tutor available 24/7. SamarthaaEdu makes that possible."*
"# education" 
