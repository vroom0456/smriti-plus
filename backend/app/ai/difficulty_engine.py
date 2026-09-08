"""
SMRITI+ — Adaptive Difficulty Engine ("Personalized Recommendation")

Rule-based baseline implementing the exact logic from Section 8.
Exposes a single recommend() interface — swappable with a future
scikit-learn model behind the same interface.

SMRITI+ supports cognitive engagement and daily assistance;
it does not diagnose or treat dementia.
"""

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class SessionInput:
    """Input features for a single game session."""
    accuracy: float          # 0.0 – 1.0
    response_time_ms: int
    completed: bool
    attempts: int
    difficulty_level: int


@dataclass
class RecommendationResult:
    """
    Structured, inspectable recommendation per Section 8.
    The UI simplifies this for users; judges can inspect via API/debug panel.
    """
    difficulty: int
    reason: str
    previous_difficulty: int
    encouragement_message: Optional[str] = None
    offer_easier_variant: bool = False
    input_metrics: dict = field(default_factory=dict)


class DifficultyEngine:
    """
    Adaptive difficulty engine with swappable interface.
    Current implementation: transparent rule-based baseline (Section 8).
    Future: scikit-learn Decision Tree / Random Forest / Gradient Boosting.
    """

    def recommend(
        self,
        session_history: list[SessionInput],
        current_difficulty: int,
        target_time_ms: int,
        min_difficulty: int = 1,
        max_difficulty: int = 5,
    ) -> RecommendationResult:
        """
        Analyze session history and recommend next difficulty level.
        Returns a structured result with a plain-language explanation.
        """
        if not session_history:
            return RecommendationResult(
                difficulty=current_difficulty,
                reason="No sessions yet — starting at current difficulty.",
                previous_difficulty=current_difficulty,
                input_metrics={},
            )

        latest = session_history[-1]
        new_difficulty = current_difficulty
        reason_parts = []
        encouragement = None
        offer_easier = False

        # ── Core rule logic from Section 8 ──

        # Rule 1: Increase difficulty on strong performance
        if latest.accuracy >= 0.85 and latest.response_time_ms <= target_time_ms:
            new_difficulty += 1
            reason_parts.append(
                f"Accuracy was {latest.accuracy:.0%} and response time was below target."
            )

        # Rule 2: Decrease difficulty on weak performance
        elif latest.accuracy < 0.5 or latest.response_time_ms > target_time_ms * 1.5:
            new_difficulty -= 1
            if latest.accuracy < 0.5:
                reason_parts.append(f"Accuracy was {latest.accuracy:.0%}, which is below 50%.")
            if latest.response_time_ms > target_time_ms * 1.5:
                reason_parts.append(
                    f"Response time ({latest.response_time_ms}ms) exceeded 1.5× target ({target_time_ms}ms)."
                )
            encouragement = self._get_encouragement(latest.accuracy, latest.completed)

        else:
            # Middle range — maintain
            reason_parts.append(
                f"Performance was moderate (accuracy {latest.accuracy:.0%}, "
                f"time {latest.response_time_ms}ms) — maintaining current difficulty."
            )

        # Rule 3: Consecutive failures protection
        consecutive_failures = self._count_consecutive_failures(session_history)
        if consecutive_failures >= 2:
            new_difficulty = min(new_difficulty, current_difficulty - 1)
            offer_easier = True
            reason_parts.append(
                f"{consecutive_failures} sessions in a row had low accuracy — "
                f"difficulty reduced to help build confidence."
            )
            encouragement = encouragement or "You're doing great — let's try something a bit easier to build up."

        # ── Clamp to bounds (Section 8 requirement) ──
        new_difficulty = max(min_difficulty, min(max_difficulty, new_difficulty))

        # Build final reason
        if new_difficulty > current_difficulty:
            plain_reason = "Your next game is a little harder because you did really well!"
        elif new_difficulty < current_difficulty:
            plain_reason = "Your next game is a bit easier today — take it at your own pace."
        else:
            plain_reason = "Your next game stays at the same level — keep going!"

        return RecommendationResult(
            difficulty=new_difficulty,
            reason=" ".join(reason_parts) if reason_parts else plain_reason,
            previous_difficulty=current_difficulty,
            encouragement_message=encouragement,
            offer_easier_variant=offer_easier,
            input_metrics={
                "accuracy": latest.accuracy,
                "response_time_ms": latest.response_time_ms,
                "attempts": latest.attempts,
                "completed": latest.completed,
                "consecutive_failures": consecutive_failures,
            },
        )

    def _count_consecutive_failures(self, history: list[SessionInput]) -> int:
        """Count consecutive sessions with accuracy < 0.5 from the end."""
        count = 0
        for session in reversed(history):
            if session.accuracy < 0.5:
                count += 1
            else:
                break
        return count

    def _get_encouragement(self, accuracy: float, completed: bool) -> str:
        """Generate a kind, non-judgmental encouragement message."""
        if not completed:
            return "No worries — every try counts! Let's try a gentler one next."
        if accuracy < 0.3:
            return "That was a tough one! Let's try something a bit easier."
        return "You're making progress! Let's keep building those skills."


    def get_rolling_average(self, history: list[SessionInput], window: int = 5) -> dict:
        """Calculate rolling average of last N sessions for trend analysis."""
        recent = history[-window:] if len(history) >= window else history
        if not recent:
            return {"avg_accuracy": 0.0, "avg_response_time_ms": 0, "sessions_count": 0}

        return {
            "avg_accuracy": sum(s.accuracy for s in recent) / len(recent),
            "avg_response_time_ms": int(sum(s.response_time_ms for s in recent) / len(recent)),
            "sessions_count": len(recent),
        }


# Module-level singleton
difficulty_engine = DifficultyEngine()
