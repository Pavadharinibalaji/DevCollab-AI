import type { KanbanColumnId, KanbanTask } from "@/types";

export const KANBAN_COLUMN_IDS: KanbanColumnId[] = [
  "todo",
  "in-progress",
  "in-review",
  "done",
];

export const KANBAN_COLUMN_LABELS: Record<KanbanColumnId, string> = {
  todo: "Todo",
  "in-progress": "In Progress",
  "in-review": "In Review",
  done: "Done",
};

export const initialKanbanColumnOrder: Record<KanbanColumnId, string[]> = {
  todo: ["t1", "t2"],
  "in-progress": ["t3", "t4"],
  "in-review": ["t5"],
  done: ["t6", "t7"],
};

export const initialKanbanTasks: Record<string, KanbanTask> = {
  t1: {
    id: "t1",
    title: "Design onboarding flow",
    priority: "high",
    assignee: { id: "u1", name: "Alex Rivera", initials: "AR" },
    dueDate: "2026-05-22",
  },
  t2: {
    id: "t2",
    title: "Document API error codes",
    priority: "low",
    assignee: { id: "u2", name: "Sam Lee", initials: "SL" },
    dueDate: "2026-05-28",
  },
  t3: {
    id: "t3",
    title: "Implement OAuth refresh",
    priority: "urgent",
    assignee: { id: "u3", name: "Jordan Kim", initials: "JK" },
    dueDate: "2026-05-21",
  },
  t4: {
    id: "t4",
    title: "Webhook retries & backoff",
    priority: "medium",
    assignee: { id: "u1", name: "Alex Rivera", initials: "AR" },
    dueDate: "2026-05-24",
  },
  t5: {
    id: "t5",
    title: "QA billing edge cases",
    priority: "high",
    assignee: { id: "u4", name: "Casey Morgan", initials: "CM" },
    dueDate: "2026-05-23",
  },
  t6: {
    id: "t6",
    title: "Release notes v2.4",
    priority: "low",
    assignee: { id: "u2", name: "Sam Lee", initials: "SL" },
    dueDate: "2026-05-18",
  },
  t7: {
    id: "t7",
    title: "Migrate CI to cached builds",
    priority: "medium",
    assignee: { id: "u3", name: "Jordan Kim", initials: "JK" },
    dueDate: "2026-05-15",
  },
};
