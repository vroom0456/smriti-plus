"""
SMRITI+ — Smart Confirmation Service

Rules:
- Low-risk intents (e.g. Navigation, Today, Games, Slower) execute immediately without confirmation.
- High-impact intents (Create Reminder, Cancel Reminder, Call Family) require localized confirmation.
- Formulates single-sentence, respectful localized confirmation prompts.
"""

from typing import Tuple, Optional
from app.voice.schemas import VoiceIntent, ExtractedEntities


CONFIRMATION_TEMPLATES = {
    "te-IN": {
        "call_family": "మీరు {person}కి కాల్ చేయాలనుకుంటున్నారా?",
        "create_reminder": "నేను {date} {time}కి {category} రిమైండర్ పెట్టనా?",
        "cancel_reminder": "ఈ రిమైండర్‌ను రద్దు చేయమంటారా?",
    },
    "hi-IN": {
        "call_family": "क्या आप {person} को फोन मिलाना चाहते हैं?",
        "create_reminder": "क्या मैं {date} को {time} बजे {category} का रिमाइंडर लगा दूँ?",
        "cancel_reminder": "क्या आप इस रिमाइंडर को हटाना चाहते हैं?",
    },
    "ta-IN": {
        "call_family": "நீங்கள் {person}-க்கு கால் செய்ய விரும்புகிறீர்களா?",
        "create_reminder": "{date} {time}-க்கு {category} நினைவூட்டல் வைக்கட்டுமா?",
        "cancel_reminder": "இந்த நினைவூட்டலை நீக்க வேண்டுமா?",
    },
    "as-IN": {
        "call_family": "আপুনি {person}লৈ ফোন কৰিব বিচাৰে নেকি?",
        "create_reminder": "{date} {time}ত {category}ৰ সোঁৱৰণী ৰাখিম নেকি?",
        "cancel_reminder": "এইটো বাতিল কৰিব বিচাৰে নেকি?",
    },
    "en-IN": {
        "call_family": "Would you like me to call {person}?",
        "create_reminder": "Shall I set a {category} reminder for {date} at {time}?",
        "cancel_reminder": "Would you like me to cancel this reminder?",
    },
}

CATEGORY_LABELS = {
    "te-IN": {"medication": "మందు", "hydration": "నీళ్ల", "appointment": "డాక్టర్"},
    "hi-IN": {"medication": "दवा", "hydration": "पानी", "appointment": "डॉक्टर"},
    "ta-IN": {"medication": "மருந்து", "hydration": "தண்ணீர்", "appointment": "மருத்துவர்"},
    "as-IN": {"medication": "ঔষধ", "hydration": "পানী", "appointment": "চিকিৎসক"},
    "en-IN": {"medication": "medicine", "hydration": "water", "appointment": "doctor appointment"},
}


class ConfirmationService:
    # High impact intents that mandate confirmation
    HIGH_IMPACT_INTENTS = {
        VoiceIntent.CREATE_REMINDER,
        VoiceIntent.CANCEL_REMINDER,
        VoiceIntent.CALL_FAMILY,
    }

    @classmethod
    def requires_confirmation(cls, intent: VoiceIntent) -> bool:
        return intent in cls.HIGH_IMPACT_INTENTS

    @classmethod
    def build_confirmation_prompt(
        cls,
        intent: VoiceIntent,
        entities: ExtractedEntities,
        language: str = "te-IN",
    ) -> Optional[str]:
        if not cls.requires_confirmation(intent):
            return None

        lang_pack = CONFIRMATION_TEMPLATES.get(language, CONFIRMATION_TEMPLATES["en-IN"])
        cat_pack = CATEGORY_LABELS.get(language, CATEGORY_LABELS["en-IN"])

        if intent == VoiceIntent.CALL_FAMILY:
            person = entities.target_person or ("Amma" if language == "te-IN" else "Caregiver")
            return lang_pack["call_family"].format(person=person)

        if intent == VoiceIntent.CREATE_REMINDER:
            cat_name = cat_pack.get(entities.category or "medication", "medicine")
            date_str = entities.date or "tomorrow"
            time_str = entities.time or "08:00"
            return lang_pack["create_reminder"].format(category=cat_name, date=date_str, time=time_str)

        if intent == VoiceIntent.CANCEL_REMINDER:
            return lang_pack["cancel_reminder"]

        return None
