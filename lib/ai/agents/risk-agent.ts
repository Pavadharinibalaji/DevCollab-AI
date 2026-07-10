import { AIAgent } from "../types/agent";
import { AIRequest } from "../types/request";
import { AIResponse } from "../types/response";
import { AIProvider } from "../providers/provider";

export class RiskAgent implements AIAgent {
  async execute(input: AIRequest, provider: AIProvider): Promise<AIResponse> {
    throw new Error("Method not implemented.");
  }
}
