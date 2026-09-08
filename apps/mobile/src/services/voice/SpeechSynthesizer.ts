/**
 * SMRITI+ — Regional Speech Synthesizer
 *
 * Selects the most appropriate regional voice for each Indian language:
 *   - Assamese → as-IN female (calm, village-elder warm)
 *   - Hindi    → hi-IN female (साफ़, धीमी)
 *   - English  → en-IN female (Indian-accented, gentle)
 *
 * Elder-friendly defaults: rate 0.82, pitch 1.0.
 * Barge-in (cancel mid-speech) supported on all platforms.
 */

import { Platform } from 'react-native';
import * as Speech from 'expo-speech';
import { VoiceCapabilities } from './VoiceCapabilities';

export interface SpeechOptions {
  rate?: number;      // 0.75–1.0  (default 0.82 for elderly)
  pitch?: number;     // 0.9–1.1
  onDone?: () => void;
  onError?: (err: any) => void;
}

export interface SpeechSynthesizer {
  speak(text: string, language: string, options?: SpeechOptions): Promise<void>;
  stop(): Promise<void>;
  isAvailable(language: string): Promise<boolean>;
}

/**
 * Regional voice priority map.
 * Each entry lists Web Speech API `voice.name` substrings in preference order.
 * If none match, the browser's default voice for that BCP-47 locale is used.
 */
const REGIONAL_VOICE_PREFERENCE: Record<string, string[]> = {
  // NER priority languages
  'as-IN':   ['Assamese', 'as-IN', 'as_IN'],
  'brx-IN':  ['Bodo', 'brx', 'as-IN'],          // Bodo → fallback Assamese
  'mni-IN':  ['Manipuri', 'mni', 'bn-IN'],        // Meitei → fallback Bengali
  'ne-IN':   ['Nepali', 'ne-IN', 'ne'],

  // Major Indian languages  
  'hi-IN':   ['Microsoft Swara', 'Lekha', 'hi-IN', 'hi_IN', 'Hindi'],
  'bn-IN':   ['Microsoft Ravi', 'bn-IN', 'Bengali', 'Bangla India'],
  'as':      ['as-IN', 'Assamese'],
  'hi':      ['Microsoft Swara', 'hi-IN', 'Hindi'],
  'en-IN':   ['Heera', 'Rishi', 'Veena', 'en-IN', 'en_IN', 'India'],
  'te-IN':   ['Microsoft Chitra', 'Chitra', 'te-IN', 'Telugu'],
  'ta-IN':   ['Lekha', 'ta-IN', 'Tamil'],
  'kn-IN':   ['kn-IN', 'Kannada'],
  'ml-IN':   ['Lekha', 'ml-IN', 'Malayalam'],
  'mr-IN':   ['Lekha', 'mr-IN', 'Marathi'],
  'gu-IN':   ['gu-IN', 'Gujarati'],
  'pa-IN':   ['pa-IN', 'Punjabi'],
  'ur-IN':   ['ur-IN', 'Urdu'],
  'or-IN':   ['or-IN', 'Odia'],
};

/** Pick the best available Web Speech voice for a given BCP-47 code */
function pickRegionalWebVoice(bcp47: string): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const prefs = REGIONAL_VOICE_PREFERENCE[bcp47] || [];
  const langPrefix = bcp47.split('-')[0];

  // Priority 1: exact BCP-47 match + preferred name
  for (const pref of prefs) {
    const found = voices.find(
      (v) =>
        v.lang.toLowerCase() === bcp47.toLowerCase() &&
        v.name.toLowerCase().includes(pref.toLowerCase())
    );
    if (found) return found;
  }

  // Priority 2: any voice with matching BCP-47
  const exactLang = voices.find((v) => v.lang.toLowerCase() === bcp47.toLowerCase());
  if (exactLang) return exactLang;

  // Priority 3: language prefix match (e.g. 'as' → 'as-IN')
  const prefixMatch = voices.find((v) => v.lang.toLowerCase().startsWith(langPrefix));
  if (prefixMatch) return prefixMatch;

  // Priority 4: Indian English fallback for unsupported scripts
  const indianEnglish = voices.find((v) => v.lang === 'en-IN' || v.name.includes('India'));
  return indianEnglish || null;
}

class UniversalSpeechSynthesizer implements SpeechSynthesizer {
  private isSpeaking = false;

  async isAvailable(language: string): Promise<boolean> {
    return VoiceCapabilities.isTTSAvailable(language);
  }

  async stop(): Promise<void> {
    this.isSpeaking = false;
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      } else {
        await Speech.stop();
      }
    } catch (_) { /* barge-in stop — silent fail acceptable */ }
  }

  async speak(text: string, language: string, options?: SpeechOptions): Promise<void> {
    await this.stop();

    // Elder-friendly defaults: slightly slower, natural pitch
    const rate = options?.rate ?? 0.82;
    const pitch = options?.pitch ?? 1.0;

    return new Promise((resolve) => {
      this.isSpeaking = true;

      const onDone = () => {
        this.isSpeaking = false;
        options?.onDone?.();
        resolve();
      };

      const onError = (err: any) => {
        this.isSpeaking = false;
        options?.onError?.(err);
        resolve();
      };

      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language;
        utterance.rate = rate;
        utterance.pitch = pitch;

        // Attempt to load voices; some browsers load them asynchronously
        const trySpeak = () => {
          const voice = pickRegionalWebVoice(language);
          if (voice) utterance.voice = voice;
          utterance.onend = onDone;
          utterance.onerror = onError;
          window.speechSynthesis.speak(utterance);
        };

        if (window.speechSynthesis.getVoices().length === 0) {
          // Wait for voiceschanged to fire once
          window.speechSynthesis.onvoiceschanged = () => {
            window.speechSynthesis.onvoiceschanged = null;
            trySpeak();
          };
        } else {
          trySpeak();
        }
      } else {
        // Native (expo-speech): language tag drives device TTS engine
        Speech.speak(text, {
          language,
          rate,
          pitch,
          onDone,
          onError,
        });
      }
    });
  }
}

export const defaultSpeechSynthesizer: SpeechSynthesizer = new UniversalSpeechSynthesizer();
