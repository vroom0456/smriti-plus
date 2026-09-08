"""
SMRITI+ — Adaptive Assistance & Struggle Detection Engine

Implements Sections 25, 26, 27, 28, & 70 of the Master Build Specification:
- Multidimensional assistance adaptation (not just difficulty)
- Behavioral struggle detection (accuracy, response times, attempts, hesitation)
- Choice reduction (4 -> 3 -> 2 options)
- Calm instruction simplification & optional visual hints
- Gentle break & comfort triggers
- Strict non-diagnostic explainability with human overrides
"""

from dataclasses import dataclass, field
from typing import Optional, Literal


@dataclass
class AssistanceInputMetrics:
    accuracy: float                       # 0.0 – 1.0 in current session
    response_time_ms: int
    target_time_ms: int
    attempts: int = 1
    hesitation_detected: bool = False     # Pausing before first touch
    repeated_help_requests: int = 0
    consecutive_low_scores: int = 0
    session_duration_minutes: float = 0.0
    user_override_assistance: Optional[str] = None  # Human caregiver override


@dataclass
class AssistanceRecommendation:
    assistance_level: Literal["minimal", "standard", "high", "maximum"]
    num_choices: int                      # 2, 3, or 4 options
    instruction_mode: Literal["standard", "simplified", "guided"]
    offer_hint: bool
    allowed_time_multiplier: float        # e.g., 1.0x, 1.5x, 2.0x of target time
    suggest_break: bool
    break_reason: Optional[str]
    encouragement_message: str
    explanation_for_caregiver: str
    struggle_detected: bool
    numeric_level: int = 1                # 1 (Assistant), 2 (Anchor), 3 (Window)
    recommended_stage_label: str = "Level 1 — Assistant"
    caregiver_recommendation: dict = field(default_factory=dict)
    signals: dict = field(default_factory=dict)


class AssistanceEngine:
    """
    Rule-based Adaptive Assistance Engine with transparent explainability.
    SMRITI+ supports cognitive engagement and daily assistance;
    it does not diagnose or treat dementia.
    """

    def evaluate(self, metrics: AssistanceInputMetrics) -> AssistanceRecommendation:
        # 1. Human Override takes precedence if specified by caregiver
        if metrics.user_override_assistance in ("minimal", "standard", "high", "maximum"):
            level = metrics.user_override_assistance
            choices = {"minimal": 4, "standard": 4, "high": 3, "maximum": 2}[level]
            num_lvl = {"minimal": 1, "standard": 1, "high": 2, "maximum": 3}[level]
            stage_labels = {
                1: "Level 1 — Assistant (Independence)",
                2: "Level 2 — Anchor (Reduced Cognitive Load)",
                3: "Level 3 — Window (Comfort & Orientation)",
            }
            return AssistanceRecommendation(
                assistance_level=level,  # type: ignore
                num_choices=choices,
                instruction_mode="guided" if level == "maximum" else "simplified" if level == "high" else "standard",
                offer_hint=level in ("high", "maximum"),
                allowed_time_multiplier=2.0 if level == "maximum" else 1.5 if level == "high" else 1.0,
                suggest_break=False,
                break_reason=None,
                encouragement_message="Let's enjoy this activity at your preferred pace. ❤️",
                explanation_for_caregiver="Assistance settings actively guided by caregiver preference override.",
                struggle_detected=False,
                numeric_level=num_lvl,
                recommended_stage_label=stage_labels[num_lvl],
                caregiver_recommendation={
                    "headline": "Caregiver Override Active",
                    "summary": f"Operating at {stage_labels[num_lvl]} per caregiver configuration.",
                    "signals_observed": ["Caregiver direct configuration"],
                    "suggested_action": "Assistance settings controlled by authorized caregiver.",
                    "is_diagnostic": False,
                    "caregiver_disclaimer": "SMRITI+ observes interaction patterns to recommend appropriate interface assistance. The authorized caregiver controls the care stage.",
                    "suggested_level": num_lvl,
                },
                signals={"override_applied": True},
            )

        # 2. Behavioral signal extraction
        struggle = False
        reasons = []

        is_low_accuracy = metrics.accuracy < 0.50
        is_slow_response = metrics.response_time_ms > (metrics.target_time_ms * 1.5)
        is_multiple_attempts = metrics.attempts >= 2
        is_repeated_failures = metrics.consecutive_low_scores >= 2
        is_long_session = metrics.session_duration_minutes >= 15.0

        if is_low_accuracy:
            struggle = True
            reasons.append("accuracy was below 50%")
        if is_slow_response:
            struggle = True
            reasons.append("response pace was relaxed (>1.5x target)")
        if is_multiple_attempts or metrics.hesitation_detected:
            struggle = True
            reasons.append("multiple tries or hesitation noticed")
        if metrics.repeated_help_requests >= 3:
            struggle = True
            reasons.append(f"{metrics.repeated_help_requests} help requests noticed")

        # 3. Determine Assistance Level & Choice Count
        if is_repeated_failures or (is_low_accuracy and is_slow_response and is_multiple_attempts):
            level = "maximum"
            num_choices = 2
            instruction_mode = "guided"
            offer_hint = True
            time_multiplier = 2.0
            encouragement = "That's okay ❤️ Let's take our time together. You are doing well."
            numeric_level = 3
            stage_label = "Level 3 — Window (Comfort & Orientation)"
        elif struggle or metrics.consecutive_low_scores >= 1:
            level = "high"
            num_choices = 3
            instruction_mode = "simplified"
            offer_hint = True
            time_multiplier = 1.5
            encouragement = "Good effort! Here is an easier option so we can enjoy the game."
            numeric_level = 2
            stage_label = "Level 2 — Anchor (Reduced Cognitive Load)"
        elif metrics.accuracy >= 0.85 and metrics.response_time_ms <= metrics.target_time_ms:
            level = "minimal"
            num_choices = 4
            instruction_mode = "standard"
            offer_hint = False
            time_multiplier = 1.0
            encouragement = "Wonderful! Your focus is sharp and calm."
            numeric_level = 1
            stage_label = "Level 1 — Assistant (Independence)"
        else:
            level = "standard"
            num_choices = 4
            instruction_mode = "standard"
            offer_hint = False
            time_multiplier = 1.2
            encouragement = "Nice job! Keep going at your own comfortable pace."
            numeric_level = 1
            stage_label = "Level 1 — Assistant (Independence)"

        # 4. Break & Comfort Assessment (Section 28)
        suggest_break = False
        break_reason = None

        if is_long_session:
            suggest_break = True
            break_reason = "You have engaged for 15+ minutes today. Resting helps you stay refreshed!"
        elif is_repeated_failures and is_slow_response:
            suggest_break = True
            break_reason = "Activities are best enjoyed when relaxed. Would you like a warm cup of tea or a short rest?"

        explanation = (
            f"Assistance tuned to '{level}' mode ({num_choices} choices) because "
            + (", ".join(reasons) if reasons else "user is engaged comfortably")
            + ". Non-evaluative cognitive engagement support."
        )

        caregiver_rec = {
            "headline": "Personalized Assistance Recommendation",
            "summary": (
                "The user appears to be experiencing increased interaction difficulty. Consider enabling a simpler assistance mode."
                if struggle
                else "The user is engaging comfortably at the current interaction level."
            ),
            "signals_observed": reasons if reasons else ["Comfortable pacing and response accuracy"],
            "suggested_action": (
                "Consider using a simpler activity mode (Level 2: Anchor or Level 3: Window) during upcoming sessions."
                if struggle
                else "Keep current mode."
            ),
            "is_diagnostic": False,
            "caregiver_disclaimer": "SMRITI+ observes interaction patterns to recommend appropriate interface assistance. The authorized caregiver controls the care stage.",
            "suggested_level": numeric_level,
        }

        return AssistanceRecommendation(
            assistance_level=level,  # type: ignore
            num_choices=num_choices,
            instruction_mode=instruction_mode,  # type: ignore
            offer_hint=offer_hint,
            allowed_time_multiplier=time_multiplier,
            suggest_break=suggest_break,
            break_reason=break_reason,
            encouragement_message=encouragement,
            explanation_for_caregiver=explanation,
            struggle_detected=struggle,
            numeric_level=numeric_level,
            recommended_stage_label=stage_label,
            caregiver_recommendation=caregiver_rec,
            signals={
                "accuracy": metrics.accuracy,
                "response_time_ms": metrics.response_time_ms,
                "consecutive_low_scores": metrics.consecutive_low_scores,
                "session_minutes": metrics.session_duration_minutes,
            },
        )

    @staticmethod
    def calculate_assistance_level(
        accuracy: float,
        response_time_ms: float,
        target_time_ms: float,
        help_requests: int = 0,
        repeated_attempts: int = 0,
        task_abandoned: bool = False,
    ) -> int:
        """
        Pure rule-based interaction difficulty calculation (Section 13).
        Never evaluates medical disease progression; observes interaction load only.
        """
        assistance = 1

        if accuracy < 0.50:
            assistance += 1
        if target_time_ms > 0 and response_time_ms > (target_time_ms * 1.5):
            assistance += 1
        if help_requests >= 3:
            assistance += 1
        if repeated_attempts >= 3 or task_abandoned:
            assistance += 1

        return min(assistance, 3)

    @staticmethod
    def get_emotional_feedback(is_correct: bool, attempt_number: int = 1) -> str:
        """
        Emotional Intelligence Layer:
        Never says 'Wrong answer' or 'You failed' or 'Score decreased'.
        Provides positive, comforting, dignity-preserving encouragement.
        """
        if is_correct:
            if attempt_number == 1:
                return "Wonderful! You found it! 🌟"
            return "Good job! You solved it! 😊"
        else:
            if attempt_number <= 1:
                return "That's okay. Let's try another one together. ❤️"
            elif attempt_number == 2:
                return "Good try! Let's take it slowly. Take your time."
            else:
                return "Let's make this one a little easier so we can enjoy it together. 🌸"
