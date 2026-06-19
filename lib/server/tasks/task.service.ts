import mongoose from "mongoose";
import { connectMongoose } from "@/lib/db/mongoose";
import { TaskModel, type TaskStatus, type TaskPriority } from "@/lib/db/models";
import { projectService } from "@/lib/server/services/project.service";

export type CreateTaskInput = {
  workspaceId: string;
  projectId: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  dueDate?: string;
  createdBy: string;
};

export type UpdateTaskInput = Partial<Omit<CreateTaskInput, "workspaceId" | "projectId" | "createdBy">> & {
  taskId: string;
};

function toObjectId(id: string) {
  return new mongoose.Types.ObjectId(id);
}

export const taskService = {
  async create(input: CreateTaskInput) {
    const conn = await connectMongoose();
    if (!conn) throw new Error("Database connection failed");

    try {
      const doc = await TaskModel.create({
        workspaceId: toObjectId(input.workspaceId),
        projectId: toObjectId(input.projectId),
        title: input.title,
        description: input.description ?? "",
        status: input.status ?? "todo",
        priority: input.priority ?? "medium",
        assigneeId: input.assigneeId && mongoose.isValidObjectId(input.assigneeId) ? toObjectId(input.assigneeId) : undefined,
        createdBy: toObjectId(input.createdBy),
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      });

      const populated = await TaskModel.findById(doc._id).populate("assigneeId");
      if (populated) {
        await projectService.recalculateProgress(populated.projectId.toString());
      }
      return populated;
    } catch (dbErr) {
      console.error("Database operation failed in create task:", dbErr);
      throw dbErr;
    }
  },

  async getById(taskId: string) {
    const conn = await connectMongoose();
    if (!conn) throw new Error("Database connection failed");

    try {
      return await TaskModel.findById(toObjectId(taskId))
        .populate("assigneeId")
        .populate("comments.userId")
        .lean();
    } catch (dbErr) {
      console.error("Database operation failed in getById task:", dbErr);
      throw dbErr;
    }
  },

  async update(input: UpdateTaskInput) {
    const conn = await connectMongoose();
    if (!conn) throw new Error("Database connection failed");

    try {
      const update: Record<string, unknown> = {};
      if (input.title !== undefined) update.title = input.title;
      if (input.description !== undefined) update.description = input.description;
      if (input.status !== undefined) update.status = input.status;
      if (input.priority !== undefined) update.priority = input.priority;
      if (input.assigneeId !== undefined) {
        update.assigneeId = input.assigneeId && mongoose.isValidObjectId(input.assigneeId) ? toObjectId(input.assigneeId) : null;
      }
      if (input.dueDate !== undefined) {
        update.dueDate = input.dueDate ? new Date(input.dueDate) : null;
      }

      const doc = await TaskModel.findByIdAndUpdate(toObjectId(input.taskId), update, {
        new: true,
      }).populate("assigneeId");

      if (doc) {
        await projectService.recalculateProgress(doc.projectId.toString());
      }

      return doc;
    } catch (dbErr) {
      console.error("Database operation failed in update task:", dbErr);
      throw dbErr;
    }
  },

  async remove(taskId: string) {
    const conn = await connectMongoose();
    if (!conn) throw new Error("Database connection failed");

    try {
      const doc = await TaskModel.findByIdAndDelete(toObjectId(taskId)).populate("assigneeId");
      if (doc) {
        await projectService.recalculateProgress(doc.projectId.toString());
      }
      return doc;
    } catch (dbErr) {
      console.error("Database operation failed in remove task:", dbErr);
      throw dbErr;
    }
  },

  async listByProject(params: { projectId?: string }) {
    const conn = await connectMongoose();
    if (!conn) throw new Error("Database connection failed");

    try {
      const query = params.projectId ? { projectId: toObjectId(params.projectId) } : {};
      const docs = await TaskModel.find(query)
        .populate("assigneeId")
        .sort({ createdAt: -1 })
        .lean();
      return docs;
    } catch (dbErr) {
      console.error("Database operation failed in listByProject task:", dbErr);
      throw dbErr;
    }
  },
};
