# SMRITI+ — Accessibility & Inclusive Elderly UX Guide
**Smart India Hackathon 2026 — Problem Statement SIH26003**

---

## 1. Core Philosophy: "SMRITI+ Adapts to the Person"

Traditional applications expect the elderly user to learn modern digital navigation patterns. SMRITI+ reverses this relationship:
* **The system adapts to the person**, forgiving motor tremors, slower reaction times, reduced working memory, and changing visual acuity.
* **Non-Diagnostic & Non-Punitive:** The system never indicates that an elder "failed" or scored poorly. Instead, it offers calm encouragement, simplifies the interface dynamically, and offers comfort breaks.

---

## 2. Quantitative Accessibility Standards

| Parameter | SMRITI+ Standard | WCAG 2.1 Reference | Implementation in Code |
| :--- | :--- | :--- | :--- |
| **Minimum Touch Target** | **56 × 56 dp** (64–72 dp for primary actions) | Level AAA (Target Size 2.5.5: 44×44px) | `UIComponents.tsx`, `HomeScreen.tsx`, `FamilyCornerScreen.tsx` |
| **Touch Spacing** | **≥ 16 px** between interactive targets | Level AAA | `spacing.lg` (16px) & `spacing.xl` (24px) |
| **Elderly Body Text** | **≥ 20 px** with bold weights | Enhanced Text (1.4.3/1.4.12) | `typography.elderly.body` (20px, line height 28px) |
| **Elderly Headings** | **28 – 34 px** bold hierarchy | Level AA | `typography.elderly.h1` (32px), `h2` (26px) |
| **Color Contrast** | **≥ 7:1** against backgrounds | Level AAA Contrast (Enhanced 1.4.6) | Navy `#132A52` on Mint `#F2FAF8` (Contrast > 11:1) |
| **Icon Pairing** | **100% paired with visible text** | SC 1.1.1 Non-text Content | `TabIcon`, `IconTile`, `FamilyCard` (Zero icon-only buttons) |
| **Animations** | **Calm or Reduced Motion** | SC 2.3.3 Animation from Interactions | `animation_level` configurable to calm/none |

---

## 3. Cognitive Accessibility Patterns

### 3.1 One-Thing-At-A-Time Mental Model
Every elderly screen addresses three explicit questions:
1. **What is happening right now?** Clear, high-contrast banner (e.g., "Personalized Recommendation", "Today's Reminders").
2. **What should I do?** Exactly **ONE** primary task per screen (e.g., tapping "Done" on a single reminder, selecting an answer card).
3. **What happens next?** Immediate audio or visual feedback without disorienting modal overlays.

### 3.2 Maximum 4 Primary Choices
The elder's home screen limits choices to four large, color-coded, labeled tiles:
1. 🧠 **Play a Game** (`#0E8E8B` Teal)
2. ⏰ **Today's Reminders** (`#E8823C` Accent Orange)
3. 👨‍👩‍👧 **Family Corner** (`#1FA96B` Success Green)
4. ❤️ **My Memories** (`#132A52` Navy)

### 3.3 Dynamic Choice Reduction (Struggle Detection)
When the adaptive assistance engine detects consecutive struggles:
- 4-choice questions dynamically collapse to **3 choices**, then **2 choices**.
- Distractor items are removed, and a gentle visual hint is highlighted.
- Response time windows are extended by 1.5× to 2.0×.

### 3.4 Comfort Breaks
If a session exceeds the preferred length or if struggle persists across consecutive attempts:
- A gentle **BreakModal** appears: *"Would you like to take a little break and have a sip of water?"*
- Two large buttons: `[ ☕ Take a Break ]` or `[ ▶ Continue ]`.
- No negative scoring or timer pressure is applied.

---

## 4. Multimodal Accessibility (Voice + Touch Dual Access)

- **Persistent Voice Access:** A large microphone card is available at all times.
- **Transcript Verification:** Whenever voice input is captured, the recognized transcript is displayed on screen with explicit confirmation (`[ Yes ]` / `[ No ]`).
- **Touch Fallback Guarantee:** Voice is never the sole way to interact. Every voice-activated action has a corresponding large touch button.

---

## 5. Regional Language & High Legibility

- **Regional Fonts:** Assamese and Bodo scripts are rendered with extended line-height (`1.5`) to prevent script ascender/descender clipping.
- **Non-Technical Error States:** Technical codes (e.g., `500 Server Error`, `SQLite timeout`) are intercepted and transformed into reassuring messages:
  > *"We couldn't connect right now. That's okay — your information is safely saved on this phone. We'll try again later."*
