/**
SMRITI+ — Multilingual Voice Intelligence Suite
 *
 * Primary entry point exporting:
 * - VoiceService singleton & class
 * - VoiceState & State Machine
 * - SpeechRecognizer & SpeechSynthesizer
 * - LanguageService & VoiceCapabilities
 * - VoiceCommandParser & ConfirmationManager
 * - VoiceErrorHandler
 * - VoiceContext & hooks (useVoiceAssistant, useVoiceState, useSpeechRecognition, useSpeechSynthesis)
 */

export * from './VoiceCapabilities';
export * from './SpeechRecognizer';
export * from './SpeechSynthesizer';
export * from './VoiceStateMachine';
export * from './LanguageService';
export * from './VoiceCommandParser';
export * from './ConfirmationManager';
export * from './VoiceErrorHandler';
export * from './VoiceService';
export * from './VoiceContext';

// Default singleton exports
import { defaultVoiceService } from './VoiceService';
export { defaultVoiceService as voiceService };
export default defaultVoiceService;
