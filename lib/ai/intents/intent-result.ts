import { IntentType } from "./intent-types";
import { AgentType } from "../types/agent";

export interface IntentResult {
  intent: IntentType;
  confidence: number;
  reasoning: string;
  suggestedAgent?: AgentType;
}
