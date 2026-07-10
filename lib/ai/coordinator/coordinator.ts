import { AIProvider } from "../providers/provider";
import { AIProviderFactory } from "../providers/factory";
import { agentRegistry } from "../registry/agent-registry";
import { AIRequest } from "../types/request";
import { AIResponse } from "../types/response";
import { AgentType } from "../types/agent";
import { aiCache } from "../cache/ai-cache";
import { buildAIContext, AIContext } from "../context/context-builder";
import { memoryManager } from "../memory/memory-manager";
import { intentClassifier } from "../intents/intent-classifier";
import { AgentExecutor } from "../executor/agent-executor";
import { selectContextInputs } from "../context/context-selector";
import { costOptimizer } from "../optimizer/cost-optimizer";
import { getProviderInstance, ModelConfiguredProvider } from "../optimizer/provider-selector";
import { executionLogger } from "../logging/execution-logger";
import { TokenEstimator } from "../optimizer/token-estimator";
import { ConfidenceCalculator } from "../intents/confidence-calculator";
import { WorkflowEngine } from "../workflows/workflow-engine";
import { WorkflowDefinition, WorkflowResult } from "../workflows/workflow-types";
import { FallbackProvider } from "../recovery/fallback-provider";
import { FailureHandler } from "../recovery/failure-handler";
import { ProviderResolver } from "../providers/provider-resolver";

/**
 * AICoordinator is the central routing engine.
 *
 * It decouples concrete agent instances and provider endpoints from the request layer.
 * Using the dynamic registry, intent routing, and caching, the coordinator orchestrates
 * requests to the correct specialized agent.
 *
 * How this infrastructure supports agents in the next phase:
 * - PlanningAgent: Receives filtered request; coordinates task/milestone creations.
 * - RepositoryAgent: Examines code repositories and workspace trees using context parameters.
 * - KnowledgeAgent: Interfaces with search endpoints and databases to retrieve answers.
 * - RiskAgent: Analyzes safety metrics, timelines, and security.
 * - CodeAgent: Uses generator capabilities to draft code modules or refactors.
 * - ScrumAgent: Resolves scrum standups and pushes digests to targets like Slack.
 */
export class AICoordinator {
  private provider: AIProvider;
  private registry = agentRegistry;
  private cache = aiCache;
  private memory = memoryManager;
  private classifier = intentClassifier;
  private executor: AgentExecutor;
  private optimizer = costOptimizer;
  private workflowEngine: WorkflowEngine;

  /**
   * Constructs the coordinator. Allows optional injection of an AIProvider instance.
   *
   * @param provider The provider implementation. Falls back to AIProviderFactory configuration.
   */
  constructor(provider?: AIProvider) {
    this.provider = provider || AIProviderFactory.getProvider();
    this.executor = new AgentExecutor(this.provider);
    this.workflowEngine = new WorkflowEngine(this);
  }

  /**
   * Evaluates the request payload, resolves the target agent, and executes the agent flow.
   *
   * @param input The AIRequest input parameters.
   * @returns Promise resolving to the AIResponse object.
   */
  /**
   * Evaluates the request payload, resolves the target agent, and executes the agent flow.
   *
   * @param input The AIRequest input parameters.
   * @returns Promise resolving to the AIResponse object.
   */
  async execute(input: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    let cacheHit = false;
    let providerName = "unknown";
    let estimatedTokens = 0;
    let response: AIResponse | undefined;
    let agentType: AgentType = "planning";

    console.log("[AICoordinator] Coordinator started");
    // resolved is declared here so it's accessible in both try and finally blocks
    let resolved: Awaited<ReturnType<typeof ProviderResolver.resolve>> | undefined;
    try {
      // Resolve provider — ProviderResolver owns all key/model/provider logic
      resolved = await ProviderResolver.resolve(input.context?.userId);
      // Single source of truth for provider label used in all logs and the execution logger
      providerName = `${resolved.instance.providerName} / ${resolved.instance.modelName}`;
      // Inject resolved provider instance into intent classifier so it uses the correct key/model
      this.classifier.setProvider(resolved.instance);

      // 1. Run Intent Classification & resolve target AgentType
      const classification = await this.classifyIntent(input);
      agentType = input.agentType || "planning";
      console.log(`[AICoordinator] Intent detected: ${classification?.intent || "unknown"}`);
      console.log(`[AICoordinator] Confidence: ${classification?.confidence ?? "N/A"}`);
      console.log(`[AICoordinator] Selected Agent: ${agentType}`);

      // 2. Validate Confidence
      if (classification && !ConfidenceCalculator.meetsThreshold(classification)) {
        response = this.createClarificationResponse(input, classification);
        return response;
      }

      // 3. Build context selection
      const aiContext = await this.compileContext(input, agentType);
      console.log("[AICoordinator] Context built");

      // 4. Load & inject AI memories
      await this.injectMemory(input, aiContext);
      console.log("[AICoordinator] Memory loaded");

      // 5. Cost Optimization & Provider Options resolution
      const optimization = await this.optimizer.optimize(input, aiContext);

      if (!optimization.requiresAI) {
        cacheHit = optimization.source === "cache";
        response = this.createLocalResponse(input, agentType, optimization);
      } else {
        cacheHit = false;
        estimatedTokens = TokenEstimator.estimateTextTokens(input.prompt) +
                          TokenEstimator.estimateContextTokens(aiContext);

        const executionOptions = this.resolveExecutionOptions(optimization, resolved.instance);
        console.log(`[AICoordinator] Resolved Provider: ${resolved.instance.providerName}`);
        console.log(`[AICoordinator] Resolved Model: ${resolved.instance.modelName}`);
        console.log(`[AICoordinator] API Key Source: ${resolved.isCustom ? "User Database" : "Environment"}`);

        // 6. Execute Agent using AgentExecutor (loads matching agent from Registry)
        response = await this.executor.execute(input, executionOptions);
        console.log("[AICoordinator] Agent executed");

        if (response.success && response.content) {
          this.cache.set(input.prompt, response.content);
        }
      }

      // 7. Save updated memory
      if (response && response.success) {
        await this.saveMemory(input, response, aiContext);
      }

      console.log("[AICoordinator] Execution completed");
      return response as AIResponse;
    } catch (error: any) {
      response = FailureHandler.handleFailure(error, input.id, agentType);
      return response;
    } finally {
      const durationMs = Date.now() - startTime;
      const finalResponse = response || this.createFallbackErrorResponse(input, agentType);
      this.logExecution(input, finalResponse, durationMs, cacheHit, estimatedTokens, providerName);
      console.log("[AICoordinator] Response returned");
    }
  }

  /**
   * Helper to classify the user request intent and assign suggested agent type.
   */
  private async classifyIntent(input: AIRequest): Promise<any> {
    if (input.agentType) {
      return input.metadata?.classification || { intent: input.agentType, confidence: 1.0, reasoning: "Pre-specified agent type" };
    }

    const classification = await this.classifier.classify(input);
    const suggestedAgentName = classification.intent as AgentType;
    const agent = this.registry.getAgent(suggestedAgentName);
    input.agentType = agent ? suggestedAgentName : "planning";
    
    input.metadata = {
      ...input.metadata,
      classification,
    };

    return classification;
  }

  /**
   * Helper to create clarification response if classification confidence threshold is not met.
   */
  private createClarificationResponse(input: AIRequest, classification: any): AIResponse {
    return {
      id: "clarify_" + Math.random().toString(36).substring(2, 15),
      requestId: input.id,
      success: false,
      agentType: "planning",
      content: ConfidenceCalculator.getClarificationMessage(classification, input.prompt),
      error: "Needs Clarification",
      confidence: classification.confidence ?? 0,
      agentName: "planning",
      provider: "local",
    };
  }

  /**
   * Helper to compile user context using context builder.
   */
  private async compileContext(input: AIRequest, agentType: AgentType): Promise<AIContext> {
    const filteredContextInputs = selectContextInputs(agentType, input.context);
    const aiContext = await buildAIContext(filteredContextInputs);
    input.aiContext = aiContext;
    return aiContext;
  }

  /**
   * Helper to retrieve memory parameters and inject them into aiContext.
   */
  private async injectMemory(input: AIRequest, aiContext: AIContext): Promise<void> {
    const workspaceId = aiContext.workspace.workspaceId;
    const projectId = aiContext.project.projectId;
    const userId = input.context?.userId;
    const conversationId = aiContext.slack.channelId || input.id;

    const [wsMemory, projMemory, usrMemory, convMemory] = await Promise.all([
      workspaceId ? this.memory.getWorkspace(workspaceId) : null,
      projectId ? this.memory.getProject(projectId) : null,
      userId ? this.memory.getUser(userId) : null,
      conversationId ? this.memory.getConversation(conversationId) : null,
    ]);

    aiContext.memory = {
      workspace: wsMemory,
      project: projMemory,
      user: usrMemory,
      conversation: convMemory,
    };
  }

  /**
   * Helper to create response for cached/local execution.
   */
  private createLocalResponse(input: AIRequest, agentType: AgentType, optimization: any): AIResponse {
    return {
      id: "local_" + Math.random().toString(36).substring(2, 15),
      requestId: input.id,
      success: true,
      agentType,
      content: optimization.content || "",
      data: optimization.data,
      confidence: 1.0,
      provider: "local",
      agentName: agentType,
    };
  }

  /**
   * Helper to resolve AI provider model options and secondary fallback wrapper.
   */
  private resolveExecutionOptions(optimization: any, resolvedProvider?: AIProvider): any {
    // If a custom/mock provider is specified for testing, use it directly
    const isMock = this.provider.constructor.name !== "GeminiProvider" &&
                   this.provider.constructor.name !== "OpenAIProvider";
    if (isMock) {
      return {
        provider: this.provider,
      };
    }

    // Use the resolved provider instance when available (from ProviderResolver DI)
    const primaryBase = resolvedProvider ?? getProviderInstance(
      optimization.providerConfig?.providerType || "gemini"
    );

    if (!optimization.providerConfig) {
      return { provider: primaryBase };
    }

    // Wrap with ModelConfiguredProvider to enforce cost-optimized model selection
    const primaryConfigured = new ModelConfiguredProvider(primaryBase, optimization.providerConfig.model);

    // Fallback provider uses the opposite provider type with env-configured models
    const fallbackType = optimization.providerConfig.providerType === "gemini" ? "openai" : "gemini";
    const fallbackModel = fallbackType === "openai"
      ? (process.env.OPENAI_MODEL || "gpt-4o-mini")
      : (process.env.GEMINI_MODEL || "gemini-2.5-flash");
    const fallbackProvider = getProviderInstance(fallbackType);
    const secondaryConfigured = new ModelConfiguredProvider(fallbackProvider, fallbackModel);

    const recoveryProvider = new FallbackProvider(primaryConfigured, secondaryConfigured);

    return {
      provider: recoveryProvider,
    };
  }

  /**
   * Helper to persist execution details in Mongoose.
   */
  private async saveMemory(input: AIRequest, response: AIResponse, aiContext: AIContext): Promise<void> {
    const timestamp = new Date().toISOString();
    const source = input.context?.channelId ? "slack" : "api";
    const conversationId = aiContext.slack.channelId || input.id;
    const projectId = aiContext.project.projectId;

    const memoryEntry = {
      id: response.id,
      type: "conversation" as const,
      timestamp,
      source,
      summary: `Agent ${response.agentType} processed request. Prompt summary: "${input.prompt.substring(0, 80)}...". Content preview: "${response.content.substring(0, 100)}..."`,
      metadata: {
        prompt: input.prompt,
        agentType: response.agentType,
        data: response.data,
      },
    };

    await this.memory.saveConversation(conversationId, memoryEntry);

    if (projectId) {
      const projectEntry = {
        ...memoryEntry,
        type: "project" as const,
        summary: `Project intent "${input.prompt.substring(0, 80)}..." handled by ${response.agentType}`,
      };
      await this.memory.saveProject(projectId, projectEntry);
    }
  }

  /**
   * Helper to write structured performance metrics logs to output execution logger.
   */
  private logExecution(
    input: AIRequest,
    response: AIResponse,
    durationMs: number,
    cacheHit: boolean,
    estimatedTokens: number,
    providerName: string
  ): void {
    executionLogger.log(
      input,
      response,
      durationMs,
      cacheHit,
      estimatedTokens,
      providerName
    );
  }

  /**
   * Create standard error responses.
   */
  private createFallbackErrorResponse(input: AIRequest, agentType: AgentType): AIResponse {
    return {
      id: "unknown",
      requestId: input.id,
      success: false,
      agentType: input.agentType || agentType,
      content: "",
      error: "Execution was aborted or did not yield a response.",
      confidence: 0,
      provider: "unknown",
      agentName: input.agentType || agentType,
    };
  }

  /**
   * Executes a multi-agent workflow sequentially.
   *
   * @param workflow The WorkflowDefinition configuration.
   * @param input The AIRequest input query.
   * @returns Promise resolving to WorkflowResult.
   */
  async executeWorkflow(
    workflow: WorkflowDefinition,
    input: AIRequest
  ): Promise<WorkflowResult> {
    return this.workflowEngine.execute(workflow, input);
  }
}


