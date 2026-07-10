import { AIAgent, AgentType } from "../types/agent";
import { PlanningAgent } from "../agents/planning-agent";
import { RepositoryAgent } from "../agents/repository-agent";
import { KnowledgeAgent } from "../agents/knowledge-agent";
import { RiskAgent } from "../agents/risk-agent";
import { CodeAgent } from "../agents/code-agent";
import { ScrumAgent } from "../agents/scrum-agent";

/**
 * Registry to manage and resolve AI Agents by their associated intent/type.
 *
 * This central registry maps each AgentType to its respective AIAgent instance.
 * By decoupling lookup via a Map, we avoid large if/else or switch blocks in the coordinator.
 *
 * Future support:
 * - PlanningAgent: Handles project planning and breaking tasks into roadmaps.
 * - RepositoryAgent: Analyzes code structure and parses GitHub files.
 * - KnowledgeAgent: Scans documentation databases (ChEMBL, UniProt, etc.).
 * - RiskAgent: Predicts project bottlenecks and security vulnerabilities.
 * - CodeAgent: Drafts code snippets and performs automated code review.
 * - ScrumAgent: Compiles standup status checks and Slack notifications.
 */
export class AgentRegistry {
  private registry = new Map<AgentType, AIAgent>();

  constructor() {
    this.registerDefaults();
  }

  /**
   * Registers default agent instances.
   */
  private registerDefaults(): void {
    this.registry.set("planning", new PlanningAgent());
    this.registry.set("repository", new RepositoryAgent());
    this.registry.set("knowledge", new KnowledgeAgent());
    this.registry.set("risk", new RiskAgent());
    this.registry.set("code", new CodeAgent());
    this.registry.set("scrum", new ScrumAgent());
  }

  /**
   * Resolves an agent by its intent/type key.
   *
   * @param intent The AgentType intent to look up.
   * @returns The matched AIAgent instance or undefined if not registered.
   */
  getAgent(intent: AgentType): AIAgent | undefined {
    return this.registry.get(intent);
  }

  /**
   * Dynamically registers a new agent or overrides an existing agent mapping.
   *
   * @param intent The AgentType to map.
   * @param agent The AIAgent instance to associate with this intent.
   */
  registerAgent(intent: AgentType, agent: AIAgent): void {
    this.registry.set(intent, agent);
  }
}

// Export a singleton instance of the agent registry
export const agentRegistry = new AgentRegistry();
