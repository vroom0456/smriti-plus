/**
SMRITI+ — Multilingual Voice Capabilities & Language Profiles
 *
 * Implements Sections 2, 7, 8, 67:
 * - Extensible 23 Indian languages catalog
 * - Truthful capability flags (never fake STT or TTS support)
 * - Accent-aware speech recognition profile
 * - Personal voice profile (private, zero biometric audio storage)
 */

export interface LanguageCapability {
  languageCode: string;       // BCP 47 code e.g. 'te-IN', 'hi-IN'
  displayName: string;        // 'Telugu'
  nativeName: string;         // 'తెలుగు'
  textSupported: boolean;
  sttSupported: boolean;
  ttsSupported: boolean;
  offlineSTTSupported: boolean;
  offlineTTSSupported: boolean;
  codeSwitchSupported: boolean;
  humanReviewed: boolean;
  pronunciationReviewed: boolean;
  accentSupport: string[];
}

export interface SpeechRecognitionProfile {
  language: string;
  accent?: string;
  speechRate?: number;
  elderlyMode?: boolean;
  noiseLevel?: 'low' | 'medium' | 'high';
}

export interface PersonalVoiceProfile {
  elderId: string;
  preferredLanguage: string;
  secondaryLanguage?: string;
  speechRate: number;         // 0.75x to 1.0x (default 0.85x for elderly)
  preferredAssistantVoice?: string;
  honorificPreference: 'formal' | 'warm_family' | 'elder_companion';
  commonFamilyNames: string[];
  enableCodeSwitching: boolean;
  enableAutoLanguageDetect: boolean;
}

export const INDIAN_VOICE_CATALOG: Record<string, LanguageCapability> = {
  'en-IN': {
    languageCode: 'en-IN',
    displayName: 'English (Indian)',
    nativeName: 'English',
    textSupported: true,
    sttSupported: true,
    ttsSupported: true,
    offlineSTTSupported: false,
    offlineTTSSupported: true,
    codeSwitchSupported: true,
    humanReviewed: true,
    pronunciationReviewed: true,
    accentSupport: ['Telugu-English', 'Hindi-English', 'Tamil-English', 'NER-English'],
  },
  'hi-IN': {
    languageCode: 'hi-IN',
    displayName: 'Hindi',
    nativeName: 'हिन्दी',
    textSupported: true,
    sttSupported: true,
    ttsSupported: true,
    offlineSTTSupported: false,
    offlineTTSSupported: true,
    codeSwitchSupported: true,
    humanReviewed: true,
    pronunciationReviewed: true,
    accentSupport: ['Bhojpuri', 'Awadhi', 'Urban Hinglish'],
  },
  'te-IN': {
    languageCode: 'te-IN',
    displayName: 'Telugu',
    nativeName: 'తెలుగు',
    textSupported: true,
    sttSupported: true,
    ttsSupported: true,
    offlineSTTSupported: false,
    offlineTTSSupported: false,
    codeSwitchSupported: true,
    humanReviewed: true,
    pronunciationReviewed: true,
    accentSupport: ['Telangana', 'Coastal Andhra', 'Rayalaseema', 'Tenglish'],
  },
  'ta-IN': {
    languageCode: 'ta-IN',
    displayName: 'Tamil',
    nativeName: 'தமிழ்',
    textSupported: true,
    sttSupported: true,
    ttsSupported: true,
    offlineSTTSupported: false,
    offlineTTSSupported: false,
    codeSwitchSupported: true,
    humanReviewed: true,
    pronunciationReviewed: true,
    accentSupport: ['Chennai', 'Madurai', 'Tanglish'],
  },
  'kn-IN': {
    languageCode: 'kn-IN',
    displayName: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    textSupported: true,
    sttSupported: true,
    ttsSupported: true,
    offlineSTTSupported: false,
    offlineTTSSupported: false,
    codeSwitchSupported: true,
    humanReviewed: true,
    pronunciationReviewed: true,
    accentSupport: ['Mysore', 'North Karnataka', 'Kanglish'],
  },
  'ml-IN': {
    languageCode: 'ml-IN',
    displayName: 'Malayalam',
    nativeName: 'മലയാളം',
    textSupported: true,
    sttSupported: true,
    ttsSupported: true,
    offlineSTTSupported: false,
    offlineTTSSupported: false,
    codeSwitchSupported: true,
    humanReviewed: true,
    pronunciationReviewed: true,
    accentSupport: ['Travancore', 'Malabar', 'Manglish'],
  },
  'bn-IN': {
    languageCode: 'bn-IN',
    displayName: 'Bengali',
    nativeName: 'বাংলা',
    textSupported: true,
    sttSupported: true,
    ttsSupported: true,
    offlineSTTSupported: false,
    offlineTTSSupported: false,
    codeSwitchSupported: true,
    humanReviewed: true,
    pronunciationReviewed: true,
    accentSupport: ['Kolkata', 'Rarh', 'Bonglish'],
  },
  'mr-IN': {
    languageCode: 'mr-IN',
    displayName: 'Marathi',
    nativeName: 'मराठी',
    textSupported: true,
    sttSupported: true,
    ttsSupported: true,
    offlineSTTSupported: false,
    offlineTTSSupported: false,
    codeSwitchSupported: true,
    humanReviewed: true,
    pronunciationReviewed: true,
    accentSupport: ['Deshi', 'Varhadi'],
  },
  'gu-IN': {
    languageCode: 'gu-IN',
    displayName: 'Gujarati',
    nativeName: 'ગુજરાતી',
    textSupported: true,
    sttSupported: true,
    ttsSupported: true,
    offlineSTTSupported: false,
    offlineTTSSupported: false,
    codeSwitchSupported: true,
    humanReviewed: true,
    pronunciationReviewed: true,
    accentSupport: ['Amdavadi', 'Kathiyawadi'],
  },
  'pa-IN': {
    languageCode: 'pa-IN',
    displayName: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    textSupported: true,
    sttSupported: true,
    ttsSupported: true,
    offlineSTTSupported: false,
    offlineTTSSupported: false,
    codeSwitchSupported: true,
    humanReviewed: true,
    pronunciationReviewed: true,
    accentSupport: ['Majhi', 'Malwai'],
  },
  'or-IN': {
    languageCode: 'or-IN',
    displayName: 'Odia',
    nativeName: 'ଓଡ଼ିଆ',
    textSupported: true,
    sttSupported: true,
    ttsSupported: true,
    offlineSTTSupported: false,
    offlineTTSSupported: false,
    codeSwitchSupported: true,
    humanReviewed: true,
    pronunciationReviewed: true,
    accentSupport: ['Mughalbandi', 'Sambalpuri'],
  },
  'as-IN': {
    languageCode: 'as-IN',
    displayName: 'Assamese',
    nativeName: 'অসমীয়া',
    textSupported: true,
    sttSupported: true,
    ttsSupported: true,
    offlineSTTSupported: false,
    offlineTTSSupported: false,
    codeSwitchSupported: true,
    humanReviewed: true,
    pronunciationReviewed: true,
    accentSupport: ['Eastern Assamese', 'Kamrupi'],
  },
  'ur-IN': {
    languageCode: 'ur-IN',
    displayName: 'Urdu',
    nativeName: 'اردو',
    textSupported: true,
    sttSupported: true,
    ttsSupported: true,
    offlineSTTSupported: false,
    offlineTTSSupported: false,
    codeSwitchSupported: true,
    humanReviewed: true,
    pronunciationReviewed: true,
    accentSupport: ['Deccani', 'Lucknow'],
  },
  'kok-IN': {
    languageCode: 'kok-IN',
    displayName: 'Konkani',
    nativeName: 'कोंकणी',
    textSupported: true,
    sttSupported: false,
    ttsSupported: false,
    offlineSTTSupported: false,
    offlineTTSSupported: false,
    codeSwitchSupported: false,
    humanReviewed: true,
    pronunciationReviewed: false,
    accentSupport: ['Goan'],
  },
  'ne-IN': {
    languageCode: 'ne-IN',
    displayName: 'Nepali',
    nativeName: 'नेपाली',
    textSupported: true,
    sttSupported: false,
    ttsSupported: false,
    offlineSTTSupported: false,
    offlineTTSSupported: false,
    codeSwitchSupported: false,
    humanReviewed: true,
    pronunciationReviewed: false,
    accentSupport: ['Sikkimese'],
  },
  'ks-IN': {
    languageCode: 'ks-IN',
    displayName: 'Kashmiri',
    nativeName: 'کٲشُر',
    textSupported: true,
    sttSupported: false,
    ttsSupported: false,
    offlineSTTSupported: false,
    offlineTTSSupported: false,
    codeSwitchSupported: false,
    humanReviewed: true,
    pronunciationReviewed: false,
    accentSupport: ['Srinagar'],
  },
  'sd-IN': {
    languageCode: 'sd-IN',
    displayName: 'Sindhi',
    nativeName: 'سنڌي',
    textSupported: true,
    sttSupported: false,
    ttsSupported: false,
    offlineSTTSupported: false,
    offlineTTSSupported: false,
    codeSwitchSupported: false,
    humanReviewed: true,
    pronunciationReviewed: false,
    accentSupport: [],
  },
  'sa-IN': {
    languageCode: 'sa-IN',
    displayName: 'Sanskrit',
    nativeName: 'संस्कृतम्',
    textSupported: true,
    sttSupported: false,
    ttsSupported: false,
    offlineSTTSupported: false,
    offlineTTSSupported: false,
    codeSwitchSupported: false,
    humanReviewed: true,
    pronunciationReviewed: false,
    accentSupport: [],
  },
  'mai-IN': {
    languageCode: 'mai-IN',
    displayName: 'Maithili',
    nativeName: 'मैथिली',
    textSupported: true,
    sttSupported: false,
    ttsSupported: false,
    offlineSTTSupported: false,
    offlineTTSSupported: false,
    codeSwitchSupported: false,
    humanReviewed: true,
    pronunciationReviewed: false,
    accentSupport: ['Mithila'],
  },
  'mni-IN': {
    languageCode: 'mni-IN',
    displayName: 'Manipuri (Meitei)',
    nativeName: 'মৈতৈলোন্',
    textSupported: true,
    sttSupported: false,
    ttsSupported: false,
    offlineSTTSupported: false,
    offlineTTSSupported: false,
    codeSwitchSupported: false,
    humanReviewed: true,
    pronunciationReviewed: false,
    accentSupport: ['Imphal'],
  },
  'brx-IN': {
    languageCode: 'brx-IN',
    displayName: 'Bodo',
    nativeName: 'बर\'',
    textSupported: true,
    sttSupported: false,
    ttsSupported: false,
    offlineSTTSupported: false,
    offlineTTSSupported: false,
    codeSwitchSupported: false,
    humanReviewed: true,
    pronunciationReviewed: false,
    accentSupport: ['Bodoland'],
  },
  'doi-IN': {
    languageCode: 'doi-IN',
    displayName: 'Dogri',
    nativeName: 'डोगरी',
    textSupported: true,
    sttSupported: false,
    ttsSupported: false,
    offlineSTTSupported: false,
    offlineTTSSupported: false,
    codeSwitchSupported: false,
    humanReviewed: true,
    pronunciationReviewed: false,
    accentSupport: ['Jammu'],
  },
  'sat-IN': {
    languageCode: 'sat-IN',
    displayName: 'Santali',
    nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ',
    textSupported: true,
    sttSupported: false,
    ttsSupported: false,
    offlineSTTSupported: false,
    offlineTTSSupported: false,
    codeSwitchSupported: false,
    humanReviewed: true,
    pronunciationReviewed: false,
    accentSupport: [],
  },
};

export class VoiceCapabilities {
  static getCapability(langCode: string): LanguageCapability {
    return INDIAN_VOICE_CATALOG[langCode] || INDIAN_VOICE_CATALOG['en-IN'];
  }

  static isSTTAvailable(langCode: string): boolean {
    return this.getCapability(langCode).sttSupported;
  }

  static isTTSAvailable(langCode: string): boolean {
    return this.getCapability(langCode).ttsSupported;
  }

  static getAllSupportedLanguages(): LanguageCapability[] {
    return Object.values(INDIAN_VOICE_CATALOG);
  }
}
