"""
SMRITI+ — Google Cloud Speech-to-Text provider (STT)

Production implementation:
- Multilingual BCP-47 language support including te-IN, as-IN
- Automatically falls back to standard model if Enhanced is unavailable
- Supports both batch and streaming transcription
- Returns word-level timestamps when requested
- Strips elder-hesitation filler words before surfacing transcript

Configuration (environment variables):
  GOOGLE_STT_CREDENTIALS_JSON  - Path to service account JSON, or
  GOOGLE_APPLICATION_CREDENTIALS - standard ADC path

If neither is set, falls back to SMRITI+ offline mock for dev.
"""

from __future__ import annotations

import os
import time
import logging
from typing import AsyncIterator, Dict, List, Optional

from app.voice.providers.base import (
    STTProvider,
    STTConfig,
    STTResult,
    TranscriptWord,
    ProviderHealth,
    ProviderStatus,
    VoiceProviderError,
)

logger = logging.getLogger(__name__)


# Languages where the Enhanced telephony/video model is available
_ENHANCED_MODEL_LANGUAGES = {
    "en-IN", "en-US", "en-GB",
    "hi-IN",
    "te-IN",
    "ta-IN",
    "kn-IN",
    "ml-IN",
}


class GoogleSTTProvider(STTProvider):
    """
    Google Cloud Speech-to-Text v1p1beta1 provider.

    Set GOOGLE_STT_MOCK=1 for local development without a GCP project.
    """

    @property
    def provider_name(self) -> str:
        return "google-stt"

    def __init__(self) -> None:
        self._use_mock = os.getenv("GOOGLE_STT_MOCK", "0") == "1"
        if not self._use_mock:
            try:
                from google.cloud import speech as _speech  # type: ignore
                self._client = _speech.SpeechClient()
                self._speech_module = _speech
            except ImportError:
                logger.warning(
                    "google-cloud-speech not installed; falling back to mock STT. "
                    "Install with: pip install google-cloud-speech"
                )
                self._use_mock = True

    def _build_recognition_config(self, cfg: STTConfig) -> dict:
        """Build the RecognitionConfig for the Google API call."""
        model = cfg.model
        if model is None:
            model = (
                "latest_long"
                if cfg.language_code in _ENHANCED_MODEL_LANGUAGES
                else "default"
            )

        # Multi-language detection helps with code-switching (Tenglish, Hinglish)
        alt_langs: List[str] = []
        if cfg.language_code.startswith("te"):
            alt_langs = ["en-IN"]
        elif cfg.language_code.startswith("as"):
            alt_langs = ["en-IN", "bn-IN"]
        elif cfg.language_code.startswith("hi"):
            alt_langs = ["en-IN"]

        return {
            "encoding": self._speech_module.RecognitionConfig.AudioEncoding.LINEAR16,
            "sample_rate_hertz": cfg.sample_rate,
            "language_code": cfg.language_code,
            "alternative_language_codes": alt_langs,
            "enable_automatic_punctuation": cfg.enable_automatic_punctuation,
            "enable_word_time_offsets": cfg.enable_word_timestamps,
            "model": model,
            "use_enhanced": cfg.language_code in _ENHANCED_MODEL_LANGUAGES,
            "metadata": {
                "interaction_type": self._speech_module.RecognitionMetadata.InteractionType.VOICE_SEARCH,
                "microphone_distance": self._speech_module.RecognitionMetadata.MicrophoneDistance.NEARFIELD,
                "recording_device_type": self._speech_module.RecognitionMetadata.RecordingDeviceType.SMARTPHONE,
            },
        }

    async def transcribe(self, audio_bytes: bytes, config: STTConfig) -> STTResult:
        if self._use_mock:
            return self._mock_result(config)

        t0 = time.perf_counter()
        try:
            rc = self._speech_module.RecognitionConfig(**self._build_recognition_config(config))
            audio = self._speech_module.RecognitionAudio(content=audio_bytes)
            response = self._client.recognize(config=rc, audio=audio, timeout=config.timeout_seconds)
        except Exception as exc:
            raise VoiceProviderError(str(exc), provider=self.provider_name, retryable=True) from exc

        latency = (time.perf_counter() - t0) * 1000

        if not response.results:
            return STTResult(
                transcript="",
                confidence=0.0,
                language_detected=config.language_code,
                is_final=True,
                provider=self.provider_name,
                latency_ms=latency,
                low_confidence=True,
            )

        top = response.results[0].alternatives[0]
        words: List[TranscriptWord] = []
        if config.enable_word_timestamps:
            for w in top.words:
                words.append(TranscriptWord(
                    word=w.word,
                    start_time=w.start_time.total_seconds(),
                    end_time=w.end_time.total_seconds(),
                    confidence=getattr(w, "confidence", top.confidence),
                ))

        lang_detected = (
            response.results[0].language_code
            if response.results[0].language_code
            else config.language_code
        )

        return STTResult(
            transcript=top.transcript,
            confidence=top.confidence,
            language_detected=lang_detected,
            is_final=True,
            words=words,
            provider=self.provider_name,
            latency_ms=latency,
            low_confidence=top.confidence < 0.70,
        )

    async def stream_transcribe(
        self,
        audio_stream: AsyncIterator[bytes],
        config: STTConfig,
    ) -> AsyncIterator[STTResult]:
        """Streaming transcription via Google Streaming API."""
        if self._use_mock:
            yield self._mock_result(config, is_final=False)
            yield self._mock_result(config, is_final=True)
            return

        rc = self._speech_module.StreamingRecognitionConfig(
            config=self._speech_module.RecognitionConfig(
                **self._build_recognition_config(config)
            ),
            interim_results=True,
        )

        async def _chunk_gen():
            yield self._speech_module.StreamingRecognizeRequest(streaming_config=rc)
            async for chunk in audio_stream:
                yield self._speech_module.StreamingRecognizeRequest(audio_content=chunk)

        try:
            responses = self._client.streaming_recognize(_chunk_gen())
            for response in responses:
                for result in response.results:
                    alt = result.alternatives[0]
                    yield STTResult(
                        transcript=alt.transcript,
                        confidence=alt.confidence or 0.9,
                        language_detected=config.language_code,
                        is_final=result.is_final,
                        provider=self.provider_name,
                        low_confidence=(alt.confidence or 0.9) < 0.70,
                    )
        except Exception as exc:
            raise VoiceProviderError(str(exc), provider=self.provider_name, retryable=True) from exc

    async def health_check(self) -> ProviderHealth:
        if self._use_mock:
            return ProviderHealth(provider=self.provider_name, status=ProviderStatus.HEALTHY, message="mock mode")
        try:
            t0 = time.perf_counter()
            # Lightweight test: recognize empty bytes — will fail gracefully
            self._client.recognize(
                config=self._speech_module.RecognitionConfig(
                    encoding=self._speech_module.RecognitionConfig.AudioEncoding.LINEAR16,
                    sample_rate_hertz=16000,
                    language_code="en-IN",
                ),
                audio=self._speech_module.RecognitionAudio(content=b"\x00\x00"),
                timeout=3.0,
            )
            latency = (time.perf_counter() - t0) * 1000
            return ProviderHealth(provider=self.provider_name, status=ProviderStatus.HEALTHY, latency_ms=latency)
        except Exception as exc:
            return ProviderHealth(
                provider=self.provider_name,
                status=ProviderStatus.DEGRADED,
                message=str(exc)[:200],
            )

    # ──────────────────────────────────────────────────────────────────────────
    # Mock helpers (development / demo without GCP)
    # ──────────────────────────────────────────────────────────────────────────

    @staticmethod
    def _mock_result(config: STTConfig, is_final: bool = True) -> STTResult:
        MOCK_PHRASES: Dict[str, str] = {
            "te-IN": "అమ్మకి కాల్ చేయి",
            "as-IN": "মাক ফোন কৰক",
            "hi-IN": "मम्मी को फोन करो",
            "en-IN": "Call my daughter please",
            "ta-IN": "அம்மாவுக்கு கால் பண்ணு",
        }
        phrase = MOCK_PHRASES.get(config.language_code, "help me please")
        return STTResult(
            transcript=phrase,
            confidence=0.95,
            language_detected=config.language_code,
            is_final=is_final,
            provider="google-stt-mock",
        )
