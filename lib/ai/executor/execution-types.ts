import { AIRequest } from "../types/request";
import { AIProvider } from "../providers/provider";
import { ExecutionResult } from "./execution-result";

/**
 * Interface representing all available hooks during AI Agent execution.
 */
export interface ExecutionHooks {
  /**
   * Called before the agent begins execution.
   */
  beforeExecute?: (input: AIRequest) => Promise<void> | void;

  /**
   * Called after the agent finishes execution (either successfully or with error).
   */
  afterExecute?: (input: AIRequest, result: ExecutionResult) => Promise<void> | void;

  /**
   * Called if the agent execution encounters an error.
   */
  onError?: (input: AIRequest, error: Error) => Promise<void> | void;

  /**
   * Called before the AI Provider is invoked.
   */
  beforeProviderCall?: (prompt: string, options?: Record<string, any>) => Promise<void> | void;

  /**
   * Called after the AI Provider successfully returns a response.
   */
  afterProviderCall?: (prompt: string, response: string) => Promise<void> | void;

  /**
   * Called when a retry attempt is initiated.
   */
  onRetry?: (attempt: number, error: Error) => Promise<void> | void;
}

/**
 * Options configuration for agent execution.
 */
export interface AgentExecutionOptions {
  /**
   * Number of retries on failure. Defaults to 0.
   */
  retries?: number;

  /**
   * Hooks callback interface.
   */
  hooks?: ExecutionHooks;

  /**
   * Optional custom AI provider instance. If not provided, falls back to coordinator's provider.
   */
  provider?: AIProvider;

  /**
   * Optional metadata to attach to the execution.
   */
  metadata?: Record<string, any>;
}
