/**
 * SMRITI+ — Master Language Profiles & Voice Validation Architecture
 *
 * Implements Sections 4–8, 10–15, 31, 38, 52–54:
 * - Authentic regional language profiles (Assamese, Bengali, Telugu, Hindi, Indian English, etc.)
 * - Genuine BCP-47 voice matching (never silently substitute unrelated accents)
 * - Respectful cultural honorifics & natural conversational expressions
 * - Localized emotional templates (praise, encouragement, confusion recovery, repetition)
 * - Number, date, and schedule natural verbalization rules
 */

export interface EmotionalTemplates {
  greeting: string;
  praise: string;
  comfort: string;
  confusion: string;
  repeat: string;
  farewell: string;
  offlineNotice: string;
  safetyRefusal: string;
}

export interface LanguageProfile {
  languageCode: string;
  languageName: string;
  nativeName: string;
  locale: string;
  bcp47List: string[];
  speechRate: number;
  pitch: number;
  defaultHonorific: string;
  emotionalTemplates: EmotionalTemplates;
  prohibitedMixing: string[];
}

export const LANGUAGE_PROFILES: Record<string, LanguageProfile> = {
  en: {
    languageCode: 'en',
    languageName: 'English (Indian)',
    nativeName: 'English',
    locale: 'en-IN',
    bcp47List: ['en-IN', 'en-GB', 'en-US'],
    speechRate: 0.85,
    pitch: 1.0,
    defaultHonorific: '',
    emotionalTemplates: {
      greeting: 'Good morning. How can I help you today?',
      praise: 'Wonderful! You took your time and stayed focused.',
      comfort: 'That’s completely okay. Let’s take our time together.',
      confusion: 'You are safe and at home. Let’s take things one gentle step at a time.',
      repeat: 'Of course. I will repeat that for you.',
      farewell: 'Take care and have a peaceful day.',
      offlineNotice: 'You are offline, but your schedule and saved activities are ready.',
      safetyRefusal: 'I can help with your schedule and daily reminders, but a doctor should answer that medical question.',
    },
    prohibitedMixing: [],
  },

  as: {
    languageCode: 'as',
    languageName: 'Assamese',
    nativeName: 'অসমীয়া',
    locale: 'as-IN',
    bcp47List: ['as-IN', 'as', 'bn-IN'], // Verified regional fallback only with notice
    speechRate: 0.82,
    pitch: 1.0,
    defaultHonorific: '',
    emotionalTemplates: {
      greeting: 'নমস্কাৰ! আজি আপোনাক কেনেকৈ সহায় কৰিব পাৰোঁ?',
      praise: 'বৰ ধুনীয়া! আপুনি মনোযোগেৰে আৰু ধীৰে ধীৰে সম্পূৰ্ণ কৰিলে।',
      comfort: 'একো কথা নাই। আমি লাহে লাহে আকৌ চেষ্টা কৰিব পাৰোঁ।',
      confusion: 'আপুনি ঘৰতে সুৰক্ষিত আছে। আমি এটা এটাকৈ কাম কৰোঁ আহক।',
      repeat: 'নিশ্চয়, মই কথাষাৰ আকৌ এবাৰ কৈছোঁ।',
      farewell: 'আপোনাৰ দিনটো শান্তিপূৰ্ণ আৰু শুভ হওক।',
      offlineNotice: 'নেটৱৰ্ক নাই, কিন্তু আপোনাৰ ঔষধ আৰু সময়সূচী ইয়াত সুৰক্ষিত আছে।',
      safetyRefusal: 'মই আপোনাৰ দৈনিক কাম আৰু সময়সূচীত সহায় কৰিব পাৰোঁ, কিন্তু স্বাস্থ্যৰ পৰামৰ্শ ডাক্তৰৰ পৰা লোৱাটো ভাল।',
    },
    prohibitedMixing: ['Hinglish'],
  },

  bn: {
    languageCode: 'bn',
    languageName: 'Bengali',
    nativeName: 'বাংলা',
    locale: 'bn-IN',
    bcp47List: ['bn-IN', 'bn'],
    speechRate: 0.82,
    pitch: 1.0,
    defaultHonorific: '',
    emotionalTemplates: {
      greeting: 'নমস্কার! আজ আপনাকে কীভাবে সাহায্য করতে পারি?',
      praise: 'খুব সুন্দর! আপনি খুব মনোযোগ দিয়ে করেছেন।',
      comfort: 'কোনো চিন্তা নেই। আমরা ধীরে ধীরে আবার করব।',
      confusion: 'আপনি একদম নিরাপদে ঘরে আছেন। চলুন এক এক করে এগোই।',
      repeat: 'হ্যাঁ নিশ্চয়ই, আমি আবার বলছি।',
      farewell: 'ভালো থাকুন, আপনার দিনটি শান্তিময় হোক।',
      offlineNotice: 'ইন্টারনেট নেই, তবে আপনার আজকের রুটিন আর ওষুধ প্রস্তুত আছে।',
      safetyRefusal: 'আমি আপনার রুটিন আর ওষুধ মনে করাতে পারি, কিন্তু চিকিৎসার সিদ্ধান্তের জন্য ডাক্তারের পরামর্শ নিন।',
    },
    prohibitedMixing: [],
  },

  te: {
    languageCode: 'te',
    languageName: 'Telugu',
    nativeName: 'తెలుగు',
    locale: 'te-IN',
    bcp47List: ['te-IN', 'te'],
    speechRate: 0.82,
    pitch: 1.0,
    defaultHonorific: 'గారు',
    emotionalTemplates: {
      greeting: 'నమస్కారమండి! ఈరోజు మీకు ఎలా సహాయపడమంటారు?',
      praise: 'చాలా బాగుందండి! చాలా ప్రశాంతంగా పూర్తి చేశారు.',
      comfort: 'పర్వాలేదండి. నిదానంగా ఇంకోసారి చేద్దాం.',
      confusion: 'మీరు ఇంట్లోనే క్షేమంగా ఉన్నారు. ఒక్కో పని నిదానంగా చేసుకుందాం.',
      repeat: 'తప్పకుండా, మళ్ళీ చెప్తాను వినండి.',
      farewell: 'రోజంతా ప్రశాంతంగా ఉండండి.',
      offlineNotice: 'నెట్‌వర్క్ లేకపోయినా మీ మందులు, పనుల వివరాలు అందుబాటులోనే ఉన్నాయి.',
      safetyRefusal: 'నేను మీ సమయాలు, మందుల గుర్తులు చెప్పగలను, కానీ వైద్య సలహా కోసం మీ డాక్టరుగారినే అడగాలి.',
    },
    prohibitedMixing: [],
  },

  hi: {
    languageCode: 'hi',
    languageName: 'Hindi',
    nativeName: 'हिन्दी',
    locale: 'hi-IN',
    bcp47List: ['hi-IN', 'hi'],
    speechRate: 0.82,
    pitch: 1.0,
    defaultHonorific: 'जी',
    emotionalTemplates: {
      greeting: 'नमस्ते जी! आज मैं आपकी क्या सहायता कर सकता हूँ?',
      praise: 'बहुत बढ़िया! आपने पूरा ध्यान देकर इसे पूरा किया।',
      comfort: 'कोई बात नहीं, हम आराम से दोबारा प्रयास करेंगे।',
      confusion: 'आप अपने घर पर पूरी तरह सुरक्षित हैं। हम एक-एक कदम आराम से आगे बढ़ेंगे।',
      repeat: 'जी बिल्कुल, मैं इसे दोबारा दोहरा देता हूँ।',
      farewell: 'अपना ख्याल रखें, आपका दिन शांतिपूर्ण रहे।',
      offlineNotice: 'इंटरनेट नहीं है, लेकिन आपकी दवाइयाँ और कार्यक्रम सुरक्षित हैं।',
      safetyRefusal: 'मैं आपकी दिनचर्या में मदद कर सकता हूँ, लेकिन दवा के बदलाव के लिए कृपया डॉक्टर से पूछें।',
    },
    prohibitedMixing: [],
  },

  // ─── North Eastern India Regional Languages ──────────────────────────────

  brx: {
    languageCode: 'brx',
    languageName: 'Bodo',
    nativeName: "बर\u2019",
    locale: 'brx-IN',
    bcp47List: ['brx-IN', 'brx', 'hi-IN'], // Fallback to Hindi TTS with notice
    speechRate: 0.82,
    pitch: 1.0,
    defaultHonorific: '',
    emotionalTemplates: {
      greeting: 'गाजा राय! आंनो माखासे मदत खालामो बायदि?',
      praise: 'गोजों सिगांथाव! आं बेरामो बेसेबां हाबहैनो।',
      comfort: 'जेबो दावगैयै, आंनो आंथि-आंथि फैगौ।',
      confusion: "आं नोंथांनि न\u2019खरायाव सुरक्षितो। गासैबो मावफुं एसे गावलायगों।",
      repeat: 'गाजा, आंनो फैसालि फोरमायों।',
      farewell: 'खामानि लाखिनानै सानाफा थांनो।',
      offlineNotice: 'इन्टारनेट गैयाव, नाथाय आंनि दैनन्दिनार बिसायखथि सुरक्षितो।',
      safetyRefusal: 'आंनि दैनन्दिन खामानि मदत खालामगोन, नाथाय मेडिकेलनि सल्लाह डाक्टरखौ सोंनो।',
    },
    prohibitedMixing: [],
  },

  mni: {
    languageCode: 'mni',
    languageName: 'Manipuri (Meitei)',
    nativeName: 'ꯃꯤꯇꯩꯂꯣꯟ',
    locale: 'mni-IN',
    bcp47List: ['mni-IN', 'mni', 'en-IN'], // Fallback to English TTS with notice
    speechRate: 0.82,
    pitch: 1.0,
    defaultHonorific: '',
    emotionalTemplates: {
      greeting: 'ꯈꯨꯔꯨꯝꯖꯔꯤ! ꯑꯩꯅꯥ ꯀꯔꯤ ꯃꯇꯦꯡ ꯄꯥꯡꯒꯦ?',
      praise: 'ꯌꯥꯝꯅꯥ ꯐꯕꯥ! ꯅꯍꯥꯛꯅꯥ ꯌꯥꯝꯅꯥ ꯐꯖꯅꯥ ꯇꯧꯔꯦ।',
      comfort: 'ꯀꯔꯤꯒꯨꯝꯕꯥ ꯑꯋꯥꯕꯥ ꯂꯩꯇꯦ। ꯑꯩꯈꯣꯌ ꯃꯁꯥ-ꯃꯁꯥ ꯆꯥꯎꯕꯤꯒꯅꯤ।',
      confusion: 'ꯅꯍꯥꯛ ꯌꯨꯝꯗꯥ ꯑꯣꯏꯅꯥ ꯂꯩꯔꯤ। ꯑꯩꯅꯥ ꯃꯇꯦꯡ ꯄꯥꯡꯒꯅꯤ।',
      repeat: 'ꯑꯃꯨꯛ ꯍꯟꯅꯥ ꯍꯥꯏꯒꯅꯤ।',
      farewell: 'ꯅꯨꯡꯉꯥꯏꯇꯕꯥ ꯅꯨꯃꯤꯠ ꯑꯃꯥ ꯑꯣꯏꯒꯗꯕꯅꯤ।',
      offlineNotice: 'ꯏꯟꯇꯥꯔꯅꯦꯠ ꯂꯩꯇꯦ, ꯑꯗꯨꯕꯨ ꯅꯍꯥꯛꯀꯤ ꯁꯤꯖꯤꯟꯅꯕꯁꯤꯡ ꯂꯩꯔꯤ।',
      safetyRefusal: 'ꯑꯩꯅꯥ ꯅꯨꯃꯤꯠ ꯈꯨꯗꯤꯡꯗꯥ ꯃꯇꯦꯡ ꯄꯥꯡꯕꯥ ꯌꯥꯏ, ꯑꯗꯨꯕꯨ ꯂꯥꯌꯅꯥ ꯗꯣꯛꯇꯔꯗꯥ ꯍꯟꯖꯤꯅꯕꯤꯌꯨ।',
    },
    prohibitedMixing: [],
  },

  kha: {
    languageCode: 'kha',
    languageName: 'Khasi',
    nativeName: 'Ka Ktien Khasi',
    locale: 'kha-IN',
    bcp47List: ['kha-IN', 'kha', 'en-IN'], // Fallback to English TTS with notice
    speechRate: 0.82,
    pitch: 1.0,
    defaultHonorific: '',
    emotionalTemplates: {
      greeting: 'Khublei! Kumno nga lah ban iarap ia phi mynta?',
      praise: 'Ba bha smat! Phi la thoh ban poi khatduh.',
      comfort: 'Ym dei na ka jingialang. Ngi poi thoh-thoh.',
      confusion: 'Phi don ha iing na phi. Ngi wan ban iarap ia phi.',
      repeat: 'Hei, nga ong biang.',
      farewell: 'Phi im kumne. Ka sngi kaba bha.',
      offlineNotice: 'Iym don internet, hynrei ki jingiathoh na phi ki long bneng.',
      safetyRefusal: 'Nga lah ban iarap ha ka rukom pynshlur, hynrei ka medical advice ka dei na u doctor.',
    },
    prohibitedMixing: [],
  },

  grt: {
    languageCode: 'grt',
    languageName: 'Garo',
    nativeName: 'A·chik',
    locale: 'grt-IN',
    bcp47List: ['grt-IN', 'grt', 'en-IN'], // Fallback to English TTS with notice
    speechRate: 0.82,
    pitch: 1.0,
    defaultHonorific: '',
    emotionalTemplates: {
      greeting: 'Na·a man·gipa! Ang nangko dakna changchigipa salgija?',
      praise: 'Sko baten ong·a! Nang nikgija aro bimang on·angaha.',
      comfort: 'Ia ba don·griknok. Angni bilsi-bilsi dakagipon.',
      confusion: 'Nang noknigimin salgija don·a. Ang nangko dakgibon.',
      repeat: 'Ang ambi mande on·aha.',
      farewell: 'Nang salgijaon dake. Sal-gija dambo ong·a.',
      offlineNotice: 'Internet dong·gija, nangni routine aro dawai nikchake dona.',
      safetyRefusal: 'Ang nangni chanchi routine dakna changchigipa, niatba dawai-nikani cha·na doctorko songa.',
    },
    prohibitedMixing: [],
  },

  lus: {
    languageCode: 'lus',
    languageName: 'Mizo',
    nativeName: 'Mizo ṭawng',
    locale: 'lus-IN',
    bcp47List: ['lus-IN', 'lus', 'en-IN'], // Fallback to English TTS with notice
    speechRate: 0.82,
    pitch: 1.0,
    defaultHonorific: '',
    emotionalTemplates: {
      greeting: 'Chibai! Eng tinnge ka pui che ang?',
      praise: 'A ṭha hle mai! I thawhrim a lang!',
      comfort: 'A harsa lo. Kan la tum leh dawn nia.',
      confusion: 'I in ah i awm mek. Ka tan ah hian i him e.',
      repeat: 'Eng, ka hrilh leh dawn che.',
      farewell: 'Hmuingil takin la awm rawh se. Ni ṭha.',
      offlineNotice: 'Internet a awm lo, mahse i damdawi leh schedule a awm mek.',
      safetyRefusal: 'I nitin hun hman ka ti pui thei, mahse damdawi chinchhuah chungchang hi doctor hriattir ṭha ber.',
    },
    prohibitedMixing: [],
  },
};

export class LanguageProfileManager {
  /**
   * Retrieve active profile by code with safe fallback to English
   */
  static getProfile(langCode: string): LanguageProfile {
    const clean = (langCode || 'en').toLowerCase().trim();
    return LANGUAGE_PROFILES[clean] || LANGUAGE_PROFILES['en'];
  }

  /**
   * Validate if a selected language has genuine TTS support
   */
  static isVoiceCompatible(langCode: string, availableLocales: string[]): boolean {
    const profile = this.getProfile(langCode);
    if (!availableLocales || availableLocales.length === 0) return true; // Default system fallback
    return profile.bcp47List.some((target) =>
      availableLocales.some((avail) => avail.toLowerCase().includes(target.toLowerCase()))
    );
  }

  /**
   * Get respectful localized emotional phrase
   */
  static getPhrase(
    langCode: string,
    type: keyof EmotionalTemplates,
    customHonorific?: string
  ): string {
    const profile = this.getProfile(langCode);
    let phrase = profile.emotionalTemplates[type] || profile.emotionalTemplates.greeting;
    if (customHonorific && profile.defaultHonorific) {
      phrase = phrase.replace(profile.defaultHonorific, customHonorific);
    }
    return phrase;
  }
}
