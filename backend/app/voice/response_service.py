"""
SMRITI+ — Regional Spoken Response Generator

Provides natural, respectful, culturally appropriate regional responses
for all canonical intents across Indian languages.
Preserves adult dignity; avoids robotic and childish tone.
"""

from typing import Dict, Any, Optional
from app.voice.schemas import VoiceIntent, ExtractedEntities


RESPONSES: Dict[str, Dict[str, str]] = {
    "te-IN": {
        "PLAY_GAME": "సరే, జ్ఞాపకశక్తి ఆట మొదలుపెడదాం రండి.",
        "SHOW_TODAY": "ఈరోజు మీకు చేయవలసిన పనులు ఇక్కడ ఉన్నాయి.",
        "SHOW_REMINDERS": "ఈరోజు మీ రిమైండర్ల వివరాలు ఇవిగోండి.",
        "COMPLETE_REMINDER": "చాలా మంచిది. పూర్తయినట్లు నమోదు చేశాను.",
        "CALL_FAMILY": "సరే, {person}కి కాల్ చేస్తున్నాను.",
        "OPEN_MEMORY_BOX": "మీ కుటుంబ జ్ఞాపకాల పెట్టెను తెరుస్తున్నాను.",
        "SLOW_DOWN": "తప్పకుండా, ఇకపై మరింత నెమ్మదిగా స్పష్టంగా మాట్లాడుతాను.",
        "SPEED_UP": "సరే, కొంచెం త్వరగా మాట్లాడుతాను.",
        "REPEAT": "మళ్ళీ చెబుతున్నాను, శ్రద్ధగా వినండి.",
        "STOP": "సరే, ఆపాను.",
        "START_BREAK": "పర్వాలేదండీ, కాసేపు హాయిగా విశ్రాంతి తీసుకోండి. మళ్ళీ తర్వాత చూద్దాం.",
        "HELP": "నాతో మీరు ఆట ఆడవచ్చు, మందు రిమైండర్ పెట్టవచ్చు లేదా కుటుంబ సభ్యులకు కాల్ చేయవచ్చు.",
        "GO_HOME": "మొదటి పేజీకి వచ్చాము.",
        "OPEN_SETTINGS": "సెట్టింగ్స్ పేజీ తెరిచాను.",
        "MISSING_TIME": "మందు రిమైండర్ ఏ సమయానికి పెట్టమంటారు?",
        "MISSING_CATEGORY": "ఏం గుర్తు చేయాలి? మందులా లేక నీళ్లా?",
        "UNKNOWN": "నేను సరిగ్గా వినలేకపోయాను. నిదానంగా మళ్ళీ చెప్పండి లేదా స్క్రీన్ పై నొక్కండి.",
    },
    "hi-IN": {
        "PLAY_GAME": "चलिए, दिमाग की कसरत के लिए एक खेल खेलते हैं।",
        "SHOW_TODAY": "आज की आपकी दिनचर्या यहाँ दी गई है।",
        "SHOW_REMINDERS": "आज के आपके रिमाइंडर की सूची ये रही।",
        "COMPLETE_REMINDER": "बहुत अच्छा। यह काम पूरा दर्ज कर दिया गया है।",
        "CALL_FAMILY": "हाँ, {person} को फोन मिलाया जा रहा है।",
        "OPEN_MEMORY_BOX": "आपकी पारिवारिक यादों का पिटारा खोल रहे हैं।",
        "SLOW_DOWN": "बिल्कुल, अब से मैं और धीरे-धीरे बात करूँगा।",
        "SPEED_UP": "जी, थोड़ा तेज़ बोलूँगा।",
        "REPEAT": "मैं फिर से दोहरा रहा हूँ।",
        "STOP": "ठीक है, रोक दिया गया है।",
        "START_BREAK": "कोई बात नहीं, आप आराम कीजिए। हम बाद में फिर मिलेंगे।",
        "HELP": "आप मुझसे खेल खेलने, दवा का रिमाइंडर लगाने या परिवार को फोन करने के लिए कह सकते हैं।",
        "GO_HOME": "मुख्य पृष्ठ पर आ गए हैं।",
        "OPEN_SETTINGS": "सेटिंग्स पृष्ठ खोल दिया गया है।",
        "MISSING_TIME": "किस समय का रिमाइंडर लगाना है?",
        "MISSING_CATEGORY": "किस चीज़ का रिमाइंडर लगाना है? दवा या पानी?",
        "UNKNOWN": "माफ़ कीजिए, मैं समझ नहीं पाया। कृपया धीरे से दोबारा बोलें या बटन दबाएँ।",
    },
    "ta-IN": {
        "PLAY_GAME": "சரி, நினைவுத்திறன் விளையாட்டை விளையாடுவோம் வாருங்கள்.",
        "SHOW_TODAY": "இன்றைய உங்கள் நிகழ்வுகள் இங்கே உள்ளன.",
        "SHOW_REMINDERS": "இன்றைய உங்கள் நினைவூட்டல் பட்டியல் இதோ.",
        "COMPLETE_REMINDER": "மிக நன்று. முடிந்தது என்று குறித்தாகிவிட்டது.",
        "CALL_FAMILY": "சரி, {person}-க்கு கால் செய்கிறேன்.",
        "OPEN_MEMORY_BOX": "உங்கள் குடும்ப நினைவுகளைத் திறக்கிறேன்.",
        "SLOW_DOWN": "நிச்சயமாக, இனி மெதுவாகப் பேசுகிறேன்.",
        "REPEAT": "மீண்டும் சொல்கிறேன், கவனியுங்கள்.",
        "STOP": "சரி, நிறுத்திவிட்டேன்.",
        "START_BREAK": "பரவாயில்லை, சிறிது நேரம் ஓய்வெடுங்கள். பிறகு தொடர்வோம்.",
        "HELP": "நீங்கள் என்னிடம் கேம் விளையாடலாம், நினைவூட்டல் வைக்கலாம் அல்லது குடும்பத்தினரை அழைக்கலாம்.",
        "UNKNOWN": "மன்னிக்கவும், எனக்குச் சரியாகக் கேட்கவில்லை. மீண்டும் கூறுங்கள்.",
    },
    "as-IN": {
        "PLAY_GAME": "বাৰু, মনত ৰখা খেল এটি খেলি চাওঁ আহক।",
        "SHOW_TODAY": "আজিৰ কাৰ্যসূচী এইয়া।",
        "SHOW_REMINDERS": "আজিৰ সোঁৱৰণীসমূহ এইয়া।",
        "COMPLETE_REMINDER": "বৰ ভাল কথা। সম্পন্ন বুলি লিপিবদ্ধ কৰা হ'ল।",
        "CALL_FAMILY": "বাৰু, {person}লৈ ফোন লগোৱা হৈছে।",
        "OPEN_MEMORY_BOX": "আপোনাৰ স্মৃতিৰ টোপোলাটো খুলি দিছোঁ।",
        "SLOW_DOWN": "নিশ্চয়, মই আৰু লাহে লাহে ক'ম।",
        "REPEAT": "মই আকৌ দোহাৰিছোঁ।",
        "STOP": "বাৰু, ৰখাই দিছোঁ।",
        "START_BREAK": "একো কথা নাই, অলপ জিৰণি লওক। পাছত আকৌ আৰম্ভ কৰিম।",
        "HELP": "আপুনি খেল খেলিব পাৰে, সোঁৱৰণী ৰাখিব পাৰে বা পৰিয়াললৈ ফোন কৰিব পাৰে।",
        "UNKNOWN": "মই সঠিককৈ শুনিব নোৱাৰিলোঁ। অনুগ্ৰহ কৰি আকৌ কওক।",
    },
    "en-IN": {
        "PLAY_GAME": "Sure, let's play a gentle memory game.",
        "SHOW_TODAY": "Here is your routine and activities for today.",
        "SHOW_REMINDERS": "Here are your active reminders.",
        "COMPLETE_REMINDER": "Well done. I've marked that as completed.",
        "CALL_FAMILY": "Calling {person} for you now.",
        "OPEN_MEMORY_BOX": "Opening your family memory box.",
        "SLOW_DOWN": "Certainly, I will speak more slowly and clearly.",
        "SPEED_UP": "Understood, speaking a little faster.",
        "REPEAT": "Repeating that for you now.",
        "STOP": "Stopped.",
        "START_BREAK": "That's completely fine. Take a gentle rest and we can continue later.",
        "HELP": "You can ask me to play a game, check reminders, set a reminder, or call family.",
        "GO_HOME": "Returned to home screen.",
        "OPEN_SETTINGS": "Opened settings.",
        "MISSING_TIME": "What time would you like me to set the reminder for?",
        "MISSING_CATEGORY": "What would you like me to remind you about? Medicine or water?",
        "UNKNOWN": "I couldn't catch that clearly. Please take your time and say it again, or tap on the screen.",
    },
}


class ResponseService:
    @classmethod
    def generate_response(
        cls,
        intent: VoiceIntent,
        entities: ExtractedEntities,
        language: str = "te-IN",
        missing_slot: Optional[str] = None,
    ) -> str:
        lang_pack = RESPONSES.get(language, RESPONSES["en-IN"])

        if missing_slot == "time":
            return lang_pack.get("MISSING_TIME", RESPONSES["en-IN"]["MISSING_TIME"])
        if missing_slot == "category":
            return lang_pack.get("MISSING_CATEGORY", RESPONSES["en-IN"]["MISSING_CATEGORY"])

        key = intent.value
        raw_text = lang_pack.get(key) or RESPONSES["en-IN"].get(key, "Done.")

        if "{person}" in raw_text:
            person = entities.target_person or "Family"
            raw_text = raw_text.format(person=person)

        return raw_text
