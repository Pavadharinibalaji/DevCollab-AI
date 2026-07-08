import mongoose from "mongoose";
import { connectMongoose } from "@/lib/db/mongoose";
import { ProjectModel, TaskModel, ActivityModel } from "@/lib/db/models";
import { activityService } from "./activity.service";
import { realtimeBroker } from "@/lib/server/realtime-broker";

export const projectService = {
  async list(workspaceId: string) {
    const conn = await connectMongoose();
    if (!conn) throw new Error("Database connection failed");

    try {
      const docs = await ProjectModel.find({ workspaceId: new mongoose.Types.ObjectId(workspaceId) })
        .sort({ createdAt: -1 })
        .lean({ virtuals: true });
      return docs.map(d => ({ ...d, title: (d as any).title || d.name }));
    } catch (err) {
      console.error("Failed to list projects from MongoDB:", err);
      throw err;
    }
  },

  async getById(projectId: string) {
    const conn = await connectMongoose();
    if (!conn) throw new Error("Database connection failed");

    try {
      const doc = await ProjectModel.findById(new mongoose.Types.ObjectId(projectId))
        .populate("members")
        .lean({ virtuals: true });
      if (doc) {
        return { ...doc, title: (doc as any).title || doc.name };
      }
      return null;
    } catch (err) {
      console.error(`Failed to get project ${projectId} from MongoDB:`, err);
      throw err;
    }
  },

  async create(workspaceId: string, input: {
    name?: string;
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    progress?: number;
    dueDate?: string;
    members?: string[];
    user?: { name: string; initials: string; avatarUrl?: string };
    createdBy: string;
  }) {
    const conn = await connectMongoose();
    if (!conn) throw new Error("Database connection failed");

    const name = input.name || input.title || "Untitled Project";
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    try {
      const memberObjectIds = (input.members || []).map(m => new mongoose.Types.ObjectId(m));
      const doc = await ProjectModel.create({
        workspaceId: new mongoose.Types.ObjectId(workspaceId),
        name,
        slug,
        description: input.description || "",
        status: input.status || "planning",
        priority: input.priority || "medium",
        progress: input.progress || 0,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        members: memberObjectIds,
        createdBy: new mongoose.Types.ObjectId(input.createdBy),
      });
      
      const populated = await ProjectModel.findById(doc._id).populate("members").lean({ virtuals: true });
      const result = { ...populated, title: (populated as any).title || populated.name };
      
      if (input.user) {
        await activityService.create({
          workspaceId: workspaceId,
          projectId: doc._id.toString(),
          user: input.user,
          action: "created project",
          target: name,
        });
      }

      await realtimeBroker.publish("global", "projectCreated", result);
      return result;
    } catch (err) {
      console.error("Failed to create project in MongoDB:", err);
      throw err;
    }
  },

  async update(projectId: string, updateInput: {
    name?: string;
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    progress?: number;
    dueDate?: string;
    members?: string[];
    user?: { name: string; initials: string; avatarUrl?: string };
  }) {
    const conn = await connectMongoose();
    if (!conn) throw new Error("Database connection failed");

    const name = updateInput.name || updateInput.title;

    try {
      const update: Record<string, any> = {};
      if (name !== undefined) {
        update.name = name;
        update.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      }
      if (updateInput.description !== undefined) update.description = updateInput.description;
      if (updateInput.status !== undefined) update.status = updateInput.status;
      if (updateInput.priority !== undefined) update.priority = updateInput.priority;
      if (updateInput.progress !== undefined) update.progress = updateInput.progress;
      if (updateInput.dueDate !== undefined) {
        update.dueDate = updateInput.dueDate ? new Date(updateInput.dueDate) : undefined;
      }
      if (updateInput.members !== undefined) {
        update.members = (updateInput.members || []).map(m => new mongoose.Types.ObjectId(m));
      }

      const doc = await ProjectModel.findByIdAndUpdate(
        new mongoose.Types.ObjectId(projectId),
        update,
        { new: true }
      ).populate("members").lean({ virtuals: true });

      if (doc) {
        const result = { ...doc, title: (doc as any).title || doc.name };
        if (updateInput.user) {
          await activityService.create({
            workspaceId: doc.workspaceId.toString(),
            projectId: doc._id.toString(),
            user: updateInput.user,
            action: "updated project",
            target: result.title,
          });
        }
        await realtimeBroker.publish("global", "projectUpdated", result);
        return result;
      }

      return null;
    } catch (err) {
      console.error(`Failed to update project ${projectId} in MongoDB:`, err);
      throw err;
    }
  },

  async delete(projectId: string) {
    const conn = await connectMongoose();
    if (!conn) throw new Error("Database connection failed");

    try {
      const pObjectId = new mongoose.Types.ObjectId(projectId);
      const project = await ProjectModel.findById(pObjectId).lean();
      if (!project) return false;

      // Delete tasks associated with this project
      await TaskModel.deleteMany({ projectId: pObjectId });

      // Delete activity logs associated with this project
      await ActivityModel.deleteMany({ projectId: pObjectId });

      // Delete the project document
      await ProjectModel.findByIdAndDelete(pObjectId);

      await realtimeBroker.publish("global", "projectDeleted", { _id: projectId });
      return true;
    } catch (err) {
      console.error(`Failed to delete project ${projectId} in MongoDB:`, err);
      throw err;
    }
  },

  async recalculateProgress(projectId: string) {
    const conn = await connectMongoose();
    if (!conn) throw new Error("Database connection failed");

    try {
      const pObjectId = new mongoose.Types.ObjectId(projectId);
      const totalTasks = await TaskModel.countDocuments({ projectId: pObjectId });
      const completedTasks = await TaskModel.countDocuments({ projectId: pObjectId, status: "done" });

      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      await ProjectModel.findByIdAndUpdate(pObjectId, { progress });

      // Broadcast project update
      const updated = await ProjectModel.findById(pObjectId).populate("members").lean({ virtuals: true });
      if (updated) {
        const result = { ...updated, title: (updated as any).title || updated.name };
        await realtimeBroker.publish("global", "projectUpdated", result);
      }
    } catch (err) {
      console.error(`Failed to recalculate progress for project ${projectId}:`, err);
    }
  }
};
