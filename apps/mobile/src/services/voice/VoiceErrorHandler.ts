/**
SMRITI+ — Tiered Voice Error Handler & Touch Fallback
 *
 * Implements Section 39:
 * - 1st failure: Gentle repeat request
 * - 2nd failure: Touch alternative hint
 * - 3+ failures: Immediate large touch fallback trigger (never trap elder in loop)
 */

export class VoiceErrorHandler {
  private consecutiveFailures: number = 0;

  recordFailure(): {
    failureCount: number;
    promptText: string;
    showTouchFallback: boolean;
  } {
    this.consecutiveFailures += 1;

    if (this.consecutiveFailures === 1) {
      return {
        failureCount: 1,
        promptText: "Sorry, I didn't catch that clearly. Please take your time and say it again.",
        showTouchFallback: false,
      };
    } else if (this.consecutiveFailures === 2) {
      return {
        failureCount: 2,
        promptText: "I'm having a little trouble hearing. You can also tap the button on screen.",
        showTouchFallback: true,
      };
    } else {
      return {
        failureCount: this.consecutiveFailures,
        promptText: "Let's make it easier: tap any of the options below.",
        showTouchFallback: true,
      };
    }
  }

  recordSuccess(): void {
    this.consecutiveFailures = 0;
  }

  getFailureCount(): number {
    return this.consecutiveFailures;
  }

  reset(): void {
    this.consecutiveFailures = 0;
  }
}

export const defaultVoiceErrorHandler = new VoiceErrorHandler();
