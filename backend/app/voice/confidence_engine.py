"""
SMRITI+ — Confidence Estimation Engine

Calculates multi-factor confidence scores and applies the confidence decision matrix:
- >= 0.90: Execute or confirm
- 0.70–0.89: Ask focused, single-question clarification
- < 0.70: Gentle repeat request with touch fallback
"""

from typing import Dict, Any
from app.voice.schemas import VoiceIntent, ExtractedEntities


class ConfidenceEngine:
    HIGH_CONFIDENCE_THRESHOLD = 0.90
    MEDIUM_CONFIDENCE_THRESHOLD = 0.70

    @classmethod
    def evaluate(
        cls,
        intent: VoiceIntent,
        base_confidence: float,
        entities: ExtractedEntities,
        is_code_switched: bool = False,
    ) -> Dict[str, Any]:
        score = base_confidence

        # Bonus if required slots are populated
        if intent == VoiceIntent.CREATE_REMINDER:
            if entities.category and entities.time:
                score = min(1.0, score + 0.05)
            elif not entities.time and not entities.category:
                score = max(0.55, score - 0.20)
            elif not entities.time or not entities.category:
                score = max(0.72, score - 0.10)

        elif intent == VoiceIntent.CALL_FAMILY:
            if entities.target_person:
                score = min(1.0, score + 0.04)
            else:
                score = max(0.65, score - 0.15)

        # Categorize action tier
        if score >= cls.HIGH_CONFIDENCE_THRESHOLD:
            tier = "high"
            action = "proceed"
        elif score >= cls.MEDIUM_CONFIDENCE_THRESHOLD:
            tier = "medium"
            action = "clarify"
        else:
            tier = "low"
            action = "repeat"

        return {
            "confidence": round(score, 2),
            "tier": tier,
            "recommended_action": action,
        }
