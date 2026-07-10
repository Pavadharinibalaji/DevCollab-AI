import { AgentType } from "../types/agent";

export interface WorkflowStep {
  id: string;
  agentType: AgentType;
  description?: string;
  customPromptTemplate?: string;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  steps: WorkflowStep[];
}

export interface WorkflowStepResult {
  stepId: string;
  agentType: AgentType;
  success: boolean;
  content: string;
  data?: Record<string, any>;
  error?: string;
  executionTimeMs: number;
}

export interface WorkflowResult {
  workflowId: string;
  success: boolean;
  results: WorkflowStepResult[];
  summary: string;
  executionTimeMs: number;
}
