import { RetryPolicy, DEFAULT_RETRY_POLICY } from "./retry-policy";

/**
 * RetryEngine handles executing tasks with strict timeouts and exponential backoff.
 */
export class RetryEngine {
  /**
   * Runs an asynchronous task, retrying it upon failure or timeout according to policy.
   *
   * @param task The task callback to execute.
   * @param policy The retry policy.
   * @param onRetry Optional callback fired on each retry trigger.
   */
  static async executeWithRetry<T>(
    task: () => Promise<T>,
    policy: RetryPolicy = DEFAULT_RETRY_POLICY,
    onRetry?: (attempt: number, error: Error) => void
  ): Promise<T> {
    let attempt = 0;
    let delay = policy.initialDelayMs;
    let lastError: Error = new Error("Execution failed without attempts.");

    while (attempt < policy.maxAttempts) {
      try {
        // Execute the task raced against a timeout promise
        return await this.withTimeout(task(), policy.timeoutMs);
      } catch (error: any) {
        attempt++;
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt >= policy.maxAttempts) {
          break;
        }

        if (onRetry) {
          onRetry(attempt, lastError);
        }

        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= policy.backoffFactor;
      }
    }

    throw lastError;
  }

  /**
   * Races a promise against a timeout, rejecting if the timeout resolves first.
   */
  private static withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    let timeoutId: NodeJS.Timeout;
    const timeoutPromise = new Promise<T>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms.`));
      }, timeoutMs);
    });

    return Promise.race([
      promise.then((val) => {
        clearTimeout(timeoutId);
        return val;
      }),
      timeoutPromise,
    ]);
  }
}
