# SMRITI+ (স্মৃতি+) — Assistive Cognitive Engagement & Memory Assistance Platform
**Smart India Hackathon 2026 — Problem Statement SIH26003**  
**Organization:** Ministry of Development of North Eastern Region (MDoNER)  
**Theme:** MedTech / BioTech / HealthTech  
*"Remember. Engage. Connect."*

> **Mandatory Regulatory & Clinical Disclosure:**  
> **SMRITI+ supports cognitive engagement and daily routine assistance; it does not diagnose, treat, prevent, or cure dementia, Alzheimer's disease, or any neurological disorder.** It is not a clinical medical diagnostic device, does not compute clinical risk scores, and does not replace medical practitioners.

---

## 1. Executive Overview

**SMRITI+** is an elderly-first, offline-first cognitive engagement, memory assistance, routine reminder, family connection, and caregiver support platform engineered especially for elderly individuals in the **North Eastern Region (NER)** experiencing cognitive difficulties or low digital literacy.

The platform unites three tailored user experiences:
1. **Elderly User Interface:** Dignified, calm design with large typography (20px+ body, 28–34px headings), minimum 56dp touch targets, cultural North Eastern Region (NER) cognitive games, time-aware voice guidance with touch fallbacks, one-tap routine reminders, and direct family connection.
2. **Family Caregiver Experience:** Real adherence metrics, 14-day activity trend charts, proactive missed-activity alerts, medication scheduling, family voice note recording, and direct human controls to override adaptive assistance levels.
3. **Community Health Worker (ASHA) Portal:** Cohort monitoring across assigned village circles, adherence risk flags, and one-click CSV export for community health reporting.

---

## 2. Complete Technology Stack

| Layer | Technologies | Key Capabilities |
| :--- | :--- | :--- |
| **Mobile (Frontend)** | React Native, Expo 57, TypeScript | Strict type safety (`tsc --noEmit` clean), zero dead buttons |
| **Local Storage & Offline** | `expo-sqlite` (WAL Mode), `expo-secure-store` | Offline-first writes, idempotent sync outbox queue |
| **State & Navigation** | TanStack React Query, Zustand, React Navigation | Tab and Stack navigators tailored per role |
| **Speech & Audio** | `expo-speech` | Multimodal voice interaction, TTS regional voice tuning |
| **Localization (i18n)** | Custom i18n engine | 100% translation key parity across English, Assamese (অসমীয়া), and Bodo (बड़ो) |
| **Backend API** | Python 3.9+, FastAPI, Pydantic v2 | High-throughput REST API, OpenAPI docs |
| **Database & Migrations**| PostgreSQL / SQLite fallback, SQLAlchemy 2.0, Alembic | 14 relational tables, Alembic migrations |
| **Security & Auth** | JWT Bearer, modern `bcrypt` | Cryptographic session tokens, server-side RBAC, IDOR defense |
| **AI Personalization** | Rule-Based Adaptive Engines | Clamped [1–5] difficulty engine, struggle detection, explainable reasoning |

---

## 3. Architecture & Two-Phase Implementation

```text
React Native + Expo (Mobile Client)
               │
      React Query + Zustand
               │
     Local SQLite Database (WAL Mode)
               │
     Local Sync Outbox Queue
               │  (Online / Reconnected)
     FastAPI Backend Gateway
               │
    PostgreSQL / SQLAlchemy
    ┌──────────┼──────────┐
  Auth & RBAC  Games & AI  Reminders & Memory Box
```

### Phase 1 — Core Platform
- ✅ Elder-Friendly Home with time-aware greeting and personalized recommendation.
- ✅ Today / Routine reminder system with single-tap completion.
- ✅ 4 Cognitive Games: Memory Recall, Memory Matching, Attention (Odd-One-Out), Pattern Recognition.
- ✅ Adaptive Difficulty Engine clamped [1–5] with transparent plain-language explanations.
- ✅ Adaptive Assistance & Struggle Detection: dynamic choice reduction (4 → 3 → 2), visual hints, comfort break modal.
- ✅ Offline-First SQLite engine and idempotent sync queue (`POST /sync/push`, `GET /sync/pull`).
- ✅ Caregiver Dashboard with weekly metrics, 14-day trend bar chart, and alerts.
- ✅ Health Worker aggregate cohort dashboard with CSV export.
- ✅ Rigorous automated tests: 26 passing pytest unit/security tests, 0 TypeScript errors, 100% localization parity.

### Phase 2 — Differentiation
- ✅ **Family Corner:** One-tap direct calling and messaging to loved ones with primary caregiver indicators.
- ✅ **Digital Memory Box:** Cherished photos, stories, and audio clips categorized into Family, Places, Celebrations, Music, and Memories.
- ✅ **Family Voice Reminders:** Caregivers record voice messages attached to reminders, spoken to the elder via regional TTS.
- ✅ **Cultural Personalization for NER:** Culturally familiar assets: Majuli Rongali Bihu, Jorhat tea gardens, Muga silk handlooms, bamboo flute tunes.
- ✅ **Caregiver Adaptation Controls:** Direct human override for assistance level, session length, calm animation modes, and text scaling.

---

## 4. Quickstart Guide

### 4.1 Backend Setup
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Run automated tests (26 unit and security tests)
PYTHONPATH=. pytest tests/ -v

# Run backend development server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
The interactive API documentation is available at `http://localhost:8000/docs`.

### 4.2 Mobile App Setup
```bash
cd apps/mobile
npm install

# Verify TypeScript compilation (0 errors)
npx tsc --noEmit

# Verify localization completeness (100% parity across English, Assamese, Bodo)
node scripts/check-translations.js

# Start Expo development server
npx expo start
```

### 4.3 Database Seeding & Reset
```bash
# Seed deterministic demo data (users, games, history, family contacts, memory box items, voice notes)
python3 scripts/seed_demo_data/seed.py

# Reset and re-seed demo data
python3 scripts/reset_demo_data/reset.py
```

---

## 5. Live Demonstration Accounts

| Role | Email / Identifier | Password / PIN | Persona Description |
| :--- | :--- | :--- | :--- |
| **Elderly** | `elder.demo@smriti.local` | `1234` | Amit Borah (Age 74, Jorhat / Guwahati, loves Bihu memories) |
| **Caregiver** | `caregiver.demo@smriti.local` | `caregiver123` | Priya Borah (Daughter, primary caregiver & manager) |
| **Health Worker** | `worker.demo@smriti.local` | `worker123` | Dr. Anjali Hazarika (Community Health Supervisor) |
| **Demo OTP** | *(Any account)* | `123456` | Fixed test OTP for development mode |

---

## 6. Comprehensive Documentation Index

* 📐 **[Architecture Specification](file:///Users/varunteja/Downloads/SIH/smriti-plus/docs/architecture.md):** Offline sync protocol, state lifecycle, and database schemas.
* ♿ **[Accessibility & Elderly UX Guide](file:///Users/varunteja/Downloads/SIH/smriti-plus/docs/accessibility.md):** 56dp+ touch targets, contrast ratios, and cognitive simplicity principles.
* 🔒 **[Privacy & Security Architecture](file:///Users/varunteja/Downloads/SIH/smriti-plus/docs/privacy.md):** Data minimization, zero raw audio storage, audit trails, and RBAC IDOR defense.
* 🧪 **[Verification & Testing Guide](file:///Users/varunteja/Downloads/SIH/smriti-plus/docs/testing.md):** Test execution instructions and offline simulation steps.
* 🌏 **[Localization & NER Culture Guide](file:///Users/varunteja/Downloads/SIH/smriti-plus/docs/localization.md):** Language parity and North Eastern cultural elements.
* 🧠 **[AI Explainability & Engines](file:///Users/varunteja/Downloads/SIH/smriti-plus/docs/ai-explainability.md):** Difficulty heuristics, struggle detection, and human caregiver override.
* 📋 **[Implementation Status Matrix](file:///Users/varunteja/Downloads/SIH/smriti-plus/docs/implementation-status.md):** Complete requirement traceability and test evidence.
* 🎬 **[Live Demo Script](file:///Users/varunteja/Downloads/SIH/smriti-plus/docs/demo-script.md):** 21-step demonstration script for hackathon evaluation.

---

## 7. License & Attribution

Built for the **Smart India Hackathon 2026** under Problem Statement **SIH26003** in service of the elderly population of the North Eastern Region of India.
