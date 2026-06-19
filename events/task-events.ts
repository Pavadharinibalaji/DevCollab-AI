/**
 * Realtime task event contracts for Kanban-style updates.
 * Use these constants on both server and client to avoid drift.
 */

export const TASK_SOCKET_EVENTS = {
  taskCreated: "task:created",
  taskUpdated: "task:updated",
  taskMoved: "task:moved",
  taskDeleted: "task:deleted",
} as const;

export type TaskSocketEventName = (typeof TASK_SOCKET_EVENTS)[keyof typeof TASK_SOCKET_EVENTS];

/** Client → server: join a project-scoped room for broadcasts */
export const CLIENT_SOCKET_EVENTS = {
  joinProject: "project:join",
  leaveProject: "project:leave",
} as const;

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type TaskStatus = "todo" | "in-progress" | "in-review" | "done";

/** Core task shape broadcast on create/update */
export type TaskRealtimePayload = {
  id: string;
  projectId: string;
  workspaceId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string | null;
  dueDate?: string | null;
  updatedAt?: string;
};

export type TaskCreatedPayload = TaskRealtimePayload;

export type TaskUpdatedPayload = TaskRealtimePayload;

export type TaskMovedPayload = {
  id: string;
  projectId: string;
  workspaceId: string;
  /** New workflow column / status after move */
  status: TaskStatus;
  /** Optional ordering hint for optimistic UI */
  position?: number;
};

export type TaskDeletedPayload = {
  id: string;
  projectId: string;
  workspaceId: string;
};

export type JoinProjectPayload = {
  projectId: string;
};
