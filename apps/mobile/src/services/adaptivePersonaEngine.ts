/**
 * SMRITI+ — Adaptive Behavioral Persona & Regional Dialect Engine
 *
 * Implements:
 * - Real-time behavioral pattern tracking (hesitations, repeats, fatigue, time of day)
 * - Dynamic persona adaptation: ultra_gentle, warm_companion, encouraging_coach, calm_evening
 * - Cultural honorifics & colloquial phrasing (Amma, Babuji, Tatayya, andi, ji)
 * - Culturally fluent, authentic regional speech generation for Telugu, Hindi, Assamese, Tamil, Bengali, and English
 */

import { CanonicalIntent } from './voiceIntelligence';

export type PersonaType = 'ultra_gentle' | 'warm_companion' | 'encouraging_coach' | 'calm_evening';
export type HonorificType = 'Amma' | 'Babuji' | 'Tatayya' | 'Mataji' | 'Aai' | 'Friend' | 'none';

export interface BehavioralProfile {
  consecutiveRepeats: number;
  hesitationCount: number;
  fatigueSignals: number;
  successStreak: number;
  currentPersona: PersonaType;
  preferredHonorific: HonorificType;
  speechSpeed: number; // 0.75x - 0.95x
  toneDescription: string;
}

class AdaptivePersonaEngine {
  private profile: BehavioralProfile = {
    consecutiveRepeats: 0,
    hesitationCount: 0,
    fatigueSignals: 0,
    successStreak: 0,
    currentPersona: 'warm_companion',
    preferredHonorific: 'none',
    speechSpeed: 0.85,
    toneDescription: 'Respectful & Patient Companion',
  };

  getProfile(): BehavioralProfile {
    return { ...this.profile };
  }

  setHonorific(honorific: HonorificType) {
    this.profile.preferredHonorific = honorific;
  }

  setManualPersona(persona: PersonaType) {
    this.profile.currentPersona = persona;
    this.updateSpeedAndDescription();
  }

  setSpeechSpeed(speed: number) {
    this.profile.speechSpeed = Math.max(0.6, Math.min(1.1, Number(speed.toFixed(2))));
  }

  /**
   * Ingest behavioral signals to adapt assistant persona dynamically
   */
  recordBehavioralSignal(signal: 'repeat' | 'hesitation' | 'struggle' | 'success' | 'fatigue') {
    if (signal === 'repeat') {
      this.profile.consecutiveRepeats += 1;
      this.profile.successStreak = 0;
    } else if (signal === 'hesitation') {
      this.profile.hesitationCount += 1;
      this.profile.successStreak = 0;
    } else if (signal === 'struggle') {
      this.profile.hesitationCount += 1;
      this.profile.successStreak = 0;
    } else if (signal === 'fatigue') {
      this.profile.fatigueSignals += 1;
    } else if (signal === 'success') {
      this.profile.successStreak += 1;
      this.profile.consecutiveRepeats = Math.max(0, this.profile.consecutiveRepeats - 1);
      this.profile.hesitationCount = Math.max(0, this.profile.hesitationCount - 1);
    }

    // Dynamic Persona Resolution
    const currentHour = new Date().getHours();

    if (this.profile.consecutiveRepeats >= 2 || this.profile.hesitationCount >= 2 || signal === 'struggle') {
      this.profile.currentPersona = 'ultra_gentle';
      this.profile.speechSpeed = 0.78; // Slow down speech cadence for maximum clarity
      this.profile.toneDescription = 'Ultra-Gentle & Soothing (Extra Patience)';
    } else if (this.profile.fatigueSignals > 0 || currentHour >= 20 || currentHour < 6) {
      this.profile.currentPersona = 'calm_evening';
      this.profile.speechSpeed = 0.80;
      this.profile.toneDescription = 'Peaceful Evening Cadence (Restful & Calming)';
    } else if (this.profile.successStreak >= 2) {
      this.profile.currentPersona = 'encouraging_coach';
      this.profile.speechSpeed = 0.88;
      this.profile.toneDescription = 'Encouraging & Joyful (Celebrating Strength)';
    } else {
      this.profile.currentPersona = 'warm_companion';
      this.profile.speechSpeed = 0.85;
      this.profile.toneDescription = 'Respectful & Patient Companion';
    }
  }

  private updateSpeedAndDescription() {
    switch (this.profile.currentPersona) {
      case 'ultra_gentle':
        this.profile.speechSpeed = 0.78;
        this.profile.toneDescription = 'Ultra-Gentle & Soothing (Extra Patience)';
        break;
      case 'calm_evening':
        this.profile.speechSpeed = 0.80;
        this.profile.toneDescription = 'Peaceful Evening Cadence (Restful & Calming)';
        break;
      case 'encouraging_coach':
        this.profile.speechSpeed = 0.88;
        this.profile.toneDescription = 'Encouraging & Joyful (Celebrating Strength)';
        break;
      case 'warm_companion':
      default:
        this.profile.speechSpeed = 0.85;
        this.profile.toneDescription = 'Respectful & Patient Companion';
        break;
    }
  }

  /**
   * Generates culturally fluent, respectful spoken text in the requested regional language
   */
  generateFluentResponse(
    intent: CanonicalIntent,
    langCode: string = 'te',
    rawTranscript: string = ''
  ): { spokenText: string; displayText: string } {
    const lang = langCode.toLowerCase().split('-')[0];
    const persona = this.profile.currentPersona;
    const honorific = this.profile.preferredHonorific !== 'none' ? this.profile.preferredHonorific : '';

    // ──────────────────────────────────────────────
    // 1. TELUGU (తెలుగు) — Authentic, warm, respectful elder phrasing
    // ──────────────────────────────────────────────
    if (lang === 'te') {
      const hPrefix = (honorific && honorific !== 'Friend') ? `${honorific}గారూ, ` : '';

      if (intent.intent === 'create_reminder') {
        const cat = intent.category === 'hydration' ? 'మంచినీళ్లు తాగాలని' : 'మందులు వేసుకోవాలని';
        const when = intent.date === 'tomorrow' ? 'రేపు' : 'ఈ రోజు';
        const time = intent.time ? `${this.formatTeluguTime(intent.time)} గంటలకు` : 'సమయానికి';

        if (persona === 'ultra_gentle') {
          const spoken = `ఎలాంటి కంగారు పడకండి ${hPrefix}${when} ${time} ${cat} నేను ప్రేమగా గుర్తుచేస్తాను. ఇది సరైనదేనా?`;
          return { spokenText: spoken, displayText: spoken };
        } else if (persona === 'calm_evening') {
          const spoken = `సరేనండి ${hPrefix}${when} ${time} మీ ${cat} చక్కగా గుర్తుచేస్తాను. ఇది ఖాయం చేయమంటారా?`;
          return { spokenText: spoken, displayText: spoken };
        } else {
          const spoken = `సరేనండి ${hPrefix}${when} ${time} ${cat} గుర్తుచేస్తాను. ఇది సరైనదేనా?`;
          return { spokenText: spoken, displayText: spoken };
        }
      }

      if (intent.intent === 'log_reminder') {
        const isWater = intent.category === 'hydration';
        if (persona === 'encouraging_coach') {
          const spoken = `చాలా సంతోషం ${hPrefix}మీరు ${isWater ? 'నీళ్లు తాగినట్లు' : 'మందులు తీసుకున్నట్లు'} నమోదు చేశాను. మీ ఆరోగ్యం మాకు ఎంతో ముఖ్యం!`;
          return { spokenText: spoken, displayText: spoken };
        } else {
          const spoken = `మంచిదండి ${hPrefix}మీరు ${isWater ? 'నీళ్లు తాగినట్లు' : 'మందులు తీసుకున్నట్లు'} భద్రపరిచాను. నిశ్చింతగా ఉండండి.`;
          return { spokenText: spoken, displayText: spoken };
        }
      }

      if (intent.intent === 'start_game') {
        if (persona === 'ultra_gentle') {
          const spoken = `తీరికగా చేద్దామండి ${hPrefix}మనమిద్దరం కలిసి ఒక చిన్న మనసుకు హాయినిచ్చే ఆట ఆడదామా?`;
          return { spokenText: spoken, displayText: spoken };
        } else if (persona === 'encouraging_coach') {
          const spoken = `శభాష్ ${hPrefix}మీ ఆలోచనా శక్తిని మరింత చురుగ్గా ఉంచేందుకు ఒక సరదా ఆట మొదలుపెడదామా?`;
          return { spokenText: spoken, displayText: spoken };
        } else {
          const spoken = `తప్పకుండా ${hPrefix}మనసు ఉల్లాసంగా ఉండేందుకు ఒక మంచి ఆట ఆడదామా?`;
          return { spokenText: spoken, displayText: spoken };
        }
      }

      if (intent.intent === 'change_difficulty') {
        const spoken = `ఎలాంటి ఇబ్బంది లేదండి ${hPrefix}మనం ఈ ఆటను చాలా సులభంగా మరియు ప్రశాంతంగా చేద్దాం.`;
        return { spokenText: spoken, displayText: spoken };
      }

      if (intent.intent === 'call_family') {
        const person = intent.targetPerson || 'మీ కుటుంబ సభ్యులకు';
        const spoken = `సరేనండి ${hPrefix}${person}కి కాల్ కలపమంటారా?`;
        return { spokenText: spoken, displayText: spoken };
      }

      if (intent.intent === 'comfort_break') {
        const spoken = `తప్పకుండా ${hPrefix}కాసేపు కళ్ళు మూసుకుని హాయిగా విశ్రాంతి తీసుకోండి. ఎటువంటి తొందర లేదు.`;
        return { spokenText: spoken, displayText: spoken };
      }

      if (intent.intent === 'repeat') {
        const spoken = `మళ్ళీ చెప్తున్నానండి ${hPrefix}నిదానంగా వినండి.`;
        return { spokenText: spoken, displayText: spoken };
      }

      if (intent.missingSlots.length > 0) {
        if (intent.missingSlots[0] === 'category') {
          const spoken = `సరేనండి ${hPrefix}నేను మీకు దేని గురించి గుర్తుచేయాలి? ఉదాహరణకు: మందులా లేక మంచినీళ్లా?`;
          return { spokenText: spoken, displayText: spoken };
        } else {
          const spoken = `ఏ సమయానికి గుర్తుచేయమంటారో సెలవివ్వండి ${hPrefix}?`;
          return { spokenText: spoken, displayText: spoken };
        }
      }

      const fallback = `నేను విన్నానండీ: "${rawTranscript}". మీ షెడ్యూల్, మందులు, లేదా ఆటల గురించి అడగవచ్చు. నేను మీకు సహాయంగా ఉన్నాను.`;
      return {
        spokenText: fallback,
        displayText: fallback,
      };
    }

    // ──────────────────────────────────────────────
    // 2. HINDI (हिन्दी) — Respectful, warm, colloquial North Indian tone
    // ──────────────────────────────────────────────
    if (lang === 'hi') {
      const hPrefix = (honorific && honorific !== 'Friend') ? `${honorific} जी, ` : '';

      if (intent.intent === 'create_reminder') {
        const cat = intent.category === 'hydration' ? 'पानी पीने की' : 'दवाई लेने की';
        const when = intent.date === 'tomorrow' ? 'कल' : 'आज';
        const time = intent.time ? `${this.formatHindiTime(intent.time)}` : 'समय पर';

        if (persona === 'ultra_gentle') {
          const spoken = `बिल्कुल चिंता मत कीजिए ${hPrefix}मैं ${when} ${time} आपको ${cat} प्यार से याद दिला दूंगा। क्या यह ठीक है?`;
          return { spokenText: spoken, displayText: spoken };
        } else {
          const spoken = `जी बिल्कुल ${hPrefix}मैं ${when} ${time} आपको ${cat} याद दिला दूंगा। क्या यह सही है?`;
          return { spokenText: spoken, displayText: spoken };
        }
      }

      if (intent.intent === 'log_reminder') {
        const isWater = intent.category === 'hydration';
        const spoken = `बहुत बढ़िया ${hPrefix}मैंने दर्ज कर लिया है कि आपने ${isWater ? 'पानी पी लिया' : 'दवाई ले ली'}। अपनी सेहत का ऐसे ही ध्यान रखें।`;
        return { spokenText: spoken, displayText: spoken };
      }

      if (intent.intent === 'start_game') {
        const spoken = persona === 'encouraging_coach'
          ? `शाबाश ${hPrefix}आइए दिमाग को तरोताज़ा करने के लिए एक मज़ेदार खेल खेलते हैं!`
          : `ज़रूर ${hPrefix}आइए मन को शांत और खुश रखने के लिए एक सरल खेल शुरू करें।`;
        return { spokenText: spoken, displayText: spoken };
      }

      if (intent.intent === 'change_difficulty') {
        const spoken = `कोई बात नहीं ${hPrefix}हम आराम से खेलेंगे। मैं इसे आपके लिए बिल्कुल आसान बना देता हूँ।`;
        return { spokenText: spoken, displayText: spoken };
      }

      if (intent.intent === 'call_family') {
        const person = intent.targetPerson || 'आपके परिवार';
        const spoken = `जी ${hPrefix}क्या मैं ${person} को फ़ोन मिला दूँ?`;
        return { spokenText: spoken, displayText: spoken };
      }

      if (intent.intent === 'comfort_break') {
        const spoken = `बिल्कुल ${hPrefix}आप थोड़ी देर आराम कीजिए। कोई जल्दी नहीं है।`;
        return { spokenText: spoken, displayText: spoken };
      }

      if (intent.missingSlots.length > 0) {
        const spoken = intent.missingSlots[0] === 'category'
          ? `ज़रूर ${hPrefix}मैं किस चीज़ की याद दिलाऊँ? जैसे दवाई या पानी?`
          : `किस समय याद दिलाना है ${hPrefix}?`;
        return { spokenText: spoken, displayText: spoken };
      }

      const fallback = `मैंने सुना: "${rawTranscript}"। आप दवाई, कार्यक्रम, या खेल के बारे में पूछ सकते हैं। मैं आपके लिए यहाँ हूँ।`;
      return {
        spokenText: fallback,
        displayText: fallback,
      };
    }

    // ──────────────────────────────────────────────
    // 3. ASSAMESE (অসমীয়া) — Respectful regional Assamese
    // ──────────────────────────────────────────────
    if (lang === 'as') {
      if (intent.intent === 'create_reminder') {
        const cat = intent.category === 'hydration' ? 'পানী খোৱাৰ' : 'ঔষধ খোৱাৰ';
        const when = intent.date === 'tomorrow' ? 'অহাকালি' : 'আজি';
        const spoken = `নিশ্চয়, ${when} আপোনাক ${cat} কথা মই মৰমেৰে মনত পেলাই দিম। ঠিকেই আছে নে?`;
        return { spokenText: spoken, displayText: spoken };
      }
      if (intent.intent === 'log_reminder') {
        const spoken = `বৰ ধুনীয়া! মই টুকি ৰাখিলোঁ। নিজৰ স্বাস্থ্যৰ যত্ন লওক।`;
        return { spokenText: spoken, displayText: spoken };
      }
      if (intent.intent === 'start_game') {
        const spoken = `নিশ্চয়, মনটো সতেজ কৰিবলৈ এটা ধুনীয়া খেল আৰম্ভ কৰোঁ নেকি?`;
        return { spokenText: spoken, displayText: spoken };
      }
      if (intent.intent === 'change_difficulty') {
        const spoken = `একো চিন্তা নকৰিব, খেলটো আমি একেবাৰে সহজ কৰি লওঁ আহক।`;
        return { spokenText: spoken, displayText: spoken };
      }
      if (intent.intent === 'call_family') {
        const spoken = `আপোনাৰ পৰিয়াললৈ ফোন সংযোগ কৰোঁ নেকি?`;
        return { spokenText: spoken, displayText: spoken };
      }
      const fallback = `মই শুনিলোঁ: "${rawTranscript}"। আপুনি ঔষধ, কাৰ্যসূচী, বা খেলৰ বিষয়ে সুধিব পাৰে। মই আপোনাৰ কাৰণে ইয়াতে আছোঁ।`;
      return {
        spokenText: fallback,
        displayText: fallback,
      };
    }

    // ──────────────────────────────────────────────
    // 4. TAMIL (தமிழ்) — Respectful Tamil
    // ──────────────────────────────────────────────
    if (lang === 'ta') {
      if (intent.intent === 'create_reminder') {
        const when = intent.date === 'tomorrow' ? 'நாளை' : 'இன்று';
        const cat = intent.category === 'hydration' ? 'தண்ணீர் குடிக்க' : 'மருந்து உட்கொள்ள';
        const spoken = `நிச்சயமாக, ${when} ${cat} நான் நினைவூட்டுகிறேன். இது சரியானதா?`;
        return { spokenText: spoken, displayText: spoken };
      }
      if (intent.intent === 'log_reminder') {
        const spoken = `மிக நன்று! நீங்கள் செய்ததை பதிவு செய்துவிட்டேன்.`;
        return { spokenText: spoken, displayText: spoken };
      }
      if (intent.intent === 'start_game') {
        const spoken = `நிச்சயமாக, மனதை சுறுசுறுப்பாக்க ஒரு எளிய விளையாட்டு தொடங்கலாமா?`;
        return { spokenText: spoken, displayText: spoken };
      }
      const fallback = `நான் கேட்டது: "${rawTranscript}"। மருந்து, நேரம், அல்லது விளையாட்டு பற்றி கேளுங்கள். நான் உங்களுக்கு உதவி இங்கே இருக்கிறேன்.`;
      return {
        spokenText: fallback,
        displayText: fallback,
      };
    }

    // ──────────────────────────────────────────────
    // 5. BENGALI (বাংলা) — Sweet, warm Bengali
    // ──────────────────────────────────────────────
    if (lang === 'bn') {
      if (intent.intent === 'create_reminder') {
        const when = intent.date === 'tomorrow' ? 'কাল' : 'আজ';
        const cat = intent.category === 'hydration' ? 'জল খাওয়ার' : 'ওষুধ খাওয়ার';
        const spoken = `অবশ্যই, ${when} আপনার ${cat} কথা আমি মনে করিয়ে দেব। ঠিক আছে তো?`;
        return { spokenText: spoken, displayText: spoken };
      }
      if (intent.intent === 'log_reminder') {
        const spoken = `খুব ভালো! আমি লিখে রাখলাম। নিজের শরীরের যত্ন নেবেন।`;
        return { spokenText: spoken, displayText: spoken };
      }
      if (intent.intent === 'start_game') {
        const spoken = `চলুন, মন ভালো করার জন্য একটি সুন্দর খেলা শুরু করা যাক।`;
        return { spokenText: spoken, displayText: spoken };
      }
      const fallback = `আমি শুনেছি: "${rawTranscript}"। ওষুধ, রুটিন, বা খেলার বিষয়ে জিজ্ঞেস করুন। আমি আপনার জন্য এখানে আছি।`;
      return {
        spokenText: fallback,
        displayText: fallback,
      };
    }

    // ──────────────────────────────────────────────
    // 6. INDIAN ENGLISH — Warm, elder-comforting
    // ──────────────────────────────────────────────
    const prefix = (honorific && honorific !== 'Friend') ? `${honorific}, ` : '';
    if (intent.intent === 'create_reminder') {
      const when = intent.date === 'tomorrow' ? 'tomorrow' : 'today';
      const cat = intent.category === 'hydration' ? 'drink water' : 'take your medicine';
      const time = intent.time ? `at ${intent.time}` : '';
      const spoken = persona === 'ultra_gentle'
        ? `Take your time ${prefix}I will gently remind you to ${cat} ${when} ${time}. Does that sound good?`
        : `Certainly ${prefix}I will remind you to ${cat} ${when} ${time}. Is that correct?`;
      return { spokenText: spoken, displayText: spoken };
    }

    if (intent.intent === 'log_reminder') {
      const isWater = intent.category === 'hydration';
      const spoken = persona === 'encouraging_coach'
        ? `Wonderful ${prefix}! Recorded that you had your ${isWater ? 'water' : 'medicine'}. You are doing fantastic!`
        : `Recorded successfully ${prefix}. Always taking good care of yourself!`;
      return { spokenText: spoken, displayText: spoken };
    }

    if (intent.intent === 'start_game') {
      const spoken = persona === 'encouraging_coach'
        ? `Splendid! Let's stimulate our minds with a joyful memory game!`
        : `Sure thing ${prefix}. Shall we play a calm memory game together?`;
      return { spokenText: spoken, displayText: spoken };
    }

    if (intent.intent === 'change_difficulty') {
      const spoken = `That is completely okay ${prefix}. Let's make this much easier and take all the time we need.`;
      return { spokenText: spoken, displayText: spoken };
    }

    if (intent.intent === 'call_family') {
      const target = intent.targetPerson || 'your family';
      const spoken = `Would you like me to connect you with ${target}?`;
      return { spokenText: spoken, displayText: spoken };
    }

    if (intent.intent === 'comfort_break') {
      const spoken = `Of course ${prefix}. Let's take a peaceful rest. There is no rush at all.`;
      return { spokenText: spoken, displayText: spoken };
    }

    return {
      spokenText: `I heard: "${rawTranscript}". I am here for you. You can ask me about your schedule, medicines, or we can play a game together.`,
      displayText: `I heard: "${rawTranscript}". I am here for you. You can ask me about your schedule, medicines, or we can play a game together.`,
    };
  }

  private formatTeluguTime(timeStr: string): string {
    const [h] = timeStr.split(':').map(Number);
    const teluguNumbers: Record<number, string> = {
      6: 'ఆరు', 7: 'ఏడు', 8: 'ఎనిమిది', 9: 'తొమ్మిది', 10: 'పది',
      11: 'పదకొండు', 12: 'పన్నెండు', 13: 'ఒకటి', 14: 'రెండు',
      15: 'మూడు', 16: 'నాలుగు', 17: 'ఐదు', 18: 'ఆరు', 19: 'ఏడు',
      20: 'ఎనిమిది', 21: 'తొమ్మిది'
    };
    return teluguNumbers[h] || `${h}`;
  }

  private formatHindiTime(timeStr: string): string {
    const [h] = timeStr.split(':').map(Number);
    const hindiNumbers: Record<number, string> = {
      6: 'सुबह 6 बजे', 7: 'सुबह 7 बजे', 8: 'सुबह 8 बजे', 9: 'सुबह 9 बजे', 10: 'सुबह 10 बजे',
      11: 'सुबह 11 बजे', 12: 'दोपहर 12 बजे', 13: 'दोपहर 1 बजे', 14: 'दोपहर 2 बजे',
      15: 'दोपहर 3 बजे', 16: 'शाम 4 बजे', 17: 'शाम 5 बजे', 18: 'शाम 6 बजे', 19: 'रात 7 बजे',
      20: 'रात 8 बजे', 21: 'रात 9 बजे'
    };
    return hindiNumbers[h] || `${h} बजे`;
  }
}

export const adaptivePersonaEngine = new AdaptivePersonaEngine();
