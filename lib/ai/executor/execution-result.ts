import { AIResponse } from "../types/response";
import { AgentType } from "../types/agent";

/**
 * Standardized results representing the outcome of an AI Agent execution.
 * Extends AIResponse to remain backward-compatible with the rest of the application.
 */
export interface ExecutionResult extends AIResponse {
  /**
   * Time taken in milliseconds to execute the agent.
   */
  executionTimeMs: number;

  /**
   * Number of retries that occurred during execution.
   */
  retryCount: number;

  /**
   * Execution metadata containing hooks results, trace logs, or other parameters.
   */
  metadata?: Record<string, any>;
}

/**
 * Standard generator for generating standard UUIDs or unique strings.
 */
function generateId(): string {
  return "exec_" + Math.random().toString(36).substring(2, 15);
}

/**
 * Helper to construct a standard successful execution result.
 */
export function createSuccessResult(
  requestId: string,
  agentType: AgentType,
  content: string,
  data?: Record<string, any>,
  executionTimeMs: number = 0,
  retryCount: number = 0,
  metadata?: Record<string, any>
): ExecutionResult {
  return {
    id: generateId(),
    requestId,
    success: true,
    agentType,
    content,
    data,
    executionTimeMs,
    retryCount,
    metadata,
  };
}

/**
 * Helper to construct a standard failed execution result.
 */
export function createErrorResult(
  requestId: string,
  agentType: AgentType,
  error: Error | string,
  executionTimeMs: number = 0,
  retryCount: number = 0,
  metadata?: Record<string, any>
): ExecutionResult {
  const errorMessage = error instanceof Error ? error.message : String(error);
  return {
    id: generateId(),
    requestId,
    success: false,
    agentType,
    content: "",
    error: errorMessage,
    executionTimeMs,
    retryCount,
    metadata: {
      ...metadata,
      stack: error instanceof Error ? error.stack : undefined,
    },
  };
}
