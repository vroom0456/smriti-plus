"""
SMRITI+ — Indian Multilingual Language Service

Supports 22 Official Scheduled Indian Languages + Indian English.
Provides:
- Truthful language capabilities catalog
- Romanized Indian language normalization
- Regional slang & colloquial phrase normalization
- Code-switching detection (e.g., Telugu+English, Hindi+English, Tamil+English)
- Elder pause/hesitation stripping
"""

import re
from typing import Dict, List, Optional, Tuple, Any
from app.voice.schemas import LanguageCapability


LANGUAGE_CATALOG: Dict[str, LanguageCapability] = {
    "en-IN": LanguageCapability(
        language_code="en-IN",
        display_name="English (Indian)",
        native_name="English",
        text_supported=True,
        stt_supported=True,
        tts_supported=True,
        offline_stt_supported=False,
        offline_tts_supported=True,
        code_switch_supported=True,
        human_reviewed=True,
        pronunciation_reviewed=True,
        accent_support=["Telugu-English", "Hindi-English", "Tamil-English", "Bengali-English", "NER-English"],
    ),
    "hi-IN": LanguageCapability(
        language_code="hi-IN",
        display_name="Hindi",
        native_name="हिन्दी",
        text_supported=True,
        stt_supported=True,
        tts_supported=True,
        offline_stt_supported=False,
        offline_tts_supported=True,
        code_switch_supported=True,
        human_reviewed=True,
        pronunciation_reviewed=True,
        accent_support=["Bhojpuri-Hindi", "Awadhi-Hindi", "Urban-Hinglish"],
    ),
    "te-IN": LanguageCapability(
        language_code="te-IN",
        display_name="Telugu",
        native_name="తెలుగు",
        text_supported=True,
        stt_supported=True,
        tts_supported=True,
        offline_stt_supported=False,
        offline_tts_supported=False,
        code_switch_supported=True,
        human_reviewed=True,
        pronunciation_reviewed=True,
        accent_support=["Coastal Andhra", "Rayalaseema", "Telangana", "Tenglish"],
    ),
    "ta-IN": LanguageCapability(
        language_code="ta-IN",
        display_name="Tamil",
        native_name="தமிழ்",
        text_supported=True,
        stt_supported=True,
        tts_supported=True,
        offline_stt_supported=False,
        offline_tts_supported=False,
        code_switch_supported=True,
        human_reviewed=True,
        pronunciation_reviewed=True,
        accent_support=["Chennai", "Madurai", "Coimbatore", "Tanglish"],
    ),
    "kn-IN": LanguageCapability(
        language_code="kn-IN",
        display_name="Kannada",
        native_name="ಕನ್ನಡ",
        text_supported=True,
        stt_supported=True,
        tts_supported=True,
        offline_stt_supported=False,
        offline_tts_supported=False,
        code_switch_supported=True,
        human_reviewed=True,
        pronunciation_reviewed=True,
        accent_support=["Old Mysore", "North Karnataka", "Mangalore", "Kanglish"],
    ),
    "ml-IN": LanguageCapability(
        language_code="ml-IN",
        display_name="Malayalam",
        native_name="മലയാളം",
        text_supported=True,
        stt_supported=True,
        tts_supported=True,
        offline_stt_supported=False,
        offline_tts_supported=False,
        code_switch_supported=True,
        human_reviewed=True,
        pronunciation_reviewed=True,
        accent_support=["Travancore", "Malabar", "Kochi", "Manglish"],
    ),
    "bn-IN": LanguageCapability(
        language_code="bn-IN",
        display_name="Bengali",
        native_name="বাংলা",
        text_supported=True,
        stt_supported=True,
        tts_supported=True,
        offline_stt_supported=False,
        offline_tts_supported=False,
        code_switch_supported=True,
        human_reviewed=True,
        pronunciation_reviewed=True,
        accent_support=["Rarh", "Varendra", "Bonglish"],
    ),
    "mr-IN": LanguageCapability(
        language_code="mr-IN",
        display_name="Marathi",
        native_name="मराठी",
        text_supported=True,
        stt_supported=True,
        tts_supported=True,
        offline_stt_supported=False,
        offline_tts_supported=False,
        code_switch_supported=True,
        human_reviewed=True,
        pronunciation_reviewed=True,
        accent_support=["Deshi", "Konkani Marathi", "Varhadi"],
    ),
    "gu-IN": LanguageCapability(
        language_code="gu-IN",
        display_name="Gujarati",
        native_name="ગુજરાતી",
        text_supported=True,
        stt_supported=True,
        tts_supported=True,
        offline_stt_supported=False,
        offline_tts_supported=False,
        code_switch_supported=True,
        human_reviewed=True,
        pronunciation_reviewed=True,
        accent_support=["Amdavadi", "Surati", "Kathiyawadi"],
    ),
    "pa-IN": LanguageCapability(
        language_code="pa-IN",
        display_name="Punjabi",
        native_name="ਪੰਜਾਬੀ",
        text_supported=True,
        stt_supported=True,
        tts_supported=True,
        offline_stt_supported=False,
        offline_tts_supported=False,
        code_switch_supported=True,
        human_reviewed=True,
        pronunciation_reviewed=True,
        accent_support=["Majhi", "Doabi", "Malwai"],
    ),
    "or-IN": LanguageCapability(
        language_code="or-IN",
        display_name="Odia",
        native_name="ଓଡ଼ିଆ",
        text_supported=True,
        stt_supported=True,
        tts_supported=True,
        offline_stt_supported=False,
        offline_tts_supported=False,
        code_switch_supported=True,
        human_reviewed=True,
        pronunciation_reviewed=True,
        accent_support=["Mughalbandi", "Western Odia"],
    ),
    "as-IN": LanguageCapability(
        language_code="as-IN",
        display_name="Assamese",
        native_name="অসমীয়া",
        text_supported=True,
        stt_supported=True,
        tts_supported=True,
        offline_stt_supported=False,
        offline_tts_supported=False,
        code_switch_supported=True,
        human_reviewed=True,
        pronunciation_reviewed=True,
        accent_support=["Eastern Assamese", "Kamrupi", "Goalpariya"],
    ),
    "ur-IN": LanguageCapability(
        language_code="ur-IN",
        display_name="Urdu",
        native_name="اردو",
        text_supported=True,
        stt_supported=True,
        tts_supported=True,
        offline_stt_supported=False,
        offline_tts_supported=False,
        code_switch_supported=True,
        human_reviewed=True,
        pronunciation_reviewed=True,
        accent_support=["Deccani", "Delhi/Lucknow"],
    ),
    "kok-IN": LanguageCapability(
        language_code="kok-IN",
        display_name="Konkani",
        native_name="कोंकणी",
        text_supported=True,
        stt_supported=False,
        tts_supported=False,
        offline_stt_supported=False,
        offline_tts_supported=False,
        code_switch_supported=True,
        human_reviewed=True,
        pronunciation_reviewed=False,
        accent_support=["Goan", "Mangalorean"],
    ),
    "ne-IN": LanguageCapability(
        language_code="ne-IN",
        display_name="Nepali",
        native_name="नेपाली",
        text_supported=True,
        stt_supported=False,
        tts_supported=False,
        offline_stt_supported=False,
        offline_tts_supported=False,
        code_switch_supported=True,
        human_reviewed=True,
        pronunciation_reviewed=False,
        accent_support=["Sikkimese", "Darjeeling"],
    ),
    "ks-IN": LanguageCapability(
        language_code="ks-IN",
        display_name="Kashmiri",
        native_name="کٲشُر",
        text_supported=True,
        stt_supported=False,
        tts_supported=False,
        offline_stt_supported=False,
        offline_tts_supported=False,
        code_switch_supported=False,
        human_reviewed=True,
        pronunciation_reviewed=False,
        accent_support=["Srinagar"],
    ),
    "sd-IN": LanguageCapability(
        language_code="sd-IN",
        display_name="Sindhi",
        native_name="سنڌي",
        text_supported=True,
        stt_supported=False,
        tts_supported=False,
        offline_stt_supported=False,
        offline_tts_supported=False,
        code_switch_supported=False,
        human_reviewed=True,
        pronunciation_reviewed=False,
        accent_support=["Ulhasnagar", "Kutch"],
    ),
    "sa-IN": LanguageCapability(
        language_code="sa-IN",
        display_name="Sanskrit",
        native_name="संस्कृतम्",
        text_supported=True,
        stt_supported=False,
        tts_supported=False,
        offline_stt_supported=False,
        offline_tts_supported=False,
        code_switch_supported=False,
        human_reviewed=True,
        pronunciation_reviewed=False,
        accent_support=["Classical"],
    ),
    "mai-IN": LanguageCapability(
        language_code="mai-IN",
        display_name="Maithili",
        native_name="मैथिली",
        text_supported=True,
        stt_supported=False,
        tts_supported=False,
        offline_stt_supported=False,
        offline_tts_supported=False,
        code_switch_supported=False,
        human_reviewed=True,
        pronunciation_reviewed=False,
        accent_support=["Mithila"],
    ),
    "mni-IN": LanguageCapability(
        language_code="mni-IN",
        display_name="Manipuri (Meitei)",
        native_name="মৈতৈলোন্",
        text_supported=True,
        stt_supported=False,
        tts_supported=False,
        offline_stt_supported=False,
        offline_tts_supported=False,
        code_switch_supported=False,
        human_reviewed=True,
        pronunciation_reviewed=False,
        accent_support=["Imphal Valley"],
    ),
    "brx-IN": LanguageCapability(
        language_code="brx-IN",
        display_name="Bodo",
        native_name="बर'",
        text_supported=True,
        stt_supported=False,
        tts_supported=False,
        offline_stt_supported=False,
        offline_tts_supported=False,
        code_switch_supported=False,
        human_reviewed=True,
        pronunciation_reviewed=False,
        accent_support=["Bodoland"],
    ),
    "doi-IN": LanguageCapability(
        language_code="doi-IN",
        display_name="Dogri",
        native_name="डोगरी",
        text_supported=True,
        stt_supported=False,
        tts_supported=False,
        offline_stt_supported=False,
        offline_tts_supported=False,
        code_switch_supported=False,
        human_reviewed=True,
        pronunciation_reviewed=False,
        accent_support=["Jammu"],
    ),
    "sat-IN": LanguageCapability(
        language_code="sat-IN",
        display_name="Santali",
        native_name="ᱥᱟᱱᱛᱟᱲᱤ",
        text_supported=True,
        stt_supported=False,
        tts_supported=False,
        offline_stt_supported=False,
        offline_tts_supported=False,
        code_switch_supported=False,
        human_reviewed=True,
        pronunciation_reviewed=False,
        accent_support=["Mayurbhanj", "Chhota Nagpur"],
    ),
}

# ──────────────────────────────────────────────
# ROMANIZED & COLLOQUIAL PHRASE MAPPER
# ──────────────────────────────────────────────

ROMANIZED_PHRASES: Dict[str, Dict[str, str]] = {
    "te-IN": {
        "amma ki call cheyyi": "అమ్మకి కాల్ చేయి",
        "amma ki call cheyyi please": "అమ్మకి కాల్ చేయి",
        "ammaku call cheyyi": "అమ్మకి కాల్ చేయి",
        "nanna ki call cheyyi": "నాన్నకి కాల్ చేయి",
        "call cheyyi": "కాల్ చేయి",
        "cheyyi": "చేయి",
        "chey": "చేయి",
        "pettava": "పెట్టు",
        "pettu": "పెట్టు",
        "gurtu cheyyi": "గుర్తు చేయి",
        "gurtu chey": "గుర్తు చేయి",
        "mandulu": "మందు",
        "mandu": "మందు",
        "neellu": "నీళ్లు",
        "aata": "ఆట",
        "aadamu": "ఆట ఆడదాం",
        "aadam": "ఆట ఆడదాం",
        "aatam": "ఆట ఆడదాం",
        "malli cheppu": "మళ్ళీ చెప్పు",
        "nemmadiga matladu": "నెమ్మదిగా మాట్లాడు",
        "koncham nemmadiga": "నెమ్మదిగా మాట్లాడు",
        "aapu": "ఆపు",
        "repu": "రేపు",
        "ellundi": "ఎల్లుండి",
        "udayam": "ఉదయం",
        "sayantram": "సాయంత్రం",
        "ratri": "రాత్రి",
        "avunu": "అవును",
        "sare": "సరే",
        "ledu": "లేదు",
        "vaddu": "వద్దు",
    },
    "hi-IN": {
        "meri dawa ka reminder laga do": "मेरी दवा का रिमाइंडर लगा दो",
        "dawa ka reminder laga do": "मेरी दवा का रिमाइंडर लगा दो",
        "mummy ko call karo": "मम्मी को फोन करो",
        "papa ko call karo": "पापा को फोन करो",
        "call karo": "फोन करो",
        "laga do": "लगा दो",
        "yaad dilana": "याद दिलाना",
        "dawa": "दवा",
        "pani": "पानी",
        "khel": "खेल",
        "phir se bolo": "फिर से बोलो",
        "dheere bolo": "धीरे बोलो",
        "rok do": "रोक दो",
        "kal": "कल",
        "parson": "परसों",
        "subah": "सुबह",
        "shaam": "शाम",
        "raat": "रात",
        "haan": "हाँ",
        "theek hai": "ठीक है",
        "nahi": "नहीं",
        "mat karo": "मत करो",
    },
    "ta-IN": {
        "amma ku call pannu": "அம்மாவுக்கு கால் பண்ணு",
        "appa ku call pannu": "அப்பாவுக்கு கால் பண்ணு",
        "marunthu reminder vai": "மருந்து நினைவூட்டல் வை",
        "thannir reminder": "தண்ணீர் நினைவூட்டல்",
        "vilayadu": "விளையாடு",
        "marubadiyum sollu": "மறுபடியும் சொல்லு",
        "medhuva pesu": "மெதுவா பேசு",
        "niru": "நிறுத்து",
        "naalaikku": "நாளைக்கு",
        "kaalai": "காலை",
        "iravu": "இரவு",
        "aam": "ஆம்",
        "sari": "சரி",
        "illai": "இல்லை",
        "vendaam": "வேண்டாம்",
    },
    "kn-IN": {
        "amma ge call maadu": "ಅಮ್ಮನಿಗೆ ಕಾಲ್ ಮಾಡು",
        "appa ge call maadu": "ಅಪ್ಪನಿಗೆ ಕಾಲ್ ಮಾಡು",
        "aushadha reminder": "ಔಷಧಿ ನೆನಪಿಸು",
        "neeru reminder": "ನೀರು ನೆನಪಿಸು",
        "aata aadu": "ಆಟ ಆಡು",
        "matthe heli": "ಮತ್ತೆ ಹೇಳಿ",
        "nidhanavagi mathadi": "ನಿಧಾನವಾಗಿ ಮಾತಾಡಿ",
        "nillisi": "ನಿಲ್ಲಿಸಿ",
        "naale": "ನಾಳೆ",
        "beligge": "ಬೆಳಿಗ್ಗೆ",
        "sanje": "ಸಂಜೆ",
        "houdu": "ಹೌದು",
        "sari": "ಸರಿ",
        "illa": "ಇಲ್ಲ",
        "beda": "ಬೇಡ",
    },
    "ml-IN": {
        "ammaye vilikku": "അമ്മയെ വിളിക്കൂ",
        "appane vilikku": "അപ്പനെ വിളിക്കൂ",
        "marunnu reminder": "മരുന്ന് ഓർമ്മിപ്പിക്കൂ",
        "vellam reminder": "വെള്ളം ഓർമ്മിപ്പിക്കൂ",
        "kali kalikku": "കളി കളിക്കൂ",
        "veendum parayoo": "വീണ്ടും പറയൂ",
        "patukke samsarikkoo": "പതുക്കെ സംസാരിക്കൂ",
        "nirthoo": "നിർത്തൂ",
        "naale": "നാളെ",
        "ravile": "രാവിലെ",
        "athe": "അതെ",
        "alla": "അല്ല",
    },
    "bn-IN": {
        "ma ke call koro": "মাকে ফোন করো",
        "baba ke call koro": "বাবাকে ফোন করো",
        "oushodh mone korao": "ওষুধ মনে করাও",
        "jol reminder": "জল মনে করাও",
        "khela khorbo": "খেলা খেলব",
        "aabar bolo": "আবার বলো",
        "aaste kotha bolo": "আস্তে কথা বলো",
        "thaamo": "থামো",
        "kaal": "কাল",
        "shokal": "সকাল",
        "hyan": "হ্যাঁ",
        "thik aache": "ঠিক আছে",
        "na": "না",
    },
}


class LanguageService:
    @staticmethod
    def get_capabilities(code: Optional[str] = None) -> Any:
        if code:
            return LANGUAGE_CATALOG.get(code)
        return LANGUAGE_CATALOG

    @staticmethod
    def detect_script_language(text: str) -> Optional[str]:
        for ch in text:
            code = ord(ch)
            if 0x0C00 <= code <= 0x0C7F:
                return "te-IN"
            if 0x0900 <= code <= 0x097F:
                return "hi-IN"
            if 0x0B80 <= code <= 0x0BFF:
                return "ta-IN"
            if 0x0C80 <= code <= 0x0CFF:
                return "kn-IN"
            if 0x0D00 <= code <= 0x0D7F:
                return "ml-IN"
            if 0x0980 <= code <= 0x09FF:
                return "bn-IN"
            if 0x0A80 <= code <= 0x0AFF:
                return "gu-IN"
            if 0x0A00 <= code <= 0x0A7F:
                return "pa-IN"
            if 0x0B00 <= code <= 0x0B7F:
                return "or-IN"
        return None

    @staticmethod
    def clean_elder_hesitation(text: str) -> str:
        """Strips filler words, ellipsis pauses, and elder hesitation sounds."""
        # Replace ellipsis and dots with spaces
        t = re.sub(r"[\.]{2,}|…", " ", text)
        filler_set = {
            "um", "umm", "ummm", "uh", "uhh", "aa", "aaa", "amm", "hmm", "hmmm", "uhm",
            "అది", "ఆ", "ఉం", "అమ్మో", "అయ్యో",
            "वो", "मतलब", "उम",
            "that",
        }
        tokens = [w.strip() for w in t.split()]
        filtered = [w for w in tokens if w.lower() not in filler_set]
        return " ".join(filtered).strip()

    @classmethod
    def normalize_transcript(cls, raw_text: str, default_lang: str = "te-IN") -> Tuple[str, str]:
        """
        Normalizes raw transcript:
        1. Strips elder hesitation pauses.
        2. Detects script or Romanized regional speech.
        3. Maps colloquial expressions and slang to canonical terms.
        Returns: (normalized_text, detected_language)
        """
        cleaned = cls.clean_elder_hesitation(raw_text)
        script_lang = cls.detect_script_language(cleaned)

        detected_lang = script_lang or default_lang
        lower_cleaned = cleaned.lower()

        # Check Romanized phrase patterns
        for lang_code, phrases in ROMANIZED_PHRASES.items():
            for roman, canonical in phrases.items():
                if roman in lower_cleaned:
                    detected_lang = lang_code
                    # replace Romanized token with canonical phrase
                    lower_cleaned = re.sub(rf"\b{re.escape(roman)}\b", canonical, lower_cleaned)

        return lower_cleaned.strip(), detected_lang

    @classmethod
    def detect_code_switch(cls, text: str) -> Dict[str, Any]:
        """
        Detects if user is code-switching between regional language & English.
        Example: 'Medicine reminder పెట్టు', 'Amma ki call cheyyi please'
        """
        has_english_words = bool(re.search(r"\b(medicine|reminder|water|game|call|phone|please|play|stop|slow|today|tomorrow)\b", text, re.IGNORECASE))
        has_regional_script = bool(cls.detect_script_language(text))
        has_romanized_tokens = any(k in text.lower() for k in ["cheyyi", "pettu", "gurtu", "laga", "aata", "khel", "pannu", "maadu", "vilikku"])

        is_code_switching = has_english_words and (has_regional_script or has_romanized_tokens)
        return {
            "is_code_switching": is_code_switching,
            "has_english": has_english_words,
            "has_regional": has_regional_script or has_romanized_tokens,
        }
