import { AgentType } from "../types/agent";

export interface MemoryMetrics {
  rss: number;
  heapTotal: number;
  heapUsed: number;
  external: number;
}

/**
 * Standard metrics structure for logging and analyzing AI execution performance and cost.
 */
export interface ExecutionMetrics {
  id: string;
  requestId: string;
  timestamp: string;
  selectedIntent: string;
  selectedAgent: AgentType;
  provider: string; // e.g. "gemini-1.5-flash", "gemini-1.5-pro", "gpt-4o-mini", "local" (cache/db/memory lookup)
  executionTimeMs: number;
  cacheHit: boolean;
  memoryUsage: MemoryMetrics;
  estimatedTokens: number;
  success: boolean;
  error?: string;

  // Phase 6 structured metrics
  confidence?: number;
  promptTokens?: number;
  completionTokens?: number;
  contextSize?: number;
  retryCount?: number;
  workflowId?: string;
}
