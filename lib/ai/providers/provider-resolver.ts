import { connectMongoose } from "../../db/mongoose";
import { UserKeyModel } from "../../db/models";
import { decrypt } from "../../crypto";
import { AIProvider } from "./provider";
import { GeminiProvider } from "./gemini-provider";
import { OpenAIProvider } from "./openai-provider";
import { PROVIDER_CONFIG } from "./provider-config";
import { ModelResolver } from "./model-resolver";
import { ProviderHealthManager } from "./provider-health";
import { AgentExecutor } from "../executor/agent-executor";

export interface ResolvedProvider {
  providerType: "gemini" | "openai";
  apiKey: string;
  model: string;
  isCustom: boolean;
  /**
   * True when the user has a saved key but decryption failed (e.g. SECRET_KEY changed).
   */
  usingFallbackEnvironmentKey: boolean;
  /** Fully instantiated provider wrapper */
  instance: AIProvider;
}

/**
 * ManagedProvider wraps a primary provider and supports timeouts, retries,
 * automatic model fallback (404), fallback provider failover, and metrics logging.
 */
export class ManagedProvider implements AIProvider {
  private active: AIProvider;
  private secondary: AIProvider | null = null;

  public lastMetrics = {
    providerName: "",
    modelName: "",
    retryCount: 0,
    fallbackUsed: false,
    cacheHit: false,
    tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    executionTimeMs: 0,
    diagnostics: [] as string[],
  };

  constructor(
    private primary: AIProvider,
    private apiKeySource: string,
  ) {
    this.active = primary;
    this.lastMetrics.providerName = primary.providerName;
    this.lastMetrics.modelName = primary.modelName;
  }

  get providerName(): string {
    return this.active.providerName;
  }

  get modelName(): string {
    return this.active.modelName;
  }

  getMetrics() {
    return this.lastMetrics;
  }

  private getSecondaryProvider(): AIProvider {
    if (this.secondary) return this.secondary;
    if (this.primary.providerName === "Gemini") {
      const apiKey = process.env.OPENAI_API_KEY || "";
      const model = ModelResolver.resolve("openai");
      this.secondary = new OpenAIProvider(apiKey, model);
    } else {
      const apiKey = process.env.GEMINI_API_KEY || "";
      const model = ModelResolver.resolve("gemini");
      this.secondary = new GeminiProvider(apiKey, model);
    }
    return this.secondary;
  }

  private async executeWithResilience<T>(
    operation: (
      provider: AIProvider,
      optionsOverride?: Record<string, any>,
    ) => Promise<T>,
  ): Promise<T> {
    const startTime = Date.now();
    let attempt = 0;
    const providerKey = this.active.providerName.toLowerCase() as
      | "gemini"
      | "openai";
    const config = PROVIDER_CONFIG[providerKey];
    const maxRetries = config.retryCount;
    let lastError: any = null;
    let modelOverride: string | undefined = undefined;

    // Reset metrics for the current execution
    this.lastMetrics.fallbackUsed = false;
    this.lastMetrics.retryCount = 0;
    this.lastMetrics.diagnostics = [];

    while (attempt <= maxRetries) {
      try {
        if (attempt > 0) {
          if (
            attempt >= 3 &&
            this.active.providerName === "Gemini" &&
            this.active === this.primary
          ) {
            const secondaryProvider = this.getSecondaryProvider();
            this.active = secondaryProvider;
            modelOverride = undefined;
            this.lastMetrics.fallbackUsed = true;
            this.lastMetrics.diagnostics.push(
              `Switching to fallback provider (OpenAI) at attempt ${attempt}`,
            );
            console.warn(
              `[ProviderResolver] Switching to fallback provider (OpenAI) at attempt ${attempt}`,
            );
          } else {
            const backoff = 500 * Math.pow(2, attempt - 1);
            this.lastMetrics.diagnostics.push(
              `Retry attempt ${attempt} with backoff of ${backoff}ms`,
            );
            await new Promise((resolve) => setTimeout(resolve, backoff));
          }
        }

        const result = await operation(
          this.active,
          modelOverride ? { model: modelOverride } : undefined,
        );

        const duration = Date.now() - startTime;
        ProviderHealthManager.recordSuccess(this.active.providerName, duration);

        const rawTokens = (this.active as any).lastTokenUsage;
        if (rawTokens) {
          this.lastMetrics.tokenUsage = { ...rawTokens };
        }

        this.lastMetrics.providerName = this.active.providerName;
        this.lastMetrics.modelName = modelOverride || this.active.modelName;
        this.lastMetrics.retryCount = attempt;
        this.lastMetrics.executionTimeMs = duration;

        this.logDiagnostics(attempt, false);

        return result;
      } catch (err: any) {
        lastError = err;
        const status = err.status || 0;
        const msg = String(err.message).toLowerCase();

        // 1. Check if model 404 / deprecation
        const is404 =
          status === 404 ||
          msg.includes("not found") ||
          msg.includes("deprecated") ||
          msg.includes("removed") ||
          msg.includes("not support") ||
          msg.includes("unsupported");

        if (is404 && !modelOverride) {
          modelOverride = ModelResolver.getFallback(
            this.active.providerName.toLowerCase() as "gemini" | "openai",
          );
          this.lastMetrics.fallbackUsed = true;
          this.lastMetrics.diagnostics.push(
            `Model fallback triggered: switched to ${modelOverride} due to error: ${err.message}`,
          );
          console.warn(
            `[ProviderResolver] Model fallback triggered. Switched to fallback: ${modelOverride}`,
          );
          attempt++;
          continue;
        }

        // 2. Check if we can retry
        const isRetryable =
          status === 408 ||
          status === 429 ||
          status === 500 ||
          status === 502 ||
          status === 503 ||
          status === 504 ||
          msg.includes("timeout") ||
          msg.includes("abort");

        if (isRetryable) {
          attempt++;
          ProviderHealthManager.recordFailure(this.active.providerName);
          this.lastMetrics.diagnostics.push(
            `Attempt ${attempt - 1} failed: ${err.message}`,
          );
          continue;
        }

        // Non-retryable error (e.g. 401/403)
        ProviderHealthManager.recordFailure(this.active.providerName);
        break;
      }
    }

    // If primary failed completely and we haven't failed over yet, try failing over
    if (this.active.providerName === "Gemini" && this.active === this.primary) {
      console.warn(
        `[ProviderResolver] Gemini completely failed. Failover to OpenAI...`,
      );
      this.lastMetrics.fallbackUsed = true;
      this.lastMetrics.diagnostics.push(
        `Provider failover triggered: Gemini -> OpenAI`,
      );

      try {
        const secondaryProvider = this.getSecondaryProvider();
        this.active = secondaryProvider;
        return await this.executeWithResilience(operation);
      } catch (fallbackErr: any) {
        ProviderHealthManager.recordFailure("openai");
        this.lastMetrics.diagnostics.push(
          `Failover OpenAI also failed: ${fallbackErr.message}`,
        );
        this.logDiagnostics(attempt, true);
        throw new Error(
          `Primary Gemini and fallback OpenAI both failed. Gemini error: ${lastError?.message} | OpenAI error: ${fallbackErr.message}`,
        );
      }
    }

    this.logDiagnostics(attempt, true);
    throw lastError || new Error("Execution failed");
  }

  private logDiagnostics(retryCount: number, failed: boolean): void {
    const healthState = ProviderHealthManager.getHealth(
      this.active.providerName,
    );
    console.log(`[ProviderResolver]`);
    console.log(`Provider: ${this.active.providerName}`);
    console.log(`Model: ${this.active.modelName}`);
    console.log(`Source: ${this.apiKeySource}`);
    console.log(`Retry: ${retryCount}`);
    console.log(`Fallback: ${this.lastMetrics.fallbackUsed}`);
    console.log(`Health: ${failed ? "Unavailable" : healthState.status}`);
  }

  async generate(
    prompt: string,
    options?: Record<string, any>,
  ): Promise<string> {
    return this.executeWithResilience((provider, optOverride) =>
      provider.generate(prompt, { ...options, ...optOverride }),
    );
  }

  async routeIntent(
    prompt: string,
    intents: string[],
    options?: Record<string, any>,
  ): Promise<string> {
    return this.executeWithResilience((provider, optOverride) =>
      provider.routeIntent(prompt, intents, { ...options, ...optOverride }),
    );
  }

  async chat(
    messages: Array<{
      role: "user" | "assistant" | "system";
      content: string;
    }>,
    options?: Record<string, any>,
  ): Promise<string> {
    return this.executeWithResilience((provider, optOverride) =>
      provider.chat(messages, { ...options, ...optOverride }),
    );
  }
}

/**
 * ProviderResolver is the single source of truth for all provider resolution.
 */
export class ProviderResolver {
  static async resolve(userId?: string): Promise<ResolvedProvider> {
    let decryptionFailed = false;
    let providerType: "gemini" | "openai" = "gemini";
    let apiKey = "";
    let model = "";
    let isCustom = false;
    let apiKeySource = "Environment";

    // 1. Check if user has an active personal API key
    if (userId) {
      try {
        await connectMongoose();
        const activeKey = await UserKeyModel.findOne({
          userId,
          isActive: true,
        }).lean();
        if (activeKey) {
          let decryptedKey: string | null = null;
          try {
            decryptedKey = decrypt(activeKey.apiKey);
          } catch (decryptErr: any) {
            decryptionFailed = true;
            console.warn(
              `[ProviderResolver] Stored API key cannot be decrypted.\n` +
                `[ProviderResolver] Falling back to environment provider.\n` +
                `[ProviderResolver] Reason: SECRET_KEY changed or stored key is invalid.`,
            );
          }

          if (decryptedKey) {
            const rawProvider = activeKey.provider as string;
            providerType = rawProvider === "gemini" ? "gemini" : "openai";
            model = ModelResolver.resolve(providerType, rawProvider);
            apiKey = decryptedKey;
            isCustom = true;
            apiKeySource = "User Database";
          }
        }
      } catch (err) {
        console.error(
          "[ProviderResolver] Failed to query user API key from database:",
          err,
        );
      }
    }

    // 2. Fall back to workspace environment defaults
    if (!isCustom) {
      const workspaceProvider = (
        process.env.AI_PROVIDER || "gemini"
      ).toLowerCase();

      if (workspaceProvider === "openai") {
        providerType = "openai";
        apiKey = process.env.OPENAI_API_KEY || "";
        if (!apiKey) {
          throw new Error(
            "No AI provider has been configured. (Missing OPENAI_API_KEY in workspace .env.local)",
          );
        }
        model = ModelResolver.resolve("openai");
      } else {
        providerType = "gemini";
        apiKey = process.env.GEMINI_API_KEY || "";
        if (!apiKey) {
          throw new Error(
            "No AI provider has been configured. (Missing GEMINI_API_KEY in workspace .env.local)",
          );
        }
        model = ModelResolver.resolve("gemini");
      }
    }

    const primaryInstance =
      providerType === "gemini"
        ? new GeminiProvider(apiKey, model)
        : new OpenAIProvider(apiKey, model);

    const managedInstance = new ManagedProvider(primaryInstance, apiKeySource);

    return {
      providerType,
      apiKey,
      model,
      isCustom,
      usingFallbackEnvironmentKey: decryptionFailed,
      instance: managedInstance,
    };
  }
}

let patchApplied = false;

function applyAgentExecutorPatch() {
  if (patchApplied) return;
  patchApplied = true;

  try {
    const originalExecutorExecute = AgentExecutor.prototype.execute;
    AgentExecutor.prototype.execute = async function (input, options) {
      const provider = options?.provider || (this as any).defaultProvider;

      const result = await originalExecutorExecute.call(this, input, options);

      // Unwrap nested provider configurations
      let metricsProvider = provider;
      while (metricsProvider) {
        if ((metricsProvider as any).inner) {
          metricsProvider = (metricsProvider as any).inner;
        } else if ((metricsProvider as any).primary) {
          metricsProvider = (metricsProvider as any).primary;
        } else if ((metricsProvider as any).provider) {
          metricsProvider = (metricsProvider as any).provider;
        } else {
          break;
        }
      }

      if (
        metricsProvider &&
        typeof (metricsProvider as any).getMetrics === "function"
      ) {
        const metrics = (metricsProvider as any).getMetrics();
        if (metrics) {
          // Standardize response metadata properties
          result.retryCount = metrics.retryCount;
          result.metadata = {
            ...result.metadata,
            provider: metrics.providerName,
            model: metrics.modelName,
            fallbackUsed: metrics.fallbackUsed,
            tokenUsage: metrics.tokenUsage,
            executionTimeMs: metrics.executionTimeMs,
            diagnostics: metrics.diagnostics,
          };
          result.provider = `${metrics.providerName} / ${metrics.modelName}`;
          (result as any).fallbackUsed = metrics.fallbackUsed;
          (result as any).tokenUsage = metrics.tokenUsage;
          (result as any).model = metrics.modelName;
        }
      }
      return result;
    };
  } catch (e) {
    console.error(
      "[ProviderResolver] Failed to apply AgentExecutor monkeypatch:",
      e,
    );
  }
}

applyAgentExecutorPatch();
