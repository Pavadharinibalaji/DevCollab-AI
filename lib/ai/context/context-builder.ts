import { getWorkspaceContext } from "./workspace-context";
import { getProjectContext } from "./project-context";
import { getRepositoryContext } from "./repository-context";
import { getSlackContext } from "./slack-context";
import { AIContext } from "../types/context";

/**
 * Combines independent sub-contexts into a single consolidated AIContext object.
 *
 * Exposes a strongly typed function that handles parameter resolution, database
 * queries, and placeholders. Handles missing inputs gracefully.
 *
 * Supported Agents in next phase:
 * - PlanningAgent: Infers project & workspace structures for tasks.
 * - RepositoryAgent: Resolves code file trees.
 * - KnowledgeAgent: Feeds project domains for scientific search.
 * - RiskAgent: Correlates project activities with delay risks.
 * - CodeAgent: Provides repository branch metadata.
 * - ScrumAgent: Integrates Slack channel history.
 */
export async function buildAIContext(input?: {
  userId?: string;
  projectId?: string;
  channelId?: string;
  repositoryUrl?: string;
  workspaceId?: string;
  additionalContext?: Record<string, any>;
}): Promise<AIContext> {
  let workspaceId = input?.workspaceId;
  const projectId = input?.projectId;

  // Gracefully deduce workspaceId from Project model if missing but projectId exists
  if (!workspaceId && projectId) {
    try {
      const { ProjectModel } = await import("../../db/models");
      const project = await ProjectModel.findById(projectId)
        .select("workspaceId")
        .exec();
      if (project?.workspaceId) {
        workspaceId = project.workspaceId.toString();
      }
    } catch (error) {
      console.error("Failed to deduce workspaceId from projectId:", error);
    }
  }

  const [workspace, project, repository, slack] = await Promise.all([
    getWorkspaceContext(workspaceId),
    getProjectContext(projectId),
    getRepositoryContext(input?.repositoryUrl),
    getSlackContext(input?.channelId),
  ]);

  return {
    workspace,
    project,
    repository,
    slack,
    timestamp: new Date().toISOString(),
  };
}
export type { AIContext };
