import { AIRequest } from "../types/request";
import { ExecutionResult } from "./execution-result";
import { ExecutionHooks } from "./execution-types";

/**
 * ExecutionHookManager orchestrates registering and executing all hooks.
 * It ensures that errors thrown inside a hook do not crash the agent execution flow.
 */
export class ExecutionHookManager {
  private hooks: ExecutionHooks[] = [];

  constructor(initialHooks: ExecutionHooks[] = []) {
    this.hooks = [...initialHooks];
  }

  /**
   * Registers a new set of hooks.
   */
  register(hooks: ExecutionHooks): void {
    this.hooks.push(hooks);
  }

  /**
   * Triggers the beforeExecute hook across all registered hooks.
   */
  async executeBefore(input: AIRequest): Promise<void> {
    for (const h of this.hooks) {
      if (h.beforeExecute) {
        try {
          await h.beforeExecute(input);
        } catch (e) {
          console.error("Error in beforeExecute hook:", e);
        }
      }
    }
  }

  /**
   * Triggers the afterExecute hook across all registered hooks.
   */
  async executeAfter(input: AIRequest, result: ExecutionResult): Promise<void> {
    for (const h of this.hooks) {
      if (h.afterExecute) {
        try {
          await h.afterExecute(input, result);
        } catch (e) {
          console.error("Error in afterExecute hook:", e);
        }
      }
    }
  }

  /**
   * Triggers the onError hook across all registered hooks.
   */
  async executeError(input: AIRequest, error: Error): Promise<void> {
    for (const h of this.hooks) {
      if (h.onError) {
        try {
          await h.onError(input, error);
        } catch (e) {
          console.error("Error in onError hook:", e);
        }
      }
    }
  }

  /**
   * Triggers the beforeProviderCall hook across all registered hooks.
   */
  async executeBeforeProvider(prompt: string, options?: Record<string, any>): Promise<void> {
    for (const h of this.hooks) {
      if (h.beforeProviderCall) {
        try {
          await h.beforeProviderCall(prompt, options);
        } catch (e) {
          console.error("Error in beforeProviderCall hook:", e);
        }
      }
    }
  }

  /**
   * Triggers the afterProviderCall hook across all registered hooks.
   */
  async executeAfterProvider(prompt: string, response: string): Promise<void> {
    for (const h of this.hooks) {
      if (h.afterProviderCall) {
        try {
          await h.afterProviderCall(prompt, response);
        } catch (e) {
          console.error("Error in afterProviderCall hook:", e);
        }
      }
    }
  }

  /**
   * Triggers the onRetry hook across all registered hooks.
   */
  async executeRetry(attempt: number, error: Error): Promise<void> {
    for (const h of this.hooks) {
      if (h.onRetry) {
        try {
          await h.onRetry(attempt, error);
        } catch (e) {
          console.error("Error in onRetry hook:", e);
        }
      }
    }
  }
}
