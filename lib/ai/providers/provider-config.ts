export interface ProviderSettings {
  defaultModel: string;
  fallbackModel: string;
  temperature: number;
  timeoutMs: number;
  retryCount: number;
  maxTokens: number;
  priority: number;
}

/**
 * Centralized Provider Configuration registry.
 * Reads environment variables with appropriate fallback defaults.
 */
export const PROVIDER_CONFIG: Record<"gemini" | "openai", ProviderSettings> = {
  gemini: {
    defaultModel:
      process.env.DEFAULT_GEMINI_MODEL ||
      process.env.GEMINI_MODEL ||
      "gemini-2.5-flash",
    fallbackModel: "gemini-1.5-flash",
    temperature: 0.2,
    timeoutMs: parseInt(process.env.AI_TIMEOUT_MS || "15000", 10),
    retryCount: parseInt(process.env.AI_MAX_RETRIES || "3", 10),
    maxTokens: 4096,
    priority: 1,
  },
  openai: {
    defaultModel:
      process.env.DEFAULT_OPENAI_MODEL ||
      process.env.OPENAI_MODEL ||
      "gpt-4o-mini",
    fallbackModel: "gpt-4-turbo",
    temperature: 0.2,
    timeoutMs: parseInt(process.env.AI_TIMEOUT_MS || "15000", 10),
    retryCount: parseInt(process.env.AI_MAX_RETRIES || "3", 10),
    maxTokens: 4096,
    priority: 2,
  },
};
