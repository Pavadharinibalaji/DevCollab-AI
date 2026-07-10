import { AIProvider } from "./provider";
import { PROVIDER_CONFIG } from "./provider-config";
import { ModelResolver } from "./model-resolver";

/**
 * OpenAI REST API implementation of the AIProvider.
 *
 * Utilizes standard OpenAI chat completions endpoint.
 * Injects keys and models via constructor using ProviderConfig / ModelResolver.
 */
export class OpenAIProvider implements AIProvider {
  private apiKey: string;
  /** Display name used in all logs/metrics. Never changes after construction. */
  readonly providerName = "OpenAI";
  /** Resolved model name — single source of truth throughout execution. */
  readonly modelName: string;
  /** @deprecated Use modelName. Kept for backward compat. */
  get defaultModel() {
    return this.modelName;
  }

  /**
   * Cached metrics for the most recent API call.
   */
  public lastTokenUsage = {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
  };

  /**
   * @param apiKey  - Resolved API key (injected by ProviderResolver)
   * @param model   - Resolved model name (injected by ProviderResolver)
   */
  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || "";
    this.modelName = model || ModelResolver.resolve("openai");
  }

  async generate(
    prompt: string,
    options?: Record<string, any>,
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error(
        "OpenAIProvider: apiKey is required. Ensure ProviderResolver has resolved a valid key.",
      );
    }

    const model = options?.model || this.defaultModel;
    const url = "https://api.openai.com/v1/chat/completions";
    const timeoutMs = options?.timeoutMs ?? PROVIDER_CONFIG.openai.timeoutMs;

    const body = {
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: options?.temperature ?? PROVIDER_CONFIG.openai.temperature,
      max_tokens: options?.maxTokens ?? PROVIDER_CONFIG.openai.maxTokens,
    };

    const controller = new AbortController();
    const timerId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timerId);

      if (!res.ok) {
        const errorText = await res.text();
        const err = new Error(
          `OpenAI generate API error: ${res.statusText} - ${errorText}`,
        );
        (err as any).status = res.status;
        throw err;
      }

      const data = await res.json();
      const messageContent = data.choices?.[0]?.message?.content;
      if (!messageContent) {
        throw new Error(
          "OpenAI generate API returned empty or invalid response.",
        );
      }

      // Record token metrics
      this.lastTokenUsage = {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      };

      return messageContent.trim();
    } catch (err: any) {
      clearTimeout(timerId);
      if (err.name === "AbortError") {
        const timeoutErr = new Error(`Request timed out after ${timeoutMs}ms`);
        (timeoutErr as any).status = 408;
        throw timeoutErr;
      }
      throw err;
    }
  }

  async routeIntent(
    prompt: string,
    intents: string[],
    options?: Record<string, any>,
  ): Promise<string> {
    const routePrompt = `You are a router. Analyze the following user prompt and classify it into exactly one of the following intent categories:
[${intents.join(", ")}]

Provide only the name of the category in your response, with no punctuation, no surrounding quotation marks, and no additional explanation.

User Prompt: "${prompt}"

Category:`;

    const result = await this.generate(routePrompt, {
      temperature: 0.0,
      ...(options || {}),
    });
    const cleanResult = result.toLowerCase().trim();

    const matched = intents.find((intent) =>
      cleanResult.includes(intent.toLowerCase()),
    );
    return matched || intents[0];
  }

  async chat(
    messages: Array<{
      role: "user" | "assistant" | "system";
      content: string;
    }>,
    options?: Record<string, any>,
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error(
        "OpenAIProvider: apiKey is required. Ensure ProviderResolver has resolved a valid key.",
      );
    }

    const model = options?.model || this.defaultModel;
    const url = "https://api.openai.com/v1/chat/completions";
    const timeoutMs = options?.timeoutMs ?? PROVIDER_CONFIG.openai.timeoutMs;

    const body = {
      model,
      messages,
      temperature: options?.temperature ?? PROVIDER_CONFIG.openai.temperature,
      max_tokens: options?.maxTokens ?? PROVIDER_CONFIG.openai.maxTokens,
    };

    const controller = new AbortController();
    const timerId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timerId);

      if (!res.ok) {
        const errorText = await res.text();
        const err = new Error(
          `OpenAI chat API error: ${res.statusText} - ${errorText}`,
        );
        (err as any).status = res.status;
        throw err;
      }

      const data = await res.json();
      const messageContent = data.choices?.[0]?.message?.content;
      if (!messageContent) {
        throw new Error("OpenAI chat API returned empty or invalid response.");
      }

      // Record token metrics
      this.lastTokenUsage = {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      };

      return messageContent;
    } catch (err: any) {
      clearTimeout(timerId);
      if (err.name === "AbortError") {
        const timeoutErr = new Error(`Request timed out after ${timeoutMs}ms`);
        (timeoutErr as any).status = 408;
        throw timeoutErr;
      }
      throw err;
    }
  }
}
