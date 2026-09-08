/**
SMRITI+ — Confirmation & Clarification Manager
 *
 * Implements Sections 10, 14, 15, 73:
 * - Two-step confirmation pairing
 * - Single-question slot clarification (never overwhelm elder with multiple questions)
 * - Resolves Affirmations / Negations against pending high-impact actions
 */

import { VoiceIntent, ExtractedEntities } from './VoiceCommandParser';

export interface PendingAction {
  intent: VoiceIntent;
  entities: ExtractedEntities;
  prompt: string;
  timestamp: number;
}

export class ConfirmationManager {
  private pendingAction: PendingAction | null = null;

  setPendingAction(intent: VoiceIntent, entities: ExtractedEntities, prompt: string): void {
    this.pendingAction = {
      intent,
      entities,
      prompt,
      timestamp: Date.now(),
    };
  }

  getPendingAction(): PendingAction | null {
    if (!this.pendingAction) return null;
    // Expire after 30 seconds
    if (Date.now() - this.pendingAction.timestamp > 30000) {
      this.pendingAction = null;
      return null;
    }
    return this.pendingAction;
  }

  clear(): void {
    this.pendingAction = null;
  }

  resolveResponse(responseIntent: 'AFFIRMATION' | 'NEGATION'): {
    confirmed: boolean;
    action: PendingAction | null;
  } {
    const action = this.getPendingAction();
    this.clear();

    if (!action) {
      return { confirmed: false, action: null };
    }

    return {
      confirmed: responseIntent === 'AFFIRMATION',
      action,
    };
  }
}

export const defaultConfirmationManager = new ConfirmationManager();
