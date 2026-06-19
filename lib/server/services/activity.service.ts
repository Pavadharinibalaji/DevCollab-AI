import mongoose from "mongoose";
import { connectMongoose } from "@/lib/db/mongoose";
import { ActivityModel } from "@/lib/db/models";
import { realtimeBroker } from "@/lib/server/realtime-broker";

export const activityService = {
  async create(input: {
    workspaceId: string;
    projectId?: string;
    taskId?: string;
    user: { name: string; initials: string; avatarUrl?: string };
    action: string;
    target: string;
  }) {
    const conn = await connectMongoose();
    if (!conn) throw new Error("Database connection failed");

    try {
      const doc = await ActivityModel.create({
        workspaceId: new mongoose.Types.ObjectId(input.workspaceId),
        projectId: input.projectId ? new mongoose.Types.ObjectId(input.projectId) : undefined,
        taskId: input.taskId ? new mongoose.Types.ObjectId(input.taskId) : undefined,
        user: input.user,
        action: input.action,
        target: input.target,
      });
      
      const leanDoc = doc.toObject();
      await realtimeBroker.publish("global", "activityCreated", leanDoc);
      return leanDoc;
    } catch (err) {
      console.error("Failed to create activity in MongoDB:", err);
      throw err;
    }
  },

  async list(workspaceId: string) {
    const conn = await connectMongoose();
    if (!conn) throw new Error("Database connection failed");
    try {
      return await ActivityModel.find({ workspaceId: new mongoose.Types.ObjectId(workspaceId) })
        .sort({ timestamp: -1 })
        .limit(20)
        .lean();
    } catch (err) {
      console.error("Failed to list activities from MongoDB:", err);
      return [];
    }
  }
};

