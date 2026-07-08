# Git AI — Autonomous AI-Powered GitHub Engineering Manager

> Your personal AI engineering manager that analyzes GitHub repositories, predicts project priority, generates daily development plans, and automates real commits.

![Git AI Dashboard](https://img.shields.io/badge/Status-Production--Ready-black) ![Tech](https://img.shields.io/badge/Stack-Next.js%20%7C%20Node.js%20%7C%20Supabase%20%7C%20LM%20Studio-white)

---

## What is Git AI?

Git AI is a full-stack AI application that acts as your personal software engineering manager:

1. **Connects** to your GitHub account via OAuth
2. **Scans** all your repositories and collects metrics
3. **Scores** each repository 0–100 using a Random Forest ML model
4. **Generates** a daily development plan via LM Studio (local LLM)
5. **Assists** with task implementation
6. **Commits and pushes** real changes — only after your approval

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase OAuth (GitHub) |
| ML | Python, scikit-learn, Random Forest |
| AI | LM Studio (Llama / Mistral / Qwen) |
| Git Automation | simple-git, GitHub REST API |

---

## Project Structure

```
Git AI/
├── frontend/               # Next.js 15 App Router
│   └── src/
│       ├── app/
│       │   ├── page.tsx              # Landing page
│       │   ├── auth/callback/        # OAuth callback
│       │   └── dashboard/
│       │       ├── page.tsx          # Main dashboard
│       │       ├── repositories/     # Repo cards & metrics
│       │       ├── planner/          # AI daily planner
│       │       ├── commit/           # Commit assistant
│       │       └── history/          # Activity history
│       ├── components/
│       │   ├── providers/AuthProvider.tsx
│       │   └── ui/Toaster.tsx
│       └── lib/api.ts               # API client
│
├── backend/                # Node.js + Express
│   ├── server.js           # Main server
│   ├── routes/
│   │   ├── auth.js         # GitHub OAuth, user management
│   │   ├── repositories.js # Scan, list, priority
│   │   ├── ai.js           # LM Studio integration
│   │   ├── git.js          # Commit & push automation
│   │   └── feedback.js     # Learning & patterns
│   ├── services/
│   │   ├── github.js       # GitHub API service
│   │   ├── ai.js           # LM Studio AI service
│   │   ├── git.js          # Git automation service
│   │   └── repository.js   # Supabase repository service
│   └── middleware/
│       └── auth.js         # Supabase JWT verification
│
├── ml/                     # Python ML Pipeline
│   ├── scanner.py          # GitHub repository scanner
│   ├── feature_engineering.py  # ML feature preparation
│   ├── train.py            # Random Forest training
│   ├── predict.py          # Priority prediction
│   └── dataset/
│       └── training_data.csv   # Training dataset
│
├── models/                 # Trained ML model artifacts
│   └── priority_model.pkl  # (generated after training)
│
└── supabase_schema.sql     # Complete database schema
```

---

## Setup Instructions

### Prerequisites

- **Node.js** v18+
- **Python** 3.9+
- **Git** installed
- **Supabase** account (free tier works)
- **LM Studio** downloaded with a model loaded
- **GitHub OAuth App** created

---

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Go to **SQL Editor** → paste the contents of `supabase_schema.sql` → Run
3. Go to **Authentication → Providers → GitHub** → Enable
4. Note your:
   - Project URL
   - Anon Key
   - Service Role Key

---

### Step 2: Create GitHub OAuth App

1. Go to GitHub → Settings → Developer Settings → OAuth Apps → New OAuth App
2. Set:
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/auth/callback`
3. Note your **Client ID** and **Client Secret**
4. Add to Supabase: Authentication → Providers → GitHub → paste Client ID & Secret

---

### Step 3: Set Up LM Studio

1. Download [LM Studio](https://lmstudio.ai)
2. Download a model (recommended: **Mistral 7B**, **Llama 3.1 8B**, or **Qwen 2.5 7B**)
3. Start the local server: **Local Server tab → Start Server** (port 1234)
4. Load your model in the server

---

### Step 4: Configure Environment Variables

**Backend** (`backend/.env`):
```env
NODE_ENV=development
PORT=8000
FRONTEND_URL=http://localhost:3000

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:8000/api/auth/callback

LM_STUDIO_URL=http://localhost:1234
LM_STUDIO_MODEL=local-model

JWT_SECRET=your_secret_key_here
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

### Step 5: Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

**Python ML (optional):**
```bash
cd ml
pip install pandas numpy scikit-learn requests
```

---

### Step 6: Run the Application

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev   # or: node server.js
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

**Access:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Health: http://localhost:8000/api/health

---

### Step 7: Train the ML Model (Optional)

```bash
cd ml
pip install pandas numpy scikit-learn
python train.py
```

Or scan your own repos first:
```bash
python scanner.py --token YOUR_GITHUB_TOKEN --output dataset/github_data.csv
# Then add priority labels to github_data.csv, save as training_data.csv
python train.py
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/auth/github-url` | Get OAuth URL |
| POST | `/api/auth/github/connect` | Connect GitHub token |
| GET | `/api/repositories` | List all repos |
| POST | `/api/repositories/scan` | Scan all GitHub repos |
| POST | `/api/repositories/:id/scan` | Scan single repo |
| GET | `/api/repositories/health/stats` | Portfolio health stats |
| POST | `/api/ai/daily-plan` | Generate daily plan |
| POST | `/api/ai/generate-task` | Generate task details |
| POST | `/api/ai/commit-message` | Generate commit message |
| GET | `/api/ai/portfolio-health` | AI portfolio analysis |
| GET | `/api/ai/status` | LM Studio connection status |
| GET | `/api/git/status` | Git repo status |
| POST | `/api/git/prepare` | Prepare repo & get diff |
| POST | `/api/git/commit` | Commit (requires approval) |
| POST | `/api/git/push` | Push (requires approval) |
| POST | `/api/git/commit-and-push` | Commit & push (requires approval) |
| POST | `/api/feedback` | Submit task feedback |
| GET | `/api/feedback/patterns` | Get learning patterns |

---

## Security Notes

- **Never pushes without approval** — every commit/push requires explicit user confirmation
- GitHub tokens stored in Supabase with Row Level Security
- All API endpoints authenticated via Supabase JWT
- Environment variables for all secrets (no hardcoded keys)
- Rate limiting on all API endpoints

---

## ML Pipeline Details

The Random Forest model predicts **project priority (0-100)** based on:

| Feature | Weight |
|---------|--------|
| Days since last commit | High |
| Open issues count | High |
| Documentation score | Medium |
| Test file ratio | Medium |
| Recent commits (30d) | Medium |
| Stars & forks | Low |
| Commit frequency | Medium |

Add more labeled data to `ml/dataset/training_data.csv` and retrain for better accuracy.

---

## Contributing

1. Fork the repo
2. Create a feature branch
3. Make real changes (no fake commits!)
4. Use Git AI's Commit Assistant to commit
5. Open a pull request

---

## License

MIT License — built for developers who want to ship more, smarter.
