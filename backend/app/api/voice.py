"""
SMRITI+ — Backend Voice Intelligence & Multilingual Intent API Router

Implements Sections 74–85, 96, 99:
- Server-side intent parsing with deterministic validation
- Prompt injection defense & untrusted input sanitization
- RBAC enforcement (voice respects identical permission matrices)
- Audit logging for all voice actions
- Privacy-first voice telemetry (no raw audio stored)
"""

from uuid import UUID
from datetime import datetime, timezone
import re
from typing import Dict, Any, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import AuditLog, User
from app.core.auth import get_current_user, CurrentUser, verify_elder_access
from app.api.schemas import (
    VoiceIntentParseRequest,
    VoiceIntentParseResponse,
    VoiceTelemetryRequest,
    VoiceTelemetryResponse,
)
from app.voice.orchestrator import VoiceOrchestrator
from app.voice.schemas import VoiceParseRequest as SmartVoiceParseRequest, VoiceParseResponse as SmartVoiceParseResponse
from app.voice.language_service import LanguageService

router = APIRouter(prefix="/voice", tags=["Voice Intelligence"])


# ──────────────────────────────────────────────
# PROMPT INJECTION DEFENSE & SANITIZATION
# ──────────────────────────────────────────────

INJECTION_PATTERNS = [
    r"ignore previous instructions",
    r"bypass security",
    r"drop database",
    r"delete all users",
    r"grant admin",
    r"system prompt",
]

def sanitize_and_check_injection(text: str) -> str:
    cleaned = text.strip()
    lower = cleaned.lower()
    for pattern in INJECTION_PATTERNS:
        if re.search(pattern, lower):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid speech instruction pattern detected."
            )
    return cleaned


# ──────────────────────────────────────────────
# SERVER-SIDE MULTILINGUAL INTENT PARSER
# ──────────────────────────────────────────────

def parse_server_intent(transcript: str, language: str) -> Dict[str, Any]:
    text = transcript.lower()

    # 1. Reminders
    if any(k in text for k in ["medicine", "pill", "dawa", "మందు", "দৰব", "மருந்து"]):
        date = "tomorrow" if any(d in text for d in ["repu", "రేపు", "kal", "कल", "tomorrow"]) else "today"
        time_match = re.search(r"(\d{1,2})\s*(am|pm|baje|o'clock|కి)?", text)
        time_val = f"{int(time_match.group(1)):02d}:00" if time_match else "08:00"

        return {
            "intent": "create_reminder",
            "category": "medication",
            "date": date,
            "time": time_val,
            "recurrence": "daily",
            "confidence": 0.94,
            "confirmation_required": True,
            "confirmation_prompt": f"I will remind you to take your medicine {date} at {time_val}. Is that right?",
            "missing_slots": [],
        }

    if any(k in text for k in ["water", "pani", "నీళ్లు", "पানী", "தண்ணீர்"]):
        return {
            "intent": "create_reminder",
            "category": "hydration",
            "date": "today",
            "time": "10:00",
            "recurrence": "every_2_hours",
            "confidence": 0.92,
            "confirmation_required": True,
            "confirmation_prompt": "I will remind you to drink water regularly. Is that right?",
            "missing_slots": [],
        }

    # 2. Family Call
    if any(k in text for k in ["call", "phone", "daughter", "son", "amma", "ravi", "ఫోన్", "फोन"]):
        target = "Daughter" if any(t in text for t in ["daughter", "కూతురు", "बेटी"]) else "Caregiver"
        return {
            "intent": "call_family",
            "target_person": target,
            "confidence": 0.95,
            "confirmation_required": True,
            "confirmation_prompt": f"Would you like me to call your {target}?",
            "missing_slots": [],
        }

    # 3. Game
    if any(k in text for k in ["game", "play", "puzzle", "ఆట", "खेल"]):
        return {
            "intent": "start_game",
            "confidence": 0.90,
            "confirmation_required": True,
            "confirmation_prompt": "Shall we play a gentle memory game together?",
            "missing_slots": [],
        }

    # 4. Fallback
    return {
        "intent": "unknown",
        "confidence": 0.55,
        "confirmation_required": False,
        "confirmation_prompt": f"I heard: '{transcript}'. Let's take our time, or choose an option on the screen.",
        "missing_slots": [],
    }


# ──────────────────────────────────────────────
# ENDPOINTS
# ──────────────────────────────────────────────

@router.post("/parse-intent", response_model=VoiceIntentParseResponse)
def parse_voice_intent(
    req: VoiceIntentParseRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Parse spoken transcript into canonical structured intent with RBAC verification.
    """
    verify_elder_access(req.elder_id, current_user, db)
    clean_text = sanitize_and_check_injection(req.transcript)

    parsed = parse_server_intent(clean_text, req.language)

    # Log to audit log
    audit = AuditLog(
        actor_id=current_user.user_id,
        action="voice_intent_parsed",
        target_id=req.elder_id,
        details={
            "intent": parsed["intent"],
            "language": req.language,
            "confidence": parsed["confidence"],
        },
    )
    db.add(audit)
    db.commit()

    return VoiceIntentParseResponse(
        intent=parsed["intent"],
        category=parsed.get("category"),
        date=parsed.get("date"),
        time=parsed.get("time"),
        recurrence=parsed.get("recurrence"),
        target_person=parsed.get("target_person"),
        confidence=parsed["confidence"],
        confirmation_required=parsed["confirmation_required"],
        confirmation_prompt=parsed["confirmation_prompt"],
        detected_language=req.language,
        missing_slots=parsed.get("missing_slots", []),
        safety_passed=True,
    )


@router.post("/smart-parse", response_model=SmartVoiceParseResponse)
def parse_smart_voice_intent(
    req: SmartVoiceParseRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Ultra-smart multilingual Indian voice parser supporting code-switching,
    Romanized speech, regional slang, multi-turn context, and confidence estimation.
    """
    verify_elder_access(req.elder_id, current_user, db)
    clean_text = sanitize_and_check_injection(req.transcript)
    req.transcript = clean_text

    result = VoiceOrchestrator.process_voice_input(req)

    # Audit log
    audit = AuditLog(
        actor_id=current_user.user_id,
        action="smart_voice_intent_parsed",
        target_id=req.elder_id,
        details={
            "intent": result.intent.value,
            "language": result.language,
            "confidence": result.confidence,
            "requires_confirmation": result.requires_confirmation,
        },
    )
    db.add(audit)
    db.commit()

    return result


@router.get("/capabilities")
def get_voice_capabilities():
    """
    Return server-backed honest registry of regional Indian language capabilities.
    """
    all_caps = LanguageService.get_capabilities()
    active_tts = [k for k, v in all_caps.items() if v.tts_supported]
    active_stt = [k for k, v in all_caps.items() if v.stt_supported]

    return {
        "supported_languages_count": len(all_caps),
        "active_tts_languages": active_tts,
        "active_stt_languages": active_stt,
        "offline_stt_supported": False,  # Truthful status: offline STT requires native on-device model
        "offline_tts_supported": True,   # Supported via on-device speech synth
        "policy": "Non-diagnostic, polite, single-question slot clarification",
        "languages": {k: v.model_dump() for k, v in all_caps.items()},
    }


@router.post("/telemetry", response_model=VoiceTelemetryResponse)
def log_voice_telemetry(
    req: VoiceTelemetryRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Privacy-first voice interaction metrics logging (no raw audio stored).
    """
    verify_elder_access(req.elder_id, current_user, db)

    audit = AuditLog(
        actor_id=current_user.user_id,
        action="voice_interaction_telemetry",
        target_id=req.elder_id,
        details={
            "intent": req.intent,
            "language": req.language,
            "confidence_bucket": req.confidence_bucket,
            "latency_ms": req.latency_ms,
            "fallback_used": req.fallback_used,
            "success": req.success,
        },
    )
    db.add(audit)
    db.commit()

    return VoiceTelemetryResponse(status="recorded")
