# SMRITI+ — Verification & Automated Testing Guide
**Smart India Hackathon 2026 — Problem Statement SIH26003**

---

## 1. Test Architecture Overview

SMRITI+ employs multi-tier verification covering:
1. **Backend Unit & Security Tests (`backend/tests/`):** Pytest suite covering auth, RBAC security, IDOR prevention, adaptive difficulty engine, struggle detection, and schema validation.
2. **Frontend Type Safety & Linting (`apps/mobile/`):** Strict TypeScript type-checking (`tsc --noEmit`).
3. **Localization Completeness:** Node script auditing 100% translation key parity across English, Assamese, and Bodo.
4. **Offline & Idempotency Simulation:** Validating local SQLite transactions and sync queue deduplication.

---

## 2. Running Backend Tests

### Prerequisites
Activate Python virtual environment in `backend/`:
```bash
cd backend
source .venv/bin/activate
```

### Run Full Test Suite
```bash
PYTHONPATH=. pytest tests/ -v
```

### Expected Output:
```text
tests/test_assistance_engine.py::test_standard_performance_gives_standard_assistance PASSED
tests/test_assistance_engine.py::test_struggle_detection_reduces_choices_and_offers_hint PASSED
tests/test_assistance_engine.py::test_severe_struggle_reduces_to_two_choices PASSED
tests/test_assistance_engine.py::test_long_session_triggers_comfort_break PASSED
tests/test_assistance_engine.py::test_human_caregiver_override_precedence PASSED
tests/test_auth.py::test_password_hashing PASSED
tests/test_auth.py::test_jwt_token_creation_and_decoding PASSED
tests/test_auth.py::test_caregiver_token_claims PASSED
tests/test_difficulty_engine.py::test_empty_history_returns_default PASSED
tests/test_difficulty_engine.py::test_increase_difficulty_after_high_accuracy PASSED
tests/test_difficulty_engine.py::test_max_difficulty_clamping PASSED
tests/test_difficulty_engine.py::test_decrease_difficulty_after_struggle PASSED
tests/test_difficulty_engine.py::test_min_difficulty_clamping PASSED
tests/test_phase2_schemas.py::test_family_contact_validation PASSED
tests/test_phase2_schemas.py::test_memory_item_validation PASSED
tests/test_phase2_schemas.py::test_family_voice_message_validation PASSED
tests/test_phase2_schemas.py::test_personalization_preference_validation PASSED
tests/test_rbac_security.py::test_caregiver_cannot_access_unlinked_elder PASSED
tests/test_rbac_security.py::test_caregiver_can_access_linked_elder PASSED
tests/test_rbac_security.py::test_elder_cannot_access_another_elder PASSED
tests/test_rbac_security.py::test_elder_can_access_own_data PASSED
tests/test_rbac_security.py::test_health_worker_cannot_access_unassigned_group PASSED
tests/test_rbac_security.py::test_role_guard_blocks_unauthorized_role PASSED
tests/test_schemas.py::test_game_session_validation PASSED
tests/test_schemas.py::test_reminder_create_validation PASSED
tests/test_schemas.py::test_sync_push_request_validation PASSED

============================== 26 passed in ~0.8s ==============================
```

---

## 3. Running Mobile Tests & Type Checking

### TypeScript Typecheck
```bash
cd apps/mobile
npx tsc --noEmit
```
**Expected Output:** Exits with code 0 and 0 errors.

### Translation Completeness Check
```bash
cd apps/mobile
node scripts/check-translations.js
```
**Expected Output:**
```text
Base English keys found: 122
[PASS] as.json has 100% parity (122/122)
[PASS] bodo.json has 100% parity (122/122)
```

---

## 4. Offline Sync & Idempotency Testing Flow

To manually verify or demonstrate offline functionality:

1. **Step 1 (Online baseline):**
   - Log in as `elder.demo@smriti.local` (PIN: `1234`).
   - Play a round of *Memory Matching*. Notice the session appears in the Caregiver Dashboard.
2. **Step 2 (Airplane mode / Offline):**
   - Disconnect Wi-Fi or turn on Airplane Mode.
   - Complete another game or mark a reminder as "Done".
   - Notice the UI immediately updates without spinner freezes. Data is saved in SQLite (`database.ts`) and queued in `sync_queue`.
3. **Step 3 (Persistence after restart):**
   - Force close the app and reopen it offline.
   - The completed reminder remains marked "Done", and the pending sync queue count in Settings remains intact.
4. **Step 4 (Network restoration):**
   - Reconnect Wi-Fi.
   - The sync engine pushes queued items to `POST /sync/push`.
   - The backend accepts the client-generated UUIDs idempotently (`synced`), preventing duplicate sessions.
