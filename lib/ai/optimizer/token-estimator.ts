/**
 * Simple token estimator to predict prompt and context token sizes.
 * Under ordinary circumstances: 1 token ~ 4 characters or 0.75 words.
 */
export class TokenEstimator {
  /**
   * Estimates token count for a text string.
   */
  static estimateTextTokens(text?: string): number {
    if (!text) return 0;
    // Standard rule-of-thumb: length / 4
    return Math.ceil(text.length / 4);
  }

  /**
   * Estimates token count for a structured object.
   */
  static estimateContextTokens(context?: any): number {
    if (!context) return 0;
    try {
      const jsonStr = JSON.stringify(context);
      return this.estimateTextTokens(jsonStr);
    } catch (e) {
      console.error("Failed to estimate context tokens:", e);
      return 0;
    }
  }
}
