// Re-export ultra-smart voice intelligence suite
export * from './voice/index';

import { voiceIntelligence, CanonicalIntent, VoiceState } from './voiceIntelligence';
import { languageRegistry } from './languageRegistry';
import { defaultVoiceService, VoiceService } from './voice/VoiceService';

export interface ParsedVoiceCommand {
  type: 'reminder' | 'game' | 'call' | 'query' | 'break' | 'unknown';
  action: string;
  parameters: Record<string, any>;
  confidence: number;
  confirmationText: string;
}

export const voiceService = {
  /**
   * Speak a phrase using the unified Voice Intelligence synthesizer
   */
  async speak(text: string, lang: string = 'en'): Promise<void> {
    await defaultVoiceService.speak(text, lang);
  },

  /**
   * Stop any ongoing speech output (barge-in / interruption)
   */
  async stop(): Promise<void> {
    await defaultVoiceService.cancel();
  },

  /**
   * Parse transcript into legacy ParsedVoiceCommand format or canonical intent
   */
  parseCommand(transcript: string): ParsedVoiceCommand {
    const canonical = voiceIntelligence.parseTranscript(transcript);

    let type: ParsedVoiceCommand['type'] = 'unknown';
    let action = 'none';

    if (canonical.intent === 'create_reminder' || canonical.intent === 'log_reminder') {
      type = 'reminder';
      action = canonical.intent === 'create_reminder' ? 'create_reminder' : 'log_reminder';
    } else if (canonical.intent === 'start_game' || canonical.intent === 'change_difficulty') {
      type = 'game';
      action = canonical.difficultyAction === 'easier' ? 'adjust_easier' : 'start_game';
    } else if (canonical.intent === 'call_family') {
      type = 'call';
      action = 'call_family';
    } else if (canonical.intent === 'comfort_break') {
      type = 'break';
      action = 'take_break';
    } else if (canonical.intent === 'help' || canonical.intent === 'show_memories') {
      type = 'query';
      action = canonical.intent;
    }

    return {
      type,
      action,
      parameters: {
        category: canonical.category,
        date: canonical.date,
        time: canonical.time,
        recurrence: canonical.recurrence,
        targetPerson: canonical.targetPerson,
        missingSlots: canonical.missingSlots,
      },
      confidence: canonical.confidence,
      confirmationText: canonical.confirmationPrompt,
    };
  },

  /**
   * Access to low-level engines
   */
  engine: voiceIntelligence,
  registry: languageRegistry,
  ultraSmartService: defaultVoiceService,
};

export { voiceIntelligence, languageRegistry, CanonicalIntent, VoiceState };

