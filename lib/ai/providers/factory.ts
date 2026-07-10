import { AIProvider } from "./provider";
import { GeminiProvider } from "./gemini-provider";
import { OpenAIProvider } from "./openai-provider";
import { ModelResolver } from "./model-resolver";

/**
 * Factory class for instantiating the configured AI model provider.
 *
 * Reads AI_PROVIDER environment variable to determine which provider to use.
 * Uses ModelResolver and ProviderConfig settings.
 */
export class AIProviderFactory {
  /**
   * Returns a provider instance using workspace environment configuration.
   */
  static getProvider(): AIProvider {
    const providerType = (process.env.AI_PROVIDER || "gemini").toLowerCase();

    if (providerType === "openai") {
      const apiKey = process.env.OPENAI_API_KEY || "";
      const model = ModelResolver.resolve("openai");
      return new OpenAIProvider(apiKey, model);
    }

    const apiKey = process.env.GEMINI_API_KEY || "";
    const model = ModelResolver.resolve("gemini");
    return new GeminiProvider(apiKey, model);
  }
}
