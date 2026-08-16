<div align="center">

# Git AI

### Autonomous AI-Powered GitHub Engineering Manager 

> Your personal AI engineering manager that watches over your GitHub repositories, tells you what to work on next, and helps you ship real code — safely, and only with your approval.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](#license)
[![Node](https://img.shields.io/badge/Node.js-v18%2B-green)](#prerequisites)
[![Python](https://img.shields.io/badge/Python-3.9%2B-blue)](#prerequisites)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](#tech-stack)
[![Status](https://img.shields.io/badge/status-active--development-orange)](#roadmap)

</div>

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

## 🎨 Design Highlights

The **Repositories**, **Dashboard**, and **AI Planner** pages have been redesigned for a cleaner, more focused engineering-manager feel — less "generic admin panel," more "control room for your codebase."

### Repositories Page
- **Card-based repo grid** — each repository is its own card showing priority score, last-commit recency, open issue count, and health status at a glance
- **Priority color coding** — visual severity indicators (e.g. urgent / needs attention / healthy) so the repos that matter most are immediately scannable
- **Inline scan controls** — trigger a single-repo rescan directly from its card instead of navigating away
- **Sort & filter** — reorder repos by priority score, last activity, or open issues

### Dashboard Page
- **At-a-glance portfolio summary** — aggregate stats (total repos tracked, average health, repos needing attention) surfaced up top
- **Recent activity feed** — a running log of recent scans, generated plans, and git actions
- **Cleaner visual hierarchy** — key numbers and priority repos are pulled forward, with secondary detail tucked into expandable sections
- **Responsive layout** — reflows gracefully from a multi-column desktop view down to a single-column mobile view

### AI Planner Page
- **Structured daily plan view** — the LLM's plan is rendered as discrete, actionable task cards rather than a wall of text
- **Expandable task detail** — click into any plan item to pull in the fully-specified task (approach, context, relevant repo) via `/api/ai/generate-task`
- **Clear plan-to-action flow** — a visible path from "here's what the AI suggests" to "here's the diff I'm about to commit," reinforcing that nothing ships without your review
- **LM Studio connection status** — an always-visible indicator so you know at a glance whether the local model is reachable before requesting a plan

> These pages share a consistent visual language — clear typographic hierarchy, generous spacing, and status-driven color accents — so priority and next actions are always obvious without digging through menus.

*(Have specific colors, fonts, or layout details you want called out here instead? Send them over and I'll tighten this section up to match exactly.)*

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

### 4. Planning — local-first, with a cloud fallback

Numbers alone aren't a plan. Git AI tries **LM Studio** (an LLM running entirely on your own machine — Llama, Mistral, or Qwen) first, and only falls back to a cloud model when LM Studio is unreachable:

1. When you request a plan (`POST /api/ai/daily-plan`), the backend's `services/ai.js` bundles up the scored repository data — priorities, open issues, recent activity — into a prompt.
2. It probes your local LM Studio server (default `http://localhost:1234`). If it answers, the prompt goes there and your data never leaves your machine.
3. If LM Studio is unreachable (or unset — the common case for other users of a hosted deployment), the same prompt goes to a cloud model instead (Claude Sonnet 5 by default, configurable via `CLOUD_LLM_MODEL`). `GET /api/ai/status` reports which backend is currently active — `local`, `cloud`, or `unavailable` — so the UI never claims privacy it isn't providing.
4. The model reasons over the data and returns a **structured, prioritized daily plan** in natural language: which repos to touch today, what specifically to do, and why it matters.
5. If you want more detail on one plan item, `POST /api/ai/generate-task` expands it into a fully-specified task with suggested approach and context.

Every cloud call is logged to `usage_events` with an estimated cost, and `GET /api/ai/usage` reports your last-30-days spend — the lever for a future per-user cap.

### 5. Implementation & the Commit Assistant

Once you know what to work on, propose the file changes you want to make — either by hand in the Commit Assistant UI, or from an AI-generated task's suggested content:

1. `POST /api/git/prepare` fetches each proposed file's current content straight from GitHub (Contents API) and builds an in-memory unified diff against it — no local clone, no server disk. This also means the backend is stateless and safe to run as multiple instances.
2. `POST /api/ai/commit-message` sends that diff to the active LLM backend (local or cloud), which drafts a clear, conventional commit message.
3. You review the diff and the generated message in the **Commit Assistant** UI.
4. Only when you click **approve** does the backend call `POST /api/git/commit`, which writes the change straight to GitHub via the Git Data API (atomic multi-file commits: blobs → tree → commit → ref update) — by default onto a new feature branch, not directly to `main`.
5. Optionally, `POST /api/git/pull-request` opens a PR from that branch for review before it ever reaches the default branch.

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
                                │ OAuth + REST + Contents/Git Data API
                                ▼
 ┌───────────────┐     ┌──────────────────────┐     ┌────────────────────┐
 │   Frontend     │◄──►│  Backend (stateless)  │◄──►│      Supabase       │
 │  (Next.js 15)  │     │  Node/Express, N inst. │     │  (Auth + Postgres)  │
 └───────────────┘     └──────────┬───────────┘     └────────────────────┘
                                   │
              ┌────────────────────┼─────────────────┬────────────────────┐
              ▼                    ▼                 ▼                    ▼
     ┌─────────────────┐  ┌──────────────────┐  ┌───────────┐   ┌───────────────────┐
     │ ML microservice   │  │   LM Studio        │  │  Claude    │   │  Commit Assistant   │
     │ (FastAPI, Random  │  │  (local LLM,       │  │  (cloud    │   │  (GitHub API only,  │
     │  Forest priority)  │  │   tried first)     │  │  fallback) │   │  no local clone)    │
     └─────────────────┘  └──────────────────┘  └───────────┘   │  ✅ requires approval │
                                                                     └───────────────────┘
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase OAuth (GitHub) |
| Machine Learning | Python, scikit-learn, Random Forest — invoked as a subprocess (`ml/predict.py`) from the backend, no separate service to run |
| Generative AI | LM Studio (local, tried first) with Claude Sonnet 5 as a cloud fallback via the Anthropic SDK |
| Git Automation | GitHub Contents + Git Data API (no local clone — stateless backend) |
| Observability | pino structured logging, Sentry (optional, `SENTRY_DSN`) |

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
├── backend/                       # Node.js + Express (stateless)
│   ├── server.js                  # Main server entry point
│   ├── routes/
│   │   ├── auth.js                # GitHub OAuth, user management
│   │   ├── repositories.js        # Scan, list, priority endpoints
│   │   ├── ai.js                  # AI planning + status/usage endpoints
│   │   ├── git.js                 # GitHub-API commit/PR endpoints
│   │   └── feedback.js            # Learning & pattern endpoints
│   ├── services/
│   │   ├── github.js              # GitHub scanning service (Octokit)
│   │   ├── githubCommit.js        # Commit/PR via Contents + Git Data API
│   │   ├── ai.js                  # LM Studio + Claude fallback
│   │   ├── repository.js          # Priority scoring (ML service + JS fallback)
│   │   ├── tokenCrypto.js         # AES-256-GCM token encryption
│   │   ├── logger.js              # Structured (pino) logging
│   │   └── errorTracking.js       # Optional Sentry wrapper
│   ├── middleware/
│   │   └── auth.js                # Supabase JWT verification
│   └── __tests__/                 # Jest unit + route tests
│
├── ml/                             # Python ML training pipeline
│   ├── scanner.py                  # GitHub repository scanner
│   ├── feature_engineering.py      # ML feature preparation
│   ├── train.py                    # Random Forest / Gradient Boosting training
│   ├── predict.py                  # Priority prediction (CLI — called as a subprocess by the backend)
│   ├── test_predict.py             # Regression test
│   └── dataset/
│       └── training_data.csv       # Training dataset
│
├── models/                         # Trained ML model artifacts (generated, not committed)
│
├── supabase/migrations/            # Versioned schema changes (Supabase CLI)
├── supabase_schema.sql             # Base database schema
├── Dockerfile                      # Single image: Node backend + Python venv for ml/predict.py
├── render.yaml                     # Backend deploy blueprint (Render, Docker runtime)
├── DEPLOYMENT.md                   # Manual account/secrets setup checklist
└── .github/workflows/              # CI (typecheck/lint/build/test) + deploy triggers
```

## Prerequisites

- **Node.js v18+** — [nodejs.org](https://nodejs.org)
- **Python 3.9+** — for the ML pipeline
- **Git** — installed and configured with your credentials
- **A Supabase account** — free tier is sufficient
- **LM Studio** — downloaded, with at least one local model loaded (optional if you set an `ANTHROPIC_API_KEY` for the cloud fallback instead)
- **A GitHub OAuth App** — created under your GitHub account settings

> **Deploying this for real users, not just local dev?** See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for the production checklist — Supabase paid tier, Render (backend + ML service), Vercel (frontend), and the account/secrets setup none of this automation can do for you.

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
| POST | `/api/git/prepare` | Preview an in-memory diff for proposed file changes, straight from GitHub |
| POST | `/api/git/commit` | Commit proposed files to a branch via the Git Data API (**requires user approval**) |
| POST | `/api/git/pull-request` | Open a PR from a branch created by `/api/git/commit` (**requires user approval**) |
| GET | `/api/ai/usage` | Last-30-days cloud LLM spend for the current user |
| POST | `/api/feedback` | Submit feedback on a completed task |
| GET | `/api/feedback/patterns` | Retrieve learned feedback patterns |

## Security & Privacy

- **No autonomous pushes** — every commit, branch, and PR requires explicit user confirmation in the UI.
- **Local-first AI, with an honest fallback** — LM Studio is tried first for every AI call; only when it's unreachable does the request go to a cloud model (Claude Sonnet 5), and `/api/ai/status` reports which backend answered so the UI never claims local-only privacy it isn't providing.
- **Stateless backend, no local git** — commits are written via the GitHub API, so no repository ever touches server disk and the backend can run as multiple instances without any shared state.
- **Encrypted tokens at rest** — GitHub access tokens are AES-256-GCM encrypted before being stored in Supabase, so a database leak alone doesn't hand out live GitHub access.
- **Row Level Security (RLS)** — every table is scoped to `auth.uid()`; the backend's service-role key bypasses RLS, so every query also explicitly filters by the authenticated user's ID as a second layer.
- **Per-user rate limiting** — the API rate limiter keys on the authenticated user (decoded from the JWT), not IP, so one active user or shared NAT can't starve everyone else.
- **JWT-authenticated API** — every protected backend endpoint verifies a Supabase-issued JWT before processing requests.
- **No hardcoded secrets** — all credentials are supplied via environment variables, never committed to source control.
- **Per-user usage tracking** — cloud LLM calls are logged with an estimated cost per user (`/api/ai/usage`), the basis for a spend cap on a multi-user deployment.

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

- [x] Optional cloud LLM fallback alongside local LM Studio
- [x] Stateless, GitHub-API-based commit engine (no local clone)
- [x] Trained priority model wired into the backend (with a JS-heuristic fallback)
- [x] CI (typecheck, lint, build, test) on every PR
- [ ] Multi-user team dashboards
- [ ] Support for GitLab and Bitbucket repositories
- [ ] Slack/Discord daily plan notifications
- [ ] Configurable scoring weights per user
- [ ] Automatic test-ratio and build-health signals in CI
- [ ] Mobile-friendly dashboard view
- [ ] GitHub App installation (narrower token scopes than the current OAuth flow)

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
