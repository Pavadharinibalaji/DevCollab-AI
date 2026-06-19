export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type NavItem = {
  title: string;
  href: string;
  icon: string;
};

export type StatMetric = {
  label: string;
  value: string;
  change: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: "owner" | "admin" | "member";
};

export type Project = {
  id: string;
  name: string;
  slug: string;
  status: "active" | "archived";
  updatedAt: string;
};

/** Dashboard home — lightweight project card data */
export type DashboardProjectPreview = {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  accent: string;
  updatedLabel: string;
  memberCount: number;
  status: "active" | "paused";
};

export type PaginatedResponse<T> = {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
};

/** Kanban board */
export type KanbanColumnId = "todo" | "in-progress" | "in-review" | "done";

export type KanbanPriority = "low" | "medium" | "high" | "urgent";

export type KanbanAssignee = {
  id: string;
  name: string;
  /** 1–2 letters for avatar fallback */
  initials: string;
  avatarUrl?: string;
};

export type KanbanTask = {
  id: string;
  title: string;
  priority: KanbanPriority;
  assignee: KanbanAssignee;
  /** ISO date string */
  dueDate: string;
  status?: KanbanColumnId;
};

export const KANBAN_PRIORITIES = ["low", "medium", "high", "urgent"] as const;

export interface MockMember {
  id: string;
  name: string;
  initials: string;
  role: string;
  avatarColor?: string;
}

export interface MockProjectTask {
  id: string;
  title: string;
  status: "todo" | "in-progress" | "in-review" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  assignee: MockMember;
  dueDate: string;
}

export interface MockActivity {
  id: string;
  user: {
    name: string;
    initials: string;
    avatarUrl?: string;
  };
  action: string;
  target: string;
  timestamp: string;
}

export interface MockProject {
  id: string;
  title: string;
  description: string;
  progress: number;
  priority: "low" | "medium" | "high" | "urgent";
  status: "planning" | "active" | "paused" | "completed";
  dueDate: string;
  members: MockMember[];
  tasks: MockProjectTask[];
  activities: MockActivity[];
}

