"""
SMRITI+ Backend — Unit Tests for Adaptive Assistance & Struggle Detection Engine

Verifies Sections 25, 26, 27, 28, & 70 requirements:
- Multidimensional assistance adaptation
- Struggle signal evaluation (accuracy, response times, attempts, hesitation)
- Choice reduction (4 -> 3 -> 2)
- Break & comfort triggers
- Non-diagnostic guarantees
- Human caregiver overrides
"""

import pytest
from app.ai.assistance_engine import AssistanceEngine, AssistanceInputMetrics


@pytest.fixture
def engine():
    return AssistanceEngine()


def test_standard_performance_gives_standard_assistance(engine):
    metrics = AssistanceInputMetrics(
        accuracy=0.75,
        response_time_ms=12000,
        target_time_ms=15000,
        attempts=1,
    )
    result = engine.evaluate(metrics)
    assert result.assistance_level == "standard"
    assert result.num_choices == 4
    assert result.struggle_detected is False
    assert result.suggest_break is False


def test_struggle_detection_reduces_choices_and_offers_hint(engine):
    # Low accuracy, slow response, multiple attempts
    metrics = AssistanceInputMetrics(
        accuracy=0.40,
        response_time_ms=35000,
        target_time_ms=15000,
        attempts=2,
        hesitation_detected=True,
    )
    result = engine.evaluate(metrics)
    assert result.struggle_detected is True
    assert result.assistance_level in ("high", "maximum")
    assert result.num_choices <= 3
    assert result.offer_hint is True
    assert result.allowed_time_multiplier > 1.0
    assert "okay" in result.encouragement_message.lower() or "effort" in result.encouragement_message.lower()


def test_severe_struggle_reduces_to_two_choices(engine):
    # Repeated low scores
    metrics = AssistanceInputMetrics(
        accuracy=0.20,
        response_time_ms=40000,
        target_time_ms=15000,
        attempts=3,
        consecutive_low_scores=2,
    )
    result = engine.evaluate(metrics)
    assert result.assistance_level == "maximum"
    assert result.num_choices == 2
    assert result.instruction_mode == "guided"
    assert result.offer_hint is True
    assert result.suggest_break is True  # Suggests gentle comfort break
    assert "tea" in result.break_reason.lower() or "rest" in result.break_reason.lower()


def test_long_session_triggers_comfort_break(engine):
    metrics = AssistanceInputMetrics(
        accuracy=0.85,
        response_time_ms=10000,
        target_time_ms=15000,
        session_duration_minutes=18.0,
    )
    result = engine.evaluate(metrics)
    assert result.suggest_break is True
    assert "15+ minutes" in result.break_reason


def test_human_caregiver_override_precedence(engine):
    # User had strong metrics but caregiver explicitly requested "maximum" assistance
    metrics = AssistanceInputMetrics(
        accuracy=0.90,
        response_time_ms=8000,
        target_time_ms=15000,
        user_override_assistance="maximum",
    )
    result = engine.evaluate(metrics)
    assert result.assistance_level == "maximum"
    assert result.num_choices == 2
    assert result.numeric_level == 3
    assert "override_applied" in result.signals
    assert result.caregiver_recommendation["is_diagnostic"] is False


def test_numeric_assistance_levels_and_caregiver_explainability(engine):
    # Standard metrics -> Level 1 (Assistant)
    std_metrics = AssistanceInputMetrics(accuracy=0.80, response_time_ms=12000, target_time_ms=15000)
    std_res = engine.evaluate(std_metrics)
    assert std_res.numeric_level == 1
    assert "Assistant" in std_res.recommended_stage_label
    assert std_res.caregiver_recommendation["is_diagnostic"] is False

    # Struggle metrics -> Level 2 (Anchor)
    struggle_metrics = AssistanceInputMetrics(accuracy=0.45, response_time_ms=25000, target_time_ms=15000)
    struggle_res = engine.evaluate(struggle_metrics)
    assert struggle_res.numeric_level in (2, 3)
    assert struggle_res.caregiver_recommendation["is_diagnostic"] is False
    assert "simpler" in struggle_res.caregiver_recommendation["suggested_action"].lower()
    assert "authorized caregiver controls" in struggle_res.caregiver_recommendation["caregiver_disclaimer"].lower()


def test_calculate_assistance_level_rules():
    # Baseline
    assert AssistanceEngine.calculate_assistance_level(accuracy=0.85, response_time_ms=4000, target_time_ms=5000) == 1
    # Low accuracy (+1) -> Level 2
    assert AssistanceEngine.calculate_assistance_level(accuracy=0.40, response_time_ms=4000, target_time_ms=5000) == 2
    # Low accuracy (+1) & slow response (+1) -> Level 3
    assert AssistanceEngine.calculate_assistance_level(accuracy=0.40, response_time_ms=9000, target_time_ms=5000) == 3
    # Help requests (+1) & repeated attempts (+1) -> Level 3
    assert AssistanceEngine.calculate_assistance_level(accuracy=0.70, response_time_ms=4000, target_time_ms=5000, help_requests=4, repeated_attempts=3) == 3


def test_emotional_intelligence_never_says_wrong_or_failed():
    # Emotional layer never degrades the user
    for attempt in (1, 2, 3):
        msg_incorrect = AssistanceEngine.get_emotional_feedback(is_correct=False, attempt_number=attempt).lower()
        assert "wrong" not in msg_incorrect
        assert "failed" not in msg_incorrect
        assert "score decreased" not in msg_incorrect
        assert "incorrect" not in msg_incorrect

    msg_correct = AssistanceEngine.get_emotional_feedback(is_correct=True, attempt_number=1).lower()
    assert "wonderful" in msg_correct or "good" in msg_correct
