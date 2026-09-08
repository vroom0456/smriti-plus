# SMRITI+ — Privacy, Security & Data Minimization Architecture
**Smart India Hackathon 2026 — Problem Statement SIH26003**

---

## 1. Regulatory & Ethical Posture: Non-Diagnostic Framing

SMRITI+ is an assistive cognitive engagement and family connection platform. Under Indian Digital Personal Data Protection (DPDP) Act and international health software standards:
1. **Never a Diagnostic Device:** SMRITI+ does not diagnose, predict, or stage Alzheimer's disease, dementia, or any other neurodegenerative disease.
2. **Terminology Restrictions:**
   - Permitted: *Cognitive engagement*, *Personalized recommendation*, *Routine support*, *Engagement trends*.
   - Prohibited: *Dementia score*, *Cognitive test*, *Alzheimer's prediction*, *Diagnostic assessment*.

---

## 2. Data Minimization Principles

SMRITI+ adheres to strict data minimization:
1. **No Continuous Audio Streaming:** The voice subsystem only activates when the user deliberately presses the microphone button. Audio streams are converted to speech/text locally via on-device APIs (`expo-speech` / speech recognition); raw microphone audio is never uploaded to persistent cloud storage.
2. **No High-Stakes Profiling:** Performance on games is used exclusively to adapt difficulty (clamped [1–5]) and provide encouragement. No clinical profile or risk scoring is shared with third parties or insurers.
3. **Local-First Isolation:** When offline, game sessions and reminder logs remain within local encrypted SQLite on the user's phone until an authorized sync occurs.

---

## 3. Server-Side Role-Based Access Control (RBAC) & IDOR Defense

Client-side role claims (`user.role`, `elder_id`) are never trusted. All authorization is derived from cryptographically signed JWT tokens on the FastAPI backend:

```python
# app/api/dependencies.py
def require_elder_access(elder_id: UUID, current_user: User = Depends(get_current_active_user)):
    if current_user.role == "elderly" and current_user.id != elder_id:
        raise HTTPException(status_code=403, detail="Elders can only access their own profile")
    if current_user.role == "caregiver":
        # Verifies caregiver is actively linked to this elder in the database
        link = db.query(ElderlyProfile).filter_by(user_id=elder_id, caregiver_id=current_user.id).first()
        if not link:
            raise HTTPException(status_code=403, detail="Not authorized for this elder")
```

### Proved via Automated Security Tests (`backend/tests/test_rbac_security.py`):
* Caregiver A cannot access Elder B even if manually altering URL params (`/elders/{elder_b_id}`).
* Health Worker A cannot access aggregate stats for Group B.
* Elders cannot access caregiver or health-worker endpoints.

---

## 4. Immutable Consent & Audit Logging

### 4.1 Explicit Informed Consent
Before first use, every user completes an onboarding consent flow (`ConsentScreen.tsx`):
- Plain-language explanation of data usage.
- Explicit agreement logged in `consent_logs` table with `user_id`, `consent_version`, and UTC `accepted_at` timestamp.

### 4.2 Caregiver & Health Worker Audit Trail
All sensitive operational actions are recorded in the append-only `audit_logs` table:
- Caregiver linking / unlinking.
- Creation, modification, and deletion of reminders.
- Upload and deletion of family memory items.
- Health worker aggregate view generation and CSV exports.

---

## 5. Offline Queue Protection & Secure Storage

- **JWT Tokens:** Saved in `expo-secure-store` (iOS Keychain / Android Keystore), never in plain `AsyncStorage`.
- **Sync Queue:** Client-generated UUIDs ensure idempotency and prevent replay attacks.
- **Data Deletion:** Caregivers can delete individual memory items, voice notes, and reminders at any time with immediate cascading removal.
