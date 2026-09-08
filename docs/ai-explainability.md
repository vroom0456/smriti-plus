# SMRITI+ — Adaptive AI Engines & Explainability Architecture
**Smart India Hackathon 2026 — Problem Statement SIH26003**

---

## 1. Ethical AI Principles in SMRITI+

1. **Rule-Based Baseline First:** All adaptations are governed by deterministic, transparent, and explainable rule engines (`difficulty_engine.py` and `assistance_engine.py`).
2. **Transparent Reasoning:** Every adaptation produces a plain-language explanation for both the elder and the caregiver.
3. **No Black-Box Scoring:** SMRITI+ never outputs pseudo-scientific "Cognitive Scores" or "Brain Age".
4. **Human Caregiver Override:** Explicit preferences set by the caregiver (e.g. assistance level, max choices, session length) always take precedence over automated algorithm recommendations.

---

## 2. Adaptive Difficulty Engine (`difficulty_engine.py`)

### 2.1 Baseline Algorithm
The difficulty engine operates on a clamped discrete scale from **Level 1 (easiest)** to **Level 5 (most challenging)**.

```python
# Adaptive progression rules
if accuracy >= 0.85 and response_time_ms <= target_time_ms:
    new_difficulty = min(5, current_level + 1)
    reason = f"Excellent recall ({int(accuracy*100)}%) and quick responses. Ready for a pleasant new step!"

elif accuracy < 0.50 or response_time_ms > target_time_ms * 1.5:
    new_difficulty = max(1, current_level - 1)
    reason = "Taking it slower today with a gentler pace and familiar items."

if consecutive_struggles >= 2:
    new_difficulty = max(1, current_level - 1)
    offer_easier_variant = True
```

### 2.2 Explainable AI Output Schema
```json
{
  "difficulty": 2,
  "reason": "This activity is a little easier today because your last activity took longer than usual. Let's take it slowly. ❤️",
  "previous_difficulty": 3,
  "input_metrics": {
    "accuracy": 0.45,
    "response_time_ms": 52000,
    "attempts": 2
  }
}
```

---

## 3. Adaptive Assistance & Struggle Detection Engine (`assistance_engine.py`)

Rather than only shifting difficulty levels, SMRITI+ adapts the entire scaffolding of the user experience:

| Behavioral Signal | Detected Condition | Adaptive Intervention |
| :--- | :--- | :--- |
| **Consecutive Inaccurate Attempts (≥ 2)** | Moderate Struggle | Choices reduced from **4 to 3**, visual hint enabled |
| **Severe Struggle (Accuracy < 40%, 3+ failures)** | Severe Struggle | Choices reduced to **2**, prominent highlight on answer, 2× time limit |
| **Session Duration > 15–20 minutes** | Fatigue / Attention Limit | Comfort Break modal triggered (`BreakModal.tsx`) |
| **Caregiver Preset = "High"** | Human Override | Enforces 3 choices and persistent voice guidance regardless of streak |

---

## 4. Stable Machine Learning Interface (`recommend(session_history)`)

The architecture cleanly decouples the decision engine from the user interface:
```python
def recommend(session_history: List[GameSessionMetrics]) -> RecommendationResult:
    """
    Stable interface. Currently evaluates rule-based heuristics.
    In future iterations, can invoke a trained scikit-learn or ONNX model
    without modifying API contracts or mobile app views.
    """
```
This guarantees long-term maintainability and regulatory compliance for MDoNER deployments.
