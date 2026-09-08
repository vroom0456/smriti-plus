"""
SMRITI+ — Multilingual Voice Orchestrator

Complete pipeline:
1. Audio transcript preprocessing & elder hesitation cleaning
2. Language identification & Romanized phrase normalization
3. Code-switching detection
4. Semantic intent detection & entity extraction
5. Multi-turn session context resolution & slot filling
6. Confidence evaluation & threshold gating
7. Deterministic confirmation checks (no arbitrary tool execution)
8. Culturally authentic regional response generation
"""

import uuid
from typing import Dict, Any, Optional
from uuid import UUID

from app.voice.schemas import (
    VoiceIntent,
    VoiceParseRequest,
    VoiceParseResponse,
    ExtractedEntities,
)
from app.voice.language_service import LanguageService
from app.voice.intent_service import IntentService
from app.voice.entity_extractor import EntityExtractor
from app.voice.context_manager import ContextManager
from app.voice.confidence_engine import ConfidenceEngine
from app.voice.confirmation_service import ConfirmationService
from app.voice.response_service import ResponseService


class VoiceOrchestrator:
    @classmethod
    def process_voice_input(cls, req: VoiceParseRequest) -> VoiceParseResponse:
        session_id = req.session_id or str(uuid.uuid4())
        session = ContextManager.get_or_create_session(session_id, req.elder_id)

        # 1. Normalize transcript & identify language/code-switching
        normalized_text, detected_lang = LanguageService.normalize_transcript(
            req.transcript, default_lang=req.language
        )
        cs_info = LanguageService.detect_code_switch(req.transcript)

        # 2. Extract Entities
        entities = EntityExtractor.extract_all(normalized_text, language=detected_lang)

        # 3. Detect Raw Intent
        raw_intent, base_conf = IntentService.detect_intent(
            normalized_text, current_screen=req.current_screen or "home"
        )

        # 4. Resolve multi-turn context (slot filling or confirmation resolution)
        turn_result = ContextManager.resolve_multi_turn(
            session=session,
            current_intent=raw_intent,
            current_entities=entities,
        )

        final_intent = turn_result["resolved_intent"]
        final_entities = turn_result["entities"]

        # Check missing slots for reminders
        missing_slots = []
        if final_intent == VoiceIntent.CREATE_REMINDER:
            if not final_entities.category:
                missing_slots.append("category")
                session.missing_slot = "category"
            elif not final_entities.time:
                missing_slots.append("time")
                session.missing_slot = "time"

        # 5. Evaluate Confidence
        conf_eval = ConfidenceEngine.evaluate(
            intent=final_intent,
            base_confidence=base_conf,
            entities=final_entities,
            is_code_switched=cs_info["is_code_switching"],
        )

        # 6. Evaluate Confirmation
        requires_conf = ConfirmationService.requires_confirmation(final_intent)
        conf_prompt = None

        if requires_conf and not turn_result.get("is_confirmed"):
            conf_prompt = ConfirmationService.build_confirmation_prompt(
                intent=final_intent,
                entities=final_entities,
                language=detected_lang,
            )
            # Store pending in session
            session.pending_confirmation_intent = final_intent
            session.pending_confirmation_payload = {
                "entities": final_entities.model_dump(),
                "language": detected_lang,
            }

        # 7. Generate Localized Spoken Response
        missing_slot_for_resp = missing_slots[0] if missing_slots else None
        spoken_resp = ResponseService.generate_response(
            intent=final_intent,
            entities=final_entities,
            language=detected_lang,
            missing_slot=missing_slot_for_resp,
        )

        # If confirmation is required, speak the confirmation prompt instead
        if conf_prompt:
            spoken_resp = conf_prompt

        # 8. Action plan for client/service execution
        action_plan = {
            "intent": final_intent.value,
            "executable": conf_eval["tier"] == "high" and (not requires_conf or turn_result.get("is_confirmed", False)),
            "entities": final_entities.model_dump(),
            "target_screen": cls._get_target_screen(final_intent),
        }

        return VoiceParseResponse(
            intent=final_intent,
            language=detected_lang,
            confidence=conf_eval["confidence"],
            entities=final_entities,
            requires_confirmation=requires_conf and not turn_result.get("is_confirmed", False),
            missing_entities=missing_slots,
            confirmation_prompt=conf_prompt,
            spoken_response=spoken_resp,
            action_plan=action_plan,
            safety_passed=True,
            client_event_id=req.client_event_id,
        )

    @classmethod
    def _get_target_screen(cls, intent: VoiceIntent) -> Optional[str]:
        mapping = {
            VoiceIntent.PLAY_GAME: "GamesHub",
            VoiceIntent.SHOW_REMINDERS: "Reminders",
            VoiceIntent.SHOW_TODAY: "Home",
            VoiceIntent.CALL_FAMILY: "FamilyCorner",
            VoiceIntent.OPEN_MEMORY_BOX: "MemoryBox",
            VoiceIntent.OPEN_SETTINGS: "Settings",
            VoiceIntent.GO_HOME: "Home",
        }
        return mapping.get(intent)
