import { createAppError } from '../middleware/errorHandler.js';

const MAX_HUMAN_WPM = 250;
const MIN_KEYSTROKE_INTERVAL_MS = 10; // Less than 10ms between keystrokes = likely paste
const PASTE_CHUNK_THRESHOLD_MS = 50; // Large text arriving in < 50ms

export class AnticheatService {
  /**
   * Validate that WPM is within human limits
   */
  validateWPM(wpm: number): void {
    if (wpm > MAX_HUMAN_WPM) {
      throw createAppError(
        `Suspicious WPM detected (${wpm}). Maximum allowed: ${MAX_HUMAN_WPM}`,
        422
      );
    }
  }

  /**
   * Validate basic timing (total time vs word count)
   */
  validateTimingBasic(timeTakenSeconds: number, wordCount: number): void {
    if (timeTakenSeconds <= 0) {
      throw createAppError('Invalid timing data', 422);
    }

    // Minimum 0.1 seconds per word (would be ~600 WPM for 5-char words)
    const minExpectedTime = wordCount * 0.1;
    if (timeTakenSeconds < minExpectedTime) {
      throw createAppError('Suspiciously fast completion time', 422);
    }
  }

  /**
   * Validate keystroke timings to detect pasting
   */
  validateKeystrokeTimings(timestamps: number[]): void {
    if (timestamps.length < 2) return;

    let suspiciousIntervals = 0;
    let consecutiveFast = 0;

    for (let i = 1; i < timestamps.length; i++) {
      const interval = timestamps[i] - timestamps[i - 1];

      if (interval < MIN_KEYSTROKE_INTERVAL_MS) {
        suspiciousIntervals++;
        consecutiveFast++;

        // 5 consecutive ultra-fast keystrokes = paste detected
        if (consecutiveFast >= 5) {
          throw createAppError('Paste/auto-type detected', 422);
        }
      } else {
        consecutiveFast = 0;
      }
    }

    // More than 20% suspicious intervals is flagged
    const suspiciousRatio = suspiciousIntervals / (timestamps.length - 1);
    if (suspiciousRatio > 0.2) {
      throw createAppError('Suspicious input pattern detected', 422);
    }
  }

  /**
   * Server-side WPM calculation from progress updates
   * Used in multiplayer to cross-validate client-reported WPM
   */
  calculateServerWPM(
    correctChars: number,
    startTime: number,
    currentTime: number
  ): number {
    const elapsedSeconds = (currentTime - startTime) / 1000;
    if (elapsedSeconds <= 0) return 0;
    const minutes = elapsedSeconds / 60;
    return Math.round((correctChars / 5) / minutes * 100) / 100;
  }

  /**
   * Validate that client-reported WPM matches server calculation
   * Allows 15% tolerance for network latency
   */
  validateClientWPM(clientWPM: number, serverWPM: number): boolean {
    if (serverWPM === 0) return true;
    const tolerance = 0.15;
    const diff = Math.abs(clientWPM - serverWPM) / serverWPM;
    return diff <= tolerance;
  }
}

export const anticheatService = new AnticheatService();
