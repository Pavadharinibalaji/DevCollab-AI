import { AIProvider } from "./provider";
import { PROVIDER_CONFIG } from "./provider-config";
import { ModelResolver } from "./model-resolver";

/**
 * Gemini REST API implementation of the AIProvider.
 *
 * Utilizes the Google Generative Language REST endpoints.
 * Injects keys and models via constructor using ProviderConfig / ModelResolver.
 */
export class GeminiProvider implements AIProvider {
  private apiKey: string;
  /** Display name used in all logs/metrics. Never changes after construction. */
  readonly providerName = "Gemini";
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
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || "";
    this.modelName = model || ModelResolver.resolve("gemini");
  }

  async generate(
    prompt: string,
    options?: Record<string, any>,
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error(
        "GeminiProvider: apiKey is required. Ensure ProviderResolver has resolved a valid key.",
      );
    }

    const model = options?.model || this.defaultModel;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
    const timeoutMs = options?.timeoutMs ?? PROVIDER_CONFIG.gemini.timeoutMs;

    const body = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: options?.temperature ?? PROVIDER_CONFIG.gemini.temperature,
        maxOutputTokens: options?.maxTokens ?? PROVIDER_CONFIG.gemini.maxTokens,
      },
    };

    const controller = new AbortController();
    const timerId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timerId);

      if (!res.ok) {
        const errorText = await res.text();
        const err = new Error(
          `Gemini generate API error: ${res.statusText} - ${errorText}`,
        );
        (err as any).status = res.status;
        throw err;
      }

      const data = await res.json();
      const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!candidateText) {
        throw new Error(
          "Gemini generate API returned empty or invalid response.",
        );
      }

      // Record token metrics
      this.lastTokenUsage = {
        promptTokens: data.usageMetadata?.promptTokenCount || 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata?.totalTokenCount || 0,
      };

      return candidateText.trim();
    } catch (err: any) {
      clearTimeout(timerId);
      if (err.name === "AbortError") {
        const timeoutErr = new Error(`Request timed out after ${timeoutMs}ms`);
        (timeoutErr as any).status = 408; // Request Timeout status code mapping
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
        "GeminiProvider: apiKey is required. Ensure ProviderResolver has resolved a valid key.",
      );
    }

    const model = options?.model || this.defaultModel;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
    const timeoutMs = options?.timeoutMs ?? PROVIDER_CONFIG.gemini.timeoutMs;

    const systemMessage = messages.find((m) => m.role === "system");
    const contents = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    const body: Record<string, any> = {
      contents,
      generationConfig: {
        temperature: options?.temperature ?? PROVIDER_CONFIG.gemini.temperature,
        maxOutputTokens: options?.maxTokens ?? PROVIDER_CONFIG.gemini.maxTokens,
      },
    };

    if (systemMessage) {
      body.systemInstruction = {
        parts: [{ text: systemMessage.content }],
      };
    }

    const controller = new AbortController();
    const timerId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timerId);

      if (!res.ok) {
        const errorText = await res.text();
        const err = new Error(
          `Gemini chat API error: ${res.statusText} - ${errorText}`,
        );
        (err as any).status = res.status;
        throw err;
      }

      const data = await res.json();
      const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!candidateText) {
        throw new Error("Gemini chat API returned empty or invalid response.");
      }

      // Record token metrics
      this.lastTokenUsage = {
        promptTokens: data.usageMetadata?.promptTokenCount || 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata?.totalTokenCount || 0,
      };

      return candidateText;
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
