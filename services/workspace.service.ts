import { apiClient } from "@/lib/api-client";

const BASE = "/api/workspace";

export interface WorkspaceMetrics {
  activeProjects: number;
  tasksCompleted: number;
  pendingTasks: number;
  overdueTasks: number;
  onlineMembers: number;
  totalMembers?: number;
  velocity?: Array<{ name: string; completed: number; created: number }>;
}

export interface Workspace {
  _id: string;
  name: string;
  slug: string;
  ownerId: string;
  members: Array<{
    userId: any;
    role: "owner" | "admin" | "member";
    joinedAt: string;
  }>;
}

export const workspaceService = {
  getWorkspaceWithMetrics: () =>
    apiClient<{ workspace: Workspace; metrics: WorkspaceMetrics }>(BASE),
  inviteMember: (email: string, role: string) =>
    apiClient<{ success: boolean; member: any }>(BASE, {
      method: "POST",
      body: { email, role },
    }),
  list: () =>
    apiClient<{ workspaces: Workspace[] }>("/api/workspaces").then((res) => res.workspaces),
  create: (name: string, slug: string, description?: string) =>
    apiClient<{ success: boolean; workspace: Workspace }>(BASE, {
      method: "POST",
      body: { name, slug, description },
    }),
  switchWorkspace: (workspaceId: string) =>
    apiClient<{ success: boolean }>("/api/workspaces/switch", {
      method: "POST",
      body: { workspaceId },
    }),
};
