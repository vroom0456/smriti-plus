"""
SMRITI+ — Voice Providers Package

Exports unified abstractions, registry, and concrete providers.
"""

from app.voice.providers.base import (
    STTProvider,
    TTSProvider,
    STTConfig,
    TTSConfig,
    STTResult,
    TTSResult,
    TranscriptWord,
    ProviderHealth,
    ProviderStatus,
    VoiceProviderRegistry,
    VoiceProviderError,
    UnsupportedLanguageError,
    LowConfidenceError,
)
from app.voice.providers.google_stt import GoogleSTTProvider
from app.voice.providers.google_tts import GoogleTTSProvider

# Initialize default providers into registry
VoiceProviderRegistry.register_stt(GoogleSTTProvider(), default=True)
VoiceProviderRegistry.register_tts(GoogleTTSProvider(), default=True)

__all__ = [
    "STTProvider",
    "TTSProvider",
    "STTConfig",
    "TTSConfig",
    "STTResult",
    "TTSResult",
    "TranscriptWord",
    "ProviderHealth",
    "ProviderStatus",
    "VoiceProviderRegistry",
    "VoiceProviderError",
    "UnsupportedLanguageError",
    "LowConfidenceError",
    "GoogleSTTProvider",
    "GoogleTTSProvider",
]
