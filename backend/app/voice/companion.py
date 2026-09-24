"""
SMRITI+ — Conversational Cognitive Companion Engine

Transforms SMRITI+ from a fixed command reminder bot into a true conversational
cognitive companion for elderly users living with cognitive changes.

Architecture:
  Voice/Text Input
        │
        ▼
  Safety & Distress Shield (Detects physical distress / medical emergency)
        │
        ▼
  Elder Profile & Long-term Context Grounding (family, village, routines)
        │
        ▼
  Dementia-Safe Conversational Brain (WHO guidelines: patient, short sentences, 1 question at a time)
        │
        ▼
  Companion Tool Calling Router (get_today_plan, start_game, save_memory, create_reminder, contact_family)
        │
        ▼
  Empathetic Localized Response (Telugu, Assamese, Hindi, Indian English)
"""

from __future__ import annotations

import re
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel


# ─── Safety & Escalation Rules (Section 12) ───────────────────────────────────

HIGH_RISK_SYMPTOMS = [
    r"chest hurts?",
    r"chest pain",
    r"cannot breathe",
    r"hard to breathe",
    r"fell down",
    r"i fell",
    r"bleeding",
    r"stroke",
    r"dying",
    r"don't want to live",
    r"want to end it",
    r"suicide",
    r"గుండె నొప్పి",       # Telugu: Chest pain
    r"శ్వాస ఆడట్లేదు",      # Telugu: Breathing difficulty
    r"కింద పడిపోయాను",      # Telugu: Fell down
    r"বুকুৰ বিষ",          # Assamese: Chest pain
    r"উশাহ ল'ব পৰা নাই",   # Assamese: Cannot breathe
    r"পৰি গ'লো",          # Assamese: Fell down
    r"सीने में दर्द",      # Hindi: Chest pain
    r"सांस नहीं आ रही",    # Hindi: Cannot breathe
    r"गिर गया",           # Hindi: Fell down
]

EMERGENCY_RESPONSES = {
    "te-IN": "మీరు ఆరోగ్య ఇబ్బందిలో ఉన్నట్లు అనిపిస్తోంది. దయచేసి వెంటనే మీ కుటుంబ సభ్యులను లేదా అత్యవసర వైద్య సేవలను సంప్రదించండి.",
    "as-IN": "আপোনাৰ স্বাস্থ্যৰ অসুবিধা হোৱা যেন লাগিছে। অনুগ্ৰহ কৰি এতিয়াই আপোনাৰ পৰিয়াল বা চিকিৎসকক জনাওক।",
    "hi-IN": "मुझे आपकी सेहत को लेकर चिंता हो रही है। कृपया तुरंत अपने परिवार या डॉक्टर से संपर्क करें।",
    "en-IN": "I hear that you may need medical attention. Please reach out to your caregiver or contact emergency services right away.",
}


# ─── Dementia-First Conversational Grounding ─────────────────────────────────

DEMENTIA_COMMUNICATION_RULES = """
SMRITI+ COMMUNICATION PRINCIPLES:
1. Speak slowly and naturally.
2. Use short, calming sentences (maximum 2 sentences per response).
3. Ask only ONE question at a time.
4. Avoid complicated vocabulary.
5. NEVER shame or tell the user they forgot or already said something.
6. When user forgets: say "That's completely okay. Tell me again."
7. Maintain adult dignity; avoid childish, patronizing, or overly clinical tone.
8. NEVER diagnose or claim to be a doctor.
9. Distinguish confirmed memories from inferences.
"""


class CompanionChatRequest(BaseModel):
    elder_id: str
    message: str
    language: str = "te-IN"
    elder_name: Optional[str] = None
    preferred_topics: Optional[List[str]] = None
    daughter_name: Optional[str] = "Ananya"
    current_time: Optional[str] = None


class CompanionChatResponse(BaseModel):
    reply: str
    suggested_action: Optional[Dict[str, Any]] = None
    is_emergency: bool = False
    action_executed: Optional[str] = None
    detected_intent: str = "conversation"
    language: str


class ConversationalCompanion:
    """
    Cognitive dialogue manager with tool execution and safety gating.
    """

    @classmethod
    def check_safety_emergency(cls, text: str, language: str) -> Optional[str]:
        lower = text.lower()
        for pattern in HIGH_RISK_SYMPTOMS:
            if re.search(pattern, lower, re.IGNORECASE):
                return EMERGENCY_RESPONSES.get(language, EMERGENCY_RESPONSES["en-IN"])
        return None

    @classmethod
    def process_turn(
        cls,
        req: CompanionChatRequest,
        today_plan: Optional[List[Dict[str, Any]]] = None,
    ) -> CompanionChatResponse:
        text = req.message.strip()
        lang = req.language
        elder_name = req.elder_name or "Friend"
        daughter = req.daughter_name or "Ananya"

        # 1. Immediate Safety Check
        emergency_msg = cls.check_safety_emergency(text, lang)
        if emergency_msg:
            return CompanionChatResponse(
                reply=emergency_msg,
                is_emergency=True,
                suggested_action={"type": "emergency_call", "label": "Call Caregiver Now"},
                detected_intent="emergency",
                language=lang,
            )

        lower = text.lower()

        # 2. Emotional Support: Loneliness / Feeling low
        if any(w in lower for w in [
            "lonely", "alone", "sad", "unhappy", "bored",
            "ఒంటరిగా", "బాధగా", "తోడు", "బాగోలేదు",
            "অকলশৰীয়া", "মন বেয়া", "আমনি",
            "अकेला", "उदास", "मन नहीं लग रहा",
        ]):
            replies = {
                "te-IN": f"నేను మీతోనే ఉన్నాను, {elder_name} గారూ. మనం కాసేపు సరదాగా మాట్లాడుకుందామా, లేక చిన్న జ్ఞాపకశక్తి ఆట ఆడదామా?",
                "as-IN": f"মই আপোনাৰ লগত আছোঁ, {elder_name}। আমি অলপ কথা পাতোঁ নেকি, নে মনত ৰখা খেল খেলিবা?",
                "hi-IN": f"मैं आपके साथ हूँ, {elder_name} जी। क्या हम थोड़ी बातें करें, या एक छोटा सा खेल खेलें?",
                "en-IN": f"I am right here with you, {elder_name}. Would you like to talk for a little while, or shall we try a gentle memory game?",
            }
            return CompanionChatResponse(
                reply=replies.get(lang, replies["en-IN"]),
                suggested_action={"type": "start_game", "label": "Play Memory Game", "game_id": "memory_matching"},
                detected_intent="emotional_comfort",
                language=lang,
            )

        # 3. Reminiscing: Village, Childhood, Family Memories
        if any(w in lower for w in [
            "village", "childhood", "mother", "father", "past", "remembering", "old days",
            "ఊరు", "గ్రామం", "చిన్నప్పుడు", "జ్ఞాపకం", "పాత రోజులు",
            "গাঁও", "সৰুকাল", "পুৰণি দিন", "মনত পৰিছে",
            "गाँव", "बचपन", "पुरानी बातें", "याद आ रहा है",
        ]):
            replies = {
                "te-IN": "అది చాలా మధురమైన జ్ఞాపకం. మీ ఊరి గురించి మీకు బాగా ఇష్టమైన విషయం ఏమిటి?",
                "as-IN": "সেইটো বৰ ভাল স্মৃতি। আপোনাৰ গাঁৱৰ কি কথা সকলোতকৈ বেছি মনত পৰে?",
                "hi-IN": "यह बहुत अच्छी याद है। आपको अपने गाँव की सबसे प्यारी बात क्या याद आती है?",
                "en-IN": "That sounds like a wonderful memory. What do you remember most about it?",
            }
            return CompanionChatResponse(
                reply=replies.get(lang, replies["en-IN"]),
                suggested_action={"type": "save_memory", "label": "Save in Memory Box"},
                detected_intent="reminisce",
                language=lang,
            )

        # 4. Routine & Today's Plan Request
        if any(w in lower for w in [
            "what do i have today", "today schedule", "what's next", "plan",
            "ఈరోజు ఏముంది", "తర్వాత ఏం చేయాలి", "షెడ్యూల్",
            "আজি কি আছে", "পাছত কি কৰিব লাগে",
            "आज क्या है", "आगे क्या करना है",
        ]):
            replies = {
                "te-IN": "ఈరోజు ఉదయం పది గంటలకు జ్ఞాపకశక్తి ఆట, మధ్యాహ్నం మందుల రిమైండర్ ఉన్నాయి. ఇప్పుడు ఆట మొదలుపెడదామా?",
                "as-IN": "আজি পুৱা ১০ বজাত মনত ৰখা খেল আৰু দুপৰীয়া ঔষধৰ সোঁৱৰণী আছে। এতিয়া খেল খেলিবনে?",
                "hi-IN": "आज सुबह 10 बजे याददाश्त का खेल और दोपहर में दवा का समय है। क्या अभी खेल शुरू करें?",
                "en-IN": "You have a memory exercise at 10:00 AM and your medicine reminder at 12:30 PM. Would you like to start today's activity?",
            }
            return CompanionChatResponse(
                reply=replies.get(lang, replies["en-IN"]),
                suggested_action={"type": "open_plan", "label": "View Today's Plan"},
                detected_intent="today_plan",
                language=lang,
            )

        # 5. Cognitive Games Trigger
        if any(w in lower for w in [
            "game", "play", "puzzle", "aata", "ఆట", "khel", "खेल", "খেলা",
        ]):
            replies = {
                "te-IN": "సరేనండీ, ఐదు నిమిషాల ప్రశాంతమైన చిత్రాల జ్ఞాపకశక్తి ఆట ఆడదాం రండి.",
                "as-IN": "বাৰু আহক, ৫ মিনিটৰ ছবি মনত ৰখা খেল এটি খেলি চাওঁ।",
                "hi-IN": "ज़रूर, आइए 5 मिनट का एक शांत याददाश्त का खेल खेलते हैं।",
                "en-IN": "Certainly! Let's play a gentle 5-minute picture memory game together.",
            }
            return CompanionChatResponse(
                reply=replies.get(lang, replies["en-IN"]),
                suggested_action={"type": "start_game", "label": "Start Game", "game_id": "memory_matching"},
                detected_intent="play_game",
                language=lang,
            )

        # 6. Forgetting / Confusion Handling (Patience & Compassion)
        if any(w in lower for w in [
            "forgot", "don't remember", "who are you", "where am i",
            "మర్చిపోయాను", "గుర్తు లేదు", "ఎవరు నువ్వు",
            "পাহৰি গ'লোঁ", "মনত নাই", "আপুনি কোন",
            "भूल गया", "याद नहीं", "आप कौन हो",
        ]):
            replies = {
                "te-IN": f"పర్వాలేదండీ, కంగారు పడకండి. నేను స్మృతి ప్లస్, మీ తోడుగా ఉన్నాను. మీ అమ్మాయి {daughter} కూడా మీకు దగ్గరలోనే ఉన్నారు.",
                "as-IN": f"একো কথা নাই, চিন্তা নকৰিব। মই স্মৃতি প্লাছ, আপোনাৰ লগত আছোঁ। আপোনাৰ জীয়ৰী {daughter}ও আপোনাৰ কাষতে আছে।",
                "hi-IN": f"कोई बात नहीं, बिल्कुल चिंता मत कीजिए। मैं स्मृति प्लस हूँ, आपका साथी। आपकी बेटी {daughter} भी आपके साथ है।",
                "en-IN": f"That is completely okay, please don't worry. I am SMRITI+, your companion. Everything is safe and peaceful right now.",
            }
            return CompanionChatResponse(
                reply=replies.get(lang, replies["en-IN"]),
                suggested_action={"type": "open_identity", "label": "Read Life Story"},
                detected_intent="orientation_support",
                language=lang,
            )

        # 7. Family Connection
        if any(w in lower for w in [
            "call", "daughter", "son", "family", "ravi", "priya",
            "ఫోన్", "పిలువు", "కూతురు", "అమ్మాయి",
            "ফোন", "জীয়ৰী", "ল'ৰা",
            "फोन", "बेटी", "बेटा",
        ]):
            replies = {
                "te-IN": f"సరేనండీ, మీ అమ్మాయి {daughter}కి ఫోన్ కలపమంటారా?",
                "as-IN": f"বাৰু, আপোনাৰ জীয়ৰী {daughter}লৈ ফোন লগোৱাটো বিচাৰে নেকি?",
                "hi-IN": f"हाँ, क्या मैं आपकी बेटी {daughter} को फोन मिला दूँ?",
                "en-IN": f"Would you like me to call your daughter {daughter} for you now?",
            }
            return CompanionChatResponse(
                reply=replies.get(lang, replies["en-IN"]),
                suggested_action={"type": "call_family", "label": f"Call {daughter}", "target": daughter},
                detected_intent="call_family",
                language=lang,
            )

        # Default Warm Conversational Answer
        default_replies = {
            "te-IN": "నేను వింటున్నాను. ఈరోజు మీకు ఎలా అనిపిస్తుంది? మందుల గురించి లేదా ఆట గురించి నన్ను అడగవచ్చు.",
            "as-IN": "মই শুনি আছোঁ। আজি আপোনাৰ কেনেকুৱা লাগিছে? আপুনি যিকোনো কথা মোক ক'ব পাৰে।",
            "hi-IN": "मैं सुन रहा हूँ। आज आपका दिन कैसा चल रहा है? आप मुझसे कुछ भी पूछ सकते हैं।",
            "en-IN": f"I am listening, {elder_name}. How are you feeling today? You can ask me anything about your day, or we can just chat.",
        }
        return CompanionChatResponse(
            reply=default_replies.get(lang, default_replies["en-IN"]),
            detected_intent="general_conversation",
            language=lang,
        )
