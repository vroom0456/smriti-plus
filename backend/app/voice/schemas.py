"""
SMRITI+ — Voice Intelligence Schemas

Defines canonical voice intents, entity structures, language capabilities,
and validated structured JSON contracts.
"""

from enum import Enum
from typing import Optional, List, Dict, Any, Literal
from uuid import UUID
from pydantic import BaseModel, Field


class VoiceIntent(str, Enum):
    PLAY_GAME = "PLAY_GAME"
    SHOW_REMINDERS = "SHOW_REMINDERS"
    CREATE_REMINDER = "CREATE_REMINDER"
    COMPLETE_REMINDER = "COMPLETE_REMINDER"
    SNOOZE_REMINDER = "SNOOZE_REMINDER"
    CANCEL_REMINDER = "CANCEL_REMINDER"
    CALL_FAMILY = "CALL_FAMILY"
    OPEN_MEMORY_BOX = "OPEN_MEMORY_BOX"
    SHOW_TODAY = "SHOW_TODAY"
    CHANGE_LANGUAGE = "CHANGE_LANGUAGE"
    CHANGE_VOICE = "CHANGE_VOICE"
    SLOW_DOWN = "SLOW_DOWN"
    SPEED_UP = "SPEED_UP"
    REPEAT = "REPEAT"
    STOP = "STOP"
    HELP = "HELP"
    GO_HOME = "GO_HOME"
    OPEN_SETTINGS = "OPEN_SETTINGS"
    START_BREAK = "START_BREAK"
    END_SESSION = "END_SESSION"
    AFFIRMATION = "AFFIRMATION"
    NEGATION = "NEGATION"
    UNKNOWN = "UNKNOWN"


class LanguageCapability(BaseModel):
    language_code: str
    display_name: str
    native_name: str
    text_supported: bool = True
    stt_supported: bool = True
    tts_supported: bool = True
    offline_stt_supported: bool = False
    offline_tts_supported: bool = False
    code_switch_supported: bool = True
    human_reviewed: bool = True
    pronunciation_reviewed: bool = True
    accent_support: List[str] = Field(default_factory=list)


class SpeechRecognitionProfile(BaseModel):
    language: str = "te-IN"
    accent: Optional[str] = "regional"
    speech_rate: float = 0.85
    elderly_mode: bool = True
    noise_level: Literal["low", "medium", "high"] = "medium"


class ExtractedEntities(BaseModel):
    category: Optional[str] = None  # medication, hydration, appointment, general
    date: Optional[str] = None      # ISO format YYYY-MM-DD or relative
    time: Optional[str] = None      # HH:MM 24-hr format
    recurrence: Optional[str] = None  # daily, once, every_2_hours
    target_person: Optional[str] = None
    target_relationship: Optional[str] = None
    game_category: Optional[str] = None
    target_language: Optional[str] = None
    speed_delta: Optional[float] = None
    raw_slot_values: Dict[str, Any] = Field(default_factory=dict)


class VoiceParseRequest(BaseModel):
    elder_id: UUID
    transcript: str
    language: str = "te-IN"
    current_screen: Optional[str] = "home"
    session_id: Optional[str] = None
    is_barge_in: bool = False
    client_event_id: Optional[str] = None


class VoiceParseResponse(BaseModel):
    intent: VoiceIntent
    language: str
    confidence: float
    entities: ExtractedEntities
    requires_confirmation: bool
    missing_entities: List[str] = Field(default_factory=list)
    confirmation_prompt: Optional[str] = None
    spoken_response: str
    action_plan: Optional[Dict[str, Any]] = None
    safety_passed: bool = True
    client_event_id: Optional[str] = None
