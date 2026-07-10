import { AgentType } from "../types/agent";
import { AIProvider } from "../providers/provider";
import { GeminiProvider } from "../providers/gemini-provider";
import { OpenAIProvider } from "../providers/openai-provider";

export interface ProviderConfig {
  providerType: "gemini" | "openai" | string;
  model: string;
  costPerInputToken: number;
  costPerOutputToken: number;
}

// Model names read from env so they are never hardcoded
const GEMINI_FLASH_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_PRO_MODEL = "gemini-1.5-pro";
const OPENAI_GPT_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

export const PROVIDER_PROFILES: Record<string, ProviderConfig> = {
  "gemini-flash": {
    providerType: "gemini",
    model: GEMINI_FLASH_MODEL,
    costPerInputToken: 0.000075 / 1000,
    costPerOutputToken: 0.0003 / 1000,
  },
  "gemini-pro": {
    providerType: "gemini",
    model: GEMINI_PRO_MODEL,
    costPerInputToken: 0.00125 / 1000,
    costPerOutputToken: 0.005 / 1000,
  },
  "openai-gpt": {
    providerType: "openai",
    model: OPENAI_GPT_MODEL,
    costPerInputToken: 0.00015 / 1000,
    costPerOutputToken: 0.0006 / 1000,
  },
};

/**
 * A wrapper implementing AIProvider that overrides options.model on downstream invocations.
 * Used by the cost optimizer to enforce specific model selection per agent type.
 */
export class ModelConfiguredProvider implements AIProvider {
  /** Delegates display name from inner provider. */
  get providerName(): string { return (this.inner as any).providerName || "unknown"; }
  /** Always reflects the cost-optimizer-selected model for this wrapper. */
  readonly modelName: string;

  constructor(
    private inner: AIProvider,
    private model: string
  ) {
    this.modelName = model;
  }

  async generate(prompt: string, options?: Record<string, any>): Promise<string> {
    return this.inner.generate(prompt, { ...options, model: this.model });
  }

  async routeIntent(
    prompt: string,
    intents: string[],
    options?: Record<string, any>
  ): Promise<string> {
    return this.inner.routeIntent(prompt, intents, { ...options, model: this.model });
  }

  async chat(
    messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
    options?: Record<string, any>
  ): Promise<string> {
    return this.inner.chat(messages, { ...options, model: this.model });
  }
}

/**
 * Helper to resolve the concrete AIProvider instance based on configuration providerType.
 * Uses dependency injection — passes apiKey and model via constructor.
 *
 * @param providerType - "gemini" | "openai"
 * @param apiKey       - Resolved API key (from ProviderResolver or env)
 * @param model        - Resolved model name
 */
export function getProviderInstance(
  providerType: string,
  apiKey?: string,
  model?: string
): AIProvider {
  if (providerType === "openai") {
    return new OpenAIProvider(
      apiKey || process.env.OPENAI_API_KEY || "",
      model || process.env.OPENAI_MODEL || "gpt-4o-mini"
    );
  }
  return new GeminiProvider(
    apiKey || process.env.GEMINI_API_KEY || "",
    model || process.env.GEMINI_MODEL || "gemini-2.5-flash"
  );
}

/**
 * ProviderSelector manages configurable rules mapping AgentType to cost-effective
 * AI provider configurations. Used by the CostOptimizer to pick the right profile.
 */
export class ProviderSelector {
  private rules: Map<AgentType, string> = new Map();

  constructor() {
    this.loadDefaultRules();
  }

  private loadDefaultRules() {
    this.rules.set("code", "openai-gpt");       // GPT-4o-mini is best for syntax/coding Tasks
    this.rules.set("planning", "gemini-pro");    // Gemini Pro handles complex planning
    this.rules.set("repository", "gemini-flash"); // Flash handles codebase listings cheaply
    this.rules.set("risk", "gemini-flash");       // Flash checks activity charts cheaply
    this.rules.set("scrum", "gemini-flash");      // Flash processes status checks cheaply
    this.rules.set("knowledge", "gemini-flash");  // Flash lookup queries cheaply
  }

  /**
   * Dynamically overrides the routing key of an agent type.
   */
  setRule(agentType: AgentType, providerKey: string): void {
    if (PROVIDER_PROFILES[providerKey]) {
      this.rules.set(agentType, providerKey);
    }
  }

  /**
   * Decides which provider key and profile configuration to use for a given agent.
   */
  selectProvider(agentType: AgentType, estimatedTokens: number): { key: string; config: ProviderConfig } {
    // Configurable environment override: e.g. PROVIDER_RULE_PLANNING=openai-gpt
    const envOverride = process.env[`PROVIDER_RULE_${agentType.toUpperCase()}`];
    if (envOverride && PROVIDER_PROFILES[envOverride]) {
      return { key: envOverride, config: PROVIDER_PROFILES[envOverride] };
    }

    // Large-context token rule: If prompt + context exceeds 10,000 tokens, use Gemini Flash
    if (estimatedTokens > 10000) {
      return { key: "gemini-flash", config: PROVIDER_PROFILES["gemini-flash"] };
    }

    const key = this.rules.get(agentType) || "gemini-flash";
    const config = PROVIDER_PROFILES[key] || PROVIDER_PROFILES["gemini-flash"];
    return { key, config };
  }
}

export const providerSelector = new ProviderSelector();
