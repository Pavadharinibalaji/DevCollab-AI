import { PROVIDER_CONFIG } from "./provider-config";

/**
 * ModelResolver manages model selection priority overrides.
 *
 * Priority order:
 *  1. Environment overrides (e.g. GEMINI_MODEL, OPENAI_MODEL)
 *  2. User preferences (e.g. custom database fields)
 *  3. Configuration defaults
 *  4. Configuration fallbacks
 */
export class ModelResolver {
  /**
   * Resolves the primary active model for a provider.
   *
   * @param providerType "gemini" | "openai"
   * @param rawProvider Optional custom provider label (e.g., "groq" maps to specific model)
   * @param userPreferenceModel Optional model preference specified by user
   */
  static resolve(
    providerType: "gemini" | "openai",
    rawProvider?: string,
    userPreferenceModel?: string,
  ): string {
    // 1. Check environment overrides
    if (providerType === "gemini" && process.env.GEMINI_MODEL) {
      return process.env.GEMINI_MODEL;
    }
    if (providerType === "openai" && process.env.OPENAI_MODEL) {
      return process.env.OPENAI_MODEL;
    }

    // 2. Check user preference model or special provider overrides
    if (userPreferenceModel) {
      return userPreferenceModel;
    }
    if (rawProvider === "groq") {
      return "llama-3.3-70b-versatile";
    }

    // 3. Fallback to centralized provider configuration default
    return PROVIDER_CONFIG[providerType].defaultModel;
  }

  /**
   * Returns the fallback model for a provider.
   *
   * @param providerType "gemini" | "openai"
   */
  static getFallback(providerType: "gemini" | "openai"): string {
    return PROVIDER_CONFIG[providerType].fallbackModel;
  }
}
