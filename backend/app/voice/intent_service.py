"""
SMRITI+ — Canonical Intent Service

Maps multilingual, colloquial, and code-switched Indian speech
to deterministic canonical VoiceIntent enum values.
"""

import re
from typing import Tuple
from app.voice.schemas import VoiceIntent


# Affirmation and Negation phrase tables across languages
AFFIRMATIONS = [
    "yes", "yeah", "yep", "sure", "okay", "correct", "right",
    "avunu", "sare", "alage", "avunu cheyyi", "అవును", "సరే", "అలాగే",
    "haan", "theek hai", "sahi hai", "हाँ", "ठीक है", "सही है",
    "aam", "sari", "சரி", "ஆம்",
    "houdu", "sari", "ಹೌದು", "ಸರಿ",
    "athe", "അതെ",
    "hyan", "thik aache", "হ্যাঁ", "ঠিক আছে",
    "hoy", "হয়",
]

NEGATIONS = [
    "no", "nope", "cancel", "don't",
    "ledu", "vaddu", "oddu", "లేదు", "వద్దు",
    "nahi", "mat karo", "नहीं", "मत करो",
    "illai", "vendaam", "இல்லை", "வேண்டாம்",
    "illa", "beda", "ಇಲ್ಲ", "ಬೇಡ",
    "alla", "venda", "അല്ല",
    "na", "dorkar nei", "না",
    "nahoi", "নহয়",
]

STOP_TOKENS = ["stop", "pause", "aapu", "ఆపు", "rok do", "रोक दो", "நிறுத்து", "thamo", "nillisi"]


class IntentService:
    @classmethod
    def detect_intent(cls, transcript: str, current_screen: str = "home") -> Tuple[VoiceIntent, float]:
        """
        Determines canonical VoiceIntent and baseline confidence score.
        Returns: (VoiceIntent, confidence: float)
        """
        lower = transcript.lower().strip()

        # 1. Barge-in / Immediate Stop has top priority
        if any(w in lower for w in STOP_TOKENS):
            return VoiceIntent.STOP, 0.98

        # 2. Immediate affirmative / negative response
        for aff in AFFIRMATIONS:
            if re.fullmatch(rf"{re.escape(aff)}[\.?!]?", lower) or lower == aff:
                return VoiceIntent.AFFIRMATION, 0.98

        for neg in NEGATIONS:
            if re.fullmatch(rf"{re.escape(neg)}[\.?!]?", lower) or lower == neg:
                return VoiceIntent.NEGATION, 0.98

        # 3. Speech Rate Adjustments
        if any(w in lower for w in ["slow down", "slower", "nemmadiga", "కొంచెం నెమ్మదిగా", "నెమ్మదిగా మాట్లాడు", "dheere bolo", "धीरे बोलो", "medhuva"]):
            return VoiceIntent.SLOW_DOWN, 0.95

        if any(w in lower for w in ["speed up", "faster", "tvaraga", "త్వరగా మాట్లాడు", "tez bolo", "तेज़ बोलो"]):
            return VoiceIntent.SPEED_UP, 0.95

        # 4. Repetition
        if any(w in lower for w in ["repeat", "again", "say that again", "malli cheppu", "మళ్ళీ చెప్పు", "phir se", "फिर से बोलो", "marubadiyum"]):
            return VoiceIntent.REPEAT, 0.96

        # 5. Language Switching
        if any(w in lower for w in ["telugu lo", "తెలుగులో మాట్లాడు", "speak in telugu"]):
            return VoiceIntent.CHANGE_LANGUAGE, 0.98
        if any(w in lower for w in ["hindi me", "हिंदी में बोलो", "speak in hindi"]):
            return VoiceIntent.CHANGE_LANGUAGE, 0.98
        if any(w in lower for w in ["english lo", "english please", "speak in english"]):
            return VoiceIntent.CHANGE_LANGUAGE, 0.98

        # 6. Break / Tiredness (Gentle non-diagnostic emotional cue)
        if any(w in lower for w in ["tired", "break", "alasipoyanu", "అలసిపోయాను", "thak gaya", "थक गया", "rest"]):
            return VoiceIntent.START_BREAK, 0.93

        # 7. Help
        if any(w in lower for w in ["help", "sahayam", "సహాయం", "madad", "मदद", "what can you do"]):
            return VoiceIntent.HELP, 0.95

        # 8. Navigation & Settings
        if any(w in lower for w in ["home", "go home", "modati page", "మొదటి పేజీ", "ghar jao", "main menu"]):
            return VoiceIntent.GO_HOME, 0.95
        if any(w in lower for w in ["settings", "preferences", "సెట్టింగ్స్"]):
            return VoiceIntent.OPEN_SETTINGS, 0.94

        # 9. Today's Overview
        if any(w in lower for w in ["what do i have today", "today schedule", "eeroju", "ఈరోజు ఏముంది", "aaj kya hai", "आज क्या है", "what's next"]):
            return VoiceIntent.SHOW_TODAY, 0.94

        # 10. Family Call
        if any(w in lower for w in ["call", "phone", "ఫోన్", "కాల్", "फोन", "vilikku", "pannu", "maadu"]):
            return VoiceIntent.CALL_FAMILY, 0.95

        # 11. Reminders
        # Create reminder indicators
        if any(w in lower for w in ["remind", "reminder", "pettu", "పెట్టు", "laga do", "लगा दो", "gurtu cheyyi", "గుర్తు చేయి", "yaad dilana", "याद दिलाना", "dawa", "medicine", "water", "నీళ్లు"]):
            return VoiceIntent.CREATE_REMINDER, 0.94

        if any(w in lower for w in ["show reminders", "reminders chupinchu", "రిమైండర్లు చూడు", "reminders dikhao"]):
            return VoiceIntent.SHOW_REMINDERS, 0.92

        if any(w in lower for w in ["done", "completed", "vesukunna", "వేసుకున్నా", "ho gaya", "खा ली"]):
            return VoiceIntent.COMPLETE_REMINDER, 0.92

        # 12. Games
        if any(w in lower for w in ["game", "play", "aata", "ఆట", "khel", "खेल", "puzzle", "matching"]):
            return VoiceIntent.PLAY_GAME, 0.93

        # 13. Memory Box
        if any(w in lower for w in ["memory", "memories", "photo", "photos", "gurtulu", "గుర్తులు", "yaadein", "यादें", "nyabagam"]):
            return VoiceIntent.OPEN_MEMORY_BOX, 0.93

        return VoiceIntent.UNKNOWN, 0.50
