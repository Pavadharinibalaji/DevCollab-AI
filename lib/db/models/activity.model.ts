import { Schema, model, models, type InferSchemaType } from "mongoose";

export const ActivitySchema = new Schema(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", index: true },
    taskId: { type: Schema.Types.ObjectId, ref: "Task", index: true },
    user: {
      name: { type: String, required: true },
      initials: { type: String, required: true },
      avatarUrl: { type: String },
    },
    action: { type: String, required: true },
    target: { type: String, required: true },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

export type ActivityDoc = InferSchemaType<typeof ActivitySchema>;

export const ActivityModel = models.Activity ?? model("Activity", ActivitySchema);
