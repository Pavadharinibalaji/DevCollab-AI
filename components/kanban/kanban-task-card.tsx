"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar } from "lucide-react";

import { cn } from "@/lib/utils";
import type { KanbanPriority, KanbanTask } from "@/types";

const PRIORITY_STYLES: Record<KanbanPriority, string> = {
  low: "border-zinc-500/30 bg-zinc-500/15 text-zinc-400",
  medium: "border-sky-500/30 bg-sky-500/15 text-sky-300",
  high: "border-amber-500/30 bg-amber-500/15 text-amber-300",
  urgent: "border-red-500/35 bg-red-500/15 text-red-300",
};

const PRIORITY_LABEL: Record<KanbanPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export function KanbanTaskCard({
  task,
  isOverlay,
  onClick,
}: {
  task: KanbanTask;
  isOverlay?: boolean;
  onClick?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  if (isOverlay) {
    return <TaskCardFace task={task} />;
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("touch-none rounded-lg outline-none", isDragging && "relative z-10 opacity-50")}
      {...attributes}
      {...listeners}
    >
      <TaskCardFace task={task} onClick={onClick} />
    </div>
  );
}

function TaskCardFace({ task, onClick }: { task: KanbanTask; onClick?: () => void }) {
  const due = task.dueDate ? new Date(task.dueDate) : null;
  const dueLabel = due ? due.toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "";

  return (
    <article
      onClick={(e) => {
        // Prevent click if dragging
        if (onClick) {
          onClick();
        }
      }}
      className="cursor-pointer rounded-lg border border-border/60 bg-card/90 p-3 shadow-sm ring-1 ring-border/40 hover:border-indigo-500/40 hover:shadow-md transition-all active:cursor-grabbing text-left"
    >
      <h3 className="text-left text-[13px] font-medium leading-snug text-foreground group-hover:text-indigo-400 transition-colors">
        {task.title}
      </h3>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
            PRIORITY_STYLES[task.priority],
          )}
        >
          {PRIORITY_LABEL[task.priority]}
        </span>

        <div className="ml-auto flex items-center gap-2">
          {dueLabel && (
            <time
              className="inline-flex items-center gap-1 text-[11px] tabular-nums text-muted-foreground"
              dateTime={task.dueDate}
            >
              <Calendar className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
              {dueLabel}
            </time>
          )}
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-primary/10 text-[10px] font-semibold text-primary-foreground ring-1 ring-border/60"
            title={task.assignee.name}
          >
            {task.assignee.initials}
          </span>
        </div>
      </div>
    </article>
  );
}
