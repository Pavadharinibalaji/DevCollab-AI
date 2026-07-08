import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/db/models";
import { taskService } from "@/lib/server/tasks/task.service";
import { realtimeBroker } from "@/lib/server/realtime-broker";
import { getCurrentMongoUser } from "@/lib/server/auth/getCurrentMongoUser";
import { activityService } from "@/lib/server/services/activity.service";

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid id.");

const createTaskBodySchema = z.object({
  workspaceId: objectIdSchema,
  projectId: objectIdSchema,
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(4000).optional().or(z.literal("")),
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  assigneeId: objectIdSchema.optional().or(z.literal("")),
  dueDate: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || !Number.isNaN(Date.parse(v)), "Invalid dueDate."),
});

const updateTaskBodySchema = z.object({
  title: z.string().trim().min(2).max(160).optional(),
  description: z.string().trim().max(4000).optional().or(z.literal("")),
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  assigneeId: objectIdSchema.optional().or(z.literal("")),
  dueDate: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || !Number.isNaN(Date.parse(v)), "Invalid dueDate."),
});

export async function requireAuth() {
  const user = await getCurrentMongoUser();
  if (!user) {
    return { ok: false as const, response: NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 }) };
  }
  return { ok: true as const, user };
}

interface SeededAssignee {
  _id?: { toString(): string } | string;
  name?: string;
  avatarUrl?: string;
}

interface TaskInputDoc {
  toObject?: () => {
    _id?: { toString(): string } | string;
    title?: string;
    priority?: string;
    status?: string;
    assigneeId?: SeededAssignee | null;
    dueDate?: string | Date | null;
  };
  _id?: { toString(): string } | string;
  title?: string;
  priority?: string;
  status?: string;
  assigneeId?: SeededAssignee | null;
  dueDate?: string | Date | null;
}

function mapTaskDocToKanbanTask(doc: TaskInputDoc) {
  if (!doc) return null;
  const plainDoc = typeof doc.toObject === "function" ? doc.toObject() : doc;
  
  const assigneeDoc = plainDoc.assigneeId;
  const name = assigneeDoc?.name || "Unassigned";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return {
    id: plainDoc._id?.toString() || "",
    title: plainDoc.title || "",
    priority: (plainDoc.priority || "medium") as "low" | "medium" | "high" | "urgent",
    status: (plainDoc.status || "todo") as "todo" | "in-progress" | "in-review" | "done",
    assignee: {
      id: assigneeDoc?._id?.toString() || "unassigned",
      name,
      initials,
      avatarUrl: assigneeDoc?.avatarUrl || undefined,
    },
    dueDate: plainDoc.dueDate ? new Date(plainDoc.dueDate).toISOString().split("T")[0] : "",
  };
}

export const taskController = {
  async create(req: NextRequest) {
    const authed = await requireAuth();
    if (!authed.ok) return authed.response;

    const json = await req.json().catch(() => null);
    const parsed = createTaskBodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, data: null, error: "Invalid request", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const doc = await taskService.create({
      ...parsed.data,
      description: parsed.data.description ?? "",
      assigneeId: parsed.data.assigneeId || undefined,
      dueDate: parsed.data.dueDate || undefined,
      createdBy: authed.user._id.toString(),
    });

    const mapped = mapTaskDocToKanbanTask(doc);

    // Publish realtime update and log activity
    if (mapped && doc) {
      const initials = authed.user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "U";

      await activityService.create({
        workspaceId: doc.workspaceId.toString(),
        projectId: doc.projectId.toString(),
        taskId: doc._id.toString(),
        user: { name: authed.user.name, initials, avatarUrl: authed.user.avatarUrl },
        action: "created task",
        target: doc.title,
      });

      await realtimeBroker.publish(doc.projectId.toString(), "taskCreated", mapped);
    }

    return NextResponse.json({ success: true, data: { task: mapped }, error: null }, { status: 201 });
  },

  async update(taskId: string, req: NextRequest) {
    const authed = await requireAuth();
    if (!authed.ok) return authed.response;

    const json = await req.json().catch(() => null);
    const parsed = updateTaskBodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, data: null, error: "Invalid request", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // Fetch the task before update to determine if it is a move or update
    const originalTask = await taskService.getById(taskId);
    const originalStatus = originalTask?.status;

    const updated = await taskService.update({
      taskId,
      ...parsed.data,
      assigneeId: parsed.data.assigneeId === "" ? "" : parsed.data.assigneeId,
      dueDate: parsed.data.dueDate || undefined,
    });

    if (!updated) {
      return NextResponse.json({ success: false, data: null, error: "Task not found" }, { status: 404 });
    }

    const mapped = mapTaskDocToKanbanTask(updated);

    // Publish realtime update and log activity
    if (mapped) {
      const eventName = originalStatus !== updated.status ? "taskMoved" : "taskUpdated";
      const actionStr = originalStatus !== updated.status ? `moved task to ${updated.status}` : "updated task";
      
      const initials = authed.user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "U";

      await activityService.create({
        workspaceId: updated.workspaceId.toString(),
        projectId: updated.projectId.toString(),
        taskId: updated._id.toString(),
        user: { name: authed.user.name, initials, avatarUrl: authed.user.avatarUrl },
        action: actionStr,
        target: updated.title,
      });

      await realtimeBroker.publish(updated.projectId.toString(), eventName, mapped);
    }

    return NextResponse.json({ success: true, data: { task: mapped }, error: null }, { status: 200 });
  },

  async remove(taskId: string) {
    const authed = await requireAuth();
    if (!authed.ok) return authed.response;

    const deleted = await taskService.remove(taskId);
    if (!deleted) {
      return NextResponse.json({ success: false, data: null, error: "Task not found" }, { status: 404 });
    }

    // Log activity
    if (deleted) {
      const initials = authed.user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "U";

      await activityService.create({
        workspaceId: deleted.workspaceId.toString(),
        projectId: deleted.projectId.toString(),
        user: { name: authed.user.name, initials, avatarUrl: authed.user.avatarUrl },
        action: "deleted task",
        target: deleted.title,
      });
    }

    // Publish realtime update
    await realtimeBroker.publish(deleted.projectId.toString(), "taskDeleted", {
      taskId,
      projectId: deleted.projectId.toString(),
    });

    return NextResponse.json({ success: true, data: { success: true }, error: null }, { status: 200 });
  },

  async listByProject(req: NextRequest) {
    const authed = await requireAuth();
    if (!authed.ok) return authed.response;

    const url = new URL(req.url);
    const projectIdParam = url.searchParams.get("projectId") ?? "";

    // 1. If no projectId is passed, we return empty tasks to avoid 400 or dummy tasks.
    if (!projectIdParam || projectIdParam === "undefined" || projectIdParam === "null") {
      return NextResponse.json({ success: true, data: { tasks: [], projectId: "000000000000000000000000" }, error: null }, { status: 200 });
    }

    // 2. Validate projectId
    const parsed = objectIdSchema.safeParse(projectIdParam);
    if (!parsed.success) {
      return NextResponse.json({ success: false, data: null, error: "projectId is required and must be valid" }, { status: 400 });
    }

    // 3. Fetch tasks for the specific project
    const tasks = await taskService.listByProject({ projectId: parsed.data });
    const mappedTasks = tasks.map(mapTaskDocToKanbanTask).filter(Boolean);
    return NextResponse.json({ success: true, data: { tasks: mappedTasks, projectId: parsed.data }, error: null }, { status: 200 });
  },
};
