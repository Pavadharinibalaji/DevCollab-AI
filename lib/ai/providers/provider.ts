/**
 * Unified interface for AI model providers (e.g., Gemini, OpenAI).
 *
 * This abstract interface supports core text generation, multi-turn chat dialogues,
 * and structured classification (intent routing) across DevCollab AI agents.
 *
 * Each provider implementation must expose providerName and modelName so that
 * every downstream component (agents, logger, coordinator) reads identity from
 * the provider instance itself — never from environment variables again.
 */
export interface AIProvider {
  /**
   * Human-readable provider display name (e.g., "Gemini", "OpenAI").
   * Used in logs and metrics. Never changes after construction.
   */
  readonly providerName: string;

  /**
   * The resolved model name for this instance (e.g., "gemini-2.5-flash", "gpt-4o-mini").
   * Injected via constructor. Never read from env inside provider methods.
   */
  readonly modelName: string;

  /**
   * Generates a text response from a single prompt.
   *
   * @param prompt The prompt to send to the AI model.
   * @param options Additional provider-specific configurations (model, temperature, maxTokens, etc.).
   */
  generate(prompt: string, options?: Record<string, any>): Promise<string>;

  /**
   * Routes a user prompt to one of the predefined intents/agents.
   *
   * @param prompt The incoming user request prompt.
   * @param intents The list of available intents (e.g., ['planning', 'repository', 'knowledge', 'risk', 'code', 'scrum']).
   */
  routeIntent(
    prompt: string,
    intents: string[],
    options?: Record<string, any>,
  ): Promise<string>;

  /**
   * Conducts a multi-turn chat conversation using message arrays.
   *
   * @param messages Array of conversational messages.
   * @param options Additional provider-specific configurations.
   */
  chat(
    messages: Array<{
      role: "user" | "assistant" | "system";
      content: string;
    }>,
    options?: Record<string, any>,
  ): Promise<string>;
}
