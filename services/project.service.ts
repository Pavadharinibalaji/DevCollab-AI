import { apiClient } from "@/lib/api-client";
import type { MockProject } from "@/types";

const BASE = "/api/projects";

export const projectService = {
  list: () =>
    apiClient<{ projects: MockProject[] }>(BASE).then((res) => res.projects),
  getById: (id: string) =>
    apiClient<{ project: MockProject }>(`${BASE}/${id}`).then((res) => res.project),
  create: (project: Partial<MockProject> & { user?: { name: string; initials: string; avatarUrl?: string } }) =>
    apiClient<{ project: MockProject }>(BASE, {
      method: "POST",
      body: project,
    }).then((res) => res.project),
  update: (id: string, updates: Partial<MockProject> & { user?: { name: string; initials: string; avatarUrl?: string } }) =>
    apiClient<{ project: MockProject }>(`${BASE}/${id}`, {
      method: "PATCH",
      body: updates,
    }).then((res) => res.project),
  delete: (id: string) =>
    apiClient<{ success: boolean }>(`${BASE}/${id}`, {
      method: "DELETE",
    }).then((res) => res.success),
};
