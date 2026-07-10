import { AIRequest } from "./request";
import { AIResponse } from "./response";
import { AIProvider } from "../providers/provider";

export type AgentType =
  | "planning"
  | "repository"
  | "knowledge"
  | "risk"
  | "code"
  | "scrum";

export interface AIAgent {
  execute(input: AIRequest, provider: AIProvider): Promise<AIResponse>;
}
