import { AgentType } from "./agent";
import { AIContext } from "./context";

export interface AIRequest {
  id: string;
  agentType?: AgentType;
  prompt: string;
  context?: {
    userId?: string;
    projectId?: string;
    channelId?: string;
    repositoryUrl?: string;
    additionalContext?: Record<string, any>;
  };
  metadata?: Record<string, any>;
  aiContext?: AIContext;
}

