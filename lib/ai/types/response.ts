import { AgentType } from "./agent";

export interface AIResponse {
  id: string;
  requestId: string;
  success: boolean;
  agentType: AgentType;
  content: string;
  data?: Record<string, any>;
  error?: string;

  // Phase 8 standardized metrics
  metadata?: Record<string, any>;
  executionTimeMs?: number;
  confidence?: number;
  provider?: string;
  agentName?: string;
}
