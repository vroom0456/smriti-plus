# SMRITI+ — System Architecture & Design Specification
**Smart India Hackathon 2026 — Problem Statement SIH26003**

> **Regulatory & Clinical Disclaimer:**  
> SMRITI+ supports cognitive engagement and daily assistance; it does not diagnose or treat dementia or any other neurological condition.

---

## 1. System Overview

SMRITI+ is an elderly-first, offline-first assistive cognitive platform designed to empower elderly users experiencing early-stage memory challenges, their primary family caregivers, and community health workers (e.g., ASHA workers in the North Eastern Region of India).

```
 ┌────────────────────────────────────────────────────────┐
 │                   SMRITI+ CLIENT                       │
 │  (React Native + Expo, TypeScript, Local SQLite Cache) │
 └─────────────┬────────────────────────────┬─────────────┘
               │                            │
      Local DB & Sync Queue                 │ Secure JWT (TLS)
               │                            │
               ▼                            ▼
 ┌────────────────────────────────────────────────────────┐
 │                   FASTAPI BACKEND                      │
 │     (Python 3.9+, REST API, Rule-Based AI Engine)      │
 └────────────────────────────┬───────────────────────────┘
                              │
                      SQLAlchemy ORM
                              │
                              ▼
 ┌────────────────────────────────────────────────────────┐
 │                 POSTGRESQL DATABASE                    │
 │    (Relational Schemas, Constraints, Audit Logs)       │
 └────────────────────────────────────────────────────────┘
```

---

## 2. Component Breakdown

### 2.1 Mobile Application (`apps/mobile`)
- **Framework:** React Native + Expo (TypeScript)
- **Local Database:** `expo-sqlite` with write-ahead logging (WAL)
- **State Management:** Zustand (lightweight client state) and TanStack React Query (server caching)
- **Offline Sync:** Custom Sync Engine implementing an outbox pattern (`sync_queue`) with exponential backoff and cursor-based pull sync.
- **Voice & Accessibility:**
  - `expo-speech` for natural regional TTS
  - 56dp minimum tap targets, 20px+ body font sizes, high-contrast palette (`#132A52` Navy, `#0E8E8B` Teal, `#F2FAF8` Mint)
  - Every icon is strictly paired with clear text labels (never icon-only)

### 2.2 Backend API (`backend/app`)
- **Framework:** FastAPI with Python typing and Pydantic v2 schemas
- **Auth & RBAC:** JWT bearer tokens with embedded role metadata (`elderly`, `caregiver`, `health_worker`). Explicit ownership guards verify caregivers only view their linked elders, and health workers view their assigned cohorts.
- **Database Layer:** SQLAlchemy 2.0 with Alembic database migrations. UUID primary keys are client-generated for sync idempotency.
- **Adaptive Difficulty AI Engine:** Rule-based baseline strictly bounded between 1 and 5, evaluating accuracy, response times, and streaks to compute personalized, encouraging difficulty adjustments with transparent explanations.

---

## 3. Data Flow & Sync Protocol

### 3.1 Local-First Write Path
1. **User Action:** The elder finishes a game or confirms a reminder.
2. **Local Commit:** A client UUID is generated, and the record is immediately committed to local SQLite (`game_sessions` or `reminder_logs`).
3. **Outbox Queue:** A corresponding sync event is inserted into `sync_queue` in SQLite with `status = 'pending'`.
4. **Immediate UI Feedback:** The UI updates instantly without awaiting network responses.

### 3.2 Background Push & Idempotency
1. When connectivity is restored, the `syncEngine` fetches pending events (up to 25 per batch).
2. The batch is posted to `POST /sync/push`.
3. The server checks the `client_event_id` and `entity_id`. If already processed, it responds with `{ status: "synced", note: "already exists" }` (idempotent duplicate elimination).
4. Each event is validated and committed independently; failures return `{ status: "rejected", error: ... }` rather than failing the whole batch.
5. On the client, successful events are marked `synced`. Network interruptions increment `retry_count` (max 5 retries).

### 3.3 Incremental Pull Sync
1. The client sends `GET /sync/pull?cursor=<opaque_cursor>`.
2. The server queries entities modified after the cursor timestamp.
3. The client writes newer entities to local SQLite and records the latest server timestamp as the new cursor.

---

## 4. Security & Privacy Safeguards
- **Identity Integrity:** Tokens are validated server-side; client identity cannot be spoofed.
- **Zero Audio Storage:** Voice transcripts are interpreted immediately on-device; raw audio recordings are never sent to external servers.
- **Data Minimization:** Only game performance metrics and reminder response timestamps are logged.
- **Non-Diagnostic Disclosure:** Required disclaimer is rendered on login, onboarding, consent, settings, and health worker reports.
