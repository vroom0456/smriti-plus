"""
SMRITI+ Backend — Unit Tests for Adaptive Difficulty Engine
"""

import pytest
from app.ai.difficulty_engine import DifficultyEngine, SessionInput


@pytest.fixture
def engine():
    return DifficultyEngine()


def test_empty_history_returns_default(engine):
    res = engine.recommend([], current_difficulty=1, target_time_ms=30000)
    assert res.difficulty == 1
    assert "No sessions yet" in res.reason


def test_increase_difficulty_after_high_accuracy(engine):
    # High-accuracy session
    history = [
        SessionInput(accuracy=0.90, response_time_ms=18000, completed=True, attempts=1, difficulty_level=2),
    ]
    res = engine.recommend(history, current_difficulty=2, target_time_ms=30000)
    assert res.difficulty == 3
    assert res.previous_difficulty == 2
    assert "Accuracy was 90%" in res.reason


def test_max_difficulty_clamping(engine):
    # Already at level 5 with high accuracy
    history = [
        SessionInput(accuracy=0.95, response_time_ms=15000, completed=True, attempts=1, difficulty_level=5),
    ]
    res = engine.recommend(history, current_difficulty=5, target_time_ms=30000)
    assert res.difficulty == 5
    assert res.previous_difficulty == 5


def test_decrease_difficulty_after_struggle(engine):
    # Two consecutive low-accuracy sessions
    history = [
        SessionInput(accuracy=0.35, response_time_ms=45000, completed=True, attempts=3, difficulty_level=3),
        SessionInput(accuracy=0.40, response_time_ms=42000, completed=True, attempts=2, difficulty_level=3),
    ]
    res = engine.recommend(history, current_difficulty=3, target_time_ms=30000)
    assert res.difficulty == 2
    assert res.previous_difficulty == 3
    assert res.offer_easier_variant is True


def test_min_difficulty_clamping(engine):
    # Already at level 1 with low accuracy
    history = [
        SessionInput(accuracy=0.30, response_time_ms=50000, completed=True, attempts=2, difficulty_level=1),
        SessionInput(accuracy=0.25, response_time_ms=50000, completed=True, attempts=2, difficulty_level=1),
    ]
    res = engine.recommend(history, current_difficulty=1, target_time_ms=30000)
    assert res.difficulty == 1
    assert res.previous_difficulty == 1
    assert res.offer_easier_variant is True
