import { AIRequest } from "../types/request";
import { AIResponse } from "../types/response";
import { ExecutionMetrics } from "./execution-metrics";
import { executionHistory } from "./execution-history";

/**
 * ExecutionLogger handles compiling run metrics and logging them to history and console.
 *
 * Provider and model identity are read from the AIResponse.provider field (set by the agent)
 * and from the providerName arg passed by the coordinator — no env vars read here.
 */
export class ExecutionLogger {
  /**
   * Logs the execution metrics of an AI request.
   *
   * @param input          The incoming AIRequest.
   * @param response       The generated AIResponse (either local or from LLM).
   * @param durationMs     Total Coordinator execution time in milliseconds.
   * @param cacheHit       Whether it was resolved from cache.
   * @param estimatedTokens The estimated input + context token count.
   * @param providerLabel  Human-readable provider/model label (e.g. "Gemini / gemini-2.5-flash").
   */
  log(
    input: AIRequest,
    response: AIResponse,
    durationMs: number,
    cacheHit: boolean,
    estimatedTokens: number,
    providerLabel: string,
    options?: {
      retryCount?: number;
      workflowId?: string;
    }
  ): void {
    const memory = process.memoryUsage();

    // Real runtime metrics — no placeholder values
    const confidence = input.metadata?.classification?.confidence;
    const intent = input.metadata?.classification?.intent || "unknown";
    const contextSize = input.aiContext ? JSON.stringify(input.aiContext).length : 0;
    const promptChars = input.prompt.length;
    const completionChars = response.content ? response.content.length : 0;
    const promptTokens = Math.ceil(promptChars / 4);
    const completionTokens = Math.ceil(completionChars / 4);
    const retryCount = response.metadata?.retryCount || options?.retryCount || 0;
    const workflowId = input.metadata?.workflowId || options?.workflowId || undefined;

    // Provider label from the coordinator (reflects ProviderResolver's resolution)
    const provider = providerLabel || response.provider || "unknown";
    const agentExecutionMs = response.executionTimeMs ?? 0;

    const entry: ExecutionMetrics = {
      id: response.id || "log_" + Math.random().toString(36).substring(2, 15),
      requestId: input.id,
      timestamp: new Date().toISOString(),
      selectedIntent: intent,
      selectedAgent: response.agentType || input.agentType || "planning",
      provider,
      executionTimeMs: durationMs,
      cacheHit,
      memoryUsage: {
        rss: memory.rss,
        heapTotal: memory.heapTotal,
        heapUsed: memory.heapUsed,
        external: memory.external,
      },
      estimatedTokens,
      success: response.success,
      error: response.error,
      confidence,
      promptTokens,
      completionTokens,
      contextSize,
      retryCount,
      workflowId,
    };

    executionHistory.add(entry);

    // Structured block log — mirrors expected terminal output format
    console.log(
      `\n[ExecutionLogger]\n` +
      `  Provider: ${provider}\n` +
      `  Intent: ${entry.selectedIntent} | Confidence: ${confidence ?? "N/A"}\n` +
      `  Agent: ${entry.selectedAgent}\n` +
      `  Prompt Chars: ${promptChars} | Completion Chars: ${completionChars}\n` +
      `  Prompt Tokens: ~${promptTokens} | Completion Tokens: ~${completionTokens}\n` +
      `  Context Size: ${contextSize} bytes\n` +
      `  Cache Hit: ${cacheHit} | Retries: ${retryCount}\n` +
      `  Agent Execution: ${agentExecutionMs}ms | Total Duration: ${durationMs}ms\n` +
      `  Memory (heap): ${Math.round(memory.heapUsed / 1024 / 1024)}MB used / ${Math.round(memory.heapTotal / 1024 / 1024)}MB total\n` +
      `  Success: ${response.success}`
    );
  }
}

export const executionLogger = new ExecutionLogger();
