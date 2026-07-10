import { AgentType } from "../types/agent";

export interface ContextSelectionInput {
  userId?: string;
  projectId?: string;
  channelId?: string;
  repositoryUrl?: string;
  workspaceId?: string;
  additionalContext?: Record<string, any>;
}

/**
 * Determines and returns only the required context parameters based on the agent type (intent).
 * This optimization is used to reduce token usage by preventing unnecessary sub-context loads.
 */
export function selectContextInputs(
  agentType: AgentType,
  context?: ContextSelectionInput
): ContextSelectionInput | undefined {
  if (!context) {
    return undefined;
  }

  // Base parameters that are universally useful or safe to preserve
  const baseContext = {
    userId: context.userId,
    workspaceId: context.workspaceId,
    additionalContext: context.additionalContext,
  };

  switch (agentType) {
    case "planning":
      // Planning Agent
      // Needs: Project, Tasks, Workspace, Memory
      // Does NOT need: Repository, Slack
      return {
        ...baseContext,
        projectId: context.projectId,
      };

    case "repository":
      // Repository Agent
      // Needs: Repository, Commits, Project, Memory
      // Does NOT need: Slack
      return {
        ...baseContext,
        projectId: context.projectId,
        repositoryUrl: context.repositoryUrl,
      };

    case "risk":
      // Risk Agent
      // Needs: Tasks, Deadlines, Activities, Workspace
      // Does NOT need: Repository, Slack
      return {
        ...baseContext,
        projectId: context.projectId,
      };

    case "knowledge":
      // Knowledge Agent
      // Needs: Workspace, Documentation, Project
      // Does NOT need: Repository, Slack
      return {
        ...baseContext,
        projectId: context.projectId,
      };

    case "code":
      // Code Agent
      // Needs: Repository, Project (for workspace/metadata)
      // Does NOT need: Slack
      return {
        ...baseContext,
        projectId: context.projectId,
        repositoryUrl: context.repositoryUrl,
      };

    case "scrum":
      // Scrum Agent
      // Needs: Workspace, Slack
      // Does NOT need: Repository
      return {
        ...baseContext,
        projectId: context.projectId,
        channelId: context.channelId,
      };

    default:
      // Graceful fallback to avoid losing potential contexts
      return context;
  }
}
