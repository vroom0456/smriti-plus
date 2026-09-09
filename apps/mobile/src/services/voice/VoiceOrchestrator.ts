/**
 * SMRITI+ — Master Voice Orchestrator Layer
 *
 * Centralized End-to-End Multilingual Voice Pipeline:
 * USER SPEECH → STT → LANGUAGE → INTENT → CONTEXT → ACTION → RESPONSE → TTS
 *
 * Elderly-friendly, context-aware, patient companion that directly controls the SMRITI+ application.
 * Fully supports offline operation, regional Indian languages, in-game context, and multi-turn state.
 */

import { Platform } from 'react-native';
import { defaultSpeechRecognizer, SpeechRecognizer } from './SpeechRecognizer';
import { defaultSpeechSynthesizer, SpeechSynthesizer } from './SpeechSynthesizer';
import { defaultVoiceStateMachine, VoiceStateMachine, VoiceState } from './VoiceStateMachine';
import { LanguageService } from './LanguageService';
import { languageRegistry } from '../languageRegistry';
import { LanguageProfileManager } from '../languageProfiles';
import { offlineStore, DEFAULT_GAMES } from '../offlineStore';
import { api } from '../api';

// ─── Intent Types ─────────────────────────────────────────────────────────────

export type VoiceIntentType =
  | 'GREETING'
  | 'HELP'
  | 'START_GAME'
  | 'SELECT_GAME'
  | 'EASIER_GAME'
  | 'HARDER_GAME'
  | 'NEXT_GAME'
  | 'REPEAT_INSTRUCTION'
  | 'PAUSE_GAME'
  | 'RESUME_GAME'
  | 'STOP_GAME'
  | 'TODAY_PLAN'
  | 'NEXT_ACTIVITY'
  | 'MEDICINE_STATUS'
  | 'HYDRATION_STATUS'
  | 'APPOINTMENT_STATUS'
  | 'MARK_REMINDER_DONE'
  | 'SNOOZE_REMINDER'
  | 'CONFIRM'
  | 'CANCEL'
  | 'UNKNOWN';

export interface OrchestratorPendingAction {
  intent: VoiceIntentType;
  actionName: string;
  payload?: any;
  prompt: string;
  contextQuestion?: string;
}

export interface ConversationTurn {
  speaker: 'user' | 'assistant';
  text: string;
  timestamp: number;
  intent?: VoiceIntentType;
}

export interface VoiceConversationContext {
  language: string;
  currentScreen: 'home' | 'games' | 'reminders' | 'family' | 'voice' | 'settings';
  currentGame: string | null;           // e.g. 'memory_matching', 'pattern'
  currentDifficulty: number;
  lastIntent: VoiceIntentType | null;
  lastQuestion: string | null;
  pendingAction: OrchestratorPendingAction | null;
  recentConversation: ConversationTurn[];
  isOffline: boolean;
  userRole?: string;
  elderId?: string;
}

export interface VoiceActionHandlers {
  startGame?: (gameId?: string, difficulty?: number) => Promise<boolean> | boolean;
  setDifficulty?: (direction: 'easier' | 'harder') => Promise<number> | number;
  pauseGame?: () => boolean;
  resumeGame?: () => boolean;
  stopGame?: () => boolean;
  repeatInstruction?: () => string;
  getTodayPlan?: () => Promise<any> | any;
  getReminder?: (category?: string) => Promise<any> | any;
  markReminderDone?: (reminderIdOrTitle?: string) => Promise<boolean> | boolean;
  snoozeReminder?: (minutes?: number) => Promise<boolean> | boolean;
  openProgress?: () => void;
  openReminders?: () => void;
  navigate?: (screen: string) => void;
}

export interface OrchestratorResult {
  transcript: string;
  normalizedTranscript: string;
  detectedLanguage: string;
  intent: VoiceIntentType;
  confidence: number;
  spokenResponse: string;
  actionExecuted?: string;
  actionSuccess?: boolean;
  requiresConfirmation?: boolean;
  confirmationPrompt?: string;
  showTouchFallback?: boolean;
}

// ─── Multilingual Dictionaries for Elderly Speech Tolerance ────────────────────

const INTENT_PATTERNS: Record<VoiceIntentType, Array<RegExp | string>> = {
  CONFIRM: [
    /^(yes|yeah|yep|sure|ok|okay|haan|theek hai|sahi hai|avunu|sare|alage|hoy|hyan|aam|sari)$/i,
    /^(అవును|సరే|అలాగే|హా|हाँ|ठीक है|হৈ|হয়|ஆம்|சரி|ಹೌದು)$/i,
    /^(yes please|start now|karo|cheyyi|kora)$/i,
  ],
  CANCEL: [
    /^(no|nope|not now|cancel|nahi|mat karo|ledu|vaddu|dorkar nei|na|beda|illa)$/i,
    /^(లేదు|వద్దు|नहीं|मत करो|না|வద్దు|இல்லை)$/i,
  ],
  GREETING: [
    /^(hello|hi|hey|good morning|good afternoon|namaste|vanakkam|namaskaram|namaskar)$/i,
    /^(నమస్కారం|నమస్తే|नमस्ते|নমস্কাৰ|নমস্কার|வணக்கம்)$/i,
    /^(how are you|kemon acho|bagunnara|kaise ho|nuvvu ela unnav)$/i,
  ],
  HELP: [
    /(help|help me|what can you do|how to use|sahayam|madad|sohay)/i,
    /(సహాయం|మదద్|मदद|সহায়|உதவி)/i,
  ],
  START_GAME: [
    /(start game|play game|game chalao|aata modalupettu|khel shuru|khel chalao|shuru karo)/i,
    /(ఆట మొదలుపెట్టు|ఆట ఆడు|खेल शुरू|খেল আৰম্ভ|ஆட்டம் தொடங்கு)/i,
    /^(game|play|aata|khel)$/i,
  ],
  SELECT_GAME: [
    /(memory game|matching game|memory wala|cards game|card game|pattern game|recall game)/i,
    /(జ్ఞాపకశక్తి ఆట|మెమరీ గేమ్|గుర్తుంచుకునే ఆట|याददाश्त वाला खेल)/i,
    /(woh memory wala|that memory game|picture game)/i,
  ],
  EASIER_GAME: [
    /(difficult|hard|too hard|easy karo|make it easy|easier|simple karo|kastanga undi|mushkil hai)/i,
    /(కష్టంగా ఉంది|సులభం చేయి|సులువుగా|मुश्किल है|आसान करो|সহজ কৰক|கடினம்)/i,
    /^(easy|choti|saral|sahaj)$/i,
  ],
  HARDER_GAME: [
    /(make it harder|too easy|challenge|level up|peddadi|muskil karo)/i,
    /(కొంచెం కష్టంగా చేయి|పెద్ద ఆట|మరింత కష్టం|मुश्किल करो|আৰু কঠিন)/i,
  ],
  NEXT_GAME: [
    /(next game|another game|different game|verey aata|dusra khel|another activity)/i,
    /(వేరే ఆట|తర్వాతి ఆట|दूसरा खेल|অন্য খেল|அடுத்த ஆட்டம்)/i,
  ],
  REPEAT_INSTRUCTION: [
    /(repeat|say again|say that again|what do i do|what should i do in game|phir se bolo|malli cheppu)/i,
    /(మళ్ళీ చెప్పు|మళ్ళీ చెప్పు అండీ|फिर से बोलो|পুনৰ কোৱা|மீண்டும் சொல்)/i,
    /^(repeat|again|phir se|malli)$/i,
  ],
  PAUSE_GAME: [
    /(pause|hold on|wait a minute|aagu|ruk jao|thamba)/i,
    /(ఆగు|కొద్దిసేపు ఆగు|रुको|থমা|நில்)/i,
  ],
  RESUME_GAME: [
    /(resume|continue|keep playing|shuru karo|chalu karo|modalupettu)/i,
    /(కొనసాగించు|మళ్ళీ మొదలుపెట్టు|जारी रखो|চালু কৰক)/i,
  ],
  STOP_GAME: [
    /(stop game|exit game|close game|aapu|band karo|khel band|khotom)/i,
    /(ఆపు|ఆట ఆపు|ఆట ముగించు|खेल बंद करो|খেল বন্ধ কৰক)/i,
  ],
  TODAY_PLAN: [
    /(what should i do now|what do i do now|what to do now|what's my schedule|today's plan|today routine|kya karna hai)/i,
    /(ఈ రోజు ఏమిటి|ఈ రోజు షెడ్యూల్|నేను ఇప్పుడు ఏమి చేయాలి|आज क्या करना है|আজি কি কৰিব লাগে)/i,
    /^(what now|what next now|today schedule|routine)$/i,
  ],
  NEXT_ACTIVITY: [
    /(what's next|what is next|after this|tarwata emiti|aage kya hai|next activity|what next)/i,
    /(తర్వాత ఏమిటి|ఆ తర్వాత ఏమిటి|इसके बाद क्या है|ইয়াৰ পিছত কি|அடுத்து என்ன)/i,
  ],
  MEDICINE_STATUS: [
    /(medicine|tablet|pill|dawa|mandhu|did i take medicine|medicine time|next medicine)/i,
    /(మందు|మాత్ర|నా మందు ఎప్పుడు|మందులు వేసుకున్నానా|दवाई|दवा ली क्या|দৰব)/i,
  ],
  HYDRATION_STATUS: [
    /(water|drink water|hydration|pani|neellu|did i drink water|glasses of water)/i,
    /(నీళ్ళు|నీళ్లు తాగానా|पानी|पानी पिया क्या|পানী|தண்ணீர்)/i,
  ],
  APPOINTMENT_STATUS: [
    /(appointment|doctor|hospital|clinic|doctor visit|dr visit)/i,
    /(డాక్టర్|అపాయింట్‌మెంట్|వైద్యుడు|डॉक्टर|अस्पताल)/i,
  ],
  MARK_REMINDER_DONE: [
    /(took medicine|taken medicine|drank water|done|completed|vesukunna|le li|ho gaya)/i,
    /(మందు వేసుకున్నాను|నీళ్ళు తాగాను|పూర్తయింది|दवाई ले ली|काम हो गया|খাই ল'লো)/i,
  ],
  SNOOZE_REMINDER: [
    /(remind later|snooze|after 10 minutes|tarwata cheppu|baad mein batao|later)/i,
    /(తర్వాత గుర్తుచేయి|10 నిమిషాల తర్వాత|बाद में याद दिलाना|পিছত ক'ব)/i,
  ],
  UNKNOWN: [],
};

export class VoiceOrchestrator {
  private recognizer: SpeechRecognizer;
  private synthesizer: SpeechSynthesizer;
  private stateMachine: VoiceStateMachine;
  private actionHandlers: VoiceActionHandlers = {};
  private onStateChangeCallback?: (state: VoiceState, context: VoiceConversationContext) => void;

  private context: VoiceConversationContext = {
    language: 'te',
    currentScreen: 'home',
    currentGame: null,
    currentDifficulty: 1,
    lastIntent: null,
    lastQuestion: null,
    pendingAction: null,
    recentConversation: [],
    isOffline: false,
    userRole: 'elderly',
    elderId: 'demo-elder-id',
  };

  constructor(
    recognizer = defaultSpeechRecognizer,
    synthesizer = defaultSpeechSynthesizer,
    stateMachine = defaultVoiceStateMachine
  ) {
    this.recognizer = recognizer;
    this.synthesizer = synthesizer;
    this.stateMachine = stateMachine;

    // Listen to low-level recognizer events
    if (this.recognizer && typeof this.recognizer.setListener === 'function') {
      this.recognizer.setListener({
        onTranscript: (text, isFinal) => {
          if (isFinal) {
            this.processUserSpeech(text);
          }
        },
        onError: (err) => {
          this.stateMachine.transition('ERROR');
          this.notifyState();
        },
        onEnd: () => {
          if (this.stateMachine.getState() === 'LISTENING') {
            this.stateMachine.transition('IDLE');
            this.notifyState();
          }
        },
      });
    }

    // Detect browser offline events (Web only)
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('online', () => this.handleNetworkChange(false));
      window.addEventListener('offline', () => this.handleNetworkChange(true));
      if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
        this.context.isOffline = !navigator.onLine;
      }
    }
  }

  // ─── Public Configuration & State Methods ─────────────────────────────────

  setLanguage(lang: string): void {
    this.context.language = lang;
    this.notifyState();
  }

  getLanguage(): string {
    return this.context.language;
  }

  setCurrentScreen(screen: VoiceConversationContext['currentScreen']): void {
    this.context.currentScreen = screen;
  }

  setCurrentGame(gameId: string | null, difficulty: number = 1): void {
    this.context.currentGame = gameId;
    this.context.currentDifficulty = difficulty;
  }

  setOfflineStatus(isOffline: boolean): void {
    this.context.isOffline = isOffline;
  }

  registerActionHandlers(handlers: VoiceActionHandlers): void {
    this.actionHandlers = { ...this.actionHandlers, ...handlers };
  }

  setListener(callback: (state: VoiceState, context: VoiceConversationContext) => void): () => void {
    this.onStateChangeCallback = callback;
    callback(this.stateMachine.getState(), { ...this.context });
    return () => {
      this.onStateChangeCallback = undefined;
    };
  }

  getState(): VoiceState {
    return this.stateMachine.getState();
  }

  getContext(): VoiceConversationContext {
    return { ...this.context };
  }

  // ─── Voice Interaction Controls ───────────────────────────────────────────

  async startListening(): Promise<void> {
    await this.synthesizer.stop();
    if (this.stateMachine.transition('LISTENING')) {
      this.notifyState();
      try {
        const bcp47 = this.getBCP47(this.context.language);
        await this.recognizer.start(bcp47);
      } catch (err: any) {
        this.stateMachine.transition('ERROR');
        this.notifyState();
      }
    }
  }

  async stopListening(): Promise<void> {
    await this.recognizer.stop();
    if (this.stateMachine.getState() === 'LISTENING') {
      this.stateMachine.transition('PROCESSING');
      this.notifyState();
    }
  }

  async cancel(): Promise<void> {
    await this.recognizer.cancel();
    await this.synthesizer.stop();
    this.context.pendingAction = null;
    this.stateMachine.transition('IDLE');
    this.notifyState();
  }

  async stop(): Promise<void> {
    await this.cancel();
  }

  async speak(text: string, lang?: string): Promise<void> {
    const targetLang = lang || this.context.language;
    this.stateMachine.transition('SPEAKING');
    this.notifyState();

    const bcp47 = this.getBCP47(targetLang);
    await this.synthesizer.speak(text, bcp47, {
      rate: 0.83, // Comfortable cadence for elderly users
      onDone: () => {
        if (this.stateMachine.getState() === 'SPEAKING') {
          this.stateMachine.transition('IDLE');
          this.notifyState();
        }
      },
      onError: () => {
        this.stateMachine.transition('IDLE');
        this.notifyState();
      },
    });
  }

  // ─── Master Speech Pipeline Processing ────────────────────────────────────

  async processUserSpeech(rawTranscript: string): Promise<OrchestratorResult> {
    const trimmed = rawTranscript.trim();
    if (!trimmed) {
      this.stateMachine.transition('IDLE');
      this.notifyState();
      return {
        transcript: '',
        normalizedTranscript: '',
        detectedLanguage: this.context.language,
        intent: 'UNKNOWN',
        confidence: 0,
        spokenResponse: '',
      };
    }

    this.stateMachine.transition('PROCESSING');
    this.notifyState();

    // 1. Language Normalization
    const { normalizedText, detectedLanguage } = LanguageService.normalizeTranscript(
      trimmed,
      this.getBCP47(this.context.language)
    );
    const shortLang = detectedLanguage.split('-')[0] || this.context.language;

    // Add user turn to conversation history
    this.recordTurn('user', trimmed);

    // 2. Intent Recognition with Elderly Speech Tolerance & In-Game Context
    const { intent, confidence } = this.parseIntentWithContext(normalizedText, this.context);

    // 3. Multi-Turn Context Resolution & Action Execution
    const result = await this.resolveAndExecute(intent, confidence, trimmed, shortLang);

    // 4. Record Assistant Turn & Speak Response
    this.recordTurn('assistant', result.spokenResponse, result.intent);
    await this.speak(result.spokenResponse, shortLang);

    return result;
  }

  // ─── Context-Aware Intent Parsing ─────────────────────────────────────────

  private parseIntentWithContext(
    text: string,
    context: VoiceConversationContext
  ): { intent: VoiceIntentType; confidence: number } {
    const lower = text.toLowerCase().trim();

    // 1. Immediate Barge-in / Stop
    if (/^(stop|pause|aapu|ఆపు|रुको|rok do|thamba|band)$/i.test(lower)) {
      return { intent: 'STOP_GAME', confidence: 0.99 };
    }

    // 2. Check Confirmation / Negation if there is a pending question
    if (context.pendingAction) {
      for (const pattern of INTENT_PATTERNS.CONFIRM) {
        if (typeof pattern === 'string' ? lower === pattern : pattern.test(lower)) {
          return { intent: 'CONFIRM', confidence: 0.98 };
        }
      }
      for (const pattern of INTENT_PATTERNS.CANCEL) {
        if (typeof pattern === 'string' ? lower === pattern : pattern.test(lower)) {
          return { intent: 'CANCEL', confidence: 0.98 };
        }
      }
    }

    // 3. Contextual In-Game Intent Evaluation
    if (context.currentGame || context.currentScreen === 'games') {
      for (const pattern of INTENT_PATTERNS.EASIER_GAME) {
        if (typeof pattern === 'string' ? lower.includes(pattern) : pattern.test(lower)) {
          return { intent: 'EASIER_GAME', confidence: 0.95 };
        }
      }
      for (const pattern of INTENT_PATTERNS.HARDER_GAME) {
        if (typeof pattern === 'string' ? lower.includes(pattern) : pattern.test(lower)) {
          return { intent: 'HARDER_GAME', confidence: 0.95 };
        }
      }
      for (const pattern of INTENT_PATTERNS.REPEAT_INSTRUCTION) {
        if (typeof pattern === 'string' ? lower.includes(pattern) : pattern.test(lower)) {
          return { intent: 'REPEAT_INSTRUCTION', confidence: 0.95 };
        }
      }
      for (const pattern of INTENT_PATTERNS.STOP_GAME) {
        if (typeof pattern === 'string' ? lower.includes(pattern) : pattern.test(lower)) {
          return { intent: 'STOP_GAME', confidence: 0.95 };
        }
      }
      for (const pattern of INTENT_PATTERNS.NEXT_GAME) {
        if (typeof pattern === 'string' ? lower.includes(pattern) : pattern.test(lower)) {
          return { intent: 'NEXT_GAME', confidence: 0.94 };
        }
      }
    }

    // 4. Evaluate Standard Intents
    const orderedIntents: VoiceIntentType[] = [
      'TODAY_PLAN',
      'NEXT_ACTIVITY',
      'START_GAME',
      'SELECT_GAME',
      'EASIER_GAME',
      'HARDER_GAME',
      'REPEAT_INSTRUCTION',
      'MEDICINE_STATUS',
      'HYDRATION_STATUS',
      'APPOINTMENT_STATUS',
      'MARK_REMINDER_DONE',
      'SNOOZE_REMINDER',
      'GREETING',
      'HELP',
    ];

    for (const intentKey of orderedIntents) {
      const patterns = INTENT_PATTERNS[intentKey] || [];
      for (const pat of patterns) {
        if (typeof pat === 'string' ? lower.includes(pat) : pat.test(lower)) {
          return { intent: intentKey, confidence: 0.92 };
        }
      }
    }

    // Single-word tolerance: "game", "aata", "khel"
    if (/^(game|aata|khel|ఆట|खेल)$/i.test(lower)) {
      return { intent: 'START_GAME', confidence: 0.90 };
    }

    // Check for general affirmations outside pendingAction
    for (const pattern of INTENT_PATTERNS.CONFIRM) {
      if (typeof pattern === 'string' ? lower === pattern : pattern.test(lower)) {
        return { intent: 'CONFIRM', confidence: 0.85 };
      }
    }

    return { intent: 'UNKNOWN', confidence: 0.35 };
  }

  // ─── Multi-Turn Resolution & Action Execution ─────────────────────────────

  private async resolveAndExecute(
    intent: VoiceIntentType,
    confidence: number,
    rawTranscript: string,
    lang: string
  ): Promise<OrchestratorResult> {
    // ── Turn Resolution: CONFIRM ──
    if (intent === 'CONFIRM' && this.context.pendingAction) {
      const pending = this.context.pendingAction;
      this.context.pendingAction = null;

      if (pending.actionName === 'start_routine_demo') {
        // Step 2 in Demo Scenario: Start with reminder check, then offer memory activity
        const response = this.getLocalizedText(lang, 'CONFIRM_REMINDER_START_NEXT_GAME');
        this.context.pendingAction = {
          intent: 'START_GAME',
          actionName: 'start_game',
          payload: { gameId: 'memory_matching', difficulty: 1 },
          prompt: response,
          contextQuestion: 'Would you like to start today\'s memory activity?',
        };

        return {
          transcript: rawTranscript,
          normalizedTranscript: rawTranscript,
          detectedLanguage: lang,
          intent: 'CONFIRM',
          confidence: 0.98,
          spokenResponse: response,
          actionExecuted: 'acknowledged_reminder',
          actionSuccess: true,
        };
      }

      if (pending.actionName === 'start_game') {
        // Step 3 in Demo Scenario: Launch game
        let success = false;
        if (this.actionHandlers.startGame) {
          success = Boolean(await this.actionHandlers.startGame(pending.payload?.gameId, pending.payload?.difficulty));
        }
        this.context.currentGame = pending.payload?.gameId || 'memory_matching';
        this.context.currentDifficulty = pending.payload?.difficulty || 1;
        this.context.currentScreen = 'games';

        const response = this.getLocalizedText(lang, 'GAME_STARTED');
        return {
          transcript: rawTranscript,
          normalizedTranscript: rawTranscript,
          detectedLanguage: lang,
          intent: 'START_GAME',
          confidence: 0.98,
          spokenResponse: response,
          actionExecuted: 'startGame',
          actionSuccess: success,
        };
      }

      if (pending.actionName === 'mark_reminder_done') {
        let success = false;
        if (this.actionHandlers.markReminderDone) {
          success = Boolean(await this.actionHandlers.markReminderDone(pending.payload?.reminderId));
        }
        const response = this.getLocalizedText(lang, 'REMINDER_MARKED_DONE');
        return {
          transcript: rawTranscript,
          normalizedTranscript: rawTranscript,
          detectedLanguage: lang,
          intent: 'MARK_REMINDER_DONE',
          confidence: 0.98,
          spokenResponse: response,
          actionExecuted: 'markReminderDone',
          actionSuccess: success,
        };
      }

      // Generic confirmed
      const response = this.getLocalizedText(lang, 'GENERIC_CONFIRMED');
      return {
        transcript: rawTranscript,
        normalizedTranscript: rawTranscript,
        detectedLanguage: lang,
        intent: 'CONFIRM',
        confidence: 0.98,
        spokenResponse: response,
      };
    }

    // ── Turn Resolution: CANCEL ──
    if (intent === 'CANCEL') {
      this.context.pendingAction = null;
      const response = this.getLocalizedText(lang, 'GENERIC_CANCELLED');
      return {
        transcript: rawTranscript,
        normalizedTranscript: rawTranscript,
        detectedLanguage: lang,
        intent: 'CANCEL',
        confidence: 0.98,
        spokenResponse: response,
      };
    }

    // ── TODAY_PLAN (Master Demo Scenario Entrypoint) ──
    if (intent === 'TODAY_PLAN') {
      // "What should I do now?"
      const response = this.getLocalizedText(lang, 'DEMO_STEP1_PLAN_PROMPT');
      this.context.pendingAction = {
        intent: 'CONFIRM',
        actionName: 'start_routine_demo',
        prompt: response,
        contextQuestion: 'Would you like to start with your reminder?',
      };

      return {
        transcript: rawTranscript,
        normalizedTranscript: rawTranscript,
        detectedLanguage: lang,
        intent: 'TODAY_PLAN',
        confidence: 0.96,
        spokenResponse: response,
        requiresConfirmation: true,
        confirmationPrompt: response,
      };
    }

    // ── NEXT_ACTIVITY (Offline or Regular) ──
    if (intent === 'NEXT_ACTIVITY') {
      if (this.context.isOffline) {
        // Section 16 Demo offline condition
        const response = this.getLocalizedText(lang, 'OFFLINE_NEXT_ACTIVITY');
        return {
          transcript: rawTranscript,
          normalizedTranscript: rawTranscript,
          detectedLanguage: lang,
          intent: 'NEXT_ACTIVITY',
          confidence: 0.95,
          spokenResponse: response,
        };
      }

      const response = this.getLocalizedText(lang, 'ONLINE_NEXT_ACTIVITY');
      return {
        transcript: rawTranscript,
        normalizedTranscript: rawTranscript,
        detectedLanguage: lang,
        intent: 'NEXT_ACTIVITY',
        confidence: 0.95,
        spokenResponse: response,
      };
    }

    // ── EASIER_GAME ("This is difficult") ──
    if (intent === 'EASIER_GAME') {
      let newDiff = 1;
      if (this.actionHandlers.setDifficulty) {
        newDiff = await this.actionHandlers.setDifficulty('easier');
      } else {
        newDiff = Math.max(1, this.context.currentDifficulty - 1);
      }
      this.context.currentDifficulty = newDiff;

      const response = this.getLocalizedText(lang, 'EASIER_GAME_ADAPTED');
      return {
        transcript: rawTranscript,
        normalizedTranscript: rawTranscript,
        detectedLanguage: lang,
        intent: 'EASIER_GAME',
        confidence: 0.96,
        spokenResponse: response,
        actionExecuted: 'setDifficultyEasier',
        actionSuccess: true,
      };
    }

    // ── HARDER_GAME ──
    if (intent === 'HARDER_GAME') {
      let newDiff = 2;
      if (this.actionHandlers.setDifficulty) {
        newDiff = await this.actionHandlers.setDifficulty('harder');
      } else {
        newDiff = Math.min(5, this.context.currentDifficulty + 1);
      }
      this.context.currentDifficulty = newDiff;

      const response = this.getLocalizedText(lang, 'HARDER_GAME_ADAPTED');
      return {
        transcript: rawTranscript,
        normalizedTranscript: rawTranscript,
        detectedLanguage: lang,
        intent: 'HARDER_GAME',
        confidence: 0.95,
        spokenResponse: response,
        actionExecuted: 'setDifficultyHarder',
        actionSuccess: true,
      };
    }

    // ── REPEAT_INSTRUCTION ──
    if (intent === 'REPEAT_INSTRUCTION') {
      let instruction = '';
      if (this.actionHandlers.repeatInstruction) {
        instruction = this.actionHandlers.repeatInstruction();
      }
      if (!instruction) {
        instruction = this.getLocalizedText(lang, 'REPEAT_GAME_INSTRUCTION');
      }
      return {
        transcript: rawTranscript,
        normalizedTranscript: rawTranscript,
        detectedLanguage: lang,
        intent: 'REPEAT_INSTRUCTION',
        confidence: 0.96,
        spokenResponse: instruction,
      };
    }

    // ── STOP_GAME / PAUSE_GAME ──
    if (intent === 'STOP_GAME') {
      if (this.actionHandlers.stopGame) {
        this.actionHandlers.stopGame();
      }
      this.context.currentGame = null;
      const response = this.getLocalizedText(lang, 'GAME_STOPPED');
      return {
        transcript: rawTranscript,
        normalizedTranscript: rawTranscript,
        detectedLanguage: lang,
        intent: 'STOP_GAME',
        confidence: 0.98,
        spokenResponse: response,
        actionExecuted: 'stopGame',
        actionSuccess: true,
      };
    }

    if (intent === 'PAUSE_GAME') {
      if (this.actionHandlers.pauseGame) {
        this.actionHandlers.pauseGame();
      }
      const response = this.getLocalizedText(lang, 'GAME_PAUSED');
      return {
        transcript: rawTranscript,
        normalizedTranscript: rawTranscript,
        detectedLanguage: lang,
        intent: 'PAUSE_GAME',
        confidence: 0.95,
        spokenResponse: response,
      };
    }

    // ── START_GAME / SELECT_GAME ──
    if (intent === 'START_GAME' || intent === 'SELECT_GAME') {
      let success = false;
      if (this.actionHandlers.startGame) {
        success = Boolean(await this.actionHandlers.startGame('memory_matching', 1));
      }
      this.context.currentGame = 'memory_matching';
      this.context.currentDifficulty = 1;
      this.context.currentScreen = 'games';

      const response = this.getLocalizedText(lang, 'GAME_STARTED');
      return {
        transcript: rawTranscript,
        normalizedTranscript: rawTranscript,
        detectedLanguage: lang,
        intent: 'START_GAME',
        confidence: 0.94,
        spokenResponse: response,
        actionExecuted: 'startGame',
        actionSuccess: success,
      };
    }

    // ── MEDICINE_STATUS ──
    if (intent === 'MEDICINE_STATUS') {
      const response = this.getLocalizedText(lang, 'MEDICINE_STATUS_INFO');
      return {
        transcript: rawTranscript,
        normalizedTranscript: rawTranscript,
        detectedLanguage: lang,
        intent: 'MEDICINE_STATUS',
        confidence: 0.94,
        spokenResponse: response,
      };
    }

    // ── HYDRATION_STATUS ──
    if (intent === 'HYDRATION_STATUS') {
      const response = this.getLocalizedText(lang, 'HYDRATION_STATUS_INFO');
      return {
        transcript: rawTranscript,
        normalizedTranscript: rawTranscript,
        detectedLanguage: lang,
        intent: 'HYDRATION_STATUS',
        confidence: 0.93,
        spokenResponse: response,
      };
    }

    // ── APPOINTMENT_STATUS ──
    if (intent === 'APPOINTMENT_STATUS') {
      const response = this.getLocalizedText(lang, 'APPOINTMENT_STATUS_INFO');
      return {
        transcript: rawTranscript,
        normalizedTranscript: rawTranscript,
        detectedLanguage: lang,
        intent: 'APPOINTMENT_STATUS',
        confidence: 0.92,
        spokenResponse: response,
      };
    }

    // ── MARK_REMINDER_DONE ──
    if (intent === 'MARK_REMINDER_DONE') {
      if (this.actionHandlers.markReminderDone) {
        await this.actionHandlers.markReminderDone();
      }
      const response = this.getLocalizedText(lang, 'REMINDER_MARKED_DONE');
      return {
        transcript: rawTranscript,
        normalizedTranscript: rawTranscript,
        detectedLanguage: lang,
        intent: 'MARK_REMINDER_DONE',
        confidence: 0.95,
        spokenResponse: response,
        actionExecuted: 'markReminderDone',
        actionSuccess: true,
      };
    }

    // ── SNOOZE_REMINDER ──
    if (intent === 'SNOOZE_REMINDER') {
      if (this.actionHandlers.snoozeReminder) {
        await this.actionHandlers.snoozeReminder(10);
      }
      const response = this.getLocalizedText(lang, 'REMINDER_SNOOZED');
      return {
        transcript: rawTranscript,
        normalizedTranscript: rawTranscript,
        detectedLanguage: lang,
        intent: 'SNOOZE_REMINDER',
        confidence: 0.94,
        spokenResponse: response,
      };
    }

    // ── GREETING ──
    if (intent === 'GREETING') {
      const response = this.getLocalizedText(lang, 'GREETING');
      return {
        transcript: rawTranscript,
        normalizedTranscript: rawTranscript,
        detectedLanguage: lang,
        intent: 'GREETING',
        confidence: 0.96,
        spokenResponse: response,
      };
    }

    // ── HELP ──
    if (intent === 'HELP') {
      const response = this.getLocalizedText(lang, 'HELP');
      return {
        transcript: rawTranscript,
        normalizedTranscript: rawTranscript,
        detectedLanguage: lang,
        intent: 'HELP',
        confidence: 0.95,
        spokenResponse: response,
      };
    }

    // ── UNKNOWN / LOW CONFIDENCE FALLBACK ──
    const fallbackResponse = this.getLocalizedText(lang, 'UNKNOWN_FALLBACK');
    return {
      transcript: rawTranscript,
      normalizedTranscript: rawTranscript,
      detectedLanguage: lang,
      intent: 'UNKNOWN',
      confidence: confidence,
      spokenResponse: fallbackResponse,
      showTouchFallback: true,
    };
  }

  // ─── Proactive Application Event Hooks (Section 10 & 16) ───────────────────

  async notifyReminderDue(reminderTitle: string): Promise<void> {
    const text = this.getLocalizedText(this.context.language, 'PROACTIVE_REMINDER_DUE', { title: reminderTitle });
    await this.speak(text);
  }

  async notifyGameCompleted(): Promise<void> {
    const text = this.getLocalizedText(this.context.language, 'PROACTIVE_GAME_COMPLETED');
    await this.speak(text);
  }

  async notifyDifficultyAdjustNeeded(): Promise<void> {
    const text = this.getLocalizedText(this.context.language, 'PROACTIVE_DIFFICULTY_ADJUST');
    await this.speak(text);
  }

  async handleNetworkChange(isOffline: boolean): Promise<void> {
    this.context.isOffline = isOffline;
    if (isOffline) {
      const text = this.getLocalizedText(this.context.language, 'PROACTIVE_OFFLINE');
      await this.speak(text);
    } else {
      const text = this.getLocalizedText(this.context.language, 'PROACTIVE_RECONNECTED');
      await this.speak(text);
    }
  }

  // ─── Multilingual Regional Natural Responses ──────────────────────────────

  private getLocalizedText(lang: string, key: string, params?: Record<string, any>): string {
    const code = lang.toLowerCase().slice(0, 2);

    const translations: Record<string, Record<string, string>> = {
      te: {
        DEMO_STEP1_PLAN_PROMPT: 'మీకు ఇప్పుడు ఒక రిమైండర్ ఉంది, ఆ తర్వాత చిన్న మెమరీ ఆట ఉంది. ముందుగా రిమైండర్‌తో ప్రారంభిద్దామా?',
        CONFIRM_REMINDER_START_NEXT_GAME: 'సరే. మీరు పూర్తయ్యాక మళ్ళీ గుర్తుచేస్తాను. ఈ రోజు మెమరీ ఆట ప్రారంభిద్దామా?',
        GAME_STARTED: 'తప్పకుండా. మెమరీ ఆట ప్రారంభమవుతోంది. ప్రశాంతంగా ఆడండి.',
        EASIER_GAME_ADAPTED: 'పర్వాలేదు. తర్వాతి రౌండ్‌ను కొంచెం సులువుగా మరియు నిదానంగా మారుస్తున్నాను.',
        HARDER_GAME_ADAPTED: 'సరే. తర్వాతి రౌండ్ కొంచెం ఆసక్తికరంగా ఉంటుంది.',
        REPEAT_GAME_INSTRUCTION: 'కార్డులను తిప్పి ఒకే రకమైన జతలను గుర్తించండి. నిదానంగా ఆడండి.',
        GAME_STOPPED: 'సరే. ఆటను ఆపాను. మీకు అలసటగా ఉంటే కొద్దిసేపు విశ్రాంతి తీసుకోండి.',
        GAME_PAUSED: 'ఆటను ఆపాను. మీరు సిద్ధమైనప్పుడు చెప్పండి.',
        PROACTIVE_GAME_COMPLETED: 'చాలా బాగుంది! ఈ రోజు యాక్టివిటీని విజయవంతంగా పూర్తి చేశారు. మరొకటి ప్రయత్నిస్తారా?',
        OFFLINE_NEXT_ACTIVITY: 'సాయంత్రం నడక సమయం ఉంది. ఆ తర్వాత మీరు విశ్రాంతి తీసుకోవచ్చు.',
        ONLINE_NEXT_ACTIVITY: 'మీ తర్వాతి యాక్టివిటీ సాయంత్రం 5 గంటలకు షెడ్యూల్ చేయబడింది.',
        PROACTIVE_OFFLINE: 'ప్రస్తుతం ఇంటర్నెట్ లేదు, కానీ మీ యాక్టివిటీలన్నీ సురక్షితంగా రికార్డ్ అవుతాయి.',
        PROACTIVE_RECONNECTED: 'ఇంటర్నెట్ తిరిగి వచ్చింది. మీ తాజా వివరాలు సింక్ చేయబడ్డాయి.',
        PROACTIVE_REMINDER_DUE: 'మీ మందు వేసుకునే సమయం అయింది.',
        MEDICINE_STATUS_INFO: 'మీ తర్వాతి మందు షెడ్యూల్ ప్రకారం ఉంది. నీటితో వేసుకోండి.',
        HYDRATION_STATUS_INFO: 'ఈ రోజు మీరు మంచిగా నీళ్ళు తాగారు. ఇప్పుడు కొద్దిగా నీరు తాగండి.',
        APPOINTMENT_STATUS_INFO: 'ఈ వారం మీ డాక్టర్ అపాయింట్‌మెంట్స్ అన్నీ సక్రమంగా ఉన్నాయి.',
        REMINDER_MARKED_DONE: 'సరే, నేను పూర్తయినట్లు నమోదు చేశాను. చాలా మంచిది.',
        REMINDER_SNOOZED: 'సరే, 10 నిమిషాల తర్వాత మళ్ళీ గుర్తుచేస్తాను.',
        GREETING: 'నమస్కారం! నేను మీకు ఎలా సహాయపడమంటారు?',
        HELP: 'మీరు మీ షెడ్యూల్, మందుల వివరాలు అడగవచ్చు లేదా నాతో ఒక మెదడు ఆట ఆడవచ్చు.',
        GENERIC_CONFIRMED: 'సరే, తప్పకుండా చేస్తాను.',
        GENERIC_CANCELLED: 'సరే, రద్దు చేశాను.',
        UNKNOWN_FALLBACK: 'నేను వినలేకపోయాను. మీరు మీ షెడ్యూల్ గురించి లేదా మెమరీ ఆట గురించి అడగవచ్చు.',
      },
      hi: {
        DEMO_STEP1_PLAN_PROMPT: 'आपके पास अभी एक रिमाइंडर है और उसके बाद एक छोटा दिमागी खेल। क्या पहले रिमाइंडर से शुरू करें?',
        CONFIRM_REMINDER_START_NEXT_GAME: 'ठीक है। काम पूरा होने पर मैं फिर याद दिलाऊँगा। क्या आज का दिमागी खेल शुरू करें?',
        GAME_STARTED: 'ज़रूर। दिमागी खेल शुरू हो रहा है। आराम से खेलिए।',
        EASIER_GAME_ADAPTED: 'कोई बात नहीं। मैं अगला राउंड थोड़ा आसान और धीमा कर देता हूँ।',
        HARDER_GAME_ADAPTED: 'बिल्कुल। अगला राउंड थोड़ा नया और रोचक होगा।',
        REPEAT_GAME_INSTRUCTION: 'कार्ड पलटकर एक जैसे जोड़े ढूँढिए। आराम से समय लीजिए।',
        GAME_STOPPED: 'खेल रोक दिया गया है। थोड़ा विश्राम कर लीजिए।',
        GAME_PAUSED: 'खेल रुका हुआ है। जब चाहें बताइए।',
        PROACTIVE_GAME_COMPLETED: 'बहुत बढ़िया! आपने आज की गतिविधि पूरी कर ली। क्या कोई और खेल खेलेंगे?',
        OFFLINE_NEXT_ACTIVITY: 'आज शाम की सैर की योजना बनी हुई है।',
        ONLINE_NEXT_ACTIVITY: 'आपकी अगली गतिविधि शाम 5 बजे निर्धारित है।',
        PROACTIVE_OFFLINE: 'अभी इंटरनेट बंद है, लेकिन आपकी गतिविधियाँ सुरक्षित सेव हो रही हैं।',
        PROACTIVE_RECONNECTED: 'इंटरनेट वापस आ गया है। आपकी सभी गतिविधियाँ सिंक हो गई हैं।',
        PROACTIVE_REMINDER_DUE: 'आपकी दवाई का समय हो गया है।',
        MEDICINE_STATUS_INFO: 'आपकी अगली दवाई समय पर है। कृपया पानी के साथ लें।',
        HYDRATION_STATUS_INFO: 'आज आपने अच्छी मात्रा में पानी पिया है। एक घूंट और ले लीजिए।',
        APPOINTMENT_STATUS_INFO: 'इस सप्ताह डॉक्टर से मिलने का समय निर्धारित है।',
        REMINDER_MARKED_DONE: 'अच्छा हुआ! मैंने इसे पूरा दर्ज कर लिया है।',
        REMINDER_SNOOZED: 'ठीक है, मैं 10 मिनट बाद फिर से याद दिलाऊँगा।',
        GREETING: 'नमस्ते! मैं आपकी किस प्रकार सहायता कर सकता हूँ?',
        HELP: 'आप मुझसे अपनी दिनचर्या, दवाइयों के बारे में पूछ सकते हैं या कोई खेल खेल सकते हैं।',
        GENERIC_CONFIRMED: 'ज़रूर, मैं इसे कर रहा हूँ।',
        GENERIC_CANCELLED: 'ठीक है, रद्द कर दिया।',
        UNKNOWN_FALLBACK: 'मैं पूरी तरह सुन नहीं पाया। आप दिनचर्या या दिमागी खेल के बारे में पूछ सकते हैं।',
      },
      as: {
        DEMO_STEP1_PLAN_PROMPT: 'আপোনাৰ এতিয়া এটা দৰবৰ সোঁৱৰণি আছে আৰু তাৰ পিছত এটা চুটি খেল। সোঁৱৰণিটোৰে আৰম্ভ কৰিমনে?',
        CONFIRM_REMINDER_START_NEXT_GAME: 'বাৰু। কাম শেষ হ\'লে মই পুনৰ মনত পেলাই দিম। এতিয়া মগজুৰ খেল আৰম্ভ কৰোঁনে?',
        GAME_STARTED: 'নিশ্চয়। মগজুৰ খেল আৰম্ভ হৈছে। লাহে লাহে খেলক।',
        EASIER_GAME_ADAPTED: 'কোনো কথা নাই। মই পিছৰ ৰাউণ্ডটো অলপ সহজ কৰি দিছোঁ।',
        HARDER_GAME_ADAPTED: 'বাৰু। পিছৰ ৰাউণ্ডটো অলপ বেছি মনোগ্ৰাহী হ\'ব।',
        REPEAT_GAME_INSTRUCTION: 'কাৰ্ডবোৰ লুটিয়াই একে জোৰাবোৰ মিলাওক। কোনো খৰখেদা নাই।',
        GAME_STOPPED: 'খেল বন্ধ কৰা হ\'ল। ভাগৰ লাগিলে জিৰণি লওক।',
        GAME_PAUSED: 'খেলটো ৰখা হৈছে। সাজু হ\'লে ক\'ব।',
        PROACTIVE_GAME_COMPLETED: 'বৰ ভাল হ\'ল! আপুনি আজিৰ খেল সফলতাৰে সম্পূৰ্ণ কৰিলে। আন এটা খেলিবনে?',
        OFFLINE_NEXT_ACTIVITY: 'আজি গধূলি ফুৰিবলৈ যোৱাৰ পৰিকল্পনা আছে।',
        ONLINE_NEXT_ACTIVITY: 'আপোনাৰ পিছৰ কামটো গধূলি ৫ বজাত নিৰ্ধাৰণ কৰা হৈছে।',
        PROACTIVE_OFFLINE: 'এতিয়া নেটৱৰ্ক নাই, কিন্তু আপোনাৰ সকলো কাম সংৰক্ষিত হৈ থাকিব।',
        PROACTIVE_RECONNECTED: 'নেটৱৰ্ক ঘূৰি আহিল। আপোনাৰ কামবোৰ ছিংক কৰা হ\'ল।',
        PROACTIVE_REMINDER_DUE: 'আপোনাৰ দৰব খোৱাৰ সময় হৈছে।',
        MEDICINE_STATUS_INFO: 'আপোনাৰ পিছৰ দৰব নিয়মীয়া সময়ত আছে।',
        HYDRATION_STATUS_INFO: 'আজি আপুনি ভালদৰে পানী খাইছে। এঢোক পানী খাই লওক।',
        APPOINTMENT_STATUS_INFO: 'এই সপ্তাহত ডাক্তৰৰ এপইণ্টমেণ্ট নিৰ্ধাৰণ কৰা হৈছে।',
        REMINDER_MARKED_DONE: 'বৰ ভাল! মই সম্পূৰ্ণ হোৱা বুলি নথিভুক্ত কৰিলোঁ।',
        REMINDER_SNOOZED: 'বাৰু, ১০ মিনিট পিছত পুনৰ মনত পেলাম।',
        GREETING: 'নমস্কাৰ! আপোনাক কেনেকৈ সহায় কৰিব পাৰোঁ?',
        HELP: 'আপুনি দিনলিপি, দৰবৰ কথা সুধিব পাৰে বা মগজুৰ খেল খেলিব পাৰে।',
        GENERIC_CONFIRMED: 'নিশ্চয়, মই কৰি আছোঁ।',
        GENERIC_CANCELLED: 'বাৰু, বাতিল কৰিলোঁ।',
        UNKNOWN_FALLBACK: 'মই স্পষ্টকৈ নুশুনিলোঁ। আপুনি দিনলিপি বা খেলৰ বিষয়ে সুধিব পাৰে।',
      },
      en: {
        DEMO_STEP1_PLAN_PROMPT: 'You have a reminder due now and a short memory activity afterwards. Would you like to start with your reminder?',
        CONFIRM_REMINDER_START_NEXT_GAME: 'Okay. I\'ll remind you again after you finish. Would you like to start today\'s memory activity?',
        GAME_STARTED: 'Of course. Starting your memory activity now. Take all the time you need.',
        EASIER_GAME_ADAPTED: 'That\'s okay. I\'ll make the next round a little easier.',
        HARDER_GAME_ADAPTED: 'Certainly. I\'ll make the next round a gentle challenge.',
        REPEAT_GAME_INSTRUCTION: 'Flip the cards to match pairs. Take your time without rushing.',
        GAME_STOPPED: 'Game stopped safely. Take a restful break whenever you need.',
        GAME_PAUSED: 'Game paused. Whenever you are ready, let me know.',
        PROACTIVE_GAME_COMPLETED: 'Well done. You completed today\'s activity. Would you like to try another activity?',
        OFFLINE_NEXT_ACTIVITY: 'Your evening walk is planned for later today.',
        ONLINE_NEXT_ACTIVITY: 'Your next activity is scheduled for 5:00 PM today.',
        PROACTIVE_OFFLINE: 'You\'re currently offline, but I\'ll continue saving your activities.',
        PROACTIVE_RECONNECTED: 'You\'re back online. Your recent activity has been synced.',
        PROACTIVE_REMINDER_DUE: 'It\'s time for your medicine.',
        MEDICINE_STATUS_INFO: 'Your medication is scheduled on time. Remember to take it with water.',
        HYDRATION_STATUS_INFO: 'You have stayed well hydrated today. A gentle sip now would be great.',
        APPOINTMENT_STATUS_INFO: 'Your healthcare appointments are on track for this week.',
        REMINDER_MARKED_DONE: 'Very well. I have marked that as completed.',
        REMINDER_SNOOZED: 'Okay, I will remind you again in 10 minutes.',
        GREETING: 'Hello! How can I assist you today?',
        HELP: 'You can ask about your schedule, medicines, or we can play a memory game together.',
        GENERIC_CONFIRMED: 'Certainly, taking care of that for you.',
        GENERIC_CANCELLED: 'Okay, cancelled.',
        UNKNOWN_FALLBACK: 'I didn\'t quite catch that. You can ask about your schedule or we can play a memory game.',
      },
    };

    const dict = translations[code] || translations.en;
    let text = dict[key] || translations.en[key] || '';
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(new RegExp(`{${k}}`, 'g'), String(v));
      }
    }
    return text;
  }

  private getBCP47(lang: string): string {
    const map: Record<string, string> = {
      te: 'te-IN',
      hi: 'hi-IN',
      as: 'as-IN',
      bn: 'bn-IN',
      brx: 'hi-IN',   // Bodo fallback Devanagari Hindi TTS
      mni: 'bn-IN',   // Manipuri fallback Bengali TTS
      kha: 'en-IN',   // Khasi fallback Indian English
      grt: 'en-IN',   // Garo fallback Indian English
      lus: 'en-IN',   // Mizo fallback Indian English
      en: 'en-IN',
    };
    return map[lang.toLowerCase().slice(0, 3)] || map[lang.toLowerCase().slice(0, 2)] || 'en-IN';
  }

  private recordTurn(speaker: 'user' | 'assistant', text: string, intent?: VoiceIntentType): void {
    this.context.recentConversation.push({
      speaker,
      text,
      timestamp: Date.now(),
      intent,
    });
    if (this.context.recentConversation.length > 20) {
      this.context.recentConversation.shift();
    }
    this.notifyState();
  }

  private notifyState(): void {
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(this.stateMachine.getState(), { ...this.context });
    }
  }
}

export const defaultVoiceOrchestrator = new VoiceOrchestrator();
