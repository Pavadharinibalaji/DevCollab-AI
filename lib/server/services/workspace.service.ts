import mongoose from "mongoose";
import { connectMongoose } from "@/lib/db/mongoose";
import { WorkspaceModel, ProjectModel, TaskModel, ActivityModel } from "@/lib/db/models";
import { invitationService } from "./invitation.service";

export const workspaceService = {
  async createWorkspace(ownerId: string, name: string, slug: string, description?: string) {
    const conn = await connectMongoose();
    if (!conn) throw new Error("Database connection failed");

    try {
      const workspace = await WorkspaceModel.create({
        name,
        slug,
        description: description || "",
        ownerId: ownerId,
        members: [{ userId: ownerId, role: "owner" }],
      });
      return workspace;
    } catch (err) {
      console.error("Failed to create workspace in MongoDB:", err);
      throw err;
    }
  },

  async getMetrics(workspaceId: string) {
    const conn = await connectMongoose();
    if (!conn) throw new Error("Database connection failed");
    try {
      const wId = new mongoose.Types.ObjectId(workspaceId);
      const activeProjects = await ProjectModel.countDocuments({ workspaceId: wId, status: { $ne: "completed" } });
      const tasksCompleted = await TaskModel.countDocuments({ workspaceId: wId, status: "done" });
      const pendingTasks = await TaskModel.countDocuments({ workspaceId: wId, status: { $ne: "done" } });
      const overdueTasks = await TaskModel.countDocuments({
        workspaceId: wId,
        status: { $ne: "done" },
        dueDate: { $lt: new Date() }
      });
      
      const workspace = await WorkspaceModel.findById(wId).lean();
      const totalMembers = workspace ? workspace.members.length : 1;
      const onlineMembers = Math.max(1, Math.ceil(totalMembers * 0.75));

      // Calculate velocity data for the last 7 days in a single query
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const now = new Date();

      const startOfRange = new Date();
      startOfRange.setDate(now.getDate() - 6);
      startOfRange.setHours(0, 0, 0, 0);

      const tasks = await TaskModel.find({
        workspaceId: wId,
        $or: [
          { createdAt: { $gte: startOfRange } },
          { updatedAt: { $gte: startOfRange } }
        ]
      }).lean();

      const daysData = Array.from({ length: 7 }, (_, idx) => {
        const d = new Date();
        d.setDate(now.getDate() - (6 - idx));
        d.setHours(0, 0, 0, 0);
        return {
          dateStr: d.toDateString(),
          name: days[d.getDay()],
          completed: 0,
          created: 0,
        };
      });

      tasks.forEach((task) => {
        const taskCreatedStr = task.createdAt ? new Date(task.createdAt).toDateString() : "";
        const taskUpdatedStr = task.updatedAt ? new Date(task.updatedAt).toDateString() : "";

        daysData.forEach((day) => {
          if (taskCreatedStr === day.dateStr) {
            day.created++;
          }
          if (task.status === "done" && taskUpdatedStr === day.dateStr) {
            day.completed++;
          }
        });
      });

      const velocity = daysData.map((d) => ({
        name: d.name,
        completed: d.completed,
        created: d.created,
      }));

      return {
        activeProjects,
        tasksCompleted,
        pendingTasks,
        overdueTasks,
        totalMembers,
        onlineMembers,
        velocity,
      };
    } catch (err) {
      console.error("Failed to get workspace metrics in MongoDB:", err);
      return {
        activeProjects: 0,
        tasksCompleted: 0,
        pendingTasks: 0,
        overdueTasks: 0,
        totalMembers: 1,
        onlineMembers: 1,
        velocity: [],
      };
    }
  },

  async inviteMember(workspaceId: string, email: string, role: string = "member", inviterId?: string) {
    const conn = await connectMongoose();
    if (!conn) throw new Error("Database connection failed");
    try {
      if (!inviterId) {
        throw new Error("Inviter ID is required");
      }
      const { invitation, resent } = await invitationService.createInvitation(
        workspaceId,
        inviterId,
        email,
        role as "admin" | "member"
      );
      return { success: true, invitation, resent };
    } catch (err: any) {
      console.error("Failed to invite member in MongoDB:", err);
      return { success: false, error: err.message || String(err), statusCode: err.statusCode || 400 };
    }
  },

  async deleteWorkspace(workspaceId: string) {
    const conn = await connectMongoose();
    if (!conn) throw new Error("Database connection failed");

    try {
      const wId = new mongoose.Types.ObjectId(workspaceId);
      // Delete tasks associated with this workspace
      await TaskModel.deleteMany({ workspaceId: wId });
      // Delete projects associated with this workspace
      await ProjectModel.deleteMany({ workspaceId: wId });
      // Delete activities associated with this workspace
      await ActivityModel.deleteMany({ workspaceId: wId });
      // Delete the workspace document itself
      await WorkspaceModel.findByIdAndDelete(wId);
      return true;
    } catch (err) {
      console.error(`Failed to delete workspace ${workspaceId}:`, err);
      throw err;
    }
  }
};

