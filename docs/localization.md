# SMRITI+ — Regional Localization & NER Language Guide
**Smart India Hackathon 2026 — Problem Statement SIH26003**

---

## 1. Scope of Regional Support

SMRITI+ is specifically built for the **North Eastern Region (NER)** under the auspices of the Ministry of Development of North Eastern Region (MDoNER).

The platform provides complete UI translation parity across 3 verified languages:
1. **English (`en`)**: Universal fallback and standard administrative interface.
2. **Assamese (`as`)**: Primary regional language spoken across Assam and neighboring Brahmaputra valley.
3. **Bodo (`bodo`)**: 8th Schedule language widely spoken in the Bodoland Territorial Region (BTR) of Assam.

---

## 2. Zero Hardcoding Policy

- **100% of User-Facing Strings** are externalized into JSON resource files in `apps/mobile/src/i18n/`.
- **Automated Validation:** The CI/pre-commit script `scripts/check-translations.js` audits every key against `en.json`. If a single key is missing in `as.json` or `bodo.json`, the audit flags a warning or failure.

### Key Hierarchy
```text
app.*           App name, tagline, non-diagnostic disclaimer
nav.*           Accessible navigation labels (Home, Games, Reminders, Memories, etc.)
auth.*          Elder-friendly sign-in labels, PIN/OTP prompts
home.*          Time-of-day greetings, primary tile labels, streak counters
games.*         Instructions, encouragement messages, break prompts
reminders.*     Categories (medicine, water, meal), response confirmations
family.*        Contacts, relations, call action, memory box categories
caregiver.*     Dashboard metric labels, alerts, explanation cards
settings.*      Text size toggles, language selector, sync status
```

---

## 3. Cultural & Regional Personalization for NER

Cultural references in games and memory boxes are researched, respectful, and regionally grounded:

| Category | North Eastern Cultural Elements |
| :--- | :--- |
| **Flora & Fruits** | Kaji Nemu (Assam lemon), Jackfruit, Betel nut (*Tamul*), Red tea (*Lal cha*) |
| **Textiles & Handlooms** | Muga silk, Eri silk, Mekhela Sador, Gamosa, Dokhona (Bodo traditional dress) |
| **Household & Everyday** | Bamboo sieve (*Kula*), Japi (traditional hat), Bell metal plate (*Kahi*) |
| **Festivals & Music** | Rongali Bihu, Bwisagu (Bodo spring festival), Bamboo flute, Pepa, Dhol |
| **Landscapes** | Jorhat tea estates, Majuli river island, Brahmaputra ferry crossings |

---

## 4. Voice Interaction & Language Truthfulness

Per clinical and engineering guidelines:
- We **never claim speech recognition supports a regional language** unless officially verified on the client device platform.
- When an elder speaks in English or regional keywords ("water", "medicine", "game"), the system matches intents with high tolerance.
- For regional languages where device STT is unavailable, the user is offered immediate, large **touch alternatives** paired with spoken TTS prompts via `expo-speech`.
