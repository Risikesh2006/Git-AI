# Git AI 🤖 — Autonomous AI-Powered GitHub Engineering Manager

> Your personal AI engineering manager that watches over your GitHub repositories, tells you what to work on next, and helps you ship real code — safely, and only with your approval.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](#license)
[![Node](https://img.shields.io/badge/Node.js-v18%2B-green)](#prerequisites)
[![Python](https://img.shields.io/badge/Python-3.9%2B-blue)](#prerequisites)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](#tech-stack)
[![Status](https://img.shields.io/badge/status-active--development-orange)](#roadmap)

---

## What is Git AI?

**Git AI** is a full-stack AI application that acts as your personal software engineering manager. It connects to your GitHub account, continuously evaluates the health and priority of every repository you own, and produces an actionable daily plan — then helps you execute that plan and ship real commits, always with your explicit approval.

Think of it as a mix between:
- A **project health dashboard** (like a static analyzer, but for your whole GitHub account)
- A **prioritization engine** (a trained ML model ranks what needs attention most)
- A **local AI copilot** (an LLM running on your own machine via LM Studio, so your code and prompts never leave your computer)
- A **safe automation layer** (it can prepare, commit, and push changes, but never without you clicking "approve")

## Why Git AI?

Most developers have more repositories than they can realistically maintain. Side projects go stale, documentation falls behind, tests stop passing, and it becomes hard to know where to focus. Git AI solves this by continuously scoring every repo on real signals, turning those signals into a prioritized daily plan instead of a vague todo list, using a local LLM so there's no dependency on (or cost from) cloud AI APIs, and keeping a human in the loop for every git operation so nothing is ever pushed silently.

---

## How the Project Actually Works

This is the core of Git AI, broken down step by step — from the moment you log in to the moment code gets pushed.

### 1. Authentication — connecting your GitHub account

You sign in through **Supabase Auth**, which handles the GitHub OAuth handshake for you:

1. The frontend requests an OAuth URL from the backend (`GET /api/auth/github-url`).
2. You're redirected to GitHub, approve access, and GitHub redirects back to `/auth/callback`.
3. Supabase exchanges the OAuth code for a GitHub access token and creates/updates your user record.
4. The backend stores your GitHub token securely in Supabase (Postgres), protected by **Row Level Security**, so only your own account can ever read it back.
5. From this point on, every API request from the frontend carries a Supabase JWT, which the backend's `middleware/auth.js` verifies before touching any data.

### 2. Scanning — turning your GitHub account into data

Once connected, Git AI needs raw material to reason about. This is handled by `ml/scanner.py` and `backend/services/github.js`:

- Calling `POST /api/repositories/scan` walks through **every repository** on your GitHub account using the GitHub REST API.
- For each repo, it pulls metrics such as: days since the last commit, number of open issues, whether a README/docs exist, ratio of test files to source files, commit frequency over the last 30 days, and star/fork counts.
- These metrics are written into Postgres via Supabase, so they persist between sessions and don't need to be re-fetched from GitHub every time you open the dashboard.
- You can also scan a single repository on demand with `POST /api/repositories/:id/scan` if you just pushed changes and want fresh numbers.

### 3. Scoring — the Random Forest priority model

Raw metrics alone don't tell you what to work on — that's the job of the ML pipeline in `/ml`:

1. `feature_engineering.py` converts the raw scanned metrics into numerical features the model can consume (normalizing values like "days since last commit" or "test file ratio").
2. A **Random Forest Regressor**, trained by `train.py` on labeled historical examples in `training_data.csv`, learns which combinations of features correspond to a repo that genuinely needs attention versus one that's healthy and can wait.
3. `predict.py` loads the trained model artifact (`models/priority_model.pkl`) and outputs a **priority score from 0–100** for every repository.
4. Feature weighting is roughly: **days since last commit** and **open issues count** matter most, **documentation, test ratio, and commit frequency** matter moderately, and **stars/forks** matter least (popularity doesn't mean a repo urgently needs work).

This score is what powers the ranking you see on the dashboard — it's a genuine trained model, not a hardcoded formula, so it improves as you feed it more labeled data.

### 4. Planning — where the local LLM comes in

Numbers alone aren't a plan. This is where **LM Studio** (running an LLM entirely on your own machine — Llama, Mistral, or Qwen) comes in:

1. When you request a plan (`POST /api/ai/daily-plan`), the backend's `services/ai.js` bundles up the scored repository data — priorities, open issues, recent activity — into a prompt.
2. That prompt is sent to your local LM Studio server (default `http://localhost:1234`).
3. The model reasons over the data and returns a **structured, prioritized daily plan** in natural language: which repos to touch today, what specifically to do, and why it matters.
4. If you want more detail on one plan item, `POST /api/ai/generate-task` expands it into a fully-specified task with suggested approach and context.

Because this all happens locally, your repository data and prompts never leave your machine to reach a third-party AI API.

### 5. Implementation & the Commit Assistant

Once you know what to work on, you make the actual code changes yourself (or with the help of your own editor/AI tools) inside the repository. When you're ready to save your progress:

1. `POST /api/git/prepare` runs `simple-git` against the local repo to gather the current diff and status.
2. `POST /api/ai/commit-message` sends that diff to the local LLM, which drafts a clear, conventional commit message summarizing the change.
3. You review the diff and the generated message in the **Commit Assistant** UI.
4. Only when you click **approve** does the backend call `POST /api/git/commit`, `POST /api/git/push`, or the combined `POST /api/git/commit-and-push` endpoint to actually run the git operation.

**There is no code path in Git AI that commits or pushes without this explicit, per-action approval step.**

### 6. Feedback & learning loop

After completing a task, you can submit feedback through `POST /api/feedback` (e.g., "this task took longer than expected" or "this suggestion wasn't relevant"). The backend stores these in Supabase, and `GET /api/feedback/patterns` surfaces recurring patterns — this data is meant to inform future retraining of the priority model and refinement of planning prompts, closing the loop between what the AI suggests and what actually turns out to be useful.

### 7. History & portfolio health

Every scan, generated plan, and git action is logged, viewable in the **History** tab of the dashboard, so you always have an audit trail of what Git AI recommended and what you actually did. `GET /api/repositories/health/stats` and `GET /api/ai/portfolio-health` roll all of this up into an aggregate view of how healthy your entire GitHub portfolio is at a glance.

---

## Architecture at a Glance

```
                     ┌─────────────────────┐
                     │   GitHub Account     │
                     └──────────┬──────────┘
                                │ OAuth + REST API
                                ▼
 ┌───────────────┐     ┌──────────────────┐     ┌────────────────────┐
 │   Frontend     │◄──►│     Backend       │◄──►│      Supabase       │
 │  (Next.js 15)  │     │ (Node/Express)   │     │  (Auth + Postgres)  │
 └───────────────┘     └────────┬─────────┘     └────────────────────┘
                                │
                 ┌──────────────┼───────────────┐
                 ▼                              ▼
        ┌─────────────────┐           ┌───────────────────┐
        │  Python ML       │           │   LM Studio        │
        │  (Random Forest) │           │  (local LLM)        │
        │  Priority Score  │           │  Daily Plan / Tasks │
        └─────────────────┘           └───────────────────┘
                 │                              │
                 └──────────────┬───────────────┘
                                ▼
                     ┌─────────────────────┐
                     │   Commit Assistant   │
                     │  (simple-git + PR)   │
                     │  ✅ requires approval │
                     └─────────────────────┘
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase OAuth (GitHub) |
| Machine Learning | Python, scikit-learn, Random Forest |
| Generative AI | LM Studio (local LLM — Llama, Mistral, Qwen, etc.) |
| Git Automation | simple-git, GitHub REST API |

## Project Structure

```
Git AI/
├── frontend/                      # Next.js 15 App Router
│   └── src/
│       ├── app/
│       │   ├── page.tsx                  # Landing page
│       │   ├── auth/callback/            # OAuth callback handler
│       │   └── dashboard/
│       │       ├── page.tsx              # Main dashboard
│       │       ├── repositories/         # Repo cards & metrics
│       │       ├── planner/              # AI daily planner UI
│       │       ├── commit/               # Commit assistant UI
│       │       └── history/              # Activity history
│       ├── components/
│       │   ├── providers/AuthProvider.tsx
│       │   └── ui/Toaster.tsx
│       └── lib/api.ts                    # API client
│
├── backend/                       # Node.js + Express
│   ├── server.js                  # Main server entry point
│   ├── routes/
│   │   ├── auth.js                # GitHub OAuth, user management
│   │   ├── repositories.js        # Scan, list, priority endpoints
│   │   ├── ai.js                  # LM Studio integration endpoints
│   │   ├── git.js                 # Commit & push automation endpoints
│   │   └── feedback.js            # Learning & pattern endpoints
│   ├── services/
│   │   ├── github.js              # GitHub API service
│   │   ├── ai.js                  # LM Studio AI service
│   │   ├── git.js                 # Git automation service
│   │   └── repository.js          # Supabase repository service
│   └── middleware/
│       └── auth.js                # Supabase JWT verification
│
├── ml/                             # Python ML Pipeline
│   ├── scanner.py                  # GitHub repository scanner
│   ├── feature_engineering.py      # ML feature preparation
│   ├── train.py                    # Random Forest training script
│   ├── predict.py                  # Priority prediction script
│   └── dataset/
│       └── training_data.csv       # Training dataset
│
├── models/                         # Trained ML model artifacts
│   └── priority_model.pkl          # Generated after training
│
└── supabase_schema.sql             # Complete database schema
```

## Prerequisites

- **Node.js v18+** — [nodejs.org](https://nodejs.org)
- **Python 3.9+** — for the ML pipeline
- **Git** — installed and configured with your credentials
- **A Supabase account** — free tier is sufficient
- **LM Studio** — downloaded, with at least one local model loaded
- **A GitHub OAuth App** — created under your GitHub account settings

## Setup Instructions

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) → **New Project**.
2. Open **SQL Editor** → paste the contents of `supabase_schema.sql` → **Run**.
3. Go to **Authentication → Providers → GitHub** → **Enable**.
4. Note down the following from **Project Settings → API**: Project URL, Anon Key, Service Role Key.

### Step 2: Create a GitHub OAuth App

1. Go to **GitHub → Settings → Developer Settings → OAuth Apps → New OAuth App**.
2. Set **Homepage URL** to `http://localhost:3000` and **Authorization callback URL** to `http://localhost:3000/auth/callback`.
3. Note down your **Client ID** and **Client Secret**.
4. In Supabase, go to **Authentication → Providers → GitHub** and paste in the Client ID & Secret.

### Step 3: Set Up LM Studio

1. Download [LM Studio](https://lmstudio.ai/).
2. Download a model — recommended: Mistral 7B, Llama 3.1 8B, or Qwen 2.5 7B.
3. Go to the **Local Server** tab → **Start Server** (default port `1234`).
4. Make sure your chosen model is loaded into the server before starting the backend.

### Step 4: Configure Environment Variables

**Backend (`backend/.env`):**

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

**Frontend (`frontend/.env.local`):**

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

> ⚠️ Never commit `.env` or `.env.local` files. Add them to `.gitignore` if they aren't already there.

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

**Python ML (optional, only needed if you plan to (re)train the model):**
```bash
cd ml
pip install pandas numpy scikit-learn requests
```

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

**Access points:**

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Health Check | http://localhost:8000/api/health |

### Step 7: Train the ML Model (Optional)

```bash
cd ml
pip install pandas numpy scikit-learn
python train.py
```

Or scan your own repositories first to build a fresh dataset:

```bash
python scanner.py --token YOUR_GITHUB_TOKEN --output dataset/github_data.csv
# Then manually add priority labels to github_data.csv, save as training_data.csv
python train.py
```

The trained model artifact is saved to `models/priority_model.pkl` and picked up automatically by `predict.py`.

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/auth/github-url` | Get GitHub OAuth authorization URL |
| POST | `/api/auth/github/connect` | Connect a GitHub token to the current user |
| GET | `/api/repositories` | List all tracked repositories |
| POST | `/api/repositories/scan` | Scan all repositories for the connected account |
| POST | `/api/repositories/:id/scan` | Scan a single repository |
| GET | `/api/repositories/health/stats` | Get aggregate portfolio health stats |
| POST | `/api/ai/daily-plan` | Generate an AI-powered daily development plan |
| POST | `/api/ai/generate-task` | Expand a plan item into a detailed task |
| POST | `/api/ai/commit-message` | Generate an AI-written commit message from a diff |
| GET | `/api/ai/portfolio-health` | Get an AI-generated summary of portfolio health |
| GET | `/api/ai/status` | Check LM Studio connection status |
| GET | `/api/git/status` | Get current git repository status |
| POST | `/api/git/prepare` | Prepare a repo and retrieve a diff for review |
| POST | `/api/git/commit` | Commit staged changes (**requires user approval**) |
| POST | `/api/git/push` | Push committed changes (**requires user approval**) |
| POST | `/api/git/commit-and-push` | Commit and push in one step (**requires user approval**) |
| POST | `/api/feedback` | Submit feedback on a completed task |
| GET | `/api/feedback/patterns` | Retrieve learned feedback patterns |

## Security & Privacy

- **No autonomous pushes** — every commit and push requires explicit user confirmation in the UI.
- **Local-first AI** — the LLM runs locally via LM Studio, so code and prompts never leave your machine for planning/generation.
- **Row Level Security (RLS)** — GitHub tokens and user data are stored in Supabase with RLS policies enforced.
- **JWT-authenticated API** — every backend endpoint verifies a Supabase-issued JWT before processing requests.
- **No hardcoded secrets** — all credentials are supplied via environment variables, never committed to source control.
- **Rate limiting** — applied across all API endpoints to prevent abuse.

## Troubleshooting

| Issue | Likely Cause | Fix |
|---|---|---|
| `LM Studio connection failed` | Local server not running or wrong port | Confirm the Local Server is started in LM Studio and `LM_STUDIO_URL` matches the port shown |
| GitHub OAuth redirect fails | Callback URL mismatch | Ensure the callback URL in your GitHub OAuth App matches `GITHUB_CALLBACK_URL` exactly |
| `401 Unauthorized` on API calls | Expired or missing Supabase JWT | Re-authenticate through the frontend; check `SUPABASE_ANON_KEY` is correct |
| Priority scores look wrong/static | Model not trained on enough data | Add more rows to `training_data.csv` and re-run `train.py` |
| Commit/push button does nothing | Missing git credentials locally | Ensure your machine has a valid GitHub token/SSH key configured for `simple-git` |
| Frontend can't reach backend | Wrong `NEXT_PUBLIC_API_URL` | Confirm it points to `http://localhost:8000` (or your deployed backend URL) |

## Roadmap

- [ ] Multi-user team dashboards
- [ ] Support for GitLab and Bitbucket repositories
- [ ] Slack/Discord daily plan notifications
- [ ] Configurable scoring weights per user
- [ ] Optional cloud LLM fallback alongside local LM Studio
- [ ] CI/CD integration for automatic test-ratio and build-health signals
- [ ] Mobile-friendly dashboard view

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature-name`.
3. Make real, meaningful changes — no fake or placeholder commits.
4. Use Git AI's own Commit Assistant to generate and confirm your commit.
5. Push your branch and open a pull request with a clear description of what changed and why.

### Additional Guidelines
- **Code Style**: Ensure TypeScript and CSS practices are followed, maintaining structural integrity and responsive layout conventions.
- **Verification**: Run `npm run build` in the frontend directory to verify that Next.js and Tailwind compilation succeed without any lint or compilation errors before opening a pull request.

---

## License

**MIT License** — built for developers who want to ship more, smarter.
