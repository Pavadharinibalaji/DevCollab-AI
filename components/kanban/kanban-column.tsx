"use client";

import { memo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";

import { KanbanTaskCard } from "@/components/kanban/kanban-task-card";
import { cn } from "@/lib/utils";
import { KANBAN_COLUMN_LABELS } from "@/lib/kanban/seed";
import type { KanbanColumnId, KanbanTask } from "@/types";

type KanbanColumnProps = {
  columnId: KanbanColumnId;
  taskIds: string[];
  tasks: Record<string, KanbanTask>;
  onTaskClick?: (taskId: string) => void;
  onAddTaskClick?: (status: string) => void;
};

export const KanbanColumn = memo(
  function KanbanColumn({ columnId, taskIds, tasks, onTaskClick, onAddTaskClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: columnId });

  return (
    <div className="flex min-h-0 flex-col rounded-xl border border-border/60 bg-secondary/20 backdrop-blur-sm">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/50 px-3 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="truncate text-sm font-semibold tracking-tight text-foreground">
            {KANBAN_COLUMN_LABELS[columnId]}
          </h2>
          <span className="shrink-0 rounded-md bg-muted/80 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
            {taskIds.length}
          </span>
        </div>
        {onAddTaskClick && (
          <button
            type="button"
            onClick={() => onAddTaskClick(columnId)}
            className="flex h-6 w-6 items-center justify-center rounded-md border border-border/40 hover:border-indigo-500/40 hover:bg-indigo-500/5 text-muted-foreground hover:text-indigo-400 transition-all cursor-pointer"
            title="Add task to column"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={cn(
            "flex min-h-[min(12rem,40vh)] flex-1 flex-col gap-2 overflow-y-auto p-3 transition-colors",
            isOver && "bg-primary/5 ring-1 ring-inset ring-primary/20",
          )}
        >
          {taskIds.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">Drop tasks here</p>
          ) : null}
          {taskIds.map((id) => {
            const task = tasks[id];
            if (!task) return null;
            return (
              <KanbanTaskCard
                key={id}
                task={task}
                onClick={() => onTaskClick && onTaskClick(id)}
              />
            );
          })}
        </div>
      </SortableContext>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.columnId === nextProps.columnId &&
    prevProps.taskIds.length === nextProps.taskIds.length &&
    prevProps.taskIds.every((id, idx) => id === nextProps.taskIds[idx]) &&
    prevProps.taskIds.every((id) => prevProps.tasks[id] === nextProps.tasks[id])
  );
});
