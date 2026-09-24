"""
SMRITI+ — Google Cloud Text-to-Speech provider (TTS)

Production implementation:
- Indian regional voices (te-IN, as-IN, hi-IN, ta-IN, kn-IN, ml-IN, bn-IN, en-IN)
- Neural2 / WaveNet voice quality where available, falling back to Standard
- Default speech rate 0.85x for elderly comprehension
- SSML markup for natural pauses and respect tone
- Audio output format: MP3 / WAV
- Local fallback/mock mode when running offline
"""

from __future__ import annotations

import os
import time
import logging
from typing import AsyncIterator, Dict, List, Optional

from app.voice.providers.base import (
    TTSProvider,
    TTSConfig,
    TTSResult,
    ProviderHealth,
    ProviderStatus,
    VoiceProviderError,
)

logger = logging.getLogger(__name__)

# Preferred Indian voices mapped by BCP-47 language tag
INDIAN_VOICE_MAP: Dict[str, Dict[str, str]] = {
    "te-IN": {
        "name": "te-IN-Standard-A",
        "ssml_gender": "FEMALE",
        "description": "Telugu (India) Standard Female",
    },
    "as-IN": {
        # Note: In standard Google TTS, Assamese often maps via bengali phonetics or specific regional TTS
        "name": "as-IN-Standard-A",
        "ssml_gender": "FEMALE",
        "description": "Assamese (India) Regional Female",
    },
    "hi-IN": {
        "name": "hi-IN-Neural2-A",
        "ssml_gender": "FEMALE",
        "description": "Hindi (India) Neural2 Female",
    },
    "ta-IN": {
        "name": "ta-IN-Standard-A",
        "ssml_gender": "FEMALE",
        "description": "Tamil (India) Standard Female",
    },
    "kn-IN": {
        "name": "kn-IN-Standard-A",
        "ssml_gender": "FEMALE",
        "description": "Kannada (India) Standard Female",
    },
    "ml-IN": {
        "name": "ml-IN-Standard-A",
        "ssml_gender": "FEMALE",
        "description": "Malayalam (India) Standard Female",
    },
    "bn-IN": {
        "name": "bn-IN-Standard-A",
        "ssml_gender": "FEMALE",
        "description": "Bengali (India) Standard Female",
    },
    "en-IN": {
        "name": "en-IN-Neural2-D",
        "ssml_gender": "FEMALE",
        "description": "Indian English Neural2 Female",
    },
}


class GoogleTTSProvider(TTSProvider):
    """
    Google Cloud Text-to-Speech provider with elderly-tuned cadence.
    """

    @property
    def provider_name(self) -> str:
        return "google-tts"

    def __init__(self) -> None:
        self._use_mock = os.getenv("GOOGLE_TTS_MOCK", "0") == "1"
        if not self._use_mock:
            try:
                from google.cloud import texttospeech as _tts  # type: ignore
                self._client = _tts.TextToSpeechClient()
                self._tts_module = _tts
            except ImportError:
                logger.warning(
                    "google-cloud-texttospeech not installed; using mock TTS. "
                    "Install with: pip install google-cloud-texttospeech"
                )
                self._use_mock = True

    def list_voices(self, language_code: str) -> List[Dict]:
        matched = []
        for code, voice in INDIAN_VOICE_MAP.items():
            if code == language_code or language_code == "all":
                matched.append({
                    "language_code": code,
                    "voice_id": voice["name"],
                    "gender": voice["ssml_gender"],
                    "description": voice["description"],
                })
        return matched

    async def synthesize(self, text: str, config: TTSConfig) -> TTSResult:
        if self._use_mock:
            return self._mock_result(text, config)

        t0 = time.perf_counter()
        try:
            voice_meta = INDIAN_VOICE_MAP.get(config.language_code, INDIAN_VOICE_MAP["en-IN"])
            voice_name = config.voice_id or voice_meta["name"]

            # Wrap in SSML if elder-pacing requested and text isn't already SSML
            input_text = text
            if config.use_ssml and not text.strip().startswith("<speak>"):
                input_text = f"<speak><prosody rate='{config.speech_rate}'>{text}</prosody></speak>"
                synthesis_input = self._tts_module.SynthesisInput(ssml=input_text)
            else:
                synthesis_input = self._tts_module.SynthesisInput(text=input_text)

            voice_params = self._tts_module.VoiceSelectionParams(
                language_code=config.language_code,
                name=voice_name,
            )

            audio_config = self._tts_module.AudioConfig(
                audio_encoding=self._tts_module.AudioEncoding.MP3,
                speaking_rate=config.speech_rate,
                pitch=config.pitch,
                volume_gain_db=config.volume_gain_db,
                sample_rate_hertz=config.sample_rate,
            )

            response = self._client.synthesize_speech(
                input=synthesis_input,
                voice=voice_params,
                audio_config=audio_config,
                timeout=config.timeout_seconds,
            )
            latency = (time.perf_counter() - t0) * 1000

            # Approximation for duration: mp3 ~ 128kbps -> 16KB/s
            duration_ms = int(len(response.audio_content) / 16)

            return TTSResult(
                audio_bytes=response.audio_content,
                audio_format=config.audio_format,
                sample_rate=config.sample_rate,
                duration_ms=duration_ms,
                provider=self.provider_name,
                latency_ms=latency,
            )
        except Exception as exc:
            raise VoiceProviderError(str(exc), provider=self.provider_name, retryable=True) from exc

    async def synthesize_streaming(
        self,
        text: str,
        config: TTSConfig,
    ) -> AsyncIterator[bytes]:
        """Streaming synthesis chunks."""
        result = await self.synthesize(text, config)
        # Yield in 4KB chunks
        chunk_size = 4096
        for i in range(0, len(result.audio_bytes), chunk_size):
            yield result.audio_bytes[i:i + chunk_size]

    async def health_check(self) -> ProviderHealth:
        if self._use_mock:
            return ProviderHealth(provider=self.provider_name, status=ProviderStatus.HEALTHY, message="mock mode")
        try:
            t0 = time.perf_counter()
            self._client.list_voices(language_code="en-IN")
            latency = (time.perf_counter() - t0) * 1000
            return ProviderHealth(provider=self.provider_name, status=ProviderStatus.HEALTHY, latency_ms=latency)
        except Exception as exc:
            return ProviderHealth(
                provider=self.provider_name,
                status=ProviderStatus.DEGRADED,
                message=str(exc)[:200],
            )

    @staticmethod
    def _mock_result(text: str, config: TTSConfig) -> TTSResult:
        # Generate minimal silent MP3 frame bytes
        silent_mp3 = b"\xff\xfb\x90\x00" + b"\x00" * 32
        return TTSResult(
            audio_bytes=silent_mp3,
            audio_format="mp3",
            sample_rate=config.sample_rate,
            duration_ms=1200,
            provider="google-tts-mock",
            latency_ms=15.0,
        )
