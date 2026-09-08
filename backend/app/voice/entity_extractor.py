"""
SMRITI+ — Multilingual Entity Extractor

Extracts and normalizes:
- Canonical Date (today, tomorrow, day after tomorrow, relative dates across Indian languages)
- Canonical Time (24-hr HH:MM, natural times like morning/evening/after lunch)
- Reminder categories (medication, hydration, appointment, general)
- Family contact targets & honorifics (Amma, Nanna, Papa, Mummy, Daughter, Son, etc.)
- Game categories
"""

import re
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, Tuple
from app.voice.schemas import ExtractedEntities


# Natural time slots
TIME_SLOT_MAP = {
    "morning": "08:00",
    "subah": "08:00",
    "udayam": "08:00",
    "ఉదయం": "08:00",
    "सुबह": "08:00",
    "காலை": "08:00",
    "ಬೆಳಿಗ್ಗೆ": "08:00",
    "সকাল": "08:00",
    "afternoon": "13:00",
    "dopahar": "13:00",
    "madhyahnam": "13:00",
    "మధ్యాహ్నం": "13:00",
    "दोपहर": "13:00",
    "after lunch": "13:30",
    "evening": "18:00",
    "shaam": "18:00",
    "sayantram": "18:00",
    "సాయంత్రం": "18:00",
    "शाम": "18:00",
    "மாலை": "18:00",
    "ಸಂಜೆ": "18:00",
    "night": "20:00",
    "raat": "20:00",
    "ratri": "20:00",
    "రాత్రి": "20:00",
    "रात": "20:00",
    "இரவு": "20:00",
    "ರಾತ್ರಿ": "20:00",
}

# Spoken number to digit map
SPOKEN_DIGITS = {
    "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
    "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
    "eleven": 11, "twelve": 12,
    "ఒకటి": 1, "రెండు": 2, "మూడు": 3, "నాలుగు": 4, "ఐదు": 5,
    "ఆరు": 6, "ఏడు": 7, "ఎనిమిది": 8, "తొమ్మిది": 9, "పది": 10,
    "एक": 1, "दो": 2, "तीन": 3, "चार": 4, "पाँच": 5,
    "छह": 6, "सात": 7, "आठ": 8, "नौ": 9, "दस": 10,
}

MEDICATION_TOKENS = [
    "medicine", "pill", "tablet", "dawa", "dawakhana", "syrup",
    "మందు", "మందులు", "దవా", "दवा", "दवाई", "மருந்து", "ಔಷಧಿ", "ঔষধ", "দৰব",
]

HYDRATION_TOKENS = [
    "water", "pani", "water bottle", "hydrate",
    "నీళ్లు", "నీరు", "पानी", "தண்ணீர்", "জল", "পানী",
]

FAMILY_TOKENS = {
    "amma": ("Amma", "Mother"),
    "अम्मा": ("Amma", "Mother"),
    "అమ్మ": ("Amma", "Mother"),
    "அம்மா": ("Amma", "Mother"),
    "ಅಮ್ಮ": ("Amma", "Mother"),
    "mummy": ("Mummy", "Mother"),
    "mother": ("Mother", "Mother"),
    "nanna": ("Nanna", "Father"),
    "నాన్న": ("Nanna", "Father"),
    "papa": ("Papa", "Father"),
    "पापा": ("Papa", "Father"),
    "father": ("Father", "Father"),
    "daughter": ("Daughter", "Daughter"),
    "son": ("Son", "Son"),
    "priya": ("Priya Barua", "Daughter"),
    "rohan": ("Rohan Barua", "Son"),
    "ravi": ("Ravi", "Family Member"),
    "didi": ("Didi", "Elder Sister"),
    "akka": ("Akka", "Elder Sister"),
    "anna": ("Anna", "Elder Brother"),
    "bhaiya": ("Bhaiya", "Elder Brother"),
}


class EntityExtractor:
    @classmethod
    def extract_date(cls, text: str) -> Tuple[str, str]:
        """
        Extracts canonical ISO date string and relative day description.
        Returns: (YYYY-MM-DD, label)
        """
        now = datetime.now(timezone.utc)
        lower = text.lower()

        if any(w in lower for w in ["tomorrow", "repu", "రేపు", "kal", "कल", "naalai", "நாளை", "naale", "ನಾಳೆ", "কাল"]):
            target = now + timedelta(days=1)
            return target.strftime("%Y-%m-%d"), "tomorrow"

        if any(w in lower for w in ["day after tomorrow", "ellundi", "ఎల్లుండి", "parson", "परसों", "மறுநாள்"]):
            target = now + timedelta(days=2)
            return target.strftime("%Y-%m-%d"), "day_after_tomorrow"

        # Default is today
        return now.strftime("%Y-%m-%d"), "today"

    @classmethod
    def extract_time(cls, text: str) -> Optional[str]:
        """
        Extracts 24-hr format HH:MM time string.
        Handles numeric times (e.g. 8:00, 8 am, 8 pm, 8 గంటలకు, 8 बजे),
        spoken words (eight, ఎనిమిది, आठ), and natural time slots (morning, evening, night).
        """
        lower = text.lower()

        # 1. Regex for explicit digital times e.g. "8:30" or "08:30"
        m_digital = re.search(r"\b(\d{1,2}):(\d{2})\b", lower)
        if m_digital:
            hour = int(m_digital.group(1))
            minute = int(m_digital.group(2))
            return f"{hour:02d}:{minute:02d}"

        # 2. Check for numeric clock hours with AM/PM or markers e.g. "8 am", "8 pm", "8 baje", "8 గంటలకు"
        m_clock = re.search(r"\b(\d{1,2})\s*(am|pm|baje|o'clock|గంటల|గంటలకు|மணிக்கு)?\b", lower)
        if m_clock:
            raw_hour = int(m_clock.group(1))
            modifier = m_clock.group(2)
            if 1 <= raw_hour <= 24:
                hour = raw_hour
                if modifier == "pm" and hour < 12:
                    hour += 12
                elif modifier == "am" and hour == 12:
                    hour = 0
                return f"{hour:02d}:00"

        # 3. Check for spoken number words e.g. "eight", "ఎనిమిది", "आठ"
        for word, val in SPOKEN_DIGITS.items():
            if re.search(rf"\b{re.escape(word)}\b", lower):
                return f"{val:02d}:00"

        # 4. Check natural slots (morning, afternoon, evening, night)
        for slot_key, slot_val in TIME_SLOT_MAP.items():
            if slot_key in lower:
                return slot_val

        return None

    @classmethod
    def extract_category(cls, text: str) -> Optional[str]:
        lower = text.lower()
        if any(t in lower for t in MEDICATION_TOKENS):
            return "medication"
        if any(t in lower for t in HYDRATION_TOKENS):
            return "hydration"
        if any(t in lower for t in ["doctor", "hospital", "clinic", "డాక్టర్", "மருத்துவர்"]):
            return "appointment"
        return None

    @classmethod
    def extract_family_target(cls, text: str) -> Tuple[Optional[str], Optional[str]]:
        lower = text.lower()
        for token, (person_name, rel) in FAMILY_TOKENS.items():
            if token in lower:
                return person_name, rel
        return None, None

    @classmethod
    def extract_all(cls, transcript: str, language: str = "te-IN") -> ExtractedEntities:
        iso_date, _ = cls.extract_date(transcript)
        time_val = cls.extract_time(transcript)
        cat = cls.extract_category(transcript)
        person, rel = cls.extract_family_target(transcript)

        # Game detection
        game_cat = None
        lower = transcript.lower()
        if "matching" in lower or "జత" in lower:
            game_cat = "memory_matching"
        elif "recall" in lower or "గుర్తు" in lower:
            game_cat = "memory_recall"
        elif "pattern" in lower or "క్రమం" in lower:
            game_cat = "pattern_recognition"
        elif "attention" in lower or "దృష్టి" in lower:
            game_cat = "attention"

        recurrence = "daily" if cat == "medication" else ("every_2_hours" if cat == "hydration" else "once")

        return ExtractedEntities(
            category=cat,
            date=iso_date,
            time=time_val,
            recurrence=recurrence,
            target_person=person,
            target_relationship=rel,
            game_category=game_cat,
        )
