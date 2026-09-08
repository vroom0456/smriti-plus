# SMRITI+ — Live Demo Script for Judges
**Smart India Hackathon 2026 — Problem Statement SIH26003**

> **Clinical Disclaimer:**  
> SMRITI+ supports cognitive engagement and daily assistance; it does not diagnose or treat dementia.

---

## Demo Overview & Seeded Accounts

The platform comes pre-seeded with deterministic accounts covering all three user roles:

| Role | Email / Phone | PIN / Password | Persona Context |
| :--- | :--- | :--- | :--- |
| **Elderly** | `elder.demo@smriti.local` | `1234` | Bhaben Barua (Age 72, Guwahati, mild cognitive challenges) |
| **Caregiver** | `caregiver.demo@smriti.local` | `demo123` | Priya Barua (Daughter, manages Bhaben's schedule & medications) |
| **Health Worker**| `worker.demo@smriti.local` | `demo123` | Anamika Das (ASHA Community Worker, Jalukbari Sub-Centre circle) |

---

## Act 1: The Elder Journey (Calm, Dignified, Accessible)

1. **Sign In:**
   - Launch app or navigate to login.
   - Tap the pre-filled **"Elder Demo"** button (or sign in with `elder.demo@smriti.local` / PIN `1234`).
2. **Home Screen First Impression:**
   - Notice the time-of-day greeting ("Good morning, Bhaben") in large 34px typography.
   - Observe the **"Personalized Recommendation"** card computed by the rule-based AI engine: suggests the optimal cognitive game based on previous session accuracy.
   - Observe the 4 large, high-contrast tiles (Play a Game, Reminders, Talk to SMRITI+, Call Family) with 56dp+ touch targets.
3. **Play a Game:**
   - Tap **"Play a Game"** → Select **"Memory Matching"**.
   - Note the culturally relevant NER themes (Assam Tea, Lotus, Bamboo, Dhol Drum).
   - Match the card pairs. On completion, observe the encouraging summary card:
     - Accuracy percentage, response time, streak counter.
     - Note the encouraging, non-evaluative message ("Wonderful! Every game makes your memory stronger!").
4. **Reminders & One-Tap Adherence:**
   - Tap **"Reminders"** from bottom navigation.
   - See the chronological list of today's reminders (Morning Medicine, Drink Water).
   - Tap **"Done ✓"** on the hydration reminder. The UI responds instantly, and adherence is recorded in local SQLite.

---

## Act 2: Multilingual Voice Assistant & Family Help

1. **Voice Assistant:**
   - From Elder Home, tap **"Talk to SMRITI+"**.
   - Tap the large pulsating microphone or tap a quick-touch action like **"I Drank Water"**.
   - The app speaks a clear audio response using `expo-speech` and displays the transcribed confirmation card.
   - Tap **"✓ Yes, Record It"** to confirm.
2. **Family Calling & Emergency Support:**
   - Tap **"Call Family"**.
   - Displays daughter Priya Barua with one-tap phone calling, emergency 108 shortcut, and the 6-character Caregiver Link Code (`SMR-842`).

---

## Act 3: Caregiver Dashboard & Proactive Monitoring

1. **Switch to Caregiver Account:**
   - Tap **Settings** → **Sign Out**.
   - Tap **"Caregiver Demo"** (`caregiver.demo@smriti.local` / `demo123`).
2. **Live Adherence & Activity Trends:**
   - Notice the top metric cards: 84% Adherence, Current 6-day streak, 12 sessions completed this week.
   - Review the **14-Day Activity Trend Bar Chart** reflecting real recorded game sessions.
   - Check the **Active Alerts Feed**: highlights missed reminders or drops in engagement so family can step in gently.
3. **Manage Reminders:**
   - Navigate to **"Reminders"** tab.
   - Tap **"+ New"** to schedule a new medication or hydration routine.
   - Enter reminder title, select category icon, specify time, and tap **"Save Reminder"**.

---

## Act 4: Community Health Worker (ASHA Cohort Overview)

1. **Switch to Health Worker:**
   - Sign in as `worker.demo@smriti.local`.
2. **Sub-Centre Cohort Overview:**
   - Displays all registered elders in the Jalukbari Circle.
   - Sort by **Adherence** to bring elders needing follow-ups to the top.
   - Notice the high-risk alert flags on elders with adherence < 70%.
3. **CSV Export for Health Centers:**
   - Tap **"📥 Export CSV"** in the header.
   - Generates client-side CSV table ready to share or archive for rural health reporting.

---

## Act 5: Offline-First Reliability & Seamless Sync

1. **Simulate Offline Mode:**
   - On the device, enable Airplane Mode (or disable Wi-Fi/cellular).
   - Play a game session or confirm a reminder.
   - Notice the app continues smoothly without any blocking loading spinners or crashes.
2. **Automatic Sync:**
   - In Settings, inspect **"Offline Sync Status"** — see `Pending Events: 1`.
   - Re-enable connectivity. Tap **"Sync Now"**.
   - Sync engine batches the event to `POST /sync/push`, gets `status: "synced"`, updates SQLite, and updates the caregiver dashboard!
