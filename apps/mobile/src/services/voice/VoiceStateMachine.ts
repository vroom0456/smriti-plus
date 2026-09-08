/**
SMRITI+ — Explicit Voice State Machine & Idempotency Guard
 *
 * Implements Sections 44, 45:
 * - Deterministic transitions: IDLE -> LISTENING -> PROCESSING -> CONFIRMING -> SPEAKING -> IDLE
 * - Prevents double recording, double requests, TTS overlap
 * - Idempotency guard for duplicate speech commands
 */

export type VoiceState =
  | 'IDLE'
  | 'LISTENING'
  | 'PROCESSING'
  | 'CONFIRMING'
  | 'SPEAKING'
  | 'ERROR'
  | 'UNAVAILABLE';

export type StateChangeListener = (newState: VoiceState, prevState: VoiceState) => void;

export class VoiceStateMachine {
  private currentState: VoiceState = 'IDLE';
  private listeners: Set<StateChangeListener> = new Set();
  private processedEventIds: Set<string> = new Set();

  getState(): VoiceState {
    return this.currentState;
  }

  addListener(listener: StateChangeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  transition(target: VoiceState): boolean {
    if (this.currentState === target) return true;

    // Validate legal transitions
    const from = this.currentState;
    let allowed = false;

    switch (from) {
      case 'IDLE':
        allowed = ['LISTENING', 'PROCESSING', 'SPEAKING', 'UNAVAILABLE', 'ERROR'].includes(target);
        break;
      case 'LISTENING':
        allowed = ['PROCESSING', 'IDLE', 'ERROR', 'SPEAKING'].includes(target);
        break;
      case 'PROCESSING':
        allowed = ['CONFIRMING', 'SPEAKING', 'IDLE', 'ERROR'].includes(target);
        break;
      case 'CONFIRMING':
        allowed = ['LISTENING', 'PROCESSING', 'SPEAKING', 'IDLE', 'ERROR'].includes(target);
        break;
      case 'SPEAKING':
        allowed = ['IDLE', 'LISTENING', 'ERROR'].includes(target);
        break;
      case 'ERROR':
      case 'UNAVAILABLE':
        allowed = ['IDLE', 'LISTENING'].includes(target);
        break;
    }

    if (!allowed) {
      console.warn(`[VoiceStateMachine] Illegal transition: ${from} -> ${target}`);
      return false;
    }

    this.currentState = target;
    this.listeners.forEach((fn) => fn(target, from));
    return true;
  }

  /**
   * Idempotency Check: Prevents recognizer repeating the same command
   */
  isDuplicateCommand(eventId: string): boolean {
    if (this.processedEventIds.has(eventId)) {
      return true;
    }
    this.processedEventIds.add(eventId);
    // Keep max 50 recent IDs in memory
    if (this.processedEventIds.size > 50) {
      const first = this.processedEventIds.values().next().value;
      if (first) this.processedEventIds.delete(first);
    }
    return false;
  }

  reset(): void {
    this.transition('IDLE');
  }
}

export const defaultVoiceStateMachine = new VoiceStateMachine();
