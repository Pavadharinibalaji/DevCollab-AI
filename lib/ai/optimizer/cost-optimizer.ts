import { AIRequest } from "../types/request";
import { AIContext } from "../types/context";
import { aiCache } from "../cache/ai-cache";
import { TokenEstimator } from "./token-estimator";
import { providerSelector, ProviderConfig } from "./provider-selector";

export interface OptimizationResult {
  requiresAI: boolean;
  source: "cache" | "database" | "memory" | "provider";
  content?: string;
  data?: Record<string, any>;
  providerKey?: string;
  providerConfig?: ProviderConfig;
}

/**
 * CostOptimizer decides whether an LLM provider invocation is required,
 * or if it can be bypassed using cache, DB workspaces lookups, or context memory logs.
 */
export class CostOptimizer {
  /**
   * Evaluates the query to minimize costs by resolving factual lookups locally.
   *
   * @param input The AIRequest input query.
   * @param context The loaded context containing project/workspace contexts.
   */
  async optimize(input: AIRequest, context?: AIContext): Promise<OptimizationResult> {
    const prompt = input.prompt.trim();

    // 1. Repeated Questions -> Use cache
    const cachedResponse = aiCache.get<string>(prompt);
    if (cachedResponse !== null) {
      return {
        requiresAI: false,
        source: "cache",
        content: cachedResponse,
      };
    }

    // 2. Workspace Lookups -> Use database context values directly
    if (context && this.isWorkspaceLookup(prompt)) {
      const ws = context.workspace;
      const content = `Workspace Details (Direct DB Lookup):
- Name: ${ws.name || "N/A"}
- Slug: ${ws.slug || "N/A"}
- Members Count: ${ws.membersCount ?? "N/A"}
- Created At: ${ws.createdAt ? new Date(ws.createdAt).toLocaleString() : "N/A"}`;

      return {
        requiresAI: false,
        source: "database",
        content,
        data: { workspace: ws },
      };
    }

    // 3. Simple Factual Requests -> Use memory logs directly
    if (context && this.isMemoryLookup(prompt)) {
      const recentActivities = context.project?.recentActivities;
      const conversationMemory = context.memory?.conversation;
      const projectMemory = context.memory?.project;

      let content = "Memory & Activity Log (Factual Summary):\n\n";

      if (recentActivities && recentActivities.length > 0) {
        content += "Recent Project Activities:\n";
        content += recentActivities
          .map((a) => `- ${a.action} on "${a.target}" by ${a.user} at ${new Date(a.timestamp).toLocaleString()}`)
          .join("\n") + "\n\n";
      }

      if (projectMemory && projectMemory.entries.length > 0) {
        content += "Last Project Digests:\n" + projectMemory.entries.slice(0, 3).map(e => `- [${new Date(e.timestamp).toLocaleDateString()}] ${e.summary}`).join("\n") + "\n\n";
      }

      if (conversationMemory && conversationMemory.entries.length > 0) {
        content += "Recent Conversation Digests:\n" + conversationMemory.entries.slice(0, 3).map(e => `- [${new Date(e.timestamp).toLocaleDateString()}] ${e.summary}`).join("\n") + "\n\n";
      }

      if (!recentActivities?.length && !projectMemory && !conversationMemory) {
        content = "No recent workspace activities or conversation memory found.";
      }

      return {
        requiresAI: false,
        source: "memory",
        content: content.trim(),
        data: {
          recentActivities,
          projectMemory,
          conversationMemory,
        },
      };
    }

    // 4. Complex Reasoning -> Fall back to AI Model selection
    const estimatedTokens =
      TokenEstimator.estimateTextTokens(prompt) +
      TokenEstimator.estimateContextTokens(context);

    const agentType = input.agentType || "planning";
    const selection = providerSelector.selectProvider(agentType, estimatedTokens);

    return {
      requiresAI: true,
      source: "provider",
      providerKey: selection.key,
      providerConfig: selection.config,
    };
  }

  /**
   * Helper to detect simple queries asking about workspace configuration metrics.
   */
  private isWorkspaceLookup(prompt: string): boolean {
    const lower = prompt.toLowerCase();
    return (
      (lower.includes("workspace") || lower.includes("organization")) &&
      (lower.includes("name") ||
        lower.includes("members") ||
        lower.includes("count") ||
        lower.includes("created"))
    );
  }

  /**
   * Helper to detect queries about recent logs or summaries.
   */
  private isMemoryLookup(prompt: string): boolean {
    const lower = prompt.toLowerCase();
    return (
      lower.includes("activity") ||
      lower.includes("activities") ||
      lower.includes("recent") ||
      lower.includes("what happened") ||
      lower.includes("last thing") ||
      lower.includes("previous topic") ||
      lower.includes("conversation memory")
    );
  }
}

export const costOptimizer = new CostOptimizer();
