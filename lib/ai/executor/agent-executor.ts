import { AIRequest } from "../types/request";
import { AgentType } from "../types/agent";
import { AIProvider } from "../providers/provider";
import { AIProviderFactory } from "../providers/factory";
import { agentRegistry } from "../registry/agent-registry";
import { ExecutionResult, createSuccessResult, createErrorResult } from "./execution-result";
import { AgentExecutionOptions } from "./execution-types";
import { ExecutionHookManager } from "./execution-hooks";

/**
 * A wrapper class implementing AIProvider that intercepts provider invocations
 * to run hooks (beforeProviderCall, afterProviderCall, onError).
 */
export class HookedProvider implements AIProvider {
  /** Delegates display name from inner provider. */
  get providerName(): string { return (this.provider as any).providerName || "unknown"; }
  /** Delegates model name from inner provider. */
  get modelName(): string { return (this.provider as any).modelName || "unknown"; }

  constructor(
    private provider: AIProvider,
    private hookManager: ExecutionHookManager
  ) {}

  async generate(prompt: string, options?: Record<string, any>): Promise<string> {
    await this.hookManager.executeBeforeProvider(prompt, options);
    try {
      const response = await this.provider.generate(prompt, options);
      await this.hookManager.executeAfterProvider(prompt, response);
      return response;
    } catch (error: any) {
      const wrappedError = error instanceof Error ? error : new Error(String(error));
      await this.hookManager.executeError({ id: "provider-call", prompt } as any, wrappedError);
      throw wrappedError;
    }
  }

  async routeIntent(
    prompt: string,
    intents: string[],
    options?: Record<string, any>
  ): Promise<string> {
    await this.hookManager.executeBeforeProvider(prompt, options);
    try {
      const response = await this.provider.routeIntent(prompt, intents, options);
      await this.hookManager.executeAfterProvider(prompt, response);
      return response;
    } catch (error: any) {
      const wrappedError = error instanceof Error ? error : new Error(String(error));
      await this.hookManager.executeError({ id: "provider-call", prompt } as any, wrappedError);
      throw wrappedError;
    }
  }

  async chat(
    messages: Array<{
      role: "user" | "assistant" | "system";
      content: string;
    }>,
    options?: Record<string, any>
  ): Promise<string> {
    const promptSummary = messages.map((m) => `[${m.role}]: ${m.content}`).join("\n");
    await this.hookManager.executeBeforeProvider(promptSummary, options);
    try {
      const response = await this.provider.chat(messages, options);
      await this.hookManager.executeAfterProvider(promptSummary, response);
      return response;
    } catch (error: any) {
      const wrappedError = error instanceof Error ? error : new Error(String(error));
      await this.hookManager.executeError({ id: "provider-call", prompt: promptSummary } as any, wrappedError);
      throw wrappedError;
    }
  }
}

/**
 * AgentExecutor is responsible for managing the loading, execution lifecycle,
 * metrics tracking (execution time), hooks orchestration, and error resilience
 * of AI Agents.
 */
export class AgentExecutor {
  private defaultProvider: AIProvider;

  constructor(provider?: AIProvider) {
    this.defaultProvider = provider || AIProviderFactory.getProvider();
  }

  /**
   * Resolves the selected agent, wraps the provider, manages hooks/retry logic,
   * measures execution duration, and returns standardised execution results.
   *
   * @param input The AIRequest input parameters.
   * @param options Configurations for retry, hooks, metadata or provider overrides.
   */
  async execute(
    input: AIRequest,
    options?: AgentExecutionOptions
  ): Promise<ExecutionResult> {
    const startTime = Date.now();

    // 1. Load selected agent
    const agentType = input.agentType || (input.metadata?.classification?.suggestedAgent as AgentType) || "planning";
    const agent = agentRegistry.getAgent(agentType);

    // Initialise hook manager
    const hookManager = new ExecutionHookManager(options?.hooks ? [options.hooks] : []);

    if (!agent) {
      const error = new Error(`No AI agent registered to handle intent type: "${agentType}"`);
      await hookManager.executeError(input, error);
      const executionTimeMs = Date.now() - startTime;
      const result = createErrorResult(input.id, agentType, error, executionTimeMs, 0, options?.metadata);
      return result;
    }

    // Resolve provider
    const baseProvider = options?.provider || this.defaultProvider;
    // Wrap the provider so executor can handle/intercept provider invocations
    const hookedProvider = new HookedProvider(baseProvider, hookManager);

    // Trigger beforeExecute hook
    await hookManager.executeBefore(input);

    let attempt = 0;
    const maxRetries = options?.retries ?? 0;
    let executionError: Error | null = null;
    let response: any = null;

    // Retry loop
    while (attempt <= maxRetries) {
      try {
        if (attempt > 0) {
          const currentError = executionError || new Error(`Retry attempt #${attempt}`);
          await hookManager.executeRetry(attempt, currentError);
          // Simple exponential backoff: 100ms * 2^attempt
          const delay = Math.pow(2, attempt) * 100;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        // 2. Measure execution time & catch errors & handle provider invocation
        // Passes the hookedProvider so agent executes operations through the intercepted provider wrapper
        response = await agent.execute(input, hookedProvider);

        if (response && response.success === false) {
          throw new Error(response.error || "Agent execution returned an unsuccessful response status.");
        }

        // Clean any previous errors if we succeeded
        executionError = null;
        break; // Success! Break out of retry loop
      } catch (err: any) {
        executionError = err instanceof Error ? err : new Error(String(err));
        attempt++;
      }
    }

    const duration = Date.now() - startTime;

    if (executionError) {
      // 3. Catch errors
      await hookManager.executeError(input, executionError);

      const result = createErrorResult(
        input.id,
        agentType,
        executionError,
        duration,
        Math.min(attempt, maxRetries),
        options?.metadata
      );
      result.confidence = 0;
      result.provider = "unknown";
      result.agentName = agentType;

      // Trigger afterExecute hook on failure
      await hookManager.executeAfter(input, result);
      return result;
    }

    // 4. Return standardized execution results
    const result = createSuccessResult(
      input.id,
      agentType,
      response?.content || "",
      response?.data,
      duration,
      attempt,
      {
        ...options?.metadata,
        ...response?.metadata,
      }
    );
    result.confidence = response?.confidence ?? 1.0;
    result.provider = response?.provider || "unknown";
    result.agentName = response?.agentName || agentType;

    // Trigger afterExecute hook on success
    await hookManager.executeAfter(input, result);
    return result;
  }
}
