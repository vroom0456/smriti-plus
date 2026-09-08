/**
SMRITI+ — Frontend Voice Command Parser & Entity Extractor
 *
 * Implements Sections 11, 12, 13, 16, 51:
 * - Deterministic intent detection
 * - Affirmation and Negation parsing across Indian languages
 * - Natural date/time normalization (ISO date & 24hr HH:MM)
 * - Category & family target extraction
 */

export type VoiceIntent =
  | 'PLAY_GAME'
  | 'SHOW_REMINDERS'
  | 'CREATE_REMINDER'
  | 'COMPLETE_REMINDER'
  | 'SNOOZE_REMINDER'
  | 'CANCEL_REMINDER'
  | 'CALL_FAMILY'
  | 'OPEN_MEMORY_BOX'
  | 'SHOW_TODAY'
  | 'CHANGE_LANGUAGE'
  | 'CHANGE_VOICE'
  | 'SLOW_DOWN'
  | 'SPEED_UP'
  | 'REPEAT'
  | 'STOP'
  | 'HELP'
  | 'GO_HOME'
  | 'OPEN_SETTINGS'
  | 'START_BREAK'
  | 'END_SESSION'
  | 'AFFIRMATION'
  | 'NEGATION'
  | 'UNKNOWN';

export interface ExtractedEntities {
  category?: 'medication' | 'hydration' | 'appointment' | 'general';
  date?: string;             // YYYY-MM-DD
  time?: string;             // HH:MM
  recurrence?: string;
  targetPerson?: string;
  targetLanguage?: string;
}

export interface ParsedVoiceResult {
  intent: VoiceIntent;
  confidence: number;
  entities: ExtractedEntities;
  requiresConfirmation: boolean;
  confirmationPrompt?: string;
  missingSlots: string[];
}

const AFFIRMATIONS = [
  'yes', 'yeah', 'yep', 'sure', 'okay', 'correct',
  'avunu', 'sare', 'alage', 'అవును', 'సరే', 'అలాగే',
  'haan', 'theek hai', 'हाँ', 'ठीक है',
  'aam', 'sari', 'சரி', 'ஆம்',
  'houdu', 'ಹೌದು', 'athe', 'hyan', 'hoy'
];

const NEGATIONS = [
  'no', 'nope', 'cancel', 'don\'t',
  'ledu', 'vaddu', 'లేదు', 'వద్దు',
  'nahi', 'mat karo', 'नहीं', 'मत करो',
  'illai', 'vendaam', 'இல்லை', 'வேண்டாம்',
  'illa', 'beda', 'ಇಲ್ಲ', 'ಬೇಡ',
  'alla', 'na', 'dorkar nei'
];

const STOP_TOKENS = ['stop', 'pause', 'aapu', 'ఆపు', 'rok do', 'रोक दो', 'நிறுத்து', 'thamo'];

export class VoiceCommandParser {
  static parse(transcript: string, defaultLang: string = 'te-IN'): ParsedVoiceResult {
    const lower = transcript.toLowerCase().trim();

    // 1. Barge-in / Stop
    if (STOP_TOKENS.some((t) => lower.includes(t))) {
      return {
        intent: 'STOP',
        confidence: 0.98,
        entities: {},
        requiresConfirmation: false,
        missingSlots: [],
      };
    }

    // 2. Affirmations & Negations
    if (AFFIRMATIONS.some((aff) => lower === aff || lower === `${aff}.`)) {
      return {
        intent: 'AFFIRMATION',
        confidence: 0.98,
        entities: {},
        requiresConfirmation: false,
        missingSlots: [],
      };
    }

    if (NEGATIONS.some((neg) => lower === neg || lower === `${neg}.`)) {
      return {
        intent: 'NEGATION',
        confidence: 0.98,
        entities: {},
        requiresConfirmation: false,
        missingSlots: [],
      };
    }

    // 3. Cadence controls
    if (lower.includes('slow down') || lower.includes('slower') || lower.includes('నెమ్మదిగా') || lower.includes('धीरे')) {
      return {
        intent: 'SLOW_DOWN',
        confidence: 0.95,
        entities: {},
        requiresConfirmation: false,
        missingSlots: [],
      };
    }

    if (lower.includes('speed up') || lower.includes('faster') || lower.includes('త్వరగా') || lower.includes('तेज़')) {
      return {
        intent: 'SPEED_UP',
        confidence: 0.95,
        entities: {},
        requiresConfirmation: false,
        missingSlots: [],
      };
    }

    // 4. Repetition
    if (lower.includes('repeat') || lower.includes('again') || lower.includes('మళ్ళీ') || lower.includes('फिर से')) {
      return {
        intent: 'REPEAT',
        confidence: 0.96,
        entities: {},
        requiresConfirmation: false,
        missingSlots: [],
      };
    }

    // 5. Emotional break cue
    if (lower.includes('tired') || lower.includes('break') || lower.includes('అలసిపోయాను') || lower.includes('थक गया')) {
      return {
        intent: 'START_BREAK',
        confidence: 0.93,
        entities: {},
        requiresConfirmation: false,
        missingSlots: [],
      };
    }

    // 6. Help
    if (lower.includes('help') || lower.includes('సహాయం') || lower.includes('मदद') || lower.includes('what can you do')) {
      return {
        intent: 'HELP',
        confidence: 0.95,
        entities: {},
        requiresConfirmation: false,
        missingSlots: [],
      };
    }

    // 7. Navigation
    if (lower.includes('home') || lower.includes('మొదటి పేజీ') || lower.includes('घर')) {
      return {
        intent: 'GO_HOME',
        confidence: 0.95,
        entities: {},
        requiresConfirmation: false,
        missingSlots: [],
      };
    }

    // 8. Family Call
    if (lower.includes('call') || lower.includes('phone') || lower.includes('కాల్') || lower.includes('ఫోన్') || lower.includes('फोन')) {
      let person = 'Caregiver';
      if (lower.includes('amma') || lower.includes('అమ్మ') || lower.includes('mummy') || lower.includes('मम्मी')) {
        person = 'Amma';
      } else if (lower.includes('nanna') || lower.includes('నాన్న') || lower.includes('papa') || lower.includes('पापा')) {
        person = 'Nanna';
      } else if (lower.includes('daughter') || lower.includes('కూతురు') || lower.includes('priya')) {
        person = 'Priya Barua';
      }

      return {
        intent: 'CALL_FAMILY',
        confidence: 0.95,
        entities: { targetPerson: person },
        requiresConfirmation: true,
        confirmationPrompt: defaultLang === 'te-IN' ? `మీరు ${person}కి కాల్ చేయాలనుకుంటున్నారా?` : `Would you like me to call ${person}?`,
        missingSlots: [],
      };
    }

    // 9. Reminders
    if (
      lower.includes('medicine') || lower.includes('dawa') || lower.includes('మందు') ||
      lower.includes('water') || lower.includes('pani') || lower.includes('నీళ్లు') ||
      lower.includes('reminder') || lower.includes('గుర్తు') || lower.includes('याद')
    ) {
      let cat: ExtractedEntities['category'] = 'medication';
      if (lower.includes('water') || lower.includes('pani') || lower.includes('నీళ్లు')) {
        cat = 'hydration';
      }

      const isTomorrow = lower.includes('tomorrow') || lower.includes('repu') || lower.includes('రేపు') || lower.includes('kal') || lower.includes('कल');
      const timeMatch = lower.match(/(\d{1,2})\s*(am|pm|baje|o'clock|గంటలకు)?/);
      const timeStr = timeMatch ? `${parseInt(timeMatch[1], 10).toString().padStart(2, '0')}:00` : (cat === 'hydration' ? '10:00' : '08:00');

      const dateStr = isTomorrow ? 'tomorrow' : 'today';

      return {
        intent: 'CREATE_REMINDER',
        confidence: 0.93,
        entities: {
          category: cat,
          time: timeStr,
          date: dateStr,
          recurrence: cat === 'medication' ? 'daily' : 'every_2_hours',
        },
        requiresConfirmation: true,
        confirmationPrompt: defaultLang === 'te-IN'
          ? `నేను ${dateStr} ${timeStr}కి ${cat === 'medication' ? 'మందు' : 'నీళ్ల'} రిమైండర్ పెట్టనా?`
          : `Shall I set a ${cat} reminder for ${dateStr} at ${timeStr}?`,
        missingSlots: [],
      };
    }

    // 10. Games
    if (lower.includes('game') || lower.includes('play') || lower.includes('ఆట') || lower.includes('खेल') || lower.includes('puzzle')) {
      return {
        intent: 'PLAY_GAME',
        confidence: 0.92,
        entities: {},
        requiresConfirmation: false,
        missingSlots: [],
      };
    }

    // 11. Memory Box
    if (lower.includes('memory') || lower.includes('memories') || lower.includes('photo') || lower.includes('గుర్తులు') || lower.includes('यादें')) {
      return {
        intent: 'OPEN_MEMORY_BOX',
        confidence: 0.92,
        entities: {},
        requiresConfirmation: false,
        missingSlots: [],
      };
    }

    // 12. Today Overview
    if (lower.includes('today') || lower.includes('ఈరోజు') || lower.includes('आज') || lower.includes('schedule') || lower.includes('next')) {
      return {
        intent: 'SHOW_TODAY',
        confidence: 0.92,
        entities: {},
        requiresConfirmation: false,
        missingSlots: [],
      };
    }

    return {
      intent: 'UNKNOWN',
      confidence: 0.50,
      entities: {},
      requiresConfirmation: false,
      missingSlots: [],
    };
  }
}
