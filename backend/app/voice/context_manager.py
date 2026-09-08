"""
SMRITI+ — Multi-Turn Conversation Context Manager

Maintains short-term conversational session state:
- Slot filling (e.g., Turn 1 specifies time -> Turn 2 specifies medication -> combined!)
- Two-step confirmation pairing (affirmation/negation resolved against pending action)
- Short-term session expiration (5 minutes inactivity cleanup)
"""

from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional
from uuid import UUID
from app.voice.schemas import VoiceIntent, ExtractedEntities


class ConversationSession:
    def __init__(self, session_id: str, elder_id: UUID):
        self.session_id = session_id
        self.elder_id = elder_id
        self.last_intent: Optional[VoiceIntent] = None
        self.accumulated_entities: ExtractedEntities = ExtractedEntities()
        self.pending_confirmation_intent: Optional[VoiceIntent] = None
        self.pending_confirmation_payload: Optional[Dict[str, Any]] = None
        self.missing_slot: Optional[str] = None
        self.last_interaction: datetime = datetime.now(timezone.utc)

    def is_expired(self, max_minutes: int = 5) -> bool:
        now = datetime.now(timezone.utc)
        return (now - self.last_interaction) > timedelta(minutes=max_minutes)

    def touch(self):
        self.last_interaction = datetime.now(timezone.utc)


class ContextManager:
    _sessions: Dict[str, ConversationSession] = {}

    @classmethod
    def get_or_create_session(cls, session_id: str, elder_id: UUID) -> ConversationSession:
        if session_id in cls._sessions:
            sess = cls._sessions[session_id]
            if not sess.is_expired():
                sess.touch()
                return sess

        # New or expired session
        sess = ConversationSession(session_id=session_id, elder_id=elder_id)
        cls._sessions[session_id] = sess
        return sess

    @classmethod
    def resolve_multi_turn(
        cls,
        session: ConversationSession,
        current_intent: VoiceIntent,
        current_entities: ExtractedEntities,
    ) -> Dict[str, Any]:
        """
        Merges current turn with short-term context.
        Handles:
        1. Confirmation of pending intent
        2. Slot filling for previously incomplete intent
        """
        # 1. Affirmation handling
        if current_intent == VoiceIntent.AFFIRMATION and session.pending_confirmation_intent:
            confirmed_intent = session.pending_confirmation_intent
            payload = session.pending_confirmation_payload or {}
            # Clear pending
            session.pending_confirmation_intent = None
            session.pending_confirmation_payload = None
            return {
                "resolved_intent": confirmed_intent,
                "is_confirmed": True,
                "entities": session.accumulated_entities,
                "payload": payload,
            }

        # 2. Negation handling
        if current_intent == VoiceIntent.NEGATION and session.pending_confirmation_intent:
            session.pending_confirmation_intent = None
            session.pending_confirmation_payload = None
            return {
                "resolved_intent": VoiceIntent.CANCEL_REMINDER,
                "is_cancelled": True,
                "entities": ExtractedEntities(),
                "payload": {},
            }

        # 3. Slot filling if previous intent was waiting for a category or time
        if session.missing_slot and session.last_intent == VoiceIntent.CREATE_REMINDER:
            if current_entities.category:
                session.accumulated_entities.category = current_entities.category
            if current_entities.time:
                session.accumulated_entities.time = current_entities.time
            if current_entities.date:
                session.accumulated_entities.date = current_entities.date

            session.missing_slot = None
            return {
                "resolved_intent": VoiceIntent.CREATE_REMINDER,
                "is_confirmed": False,
                "entities": session.accumulated_entities,
                "payload": {},
            }

        # 4. Standard new turn: update state
        session.last_intent = current_intent
        session.accumulated_entities = current_entities
        return {
            "resolved_intent": current_intent,
            "is_confirmed": False,
            "entities": current_entities,
            "payload": {},
        }
