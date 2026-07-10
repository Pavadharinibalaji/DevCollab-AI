import { AIProvider } from "../providers/provider";
import { RetryEngine } from "./retry-engine";
import { RetryPolicy, DEFAULT_RETRY_POLICY } from "./retry-policy";

/**
 * FallbackProvider wraps a primary provider and a secondary fallback provider.
 * It routes requests to primary with retries and timeout, switching to secondary if primary fails.
 *
 * Future TODO:
 * - Circuit Breaker: Maintain statistics of provider failures and open the circuit (failing fast)
 *   if a threshold is reached.
 * - Rate Limiter: Queue or throttle requests to prevent hit rate limits on model endpoints.
 * - Provider Health Monitor: Poll endpoints to track availability dynamically.
 */
export class FallbackProvider implements AIProvider {
  /** Delegates display name from primary provider. */
  get providerName(): string { return (this.primary as any).providerName || "unknown"; }
  /** Delegates model name from primary provider. */
  get modelName(): string { return (this.primary as any).modelName || "unknown"; }

  constructor(
    private primary: AIProvider,
    private fallback: AIProvider,
    private policy: RetryPolicy = DEFAULT_RETRY_POLICY
  ) {}

  async generate(prompt: string, options?: Record<string, any>): Promise<string> {
    try {
      // 1. Attempt primary provider with retries and timeout
      return await RetryEngine.executeWithRetry(
        () => this.primary.generate(prompt, options),
        this.policy,
        (attempt, err) => {
          console.warn(`[FallbackProvider] Primary generate failed (attempt ${attempt}/${this.policy.maxAttempts}): ${err.message}`);
        }
      );
    } catch (primaryError: any) {
      console.warn(`[FallbackProvider] Primary provider generate failed completely. Falling back to secondary... Error: ${primaryError.message}`);
      try {
        // 2. Fallback to secondary provider with retries and timeout
        return await RetryEngine.executeWithRetry(
          () => this.fallback.generate(prompt, options),
          this.policy,
          (attempt, err) => {
            console.warn(`[FallbackProvider] Fallback generate failed (attempt ${attempt}/${this.policy.maxAttempts}): ${err.message}`);
          }
        );
      } catch (fallbackError: any) {
        throw new Error(
          `Primary and fallback providers failed generate. Primary: ${primaryError.message} | Fallback: ${fallbackError.message}`
        );
      }
    }
  }

  async routeIntent(
    prompt: string,
    intents: string[],
    options?: Record<string, any>
  ): Promise<string> {
    try {
      return await RetryEngine.executeWithRetry(
        () => this.primary.routeIntent(prompt, intents, options),
        this.policy
      );
    } catch (primaryError: any) {
      console.warn(`[FallbackProvider] Primary routeIntent failed. Falling back... Error: ${primaryError.message}`);
      try {
        return await RetryEngine.executeWithRetry(
          () => this.fallback.routeIntent(prompt, intents, options),
          this.policy
        );
      } catch (fallbackError: any) {
        throw new Error(
          `Primary and fallback providers failed routeIntent. Primary: ${primaryError.message} | Fallback: ${fallbackError.message}`
        );
      }
    }
  }

  async chat(
    messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
    options?: Record<string, any>
  ): Promise<string> {
    try {
      return await RetryEngine.executeWithRetry(
        () => this.primary.chat(messages, options),
        this.policy,
        (attempt, err) => {
          console.warn(`[FallbackProvider] Primary chat failed (attempt ${attempt}/${this.policy.maxAttempts}): ${err.message}`);
        }
      );
    } catch (primaryError: any) {
      console.warn(`[FallbackProvider] Primary provider chat failed completely. Falling back to secondary... Error: ${primaryError.message}`);
      try {
        return await RetryEngine.executeWithRetry(
          () => this.fallback.chat(messages, options),
          this.policy,
          (attempt, err) => {
            console.warn(`[FallbackProvider] Fallback chat failed (attempt ${attempt}/${this.policy.maxAttempts}): ${err.message}`);
          }
        );
      } catch (fallbackError: any) {
        throw new Error(
          `Primary and fallback providers failed chat. Primary: ${primaryError.message} | Fallback: ${fallbackError.message}`
        );
      }
    }
  }
}
