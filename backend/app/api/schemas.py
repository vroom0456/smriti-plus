"""
SMRITI+ Backend — Pydantic Schemas

Request/response models for all API endpoints.
Every endpoint has explicit Pydantic schemas per Section 7.
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal
from datetime import datetime
from uuid import UUID


# ──────────────────────────────────────────────
# AUTH
# ──────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None  # PIN for elderly, password for demo
    otp: Optional[str] = None       # OTP for caregiver/health_worker
    link_code: Optional[str] = None # Direct Flo-style access code for caregiver/health worker

class SignupRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    role: Literal["elderly", "caregiver", "health_worker"]
    email: Optional[str] = None
    phone: Optional[str] = None
    password: str = Field(..., min_length=4)
    language: str = Field(default="en")
    patient_link_code: Optional[str] = None  # Optional patient code at sign-up

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"

class LinkCaregiverRequest(BaseModel):
    link_code: str = Field(..., min_length=4, max_length=12)

class LinkCaregiverResponse(BaseModel):
    success: bool
    elder_name: str
    elder_id: UUID
    message: Optional[str] = "Caregiver successfully linked"

class LinkPatientRequest(BaseModel):
    link_code: str = Field(..., min_length=4, max_length=12)

class LinkPatientResponse(BaseModel):
    success: bool
    elder_name: str
    elder_id: UUID
    message: Optional[str] = "Patient successfully linked to cohort"


# ──────────────────────────────────────────────
# USER
# ──────────────────────────────────────────────

class UserResponse(BaseModel):
    id: UUID
    role: Literal["elderly", "caregiver", "health_worker"]
    name: str
    language: str
    phone: Optional[str] = None
    email: Optional[str] = None

    model_config = {"from_attributes": True}

class ElderlyProfileResponse(BaseModel):
    user_id: UUID
    caregiver_id: Optional[UUID] = None
    caregiver_name: Optional[str] = None
    text_size: str
    voice_sensitivity: float
    photo_url: Optional[str] = None

    model_config = {"from_attributes": True}

class ElderProfileSetupRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    language: str = Field(default="en", max_length=10)
    pin: str = Field(..., min_length=4, max_length=6)
    photo_url: Optional[str] = None


# ──────────────────────────────────────────────
# GAMES
# ──────────────────────────────────────────────

class GameResponse(BaseModel):
    id: UUID
    name: str
    category: str
    base_difficulty: int
    description: Optional[str] = None
    icon: Optional[str] = None
    target_time_ms: int
    min_difficulty: int
    max_difficulty: int
    is_active: bool

    model_config = {"from_attributes": True}

class GameSessionCreate(BaseModel):
    id: UUID  # client-generated
    game_id: UUID
    accuracy: float = Field(..., ge=0.0, le=1.0)
    response_time_ms: int = Field(..., ge=0)
    completed: bool = True
    attempts: int = Field(default=1, ge=1)
    difficulty_level: int = Field(..., ge=1)
    streak_at_time: int = Field(default=0, ge=0)
    device_id: Optional[str] = None

class DifficultyResponse(BaseModel):
    game_id: UUID
    current_level: int
    previous_level: Optional[int] = None
    reason: str
    encouragement: Optional[str] = None
    input_metrics: Optional[dict] = None

class GameSessionResponse(BaseModel):
    id: UUID
    elderly_id: UUID
    game_id: UUID
    accuracy: float
    response_time_ms: int
    completed: bool
    attempts: int
    difficulty_level: int
    streak_at_time: int
    created_at: datetime
    recommendation: Optional[DifficultyResponse] = None

    model_config = {"from_attributes": True}


# ──────────────────────────────────────────────
# REMINDERS
# ──────────────────────────────────────────────

class ReminderCreate(BaseModel):
    elderly_id: UUID
    category: Literal["medicine", "hydration", "meal", "activity", "appointment"]
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    scheduled_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")  # HH:MM
    recurrence_rule: Optional[str] = None

class ReminderUpdate(BaseModel):
    category: Optional[Literal["medicine", "hydration", "meal", "activity", "appointment"]] = None
    title: Optional[str] = Field(default=None, max_length=255)
    description: Optional[str] = None
    scheduled_time: Optional[str] = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    recurrence_rule: Optional[str] = None
    is_active: Optional[bool] = None

class ReminderResponse(BaseModel):
    id: UUID
    elderly_id: UUID
    category: str
    title: str
    description: Optional[str] = None
    scheduled_time: str
    recurrence_rule: Optional[str] = None
    is_active: bool
    created_by: Optional[UUID] = None
    created_at: datetime
    today_status: Optional[str] = None  # derived: done/missed/snoozed/pending

    model_config = {"from_attributes": True}

class ReminderLogCreate(BaseModel):
    id: UUID  # client-generated
    status: Literal["done", "missed", "snoozed"]
    responded_via: Literal["voice", "touch", "auto"]
    device_id: Optional[str] = None

class ReminderLogResponse(BaseModel):
    id: UUID
    reminder_id: UUID
    status: str
    responded_via: str
    responded_at: datetime

    model_config = {"from_attributes": True}


# ──────────────────────────────────────────────
# HOME SUMMARY
# ──────────────────────────────────────────────

class HomeSummaryResponse(BaseModel):
    greeting: str
    next_action: Optional[dict] = None  # {message, game_id, difficulty, reason}
    reminders_today_count: int
    reminders_pending_count: int
    current_streak: int
    care_stage: int = 1                  # 1, 2, 3 (Caregiver-controlled care stage)
    assistance_level: int = 1            # 1, 2, 3 (Temporary assistance level)
    effective_level: int = 1             # Effective UI level (1=Assistant, 2=Anchor, 3=Window)
    stage_label: str = "Level 1 — Assistant"


# ──────────────────────────────────────────────
# CAREGIVER DASHBOARD
# ──────────────────────────────────────────────

class DashboardAlert(BaseModel):
    type: Literal["warning", "info", "success"]
    message: str
    timestamp: Optional[datetime] = None

class DashboardStats(BaseModel):
    engagement_this_week: int  # sessions count
    reminder_adherence_pct: float
    missed_activities: int
    current_streak: int

class DashboardTrendPoint(BaseModel):
    date: str
    accuracy: Optional[float] = None
    completion_rate: Optional[float] = None
    sessions_count: int = 0

class CareStageUpdateRequest(BaseModel):
    care_stage: int = Field(..., ge=1, le=3)
    temporary_assistance_level: Optional[int] = Field(None, ge=1, le=3)

class CaregiverDashboardResponse(BaseModel):
    elder: UserResponse
    stats: DashboardStats
    trends: list[DashboardTrendPoint]
    alerts: list[DashboardAlert]
    recent_sessions: list[GameSessionResponse]
    reminders: list[ReminderResponse]
    care_stage: int = 1
    assistance_level: int = 1
    assistance_recommendation: Optional[dict] = None


# ──────────────────────────────────────────────
# HEALTH WORKER
# ──────────────────────────────────────────────

class ElderSummary(BaseModel):
    elder_id: UUID
    name: str
    engagement_score: float
    adherence_pct: float
    last_active: Optional[datetime] = None
    current_streak: int

class HealthWorkerGroupStats(BaseModel):
    group_id: UUID
    total_elders: int
    avg_engagement: float
    avg_adherence: float
    elders: list[ElderSummary]


# ──────────────────────────────────────────────
# SYNC
# ──────────────────────────────────────────────

class SyncEvent(BaseModel):
    client_event_id: UUID
    device_id: Optional[str] = None
    entity_type: Literal["game_session", "reminder_log", "reminder", "family_contact", "memory_item", "family_voice_message"]
    operation: Literal["created", "updated"]
    entity_id: UUID
    payload: dict

class SyncPushRequest(BaseModel):
    events: list[SyncEvent]

class SyncEventResult(BaseModel):
    client_event_id: UUID
    status: Literal["synced", "rejected", "conflict"]
    server_entity: Optional[dict] = None
    error: Optional[dict] = None

class SyncPushResponse(BaseModel):
    results: list[SyncEventResult]

class SyncPullResponse(BaseModel):
    events: list[dict]
    next_cursor: Optional[str] = None
    has_more: bool = False


# ──────────────────────────────────────────────
# PHASE 2: FAMILY CONTACTS
# ──────────────────────────────────────────────

class FamilyContactCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    relationship_label: str = Field(..., min_length=1, max_length=100)
    phone: str = Field(..., min_length=3, max_length=20)
    photo_url: Optional[str] = None
    is_primary: bool = False

class FamilyContactUpdate(BaseModel):
    name: Optional[str] = None
    relationship_label: Optional[str] = None
    phone: Optional[str] = None
    photo_url: Optional[str] = None
    is_primary: Optional[bool] = None

class FamilyContactResponse(BaseModel):
    id: UUID
    elderly_id: UUID
    name: str
    relationship_label: str
    phone: str
    photo_url: Optional[str] = None
    is_primary: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ──────────────────────────────────────────────
# PHASE 2: MEMORY ITEMS (DIGITAL MEMORY BOX)
# ──────────────────────────────────────────────

class MemoryItemCreate(BaseModel):
    type: Literal["photo", "audio", "video", "story", "person", "place", "music"]
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    media_url: str
    thumbnail_url: Optional[str] = None
    category: Literal["Family", "Friends", "Places", "Celebrations", "Memories", "Music", "Important People"] = "Family"

class MemoryItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    media_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    category: Optional[Literal["Family", "Friends", "Places", "Celebrations", "Memories", "Music", "Important People"]] = None

class MemoryItemResponse(BaseModel):
    id: UUID
    elderly_id: UUID
    type: str
    title: str
    description: Optional[str] = None
    media_url: str
    thumbnail_url: Optional[str] = None
    category: str
    created_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ──────────────────────────────────────────────
# PHASE 2: FAMILY VOICE MESSAGES
# ──────────────────────────────────────────────

class FamilyVoiceMessageCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    audio_url: str
    message_type: Literal["reminder", "greeting", "comfort", "story"] = "reminder"
    expires_at: Optional[datetime] = None

class FamilyVoiceMessageResponse(BaseModel):
    id: UUID
    elderly_id: UUID
    caregiver_id: Optional[UUID] = None
    title: str
    audio_url: str
    message_type: str
    created_at: datetime
    expires_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ──────────────────────────────────────────────
# PHASE 2: PERSONALIZATION PREFERENCES
# ──────────────────────────────────────────────

class PersonalizationPreferenceUpdate(BaseModel):
    preferred_game: Optional[str] = None
    preferred_session_length: Optional[int] = Field(None, ge=3, le=60)
    preferred_language: Optional[str] = None
    preferred_voice: Optional[str] = None
    assistance_level: Optional[Literal["minimal", "standard", "high", "maximum"]] = None
    animation_level: Optional[Literal["none", "calm", "standard"]] = None
    text_size: Optional[Literal["standard", "large", "extra_large"]] = None
    difficulty_preference: Optional[int] = Field(None, ge=1, le=5)

class PersonalizationPreferenceResponse(BaseModel):
    elderly_id: UUID
    preferred_game: str
    preferred_session_length: int
    preferred_language: str
    preferred_voice: str
    assistance_level: str
    animation_level: str
    text_size: str
    difficulty_preference: int
    updated_at: datetime

    model_config = {"from_attributes": True}


# ──────────────────────────────────────────────
# PHASE 2: ASSISTANCE EVALUATION
# ──────────────────────────────────────────────

class AssistanceEvaluationRequest(BaseModel):
    accuracy: float = Field(..., ge=0.0, le=1.0)
    response_time_ms: int = Field(..., ge=0)
    target_time_ms: int = Field(..., ge=1000)
    attempts: int = Field(1, ge=1)
    hesitation_detected: bool = False
    repeated_help_requests: int = Field(0, ge=0)
    consecutive_low_scores: int = Field(0, ge=0)
    session_duration_minutes: float = Field(0.0, ge=0.0)

class AssistanceEvaluationResponse(BaseModel):
    assistance_level: str
    num_choices: int
    instruction_mode: str
    offer_hint: bool
    allowed_time_multiplier: float
    suggest_break: bool
    break_reason: Optional[str] = None
    encouragement_message: str
    explanation_for_caregiver: str
    struggle_detected: bool
    signals: dict = {}


# ──────────────────────────────────────────────
# VOICE INTELLIGENCE & MULTILINGUAL SCHEMAS
# ──────────────────────────────────────────────

class VoiceIntentParseRequest(BaseModel):
    elder_id: UUID
    transcript: str = Field(..., min_length=1, max_length=1000)
    language: str = Field(default="en-IN")
    client_context: Optional[dict] = Field(default_factory=dict)

class VoiceIntentParseResponse(BaseModel):
    intent: str
    category: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    recurrence: Optional[str] = None
    target_person: Optional[str] = None
    confidence: float
    confirmation_required: bool
    confirmation_prompt: str
    detected_language: str
    missing_slots: list[str] = []
    safety_passed: bool = True

class VoiceTelemetryRequest(BaseModel):
    elder_id: UUID
    intent: str
    language: str
    confidence_bucket: str  # e.g. "high", "medium", "low"
    success: bool
    latency_ms: int
    fallback_used: bool = False

class VoiceTelemetryResponse(BaseModel):
    status: str = "recorded"


