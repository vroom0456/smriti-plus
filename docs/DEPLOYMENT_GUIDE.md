# SMRITI+ Production Deployment & Evaluation Master Guide

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                 SMRITI+                                 │
│                   AI Cognitive Care & Support Platform                   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
         ┌───────────────────────────┴───────────────────────────┐
         ▼                                                       ▼
┌──────────────────┐                                   ┌──────────────────┐
│   Web Frontend   │                                   │   Android APK    │
│  (Expo Web/Vercel)│                                  │ (Expo EAS Build) │
└────────┬─────────┘                                   └────────┬─────────┘
         │                                                       │
         └───────────────────────────┬───────────────────────────┘
                                     ▼
                      ┌─────────────────────────────┐
                      │    FastAPI Application      │
                      │  (Railway / Render / Docker)│
                      └──────────────┬──────────────┘
                                     │
         ┌───────────────────────────┴───────────────────────────┐
         ▼                                                       ▼
┌──────────────────┐                                   ┌──────────────────┐
│  Cloud Database  │                                   │  Offline SQLite  │
│  (Supabase PG)   │                                   │  (Local Device)  │
└──────────────────┘                                   └──────────────────┘
```

---

## 1. Overview: 3-Tier Deployment Architecture

For Smart India Hackathon (SIH), SMRITI+ is split into 3 independent, production-grade deployments:

| Tier | Component | Platform | Technologies | Purpose |
|:---|:---|:---|:---|:---|
| **Tier 1: Frontend** | Web Application | **Vercel** | React Native Web / Expo | Instant web preview & caregiver browser dashboard |
| **Tier 1b: Mobile** | Native Android APK | **Expo EAS** | React Native, SQLite, Voice | Standalone APK for judge evaluation on real smartphones |
| **Tier 2: Backend** | REST & AI API | **Railway / Render** | Python 3.11, FastAPI, Uvicorn | Cognitive scoring, adaptive difficulty, RBAC, sync engine |
| **Tier 3: Database** | PostgreSQL & Auth | **Supabase** | PostgreSQL 15, PostgREST | Cloud storage, row-level security, audit & consent logs |

---

## 2. Tier 1: Deploying the Web Frontend (Vercel)

The web frontend is exported via Expo Web and served by Vercel as a high-performance Single Page Application.

### A. Pre-Deployment Verification
```bash
# In apps/mobile
npm install
npm run build
```
- Confirms bundle generation in `apps/mobile/dist`.
- Validates that zero build errors occur.

### B. Deploying to Vercel
1. Open [Vercel Dashboard](https://vercel.com/dashboard) → **Add New Project**.
2. Select your GitHub repository: `https://github.com/vroom0456/smriti-plus`.
3. Configure project settings:
   - **Root Directory**: `.` (or `apps/mobile`)
   - **Build Command**: `cd apps/mobile && npm install && npm run build` (or automatic via `vercel.json`)
   - **Output Directory**: `apps/mobile/dist` (or `dist` if root set to `apps/mobile`)
4. Add Frontend Environment Variables:
   - `EXPO_PUBLIC_API_URL`: URL of your deployed Railway FastAPI backend (e.g., `https://smriti-plus-api.up.railway.app`)
   - `EXPO_PUBLIC_SUPABASE_URL`: `https://tffkslztyrejetxewlbi.supabase.co`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
5. Click **Deploy**.

---

## 3. Tier 2: Deploying the FastAPI Backend (Railway / Render)

The backend provides all cognitive evaluation APIs, CSV reporting, and sync processing:
- `POST /auth/login`, `POST /auth/signup`, `POST /auth/link-caregiver`
- `GET /games`, `POST /games/{id}/session`, `GET /elders/{id}/difficulty/{game_id}`
- `GET /elders/{id}/reminders/today`, `POST /reminders`, `POST /reminders/{id}/log`
- `GET /caregiver/{id}/dashboard`, `GET /health-worker/{id}/group-stats`
- `POST /sync/push`, `GET /sync/pull`

### Option A: Railway Deployment (Recommended)
1. Open [Railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**.
2. Select `smriti-plus`.
3. In service settings, set:
   - **Root Directory**: `/backend`
   - **Build Command**: Dockerfile builds automatically using `backend/Dockerfile`
4. Add Environment Variables:
   ```env
   DATABASE_URL=postgresql://postgres.tffkslztyrejetxewlbi:Smiriti-plus%402026@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
   SECRET_KEY=smriti-plus-jwt-secret-key-2026-secure-production-random-token
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
   DEMO_OTP=123456
   ```
5. Railway provides your public HTTPS URL (e.g., `https://smriti-plus-api.up.railway.app`).
6. Test endpoint:
   ```bash
   curl https://smriti-plus-api.up.railway.app/health
   # Response: {"status": "healthy"}
   ```

### Option B: Render Deployment
1. Open [Render.com](https://render.com) → **New Web Service**.
2. Connect `smriti-plus` repository.
3. Configure:
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3` (or Docker)
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables matching the Railway list above.

---

## 4. Tier 3: Database Migrations (Supabase)

All database structure is version-controlled inside [`supabase/migrations/`](file:///Users/varunteja/Downloads/SIH/smriti-plus/supabase/migrations):

```
supabase/
├── migrations/
│   ├── 001_users.sql
│   ├── 002_elderly_profiles.sql
│   ├── 003_games.sql
│   ├── 004_game_sessions.sql
│   ├── 005_reminders.sql
│   ├── 006_difficulty_state.sql
│   ├── 007_sync_queue.sql
│   ├── 008_consent_logs.sql
│   └── 009_audit_logs.sql
└── seed.sql
```

### Applying via Supabase CLI
```bash
# 1. Login to Supabase CLI
npx supabase login

# 2. Link your project
npx supabase link --project-ref tffkslztyrejetxewlbi

# 3. Push migrations to production database
npx supabase db push

# 4. Apply seed data
cat supabase/seed.sql | npx supabase db execute
```

### Applying via Supabase Web Dashboard
1. Open Supabase Dashboard → Project `tffkslztyrejetxewlbi`.
2. Navigate to **SQL Editor** → **New Query**.
3. Copy & paste [`scripts/supabase_schema.sql`](file:///Users/varunteja/Downloads/SIH/smriti-plus/scripts/supabase_schema.sql) and run.

---

## 5. Mobile: Compiling the Standalone Android APK (Expo EAS)

For the SIH jury, running an installed `.apk` on an actual Android device proves production readiness.

### A. Install EAS CLI
```bash
npm install -g eas-cli
```

### B. Log in to Expo Account
```bash
eas login
```

### C. Build the Android APK
```bash
cd apps/mobile
eas build -p android --profile preview
```
- EAS Cloud will compile your React Native app with native SQLite, voice synthesis, and sensors.
- When finished, EAS outputs a direct `.apk` download link (e.g. `https://expo.dev/artifacts/eas/...apk`).
- Download and install the APK directly onto your Android test phones.

---

## 6. Offline-First SQLite & Sync Architecture

```
[User Action: Game / Reminder / Memory]
                 │
                 ▼
     ┌───────────────────────┐
     │ Local SQLite Database │ ◄── Read & Write in <5ms (Never blocks UI)
     └───────────┬───────────┘
                 │
                 ▼
     ┌───────────────────────┐
     │ Local Sync Queue      │ ◄── Stores UUID, timestamp, action, retry_count
     └───────────┬───────────┘
                 │
      ┌──────────┴──────────┐
      ▼                     ▼
[ONLINE]                [OFFLINE (Airplane Mode)]
      │                     │
      ▼                     ▼
POST /sync/push         Continue functioning seamlessly;
      │                 queue grows locally.
      ▼                     │
Server validates &          │
persists to PostgreSQL      │
      │                     │
      ▼                     ▼
Mark local event        When internet returns:
as SYNCED               Auto-sync flushes queue
```

---

## 7. The Winning 100-Point SIH Live Demo Script

Follow this sequential demonstration flow to impress the judges:

### Phase 1: Authentication & Role Differentiation (1 min)
1. Open the app on the Android phone.
2. Tap **Instant Demo Profiles** → **Elder (Amit Borah)**.
3. Notice high-contrast text, simplified navigation, and voice-guided greeting in Assamese/English.

### Phase 2: Cognitive Gaming & Adaptive Difficulty (1.5 min)
1. Open **Card Flip Matching** or **Name That Object**.
2. Play a round and achieve high accuracy.
3. Show the real-time AI recommendation:
   - *"Accuracy was 95% — difficulty automatically progressed to Level 2."*
4. Complete the daily hydration reminder.

### Phase 3: The Climax — Complete Offline Resilience (2 min)
1. **Turn Airplane Mode ON** right in front of the judges.
2. Open another game (**Attention Game / Spot the Difference**).
3. Play the game and complete it.
4. Show that the score, streak, and local state are saved immediately:
   - Notification appears: *"Saved locally. Will sync when online."*
5. Open the **Memory Box** and browse cached memories and family photos completely offline.

### Phase 4: Sync & Caregiver Real-Time Visibility (1.5 min)
1. Open the **Caregiver Dashboard** on a laptop/tablet via Vercel URL.
2. Notice the previous session stats.
3. **Turn Airplane Mode OFF** on the phone.
4. Watch the mobile app's background sync engine push the queued events to the backend.
5. Refresh the caregiver dashboard:
   - The offline session score, updated streak, and completed reminder reflect immediately!
6. Present the **Flo-style pairing code** (`SMR-842`) to demonstrate how easy it is for families to connect.

### Phase 5: Healthcare Compliance & DPDP Act 2023 (1 min)
1. Switch to the **Health Worker** view.
2. Show the cohort risk score distribution and 1-click anonymized CSV export.
3. Highlight that all actions are backed by cryptographic audit logs and explicit consent records.
