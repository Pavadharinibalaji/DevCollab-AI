import { AIResponse } from "../types/response";
import { AgentType } from "../types/agent";

/**
 * FailureHandler standardizes and translates low-level AI provider errors
 * (timeouts, service outages, bad credentials) into helpful user-facing response payloads.
 */
export class FailureHandler {
  /**
   * Evaluates the error and constructs a graceful successful response carrying error content.
   *
   * @param error The raw thrown error.
   * @param requestId The ID of the request.
   * @param agentType The target agent.
   */
  static handleFailure(
    error: any,
    requestId: string,
    agentType: AgentType
  ): AIResponse {
    const message = error instanceof Error ? error.message : String(error);

    let gracefulMessage = "An unexpected error occurred while processing your request. Please try again later.";

    if (message.includes("timed out") || message.includes("Timeout")) {
      gracefulMessage = "The request took too long to complete. The AI model timed out. Please try again shortly.";
    } else if (message.includes("both primary and fallback") || message.includes("Both primary and fallback")) {
      gracefulMessage = "All available AI models are currently offline or unreachable. We are investigating this issue. Please try again in a few minutes.";
    } else if (message.includes("API key") || message.includes("authentication") || message.includes("unauthorized")) {
      gracefulMessage = "AI Provider Authentication failed. Please check the workspace setup settings configuration.";
    } else if (message.includes("rate limit") || message.includes("429")) {
      gracefulMessage = "We are currently experiencing high request volumes. Please wait a moment before trying again.";
    }

    return {
      id: "fail_" + Math.random().toString(36).substring(2, 15),
      requestId,
      success: false,
      agentType,
      content: gracefulMessage,
      error: message,
    };
  }
}
