/**
 * RetryPolicy defines the parameters governing retry counts, exponential backoff,
 * and operation timeouts.
 */
export interface RetryPolicy {
  /**
   * The maximum number of execution attempts.
   */
  maxAttempts: number;

  /**
   * The delay in milliseconds before triggering the first retry.
   */
  initialDelayMs: number;

  /**
   * The multiplier applied to the delay on each subsequent retry.
   */
  backoffFactor: number;

  /**
   * The timeout limit in milliseconds for each individual attempt.
   */
  timeoutMs: number;
}

/**
 * Standard retry policy optimized for quick recovery from transient AI provider glitches:
 * - 3 max attempts.
 * - 200ms initial retry delay.
 * - 2x backoff multiplier.
 * - 8000ms (8 seconds) timeout threshold.
 */
export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 3,
  initialDelayMs: 200,
  backoffFactor: 2,
  timeoutMs: 8000,
};
