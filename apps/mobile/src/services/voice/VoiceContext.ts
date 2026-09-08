/**
SMRITI+ — Voice Assistant React Context & Hooks
 *
 * Implements Section 53:
 * - useVoiceAssistant()
 * - useSpeechRecognition()
 * - useSpeechSynthesis()
 * - useVoiceState()
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { defaultVoiceService, VoiceSessionState, VoiceService } from './VoiceService';
import { VoiceState } from './VoiceStateMachine';

export interface VoiceAssistantContextValue extends VoiceSessionState {
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
  cancel: () => Promise<void>;
  speak: (text: string, lang?: string) => Promise<void>;
  setLanguage: (lang: string) => void;
  setSpeechRate: (rate: number) => void;
}

const VoiceContext = createContext<VoiceAssistantContextValue | null>(null);

export function VoiceProvider({
  children,
  service = defaultVoiceService,
}: {
  children: React.ReactNode;
  service?: VoiceService;
}) {
  const [sessionState, setSessionState] = useState<VoiceSessionState>({
    state: 'IDLE',
    transcript: '',
    normalizedTranscript: '',
    detectedLanguage: 'te-IN',
    intent: 'UNKNOWN',
    confidence: 0,
    spokenResponse: '',
    showTouchFallback: false,
    requiresConfirmation: false,
  });

  useEffect(() => {
    const unsubscribe = service.setSessionListener((s) => {
      setSessionState(s);
    });
    return () => {
      unsubscribe();
    };
  }, [service]);

  const value: VoiceAssistantContextValue = {
    ...sessionState,
    startListening: () => service.startListening(),
    stopListening: () => service.stopListening(),
    cancel: () => service.cancel(),
    speak: (text: string, lang?: string) => service.speak(text, lang),
    setLanguage: (lang: string) => service.setLanguage(lang),
    setSpeechRate: (rate: number) => service.setSpeechRate(rate),
  };

  return React.createElement(VoiceContext.Provider, { value }, children);
}

export function useVoiceAssistant(): VoiceAssistantContextValue {
  const ctx = useContext(VoiceContext);
  if (!ctx) {
    // Return fallback bound directly to singleton if used outside Provider
    return {
      state: 'IDLE',
      transcript: '',
      normalizedTranscript: '',
      detectedLanguage: 'te-IN',
      intent: 'UNKNOWN',
      confidence: 0,
      spokenResponse: '',
      showTouchFallback: false,
      requiresConfirmation: false,
      startListening: () => defaultVoiceService.startListening(),
      stopListening: () => defaultVoiceService.stopListening(),
      cancel: () => defaultVoiceService.cancel(),
      speak: (text: string, lang?: string) => defaultVoiceService.speak(text, lang),
      setLanguage: (lang: string) => defaultVoiceService.setLanguage(lang),
      setSpeechRate: (rate: number) => defaultVoiceService.setSpeechRate(rate),
    };
  }
  return ctx;
}

export function useVoiceState(): VoiceState {
  const { state } = useVoiceAssistant();
  return state;
}

export function useSpeechRecognition() {
  const { state, transcript, startListening, stopListening, cancel } = useVoiceAssistant();
  return {
    isListening: state === 'LISTENING',
    transcript,
    start: startListening,
    stop: stopListening,
    cancel,
  };
}

export function useSpeechSynthesis() {
  const { speak, cancel, state } = useVoiceAssistant();
  return {
    isSpeaking: state === 'SPEAKING',
    speak,
    stop: cancel,
  };
}
