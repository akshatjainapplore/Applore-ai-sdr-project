# Applore AI SDR — Full Stack Codebase

Autonomous AI-powered outbound SDR system. Runs 24/7. No human needed until a meeting is booked.

## Architecture

```
/frontend    → React + Vite  →  Deploy to Vercel
/backend     → Node.js + Express + Cron  →  Deploy to Railway or Render
Database     → Supabase (Postgres)
```

## What it does autonomously

Every day at 7:00 AM IST (configurable):
1. Discovers 10 new companies via Vibe Prospecting API
2. Claude AI researches each company (news, funding, pain points)
3. Claude AI writes all 7 personalised outreach scripts per company
4. Pushes contacts + scripts into Instantly campaign automatically
5. Dashboard updates with new prospects, hot alerts, pipeline counts

---

## Setup Instructions for DevOps

### Step 1 — Supabase

1. Go to https://supabase.com → Create new project
2. Go to SQL Editor → paste the contents of `backend/db/schema.sql` → Run
3. Go to Settings → API → copy `Project URL` and `service_role` key

### Step 2 — Backend (Railway recommended)

1. Go to https://railway.app → New Project → Deploy from GitHub repo
2. Select the `/backend` folder as root directory
3. Add environment variables from `backend/.env.example`:
   - ANTHROPIC_API_KEY
   - SUPABASE_URL
   - SUPABASE_SERVICE_KEY
   - INSTANTLY_API_KEY
   - INSTANTLY_CAMPAIGN_ID
   - VIBE_API_KEY
   - FRONTEND_URL (add after Vercel deploy)
   - CRON_HOUR_UTC=1
   - CRON_MINUTE_UTC=30
4. Deploy → copy the Railway URL

### Step 3 — Frontend (Vercel)

1. Go to https://vercel.com → New Project → Import from GitHub
2. Set root directory to `/frontend`
3. Add environment variable:
   - VITE_API_URL = your Railway backend URL (from Step 2)
4. Deploy → copy the Vercel URL
5. Go back to Railway → add FRONTEND_URL = your Vercel URL → redeploy

### Step 4 — Verify

1. Open your Vercel URL in browser
2. Dashboard should load (no data yet — that's fine)
3. Click "Run Now" button → watch the scheduler fire
4. After ~5 minutes, refresh — prospects should appear in queue

---

## Daily Operation (Zero human effort)

The backend cron fires every day at 1:30 UTC (7:00 AM IST).
Instantly handles all email sending automatically.
SDR team only needs to:
- Check LinkedIn Pack page daily for pre-written messages to send
- Take calls when meetings are booked

## Folder Structure

```
applore-ai-sdr/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx       ← Pipeline overview, scheduler status
│   │   │   ├── ProspectQueue.jsx   ← All prospects, status, expand for brief
│   │   │   ├── Scripts.jsx         ← All 7 scripts per company, copy buttons
│   │   │   ├── LinkedIn.jsx        ← LinkedIn messages, one-click copy + LinkedIn link
│   │   │   └── SettingsPage.jsx    ← ICP config, schedule, API keys
│   │   ├── api/index.js            ← All backend API calls
│   │   ├── App.jsx                 ← Router + sidebar navigation
│   │   └── index.css               ← Global styles + CSS variables
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── backend/
│   ├── services/
│   │   ├── scheduler.js    ← THE BRAIN — autonomous daily job
│   │   ├── claude.js       ← Research + script generation via Claude API
│   │   ├── instantly.js    ← Push contacts to Instantly
│   │   └── vibe.js         ← Lead discovery via Vibe Prospecting
│   ├── routes/
│   │   ├── prospects.js    ← CRUD for prospect list
│   │   ├── scripts.js      ← Script retrieval + editing
│   │   ├── pipeline.js     ← Summary stats, hot prospects, scheduler logs
│   │   ├── settings.js     ← ICP + API key management
│   │   ├── instantly.js    ← Campaign data from Instantly
│   │   └── schedulerRoute.js ← Manual trigger endpoint
│   ├── db/
│   │   ├── client.js       ← Supabase client
│   │   └── schema.sql      ← Run once to set up tables
│   ├── index.js            ← Express server + scheduler init
│   └── package.json
│
├── .env.example            ← Template — fill in your keys
└── README.md
```

## Adding More Prospects Manually

If you want to add a company outside the daily job:
POST /api/prospects with body: `{ company_name, website, sector, country }`
The scheduler will pick it up and research it on the next run.

## Monitoring

- Dashboard → Scheduler Status shows last run time and stats
- Dashboard → Hot Prospects shows anyone who replied or opened 3+ times
- Supabase table `scheduler_log` has full history of every daily run
