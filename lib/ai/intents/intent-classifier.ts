import { AIRequest } from "../types/request";
import { AIProvider } from "../providers/provider";
import { AIProviderFactory } from "../providers/factory";
import { IntentResult } from "./intent-types";
import { parseIntentJSON } from "./intent-parser";
import { CLASSIFIER_PROMPT } from "./classifier-prompt";

/**
 * Classifies AIRequest user prompts using LLM/Provider models.
 * Parses strict JSON response parameters and implements a retry validation loop.
 */
export class IntentClassifier {
  private customProvider: AIProvider | null = null;

  /**
   * Override provider instance for unit tests.
   *
   * @param provider Mocked provider or override.
   */
  setProvider(provider: AIProvider): void {
    this.customProvider = provider;
  }

  /**
   * Reset custom provider override.
   */
  resetProvider(): void {
    this.customProvider = null;
  }

  /**
   * Helper method to get the active provider.
   */
  private getProvider(providerOverride?: AIProvider): AIProvider {
    return providerOverride || this.customProvider || AIProviderFactory.getProvider();
  }

  /**
   * Classifies intent using the raw prompt text (unit-test friendly).
   *
   * @param prompt User prompt text.
   * @param providerOverride Optional provider instance override.
   */
  async classifyText(prompt: string, providerOverride?: AIProvider): Promise<IntentResult> {
    const provider = this.getProvider(providerOverride);
    const fullPrompt = `${CLASSIFIER_PROMPT}\n\nUser Prompt: "${prompt}"\n\nReturn JSON:`;

    let response = "";
    let parsed: IntentResult | null = null;

    try {
      response = await provider.generate(fullPrompt, { temperature: 0.0 });
      parsed = parseIntentJSON(response);
    } catch (err) {
      console.warn("[IntentClassifier] First classification attempt failed:", err);
    }

    // If parsing fails, retry once
    if (!parsed) {
      try {
        console.info("[IntentClassifier] Retrying intent classification due to invalid or empty JSON...");
        response = await provider.generate(fullPrompt, { temperature: 0.1 });
        parsed = parseIntentJSON(response);
      } catch (err) {
        console.error("[IntentClassifier] Intent classification retry failed:", err);
      }
    }

    // If still invalid, fall back
    if (!parsed) {
      return {
        intent: "unknown",
        confidence: 0,
        reasoning: "Classification failed or returned invalid JSON structure after retrying.",
      };
    }

    return parsed;
  }

  /**
   * Classifies the intent of an AIRequest.
   *
   * @param request The incoming AIRequest.
   * @param providerOverride Optional provider instance override.
   * @returns The classified IntentResult containing intent name, confidence, reasoning, and suggestedAgent.
   */
  async classify(request: AIRequest, providerOverride?: AIProvider): Promise<IntentResult> {
    return this.classifyText(request.prompt, providerOverride);
  }
}

// Export a default classifier instance
export const intentClassifier = new IntentClassifier();
export default IntentClassifier;
