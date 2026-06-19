import type { KnownBlock } from "@slack/types";

import { projectService } from "@/lib/server/services/project.service";
import { taskService } from "@/lib/server/tasks/task.service";
import { getAppBaseUrl, getSlackWorkspaceId } from "@/lib/slack/config";

type ProjectSummary = {
  id: string;
  name: string;
  status: string;
  progress: number;
  totalTasks: number;
  doneTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
};

async function buildProjectSummaries(workspaceId: string): Promise<ProjectSummary[]> {
  const projects = await projectService.list(workspaceId);
  const now = new Date();

  return Promise.all(
    projects.map(async (project) => {
      const projectId = String(project._id);
      const tasks = await taskService.listByProject({ projectId });

      const doneTasks = tasks.filter((task) => task.status === "done").length;
      const inProgressTasks = tasks.filter((task) => task.status === "in-progress").length;
      const overdueTasks = tasks.filter(
        (task) =>
          task.status !== "done" &&
          task.dueDate &&
          new Date(task.dueDate) < now,
      ).length;

      return {
        id: projectId,
        name: String((project as { title?: string; name?: string }).title ?? project.name ?? "Untitled"),
        status: String(project.status ?? "active"),
        progress: Number(project.progress ?? 0),
        totalTasks: tasks.length,
        doneTasks,
        inProgressTasks,
        overdueTasks,
      };
    }),
  );
}

function formatStatusBlocks(summaries: ProjectSummary[]): KnownBlock[] {
  const appUrl = getAppBaseUrl();

  if (summaries.length === 0) {
    return [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*DevCollab status*\nNo projects found in the linked workspace. Create a project in DevCollab first.",
        },
      },
    ];
  }

  const blocks: KnownBlock[] = [
    {
      type: "header",
      text: { type: "plain_text", text: "DevCollab — Workspace Status", emoji: true },
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `${summaries.length} active project${summaries.length === 1 ? "" : "s"}`,
        },
      ],
    },
    { type: "divider" },
  ];

  for (const project of summaries) {
    const overdueLine =
      project.overdueTasks > 0 ? ` • *${project.overdueTasks} overdue*` : "";

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: [
          `*${project.name}*`,
          `Status: \`${project.status}\` • Progress: *${project.progress}%*`,
          `${project.doneTasks}/${project.totalTasks} done • ${project.inProgressTasks} in progress${overdueLine}`,
        ].join("\n"),
      },
      accessory: {
        type: "button",
        text: { type: "plain_text", text: "Open", emoji: true },
        url: `${appUrl}/dashboard/projects/${project.id}`,
        action_id: `view_project_${project.id}`,
      },
    });
  }

  blocks.push({ type: "divider" });
  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: "Use `/devcollab help` for more commands.",
      },
    ],
  });

  return blocks;
}

export async function buildStatusResponse() {
  const workspaceId = getSlackWorkspaceId();
  const summaries = await buildProjectSummaries(workspaceId);
  const blocks = formatStatusBlocks(summaries);

  return {
    response_type: "ephemeral" as const,
    text: `DevCollab status — ${summaries.length} project(s)`,
    blocks,
  };
}
