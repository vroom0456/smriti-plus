/**
SMRITI+ — Frontend Language Service
 *
 * Implements Sections 4, 5, 6, 33, 34, 50:
 * - Real-time Romanized regional normalization
 * - Code-switch detection
 * - Slang and colloquial phrase mapping
 * - Dynamic language identification
 */

import { INDIAN_VOICE_CATALOG, LanguageCapability } from './VoiceCapabilities';

const ROMANIZED_PHRASES: Record<string, Record<string, string>> = {
  'as-IN': {
    'dorob monot pelai diya': 'দৰব মনত পেলাই দিয়া',
    'dorob reminder': 'দৰব মনত পেলাই দিয়া',
    'dorob khua': 'দৰব খোৱা',
    'dawa khua': 'দৰব খোৱা',
    'dorob': 'দৰব',
    'pani monot pelai diya': 'পানী মনত পেলাই দিয়া',
    'pani kham': 'পানী খাম',
    'pani': 'পানী',
    'deuta k phone kora': 'দেউতাক ফোন কৰা',
    'deuta k call kora': 'দেউতাক ফোন কৰা',
    'maak phone kora': 'মাক ফোন কৰা',
    'maak call kora': 'মাক ফোন কৰা',
    'aita k phone kora': 'আইতাক ফোন কৰা',
    'aita k call kora': 'আইতাক ফোন কৰা',
    'priya k phone kora': 'প্ৰিয়াক ফোন কৰা',
    'priya k call kora': 'প্ৰিয়াক ফোন কৰা',
    'phone kora': 'ফোন কৰা',
    'call kora': 'ফোন কৰা',
    'khela aaromvo kora': 'খেলা আৰম্ভ কৰা',
    'khel khilao': 'খেলা আৰম্ভ কৰা',
    'khela': 'খেলা',
    'aakou kua': 'আকৌ কোৱা',
    'lahe lahe kua': 'লাহে লাহে কোৱা',
    'rob': 'ৰব',
    'thakok': 'ৰব',
    'hoy': 'হয়',
    'nohoy': 'নহয়',
    'bhal': 'ভাল',
    'thik ase': 'ঠিক আছে',
  },
  'bn-IN': {
    'oshudh reminder': 'ওষুধ মনে করিয়ে দাও',
    'oshudh mone koriye dao': 'ওষুধ মনে করিয়ে দাও',
    'oshudh khawa': 'ওষুধ খাওয়া',
    'oshudh': 'ওষুধ',
    'dawai': 'ওষুধ',
    'jol reminder': 'জল মনে করিয়ে দাও',
    'jol khabo': 'জল খাব',
    'jol': 'জল',
    'pani': 'জল',
    'baba ke phone koro': 'বাবাকে ফোন করো',
    'baba ke call koro': 'বাবাকে ফোন করো',
    'ma ke phone koro': 'মাকে ফোন করো',
    'ma ke call koro': 'মাকে ফোন করো',
    'khela shuru koro': 'খেলা শুরু করো',
    'khela': 'খেলা',
    'dhire bolo': 'ধীরে বলো',
    'aabar bolo': 'আবার বলো',
    'thamo': 'থামো',
    'haa': 'হ্যাঁ',
    'na': 'না',
    'thik ache': 'ঠিক আছে',
  },
  'te-IN': {
    'amma ki call cheyyi': 'అమ్మకి కాల్ చేయి',
    'ammaku call cheyyi': 'అమ్మకి కాల్ చేయి',
    'nanna ki call cheyyi': 'నాన్నకి కాల్ చేయి',
    'nannaku call cheyyi': 'నాన్నకి కాల్ చేయి',
    'priya ki call cheyyi': 'ప్రియాకి కాల్ చేయి',
    'call cheyyi': 'కాల్ చేయి',
    'phone kottu': 'కాల్ చేయి',
    'cheyyi': 'చేయి',
    'pettu': 'పెట్టు',
    'pettava': 'పెట్టు',
    'gurtu cheyyi': 'గుర్తు చేయి',
    'mandu tinnanu': 'మందు వేసుకున్నాను',
    'mandu vesukovali': 'మందు వేసుకోవాలి',
    'mandu': 'మందు',
    'mandulu': 'మందు',
    'matralu': 'మందు',
    'neellu': 'నీళ్లు',
    'manchi neellu': 'మంచినీళ్లు',
    'aata modalettu': 'ఆట మొదలుపెట్టు',
    'aata': 'ఆట',
    'malli cheppu': 'మళ్ళీ చెప్పు',
    'nemmadiga matladu': 'నెమ్మదిగా మాట్లాడు',
    'aapu': 'ఆపు',
    'aagandi': 'ఆపు',
    'avunu': 'అవును',
    'sare': 'సరే',
    'ledu': 'లేదు',
    'vaddu': 'వద్దు',
  },
  'hi-IN': {
    'meri dawa ka reminder laga do': 'मेरी दवा का रिमाइंडर लगा दो',
    'dawa ka reminder laga do': 'मेरी दवा का रिमाइंडर लगा दो',
    'dawai kha li': 'दवा खा ली',
    'dawa kha li': 'दवा खा ली',
    'dawa': 'दवा',
    'dawai': 'दवा',
    'goli': 'दवा',
    'pani ka reminder': 'पानी का रिमाइंडर',
    'pani peena hai': 'पानी का रिमाइंडर',
    'pani': 'पानी',
    'mummy ko call karo': 'मम्मी को फोन करो',
    'mummy ko phone lagao': 'मम्मी को फोन करो',
    'papa ko call karo': 'पापा को फोन करो',
    'papa ko phone lagao': 'पापा को फोन करो',
    'priya ko call karo': 'प्रिया को फोन करो',
    'laga do': 'लगा दो',
    'yaad dilana': 'याद दिलाना',
    'khel shuru karo': 'खेल शुरू करो',
    'khel': 'खेल',
    'phir se bolo': 'फिर से बोलो',
    'dheere bolo': 'धीरे बोलो',
    'rok do': 'रोक दो',
    'ruk jao': 'रोक दो',
    'haan': 'हाँ',
    'theek hai': 'ठीक है',
    'nahi': 'नहीं',
    'mat karo': 'मत करो',
  },
  'ta-IN': {
    'amma ku call pannu': 'அம்மாவுக்கு கால் பண்ணு',
    'appa ku call pannu': 'அப்பாவுக்கு கால் பண்ணு',
    'marunthu reminder': 'மருந்து நினைவூட்டல்',
    'marunthu saapitten': 'மருந்து சாப்பிட்டேன்',
    'marunthu': 'மருந்து',
    'thannir reminder': 'தண்ணீர் நினைவூட்டல்',
    'thanni': 'தண்ணீர்',
    'thannir': 'தண்ணீர்',
    'vilayattu': 'விளையாட்டு',
    'marubadiyum sollu': 'மறுபடியும் சொல்லு',
    'medhuva pesu': 'மெதுவா பேசு',
    'niru': 'நிறுத்து',
    'aam': 'ஆம்',
    'sari': 'சரி',
    'illai': 'இல்லை',
    'vendaam': 'வேண்டாம்',
  },
};

export class LanguageService {
  static getCapability(code: string): LanguageCapability {
    return INDIAN_VOICE_CATALOG[code] || INDIAN_VOICE_CATALOG['en-IN'];
  }

  static detectScriptLanguage(text: string): string | null {
    for (const ch of text) {
      const code = ch.charCodeAt(0);
      if (code >= 0x0c00 && code <= 0x0c7f) return 'te-IN'; // Telugu
      if (code >= 0x0900 && code <= 0x097f) return 'hi-IN'; // Devanagari (Hindi)
      if (code >= 0x0b80 && code <= 0x0bff) return 'ta-IN'; // Tamil
      if (code >= 0x0c80 && code <= 0x0cff) return 'kn-IN'; // Kannada
      if (code >= 0x0d00 && code <= 0x0d7f) return 'ml-IN'; // Malayalam
      if (code >= 0x0980 && code <= 0x09ff) return 'bn-IN'; // Bengali / Assamese
    }
    return null;
  }

  static cleanElderHesitation(text: string): string {
    const t = text.replace(/[\.]{2,}|…/g, ' ');
    const fillers = new Set([
      'um', 'umm', 'ummm', 'uh', 'uhh', 'aa', 'aaa', 'amm', 'hmm', 'hmmm',
      // Telugu fillers
      'అది', 'ఆ', 'ఉం', 'అమ్మో', 'అయ్యో', 'అదేంటంటే', 'మరి',
      // Hindi fillers
      'वो', 'मतलब', 'अरे', 'यार', 'सुनो', 'तो',
      // Assamese & Bengali fillers
      'মানে', 'এক মিনিট', 'আৰে', 'কিবা এটা', 'এনেকুৱা', 'একটু',
      // Tamil fillers
      'வந்து', 'அதாவது',
      'that'
    ]);
    const tokens = t.split(/\s+/);
    return tokens.filter((w) => !fillers.has(w.toLowerCase())).join(' ').trim();
  }

  static normalizeTranscript(rawText: string, defaultLang: string = 'te-IN'): {
    normalizedText: string;
    detectedLanguage: string;
    isCodeSwitch: boolean;
  } {
    const cleaned = this.cleanElderHesitation(rawText);
    let detectedLang = this.detectScriptLanguage(cleaned) || defaultLang;
    let lower = cleaned.toLowerCase();

    // Check Romanized phrases
    for (const [lang, phrases] of Object.entries(ROMANIZED_PHRASES)) {
      for (const [roman, canonical] of Object.entries(phrases)) {
        if (lower.includes(roman)) {
          detectedLang = lang;
          lower = lower.replace(new RegExp(`\\b${roman}\\b`, 'g'), canonical);
        }
      }
    }

    const hasEnglishWords = /\b(medicine|reminder|water|game|call|phone|please|play|stop|slow|today|tomorrow)\b/i.test(rawText);
    const hasRegional = Boolean(this.detectScriptLanguage(rawText)) || lower !== cleaned.toLowerCase();

    return {
      normalizedText: lower.trim(),
      detectedLanguage: detectedLang,
      isCodeSwitch: hasEnglishWords && hasRegional,
    };
  }
}
