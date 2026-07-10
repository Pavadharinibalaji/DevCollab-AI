import { WorkspaceContext } from "../types/context";
import { WorkspaceModel } from "../../db/models";

/**
 * Generates the context for a specific workspace.
 *
 * Fetches the workspace document from the database and returns details
 * such as workspace name, slug, and member count.
 * Gracefully defaults to an empty object if no workspaceId is supplied or on database error.
 *
 * @param workspaceId Optional MongoDB ID of the workspace.
 * @returns The populated WorkspaceContext.
 */
export async function getWorkspaceContext(
  workspaceId?: string,
): Promise<WorkspaceContext> {
  if (!workspaceId) {
    return {};
  }

  try {
    const workspace = await WorkspaceModel.findById(workspaceId).exec();
    if (!workspace) {
      return { workspaceId };
    }

    return {
      workspaceId: workspace._id.toString(),
      name: workspace.name,
      slug: workspace.slug,
      membersCount: workspace.members?.length || 0,
      createdAt: workspace.createdAt
        ? new Date(workspace.createdAt).toISOString()
        : undefined,
    };
  } catch (error) {
    console.error("Error building workspace context:", error);
    return { workspaceId };
  }
}
