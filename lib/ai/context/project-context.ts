import { ProjectContext } from "../types/context";
import { ProjectModel, TaskModel, ActivityModel } from "../../db/models";

/**
 * Generates the context for a specific project.
 *
 * Fetches the project document, counts the associated tasks, and fetches
 * the most recent project activities from the database.
 * Gracefully defaults to an empty object if no projectId is supplied or on database error.
 *
 * @param projectId Optional MongoDB ID of the project.
 * @returns The populated ProjectContext.
 */
export async function getProjectContext(
  projectId?: string,
): Promise<ProjectContext> {
  if (!projectId) {
    return {};
  }

  try {
    const project = await ProjectModel.findById(projectId).exec();
    if (!project) {
      return { projectId };
    }

    const tasksCount = await TaskModel.countDocuments({ projectId }).exec();

    const rawActivities = await ActivityModel.find({ projectId })
      .sort({ timestamp: -1 })
      .limit(5)
      .exec();

    const recentActivities = rawActivities.map((act) => ({
      id: act._id.toString(),
      action: act.action,
      target: act.target,
      timestamp: act.timestamp ? new Date(act.timestamp).toISOString() : new Date().toISOString(),
      user: act.user?.name || "Unknown",
    }));

    return {
      projectId: project._id.toString(),
      name: project.name,
      slug: project.slug,
      status: project.status,
      tasksCount,
      recentActivities,
    };
  } catch (error) {
    console.error("Error building project context:", error);
    return { projectId };
  }
}
