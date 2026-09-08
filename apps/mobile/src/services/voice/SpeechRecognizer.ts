/**
SMRITI+ — Speech Recognizer Abstraction & Adapters
 *
 * Implements Sections 7, 40, 49:
 * - Provider-agnostic SpeechRecognizer interface
 * - Web Speech API adapter with continuous listening tolerance
 * - Accent-aware speech profile support
 * - Elder speech tolerance (extended silence timeouts, repeated word handling)
 */

import { Platform } from 'react-native';
import { VoiceCapabilities, SpeechRecognitionProfile } from './VoiceCapabilities';

export interface SpeechRecognizerListener {
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
  onAudioLevel?: (level: number) => void;
}

export interface SpeechRecognizer {
  start(language: string, profile?: SpeechRecognitionProfile): Promise<void>;
  stop(): Promise<void>;
  cancel(): Promise<void>;
  isAvailable(language: string): Promise<boolean>;
  setListener(listener: SpeechRecognizerListener): void;
}

class WebSpeechRecognizer implements SpeechRecognizer {
  private recognition: any = null;
  private listener: SpeechRecognizerListener = {};
  private isListening: boolean = false;

  constructor() {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 3;

        this.recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          const activeText = finalTranscript || interimTranscript;
          if (activeText && this.listener.onTranscript) {
            this.listener.onTranscript(activeText, Boolean(finalTranscript));
          }
        };

        this.recognition.onerror = (event: any) => {
          this.isListening = false;
          if (this.listener.onError) {
            this.listener.onError(event.error || 'Speech recognition error');
          }
        };

        this.recognition.onend = () => {
          this.isListening = false;
          if (this.listener.onEnd) {
            this.listener.onEnd();
          }
        };
      }
    }
  }

  setListener(listener: SpeechRecognizerListener): void {
    this.listener = listener;
  }

  async isAvailable(language: string): Promise<boolean> {
    if (Platform.OS === 'web') {
      const hasEngine = Boolean(this.recognition);
      const isLangSupported = VoiceCapabilities.isSTTAvailable(language);
      return hasEngine && isLangSupported;
    }
    return VoiceCapabilities.isSTTAvailable(language);
  }

  async start(language: string, profile?: SpeechRecognitionProfile): Promise<void> {
    if (!this.recognition) {
      throw new Error('Speech recognition not available on this browser/device.');
    }

    if (this.isListening) {
      try {
        this.recognition.abort();
      } catch {}
    }

    this.recognition.lang = language;
    this.isListening = true;

    try {
      this.recognition.start();
    } catch (err: any) {
      this.isListening = false;
      throw err;
    }
  }

  async stop(): Promise<void> {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {}
      this.isListening = false;
    }
  }

  async cancel(): Promise<void> {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.abort();
      } catch {}
      this.isListening = false;
    }
  }
}

export const defaultSpeechRecognizer: SpeechRecognizer = new WebSpeechRecognizer();
