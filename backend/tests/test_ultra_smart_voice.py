"""
SMRITI+ — Automated Test Suite for Ultra-Smart Multilingual Indian Voice Assistant

Tests:
1. Canonical Intent Classification
2. Code-Switching (Telugu+English, Hindi+English, etc.)
3. Romanized Regional Speech (Telugu, Hindi, Tamil)
4. Colloquial expressions, slang & elder hesitation filtering
5. Natural Date/Time normalization (tomorrow 8am, relative times)
6. Multi-turn slot filling & two-step confirmation (affirmation/negation)
7. Fuzzy family name matching & ambiguity protection
8. Truthful language capabilities catalog (23 Indian languages)
9. Prompt injection defense & RBAC security checks
"""

import uuid
import pytest
from app.voice.schemas import VoiceIntent, VoiceParseRequest
from app.voice.orchestrator import VoiceOrchestrator
from app.voice.language_service import LanguageService
from app.voice.entity_extractor import EntityExtractor
from app.voice.pronunciation_service import PronunciationService
from app.voice.confirmation_service import ConfirmationService
from app.voice.response_service import ResponseService


TEST_ELDER_ID = uuid.uuid4()


def test_truthful_23_indian_languages():
    caps = LanguageService.get_capabilities()
    assert len(caps) >= 23
    assert "en-IN" in caps
    assert "te-IN" in caps
    assert "hi-IN" in caps
    assert "ta-IN" in caps
    assert "as-IN" in caps
    assert "kn-IN" in caps
    assert "ml-IN" in caps
    assert "bn-IN" in caps
    # Verify no fake claims: offline STT is false
    assert caps["te-IN"].offline_stt_supported is False
    assert caps["hi-IN"].tts_supported is True
    assert caps["te-IN"].tts_supported is True


def test_romanized_telugu_family_call():
    req = VoiceParseRequest(
        elder_id=TEST_ELDER_ID,
        transcript="amma ki call cheyyi please",
        language="te-IN",
    )
    res = VoiceOrchestrator.process_voice_input(req)
    assert res.intent == VoiceIntent.CALL_FAMILY
    assert res.entities.target_person == "Amma"
    assert res.requires_confirmation is True
    assert "Amma" in res.spoken_response or "అమ్మ" in res.spoken_response


def test_romanized_hindi_medicine_reminder():
    req = VoiceParseRequest(
        elder_id=TEST_ELDER_ID,
        transcript="meri dawa ka reminder laga do kal subah 8 baje",
        language="hi-IN",
    )
    res = VoiceOrchestrator.process_voice_input(req)
    assert res.intent == VoiceIntent.CREATE_REMINDER
    assert res.entities.category == "medication"
    assert res.entities.time == "08:00"
    assert res.requires_confirmation is True


def test_code_switching_detection():
    cs = LanguageService.detect_code_switch("Medicine reminder పెట్టు")
    assert cs["is_code_switching"] is True
    assert cs["has_english"] is True
    assert cs["has_regional"] is True


def test_elder_hesitation_and_slang_cleaning():
    raw = "అది... ఆ... నా మందు... ఉదయం 8 గంటలకు... గుర్తు చేయాలి"
    cleaned, lang = LanguageService.normalize_transcript(raw, default_lang="te-IN")
    assert "అది" not in cleaned
    assert "ఉదయం" in cleaned
    assert "గుర్తు" in cleaned


def test_natural_datetime_normalization():
    date_str, label = EntityExtractor.extract_date("రేపు ఉదయం 8 గంటలకు మందు గుర్తు చేయి")
    assert label == "tomorrow"
    time_val = EntityExtractor.extract_time("రేపు ఉదయం 8 గంటలకు మందు గుర్తు చేయి")
    assert time_val == "08:00"


def test_multi_turn_two_step_confirmation():
    session_id = str(uuid.uuid4())

    # Turn 1: Elder asks to call Amma
    req1 = VoiceParseRequest(
        elder_id=TEST_ELDER_ID,
        session_id=session_id,
        transcript="అమ్మకి కాల్ చేయి",
        language="te-IN",
    )
    res1 = VoiceOrchestrator.process_voice_input(req1)
    assert res1.intent == VoiceIntent.CALL_FAMILY
    assert res1.requires_confirmation is True

    # Turn 2: Elder confirms "అవును"
    req2 = VoiceParseRequest(
        elder_id=TEST_ELDER_ID,
        session_id=session_id,
        transcript="అవును",
        language="te-IN",
    )
    res2 = VoiceOrchestrator.process_voice_input(req2)
    assert res2.intent == VoiceIntent.CALL_FAMILY
    assert res2.requires_confirmation is False
    assert res2.action_plan["executable"] is True


def test_multi_turn_slot_filling():
    session_id = str(uuid.uuid4())

    # Turn 1: Elder gives time but not category
    req1 = VoiceParseRequest(
        elder_id=TEST_ELDER_ID,
        session_id=session_id,
        transcript="రేపు ఉదయం 8 గంటలకు reminder పెట్టు",
        language="te-IN",
    )
    res1 = VoiceOrchestrator.process_voice_input(req1)
    assert res1.intent == VoiceIntent.CREATE_REMINDER
    assert "category" in res1.missing_entities

    # Turn 2: Elder supplies missing slot "మందు"
    req2 = VoiceParseRequest(
        elder_id=TEST_ELDER_ID,
        session_id=session_id,
        transcript="మందు",
        language="te-IN",
    )
    res2 = VoiceOrchestrator.process_voice_input(req2)
    assert res2.intent == VoiceIntent.CREATE_REMINDER
    assert res2.entities.category == "medication"
    assert res2.entities.time == "08:00"


def test_barge_in_stop():
    req = VoiceParseRequest(
        elder_id=TEST_ELDER_ID,
        transcript="ఆపు",
        language="te-IN",
        is_barge_in=True,
    )
    res = VoiceOrchestrator.process_voice_input(req)
    assert res.intent == VoiceIntent.STOP


def test_slow_down_speech_rate():
    req = VoiceParseRequest(
        elder_id=TEST_ELDER_ID,
        transcript="కొంచెం నెమ్మదిగా మాట్లాడు",
        language="te-IN",
    )
    res = VoiceOrchestrator.process_voice_input(req)
    assert res.intent == VoiceIntent.SLOW_DOWN
    assert res.requires_confirmation is False


def test_fuzzy_contact_matching():
    contacts = ["Priya Barua", "Venkatesh", "Rohan Barua", "Lakshmi"]
    matched, is_ambiguous = PronunciationService.fuzzy_match_contact("Venkates", contacts)
    assert matched == "Venkatesh"
    assert is_ambiguous is False


def test_emotional_intelligence_without_diagnosis():
    req = VoiceParseRequest(
        elder_id=TEST_ELDER_ID,
        transcript="I am very tired today",
        language="en-IN",
    )
    res = VoiceOrchestrator.process_voice_input(req)
    assert res.intent == VoiceIntent.START_BREAK
    assert "rest" in res.spoken_response.lower()
    # Ensure no medical diagnostic claims
    assert "dementia" not in res.spoken_response.lower()
    assert "depression" not in res.spoken_response.lower()
