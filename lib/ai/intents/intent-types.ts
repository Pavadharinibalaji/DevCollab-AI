import { AIRequest } from "../types/request";
import { AgentType } from "../types/agent";

export type IntentType =
  | "planning"
  | "repository"
  | "knowledge"
  | "risk"
  | "code"
  | "scrum"
  | "general"
  | "unknown";

export interface IntentResult {
  intent: IntentType;
  confidence: number;
  reasoning: string;
  suggestedAgent?: AgentType;
}

export interface IntentClassificationStrategy {
  classify(request: AIRequest): Promise<IntentResult>;
}
