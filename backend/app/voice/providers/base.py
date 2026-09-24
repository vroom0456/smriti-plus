"""
SMRITI+ — Voice Provider Abstraction Layer

Provider-independent interfaces for STT, TTS, and voice cloning.
Concrete implementations live in providers/. The app code imports
only these interfaces — swap providers without touching business logic.

SECURITY: All provider API secrets must reside in backend environment
variables. Never expose them to the mobile client.
"""

from __future__ import annotations

import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from typing import AsyncIterator, Dict, List, Optional


# ─── Common types ─────────────────────────────────────────────────────────────

class ProviderStatus(str, Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNAVAILABLE = "unavailable"


@dataclass
class ProviderHealth:
    provider: str
    status: ProviderStatus
    latency_ms: Optional[float] = None
    message: Optional[str] = None
    checked_at: float = field(default_factory=time.time)


@dataclass
class TranscriptWord:
    word: str
    start_time: float
    end_time: float
    confidence: float


@dataclass
class STTResult:
    """Result from a speech-to-text operation."""
    transcript: str
    confidence: float
    language_detected: str
    is_final: bool
    words: List[TranscriptWord] = field(default_factory=list)
    provider: str = "unknown"
    latency_ms: Optional[float] = None
    # True when the provider flagged low confidence — trigger re-prompt
    low_confidence: bool = False


@dataclass
class TTSResult:
    """Result from a text-to-speech synthesis request."""
    audio_bytes: bytes
    audio_format: str          # "mp3", "wav", "ogg"
    sample_rate: int           # e.g. 22050
    duration_ms: int
    provider: str = "unknown"
    latency_ms: Optional[float] = None


@dataclass
class STTConfig:
    language_code: str                      # BCP-47, e.g. "te-IN"
    sample_rate: int = 16000
    encoding: str = "LINEAR16"
    enable_word_timestamps: bool = False
    enable_automatic_punctuation: bool = True
    model: Optional[str] = None             # provider-specific model hint
    timeout_seconds: float = 10.0
    max_retries: int = 2


@dataclass
class TTSConfig:
    language_code: str                      # BCP-47, e.g. "te-IN"
    voice_id: Optional[str] = None         # provider voice ID
    speech_rate: float = 0.85              # 0.5–2.0; 0.85 suits elders
    pitch: float = 0.0                     # semitones offset
    volume_gain_db: float = 0.0
    audio_format: str = "mp3"
    sample_rate: int = 22050
    timeout_seconds: float = 15.0
    max_retries: int = 2
    # SSML if provider supports it; plain text otherwise
    use_ssml: bool = False


# ─── Abstract interfaces ────────────────────────────────────────────────────

class STTProvider(ABC):
    """Abstract speech-to-text provider."""

    @property
    @abstractmethod
    def provider_name(self) -> str: ...

    @abstractmethod
    async def transcribe(
        self,
        audio_bytes: bytes,
        config: STTConfig,
    ) -> STTResult:
        """
        Transcribe a complete audio buffer.
        Raises VoiceProviderError on unrecoverable failure.
        """
        ...

    @abstractmethod
    async def stream_transcribe(
        self,
        audio_stream: AsyncIterator[bytes],
        config: STTConfig,
    ) -> AsyncIterator[STTResult]:
        """
        Streaming recognition — yields partial and final results.
        Implementations that don't support streaming should buffer
        and yield a single final result.
        """
        ...

    @abstractmethod
    async def health_check(self) -> ProviderHealth: ...


class TTSProvider(ABC):
    """Abstract text-to-speech provider."""

    @property
    @abstractmethod
    def provider_name(self) -> str: ...

    @abstractmethod
    def list_voices(self, language_code: str) -> List[Dict]: ...

    @abstractmethod
    async def synthesize(
        self,
        text: str,
        config: TTSConfig,
    ) -> TTSResult:
        """
        Synthesize speech for the full text.
        text may be SSML if config.use_ssml is True and the provider
        supports it; plain text otherwise.
        """
        ...

    @abstractmethod
    async def synthesize_streaming(
        self,
        text: str,
        config: TTSConfig,
    ) -> AsyncIterator[bytes]:
        """
        Streaming synthesis — yields audio chunks as they are produced.
        Allows the client to start playback before the full text is
        synthesized.
        """
        ...

    @abstractmethod
    async def health_check(self) -> ProviderHealth: ...


# ─── Provider registry ────────────────────────────────────────────────────────

class VoiceProviderRegistry:
    """
    Singleton that holds named STT/TTS provider instances.
    Wire providers at application startup; swap by name without restarting.
    """

    _stt: Dict[str, STTProvider] = {}
    _tts: Dict[str, TTSProvider] = {}
    _default_stt: Optional[str] = None
    _default_tts: Optional[str] = None

    @classmethod
    def register_stt(cls, provider: STTProvider, default: bool = False) -> None:
        cls._stt[provider.provider_name] = provider
        if default or cls._default_stt is None:
            cls._default_stt = provider.provider_name

    @classmethod
    def register_tts(cls, provider: TTSProvider, default: bool = False) -> None:
        cls._tts[provider.provider_name] = provider
        if default or cls._default_tts is None:
            cls._default_tts = provider.provider_name

    @classmethod
    def get_stt(cls, name: Optional[str] = None) -> STTProvider:
        key = name or cls._default_stt
        if not key or key not in cls._stt:
            raise VoiceProviderError(f"STT provider '{key}' not registered.")
        return cls._stt[key]

    @classmethod
    def get_tts(cls, name: Optional[str] = None) -> TTSProvider:
        key = name or cls._default_tts
        if not key or key not in cls._tts:
            raise VoiceProviderError(f"TTS provider '{key}' not registered.")
        return cls._tts[key]

    @classmethod
    def stt_names(cls) -> List[str]:
        return list(cls._stt.keys())

    @classmethod
    def tts_names(cls) -> List[str]:
        return list(cls._tts.keys())


# ─── Errors ───────────────────────────────────────────────────────────────────

class VoiceProviderError(Exception):
    """Raised when a voice provider fails unrecoverably."""

    def __init__(self, message: str, provider: str = "unknown", retryable: bool = False):
        super().__init__(message)
        self.provider = provider
        self.retryable = retryable


class UnsupportedLanguageError(VoiceProviderError):
    """Raised when a provider doesn't support the requested language."""
    pass


class LowConfidenceError(VoiceProviderError):
    """Raised when STT confidence is below the configured threshold."""
    pass
