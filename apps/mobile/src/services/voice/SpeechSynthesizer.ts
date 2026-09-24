/**
 * SMRITI+ — Regional Speech Synthesizer
 *
 * Selects the most appropriate regional voice for each Indian language:
 *   - Telugu   → te-IN female (Geeta on macOS, Microsoft Chitra/Mohan on Windows, Google తెలుగు)
 *   - Hindi    → hi-IN female (Lekha on macOS, Microsoft Swara on Windows, Google हिन्दी)
 *   - Assamese → as-IN female (calm, village-elder warm)
 *   - Bengali  → bn-IN female (Pooja/Mitali on macOS, Microsoft Ravi on Windows, Google বাংলা)
 *   - Tamil    → ta-IN female (Latha/Vani on macOS, Microsoft Pallavi on Windows, Google தமிழ்)
 *   - English  → en-IN (Rishi/Aman/Tara on macOS, Microsoft Neerja on Windows, Indian-accented gentle)
 *
 * Elder-friendly defaults: rate 0.82, pitch 1.0.
 * Barge-in (cancel mid-speech) supported on all platforms.
 * Built-in Web Audio Earcon Chimes & Indic-to-Phonetic fallback so speech is ALWAYS audible!
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
  isSpeaking(): Promise<boolean>;
  isAvailable(language: string): Promise<boolean>;
}

// ── Web Audio Earcon Chimes (Immediate Auditory Feedback) ──

export function playEarconChime(type: 'listen' | 'confirm' | 'stop') {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  try {
    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'listen') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.12); // E5
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === 'confirm') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.14); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
      osc.start();
      osc.stop(ctx.currentTime + 0.28);
    } else if (type === 'stop') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch (_) {
    // Non-fatal audio chime error
  }
}

// ── Brahmic Indic-to-Phonetic Fallback Transliterator ──
// Used when the device lacks a native Telugu/Assamese/Bengali voice and falls back to Indian English.
// English voices produce 0 audio when given Indic Unicode characters; transliterating ensures
// the English voice speaks the exact Telugu/Assamese/Hindi words loud and clear!

const INDIC_VOWELS: Record<number, string> = {
  0x05: 'a', 0x06: 'aa', 0x07: 'i', 0x08: 'ee', 0x09: 'u', 0x0A: 'oo', 0x0B: 'ru',
  0x0E: 'e', 0x0F: 'ae', 0x10: 'ai', 0x12: 'o', 0x13: 'o', 0x14: 'au',
};
const INDIC_CONSONANTS: Record<number, string> = {
  0x15: 'ka', 0x16: 'kha', 0x17: 'ga', 0x18: 'gha', 0x19: 'nga',
  0x1A: 'cha', 0x1B: 'chha', 0x1C: 'ja', 0x1D: 'jha', 0x1E: 'nya',
  0x1F: 'ta', 0x20: 'tha', 0x21: 'da', 0x22: 'dha', 0x23: 'na',
  0x24: 'tha', 0x25: 'thha', 0x26: 'da', 0x27: 'dhha', 0x28: 'na',
  0x2A: 'pa', 0x2B: 'pha', 0x2C: 'ba', 0x2D: 'bha', 0x2E: 'ma',
  0x2F: 'ya', 0x30: 'ra', 0x31: 'rra', 0x32: 'la', 0x33: 'la', 0x35: 'va',
  0x36: 'sha', 0x37: 'sha', 0x38: 'sa', 0x39: 'ha',
};
const INDIC_MATRAS: Record<number, string> = {
  0x3E: 'aa', 0x3F: 'i', 0x40: 'ee', 0x41: 'u', 0x42: 'oo', 0x43: 'ru',
  0x46: 'e', 0x47: 'ae', 0x48: 'ai', 0x4A: 'o', 0x4B: 'o', 0x4C: 'au',
};

export function transliterateIndicToPhonetic(text: string): string {
  if (!text) return '';
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    // Indic Brahmic range (Devanagari 0x0900 to Malayalam 0x0D7F)
    if (code >= 0x0900 && code <= 0x0D7F) {
      const offset = code & 0x7F;
      if (offset === 0x02) { out += 'm'; continue; }
      if (offset === 0x03) { out += 'h'; continue; }
      if (INDIC_VOWELS[offset]) { out += INDIC_VOWELS[offset]; continue; }
      if (INDIC_CONSONANTS[offset]) {
        const root = INDIC_CONSONANTS[offset].slice(0, -1);
        const nextCode = text.charCodeAt(i + 1);
        if (nextCode >= 0x0900 && nextCode <= 0x0D7F) {
          const nextOffset = nextCode & 0x7F;
          if (nextOffset === 0x4D) { // virama / halant
            out += root;
            i++;
            continue;
          }
          if (INDIC_MATRAS[nextOffset]) {
            out += root + INDIC_MATRAS[nextOffset];
            i++;
            continue;
          }
        }
        out += INDIC_CONSONANTS[offset];
        continue;
      }
      if (INDIC_MATRAS[offset]) { out += INDIC_MATRAS[offset]; continue; }
    } else {
      out += text[i];
    }
  }
  return out;
}

/**
 * Regional voice priority map.
 * Expanded with macOS, Windows, Google, and Android system voices.
 */
const REGIONAL_VOICE_PREFERENCE: Record<string, string[]> = {
  // Telugu
  'te-IN': ['Geeta', 'Microsoft Chitra', 'Chitra', 'Mohan', 'Microsoft Mohan', 'Google తెలుగు', 'Telugu', 'te-IN', 'te_IN'],
  'te':    ['Geeta', 'Microsoft Chitra', 'Chitra', 'Mohan', 'Microsoft Mohan', 'Google తెలుగు', 'Telugu', 'te-IN', 'te_IN'],

  // Hindi
  'hi-IN': ['Lekha', 'Microsoft Swara', 'Swara', 'Madhur', 'Hemant', 'Google हिन्दी', 'Hindi', 'hi-IN', 'hi_IN'],
  'hi':    ['Lekha', 'Microsoft Swara', 'Swara', 'Madhur', 'Hemant', 'Google हिन्दी', 'Hindi', 'hi-IN', 'hi_IN'],

  // Assamese
  'as-IN': ['Assamese', 'as-IN', 'as_IN', 'as'],
  'as':    ['Assamese', 'as-IN', 'as_IN', 'as'],
  'brx-IN': ['Bodo', 'brx', 'as-IN'],

  // Bengali
  'bn-IN': ['Pooja', 'Mitali', 'Microsoft Ravi', 'Ravi', 'Tanishaa', 'Bashkar', 'Google বাংলা', 'Bengali', 'Bangla', 'bn-IN', 'bn_IN'],
  'bn':    ['Pooja', 'Mitali', 'Microsoft Ravi', 'Ravi', 'Tanishaa', 'Bashkar', 'Google বাংলা', 'Bengali', 'Bangla', 'bn-IN', 'bn_IN'],

  // Tamil
  'ta-IN': ['Latha', 'Vani', 'Microsoft Pallavi', 'Valluvar', 'Google தமிழ்', 'Tamil', 'ta-IN', 'ta_IN'],
  'ta':    ['Latha', 'Vani', 'Microsoft Pallavi', 'Valluvar', 'Google தமிழ்', 'Tamil', 'ta-IN', 'ta_IN'],

  // Kannada
  'kn-IN': ['kn-IN', 'Kannada', 'kn'],
  'kn':    ['kn-IN', 'Kannada', 'kn'],

  // Indian English
  'en-IN': ['Rishi', 'Aman', 'Tara', 'Sangeeta', 'Veena', 'Heera', 'Microsoft Neerja', 'Microsoft Prabhat', 'Google Indian English', 'India', 'en-IN', 'en_IN'],
  'en':    ['Rishi', 'Aman', 'Tara', 'Sangeeta', 'Veena', 'Heera', 'Microsoft Neerja', 'Microsoft Prabhat', 'Google Indian English', 'India', 'en-IN', 'en_IN'],
};

/** Normalize any language tag like 'te', 'te-IN', 'te_IN' to standard keys */
function normalizeLangCode(lang: string): { base: string; bcp47: string } {
  const clean = (lang || 'en').toLowerCase().trim();
  const base = clean.split(/[-_]/)[0];
  const bcp47 = clean.includes('-') || clean.includes('_')
    ? clean.replace('_', '-')
    : `${clean}-IN`;
  return { base, bcp47 };
}

/** Pick the best available Web Speech voice and check if it's native Indic or English fallback */
function pickRegionalWebVoice(language: string): { voice: SpeechSynthesisVoice | null; isNativeVoice: boolean } {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.speechSynthesis) {
    return { voice: null, isNativeVoice: false };
  }
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return { voice: null, isNativeVoice: false };

  const { base, bcp47 } = normalizeLangCode(language);
  const prefs = REGIONAL_VOICE_PREFERENCE[bcp47] || REGIONAL_VOICE_PREFERENCE[base] || [];

  // Priority 1: Exact preferred name match for this regional language
  for (const pref of prefs) {
    const found = voices.find(
      (v) => v.name.toLowerCase().includes(pref.toLowerCase())
    );
    if (found) {
      const isNative = !found.lang.toLowerCase().startsWith('en');
      return { voice: found, isNativeVoice: isNative };
    }
  }

  // Priority 2: Any voice whose lang matches BCP-47 or base code
  const exactLang = voices.find(
    (v) =>
      v.lang.toLowerCase().replace('_', '-') === bcp47.toLowerCase() ||
      v.lang.toLowerCase().startsWith(base)
  );
  if (exactLang) {
    const isNative = !exactLang.lang.toLowerCase().startsWith('en');
    return { voice: exactLang, isNativeVoice: isNative };
  }

  // Priority 3: Indian English voice fallback
  const indianEnglish = voices.find(
    (v) =>
      v.lang.toLowerCase().includes('en-in') ||
      v.lang.toLowerCase().includes('en_in') ||
      v.name.toLowerCase().includes('india') ||
      v.name.toLowerCase().includes('rishi') ||
      v.name.toLowerCase().includes('aman') ||
      v.name.toLowerCase().includes('tara')
  );
  if (indianEnglish) {
    return { voice: indianEnglish, isNativeVoice: base === 'en' };
  }

  // Priority 4: Default voice or first available
  const defaultVoice = voices.find((v) => v.default) || voices[0] || null;
  return { voice: defaultVoice, isNativeVoice: false };
}

/**
 * Strips emojis and pictographs so TTS does NOT pronounce them aloud
 */
export function stripEmojisForSpeech(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F1E6}-\u{1F1FF}]/gu, '')
    .replace(/[🙏✨💡🛡️⚡🎉❤️👍👋✓✕🛑🔁🐢📋💊💧🎮📞]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Phonetic pronunciation dictionary to correct common TTS mispronunciations
 */
export const PHONETIC_ACCENT_CORRECTIONS: Record<string, Record<string, string>> = {
  'en-IN': {
    'Gamosa': 'Guh-mo-sa',
    'gamosa': 'guh-mo-sa',
    'Bihu': 'Bee-hoo',
    'bihu': 'bee-hoo',
    'Brahmaputra': 'Bruh-muh-poo-truh',
    'brahmaputra': 'bruh-muh-poo-truh',
    'Jorhat': 'Jor-haat',
    'Tezpur': 'Ttez-poor',
    'Majuli': 'Mah-joo-lee',
    'Muga': 'Moo-ga',
    'Kopou': 'Ko-po-oo',
    'Mekhela': 'May-khe-la',
    'Chador': 'Chah-dore',
    'Borgeet': 'Bor-geet',
    'SMRITI': 'Smri-tee',
    'Smriti': 'Smri-tee',
    'Deuta': 'Deh-oo-tah',
    'Aita': 'Eye-tah',
    'Namaste': 'Nuh-muh-stay',
    'Pranam': 'Prah-naam',
    'Metformin': 'Met-for-min',
    'Amlodipine': 'Am-lo-di-peen',
    'Paracetamol': 'Pa-ra-see-ta-mol',
    'Atorvastatin': 'A-tor-va-sta-tin',
  },
  'en': {
    'SMRITI+': 'Smri-tee Plus',
    'SMRITI': 'Smri-tee',
    'Smriti': 'Smri-tee',
    'Gamosa': 'Guh-mo-sa',
    'Bihu': 'Bee-hoo',
    'Brahmaputra': 'Bruh-muh-poo-truh',
  },
  'as-IN': {
    'SMRITI+': 'স্মৃতি প্লাস',
    'SMRITI': 'স্মৃতি',
    'Smriti': 'স্মৃতি',
    'bp': 'বি পি',
    'BP': 'বি পি',
  },
  'bn-IN': {
    'SMRITI+': 'স্মৃতি প্লাস',
    'SMRITI': 'স্মৃতি',
    'Smriti': 'স্মৃতি',
    'bp': 'বি পি',
    'BP': 'বি পি',
  },
  'te-IN': {
    'SMRITI+': 'స్మృతి ప్లస్',
    'SMRITI': 'స్మృతి',
    'Smriti': 'స్మృతి',
    'bp': 'బీ పీ',
    'BP': 'బీ పీ',
  },
  'hi-IN': {
    'SMRITI+': 'स्मृति प्लस',
    'SMRITI': 'स्मृति',
    'Smriti': 'स्मृति',
    'bp': 'बी पी',
    'BP': 'बी पी',
  },
  'ta-IN': {
    'SMRITI+': 'ஸ்மிருதி பிளஸ்',
    'SMRITI': 'ஸ்மிருதி',
    'Smriti': 'ஸ்மிருதி',
    'bp': 'பி பி',
    'BP': 'பி பி',
  },
};

export function applyRegionalPhonetics(text: string, language: string): string {
  if (!text) return '';
  const { base, bcp47 } = normalizeLangCode(language);
  const dict = PHONETIC_ACCENT_CORRECTIONS[bcp47] || PHONETIC_ACCENT_CORRECTIONS[base];
  if (!dict) return text;

  let result = text;
  for (const [word, phonetic] of Object.entries(dict)) {
    result = result.replace(new RegExp(`\\b${word}\\b`, 'g'), phonetic);
  }
  return result;
}

// Module-level utterance reference to prevent Chromium garbage collection bug
let activeUtterance: SpeechSynthesisUtterance | null = null;
let speechHeartbeat: any = null;

// Global unlock on web for unprompted autoplay restrictions
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  const unlockAudio = () => {
    if (window.speechSynthesis && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const dummyCtx = new AudioCtx();
        if (dummyCtx.state === 'suspended') dummyCtx.resume();
      }
    } catch (_) {}
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
  };
  window.addEventListener('click', unlockAudio);
  window.addEventListener('touchstart', unlockAudio);

  // Eagerly pre-load voices
  if (window.speechSynthesis) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }
}

class UniversalSpeechSynthesizer implements SpeechSynthesizer {
  private _isSpeaking = false;

  async isSpeaking(): Promise<boolean> {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.speechSynthesis) {
      return window.speechSynthesis.speaking;
    }
    try {
      return await Speech.isSpeakingAsync();
    } catch {
      return this._isSpeaking;
    }
  }

  async isAvailable(language: string): Promise<boolean> {
    return VoiceCapabilities.isTTSAvailable(language);
  }

  async stop(): Promise<void> {
    this._isSpeaking = false;
    if (speechHeartbeat) {
      clearInterval(speechHeartbeat);
      speechHeartbeat = null;
    }
    activeUtterance = null;
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

    const strippedText = stripEmojisForSpeech(text);
    const cleanText = applyRegionalPhonetics(strippedText, language);
    if (!cleanText) {
      options?.onDone?.();
      return;
    }

    const rate = options?.rate ?? 0.82;
    const pitch = options?.pitch ?? 1.0;
    const { bcp47, base } = normalizeLangCode(language);

    return new Promise((resolve) => {
      this._isSpeaking = true;

      const finish = () => {
        this._isSpeaking = false;
        if (speechHeartbeat) {
          clearInterval(speechHeartbeat);
          speechHeartbeat = null;
        }
        activeUtterance = null;
        options?.onDone?.();
        resolve();
      };

      const fail = (err: any) => {
        this._isSpeaking = false;
        if (speechHeartbeat) {
          clearInterval(speechHeartbeat);
          speechHeartbeat = null;
        }
        activeUtterance = null;
        options?.onError?.(err);
        resolve();
      };

      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.speechSynthesis) {
        // Resume synthesis if paused
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        const executeWebSpeak = () => {
          const { voice, isNativeVoice } = pickRegionalWebVoice(language);

          // If fallback English voice is used on Indic script text, transliterate
          // so the English voice actually speaks the regional words out loud!
          let textToSpeak = cleanText;
          const hasIndicScript = /[\u0900-\u0D7F]/.test(cleanText);
          if (!isNativeVoice && hasIndicScript) {
            textToSpeak = transliterateIndicToPhonetic(cleanText);
          }

          const utterance = new SpeechSynthesisUtterance(textToSpeak);
          utterance.rate = rate;
          utterance.pitch = pitch;
          utterance.volume = 1.0;

          if (voice) {
            utterance.voice = voice;
            utterance.lang = voice.lang;
          } else {
            utterance.lang = bcp47;
          }

          utterance.onend = finish;
          utterance.onerror = (e) => {
            console.warn('[SpeechSynthesizer] Web Speech error:', e);
            finish();
          };

          // Hold reference globally to defeat Chromium GC collection bug
          activeUtterance = utterance;
          (window as any).__smritiCurrentUtterance = utterance;

          // Chrome long-utterance keep-alive heartbeat
          speechHeartbeat = setInterval(() => {
            if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
              window.speechSynthesis.pause();
              window.speechSynthesis.resume();
            }
          }, 8000);

          // Safety timeout so UI never hangs if browser fails silently
          const maxDuration = Math.max(4000, textToSpeak.length * 140);
          setTimeout(() => {
            if (activeUtterance === utterance) {
              finish();
            }
          }, maxDuration);

          window.speechSynthesis.speak(utterance);
        };

        // Small 35ms delay after cancel to prevent Chrome audio deadlock
        setTimeout(() => {
          if (window.speechSynthesis.getVoices().length === 0) {
            window.speechSynthesis.onvoiceschanged = () => {
              window.speechSynthesis.onvoiceschanged = null;
              executeWebSpeak();
            };
            // Fallback if onvoiceschanged doesn't fire
            setTimeout(executeWebSpeak, 250);
          } else {
            executeWebSpeak();
          }
        }, 35);
      } else {
        // Native (expo-speech): language tag drives device TTS engine
        Speech.speak(cleanText, {
          language: bcp47,
          rate,
          pitch,
          onDone: finish,
          onError: fail,
        });
      }
    });
  }
}

export const defaultSpeechSynthesizer: SpeechSynthesizer = new UniversalSpeechSynthesizer();
