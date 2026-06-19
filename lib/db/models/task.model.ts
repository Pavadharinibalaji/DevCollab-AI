import { Schema, model, models, type InferSchemaType } from "mongoose";

export const TASK_STATUSES = ["todo", "in-progress", "in-review", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

const CommentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

export const TaskSchema = new Schema(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },

    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },

    status: { type: String, enum: TASK_STATUSES, default: "todo", index: true },
    priority: { type: String, enum: TASK_PRIORITIES, default: "medium", index: true },

    assigneeId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    dueDate: { type: Date, index: true },
    comments: { type: [CommentSchema], default: [] },
  },
  { timestamps: true },
);

TaskSchema.index({ workspaceId: 1, projectId: 1, status: 1 });

export type TaskDoc = InferSchemaType<typeof TaskSchema>;

export const TaskModel = models.Task ?? model("Task", TaskSchema);

