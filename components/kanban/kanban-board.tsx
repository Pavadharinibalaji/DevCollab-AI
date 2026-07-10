"use client";

import { useEffect, useState } from "react";
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  defaultDropAnimationSideEffects,
  type DragEndEvent,
  type DragStartEvent,
  type DropAnimation,
} from "@dnd-kit/core";
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { FolderKanban, Loader2, Plus, Sparkle } from "lucide-react";

import { KanbanColumn } from "@/components/kanban/kanban-column";
import { KanbanTaskCard } from "@/components/kanban/kanban-task-card";
import { CreateTaskModal } from "@/components/kanban/create-task-modal";
import { TaskDetailsModal } from "@/components/kanban/task-details-modal";
import { KANBAN_COLUMN_IDS } from "@/lib/kanban/seed";
import type { KanbanColumnId, KanbanTask } from "@/types";
import { useSocket } from "@/hooks/use-socket";
import { apiClient } from "@/lib/api-client";
import Link from "next/link";

function isColumnId(value: string): value is KanbanColumnId {
  return KANBAN_COLUMN_IDS.includes(value as KanbanColumnId);
}

function findColumnForTask(
  taskId: string,
  columns: Record<KanbanColumnId, string[]>,
): KanbanColumnId | undefined {
  for (const col of KANBAN_COLUMN_IDS) {
    if (columns[col].includes(taskId)) return col;
  }
  return undefined;
}

function resolveOverColumn(
  overId: string,
  columns: Record<KanbanColumnId, string[]>,
): KanbanColumnId | undefined {
  if (isColumnId(overId)) return overId;
  return findColumnForTask(overId, columns);
}

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: "0.5" } },
  }),
};

export function KanbanBoard() {
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [workspaceMembers, setWorkspaceMembers] = useState<any[]>([]);
  
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [projectsLoading, setProjectsLoading] = useState(true);

  const { socket, isConnected } = useSocket({
    projectId: selectedProjectId || undefined,
  });

  const [columns, setColumns] = useState<Record<KanbanColumnId, string[]>>({
    todo: [],
    "in-progress": [],
    "in-review": [],
    done: [],
  });
  const [tasks, setTasks] = useState<Record<string, KanbanTask>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createTaskStatus, setCreateTaskStatus] = useState<string>("todo");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // 1. Fetch Workspace & Projects on Mount
  useEffect(() => {
    let active = true;

    // Fetch workspace details (members list)
    fetch("/api/workspace")
      .then((res) => res.json())
      .then((payload) => {
        if (!active) return;
        const data = payload.data || {};
        if (data.workspace) {
          setWorkspaceId(data.workspace._id);
          const membersList = (data.workspace.members || []).map((m: any) => {
            const u = m.userId;
            if (!u) return null;
            return {
              id: u._id || u.id,
              name: u.name || "Teammate",
            };
          }).filter(Boolean);
          setWorkspaceMembers(membersList);
        }
      })
      .catch((err) => console.error("Failed to load workspace members:", err));

    // Fetch projects
    fetch("/api/projects")
      .then((res) => res.json())
      .then((payload) => {
        if (!active) return;
        setProjectsLoading(false);
        const data = payload.data || {};
        if (data.projects && data.projects.length > 0) {
          setProjects(data.projects);
          setSelectedProjectId(data.projects[0]._id || data.projects[0].id);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch projects:", err);
        if (active) setProjectsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // 2. Fetch Tasks when selected project changes
  const fetchTasks = () => {
    if (!selectedProjectId) return;
    setIsLoading(true);

    fetch(`/api/tasks?projectId=${selectedProjectId}`)
      .then((res) => res.json())
      .then((payload) => {
        const data = payload.data || { tasks: [] };
        const newTasks: Record<string, KanbanTask> = {};
        const newColumns: Record<KanbanColumnId, string[]> = {
          todo: [],
          "in-progress": [],
          "in-review": [],
          done: [],
        };

        data.tasks.forEach((t: any) => {
          newTasks[t.id] = t;
          if (t.status && newColumns[t.status as KanbanColumnId]) {
            newColumns[t.status as KanbanColumnId].push(t.id);
          }
        });

        setTasks(newTasks);
        setColumns(newColumns);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load tasks:", err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchTasks();
  }, [selectedProjectId]);

  // 3. Setup Socket.IO realtime events
  useEffect(() => {
    if (!socket) return;

    const onTaskCreated = (task: KanbanTask) => {
      console.log(`[Socket.IO Client] Event received: "taskCreated"`, task);
      setTasks((prev) => ({ ...prev, [task.id]: task }));
      setColumns((prev) => {
        const col = task.status || "todo";
        const exists = findColumnForTask(task.id, prev);
        if (exists) return prev;
        return {
          ...prev,
          [col]: [...prev[col], task.id],
        };
      });
    };

    const onTaskUpdated = (task: KanbanTask) => {
      console.log(`[Socket.IO Client] Event received: "taskUpdated"`, task);
      setTasks((prev) => ({ ...prev, [task.id]: task }));
      // Also sync column lists in case status changed from detail modal
      setColumns((prev) => {
        const newStatus = task.status || "todo";
        const oldStatus = findColumnForTask(task.id, prev);

        if (oldStatus === newStatus) return prev;

        const next = { ...prev };
        if (oldStatus) {
          next[oldStatus] = next[oldStatus].filter((id) => id !== task.id);
        }
        if (!next[newStatus].includes(task.id)) {
          next[newStatus] = [...next[newStatus], task.id];
        }
        return next;
      });
    };

    const onTaskMoved = (task: KanbanTask) => {
      console.log(`[Socket.IO Client] Event received: "taskMoved"`, task);
      setTasks((prev) => ({ ...prev, [task.id]: task }));
      setColumns((prev) => {
        const newStatus = task.status || "todo";
        const oldStatus = findColumnForTask(task.id, prev);

        if (oldStatus === newStatus) return prev;

        const next = { ...prev };
        if (oldStatus) {
          next[oldStatus] = next[oldStatus].filter((id) => id !== task.id);
        }
        if (!next[newStatus].includes(task.id)) {
          next[newStatus] = [...next[newStatus], task.id];
        }
        return next;
      });
    };

    const onTaskDeleted = ({ taskId }: { taskId: string }) => {
      console.log(`[Socket.IO Client] Event received: "taskDeleted"`, { taskId });
      setTasks((prev) => {
        const next = { ...prev };
        delete next[taskId];
        return next;
      });
      setColumns((prev) => {
        const next = { ...prev };
        for (const col of KANBAN_COLUMN_IDS) {
          if (next[col].includes(taskId)) {
            next[col] = next[col].filter((id) => id !== taskId);
          }
        }
        return next;
      });
    };

    socket.on("taskCreated", onTaskCreated);
    socket.on("taskUpdated", onTaskUpdated);
    socket.on("taskMoved", onTaskMoved);
    socket.on("taskDeleted", onTaskDeleted);

    return () => {
      socket.off("taskCreated", onTaskCreated);
      socket.off("taskUpdated", onTaskUpdated);
      socket.off("taskMoved", onTaskMoved);
      socket.off("taskDeleted", onTaskDeleted);
    };
  }, [socket]);

  const activeTask = activeId ? tasks[activeId] : null;

  function onDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeTaskId = String(active.id);
    const overId = String(over.id);

    if (activeTaskId === overId) return;

    const activeColumn = findColumnForTask(activeTaskId, columns);
    const overColumn = resolveOverColumn(overId, columns);

    if (!activeColumn || !overColumn) return;

    setColumns((prev) => {
      if (activeColumn === overColumn) {
        const list = prev[activeColumn];
        const activeIndex = list.indexOf(activeTaskId);
        if (activeIndex < 0) return prev;

        if (isColumnId(overId)) return prev;

        const overIndex = list.indexOf(overId);
        if (overIndex < 0) return prev;

        return {
          ...prev,
          [activeColumn]: arrayMove(list, activeIndex, overIndex),
        };
      }

      const from = [...prev[activeColumn]];
      const to = [...prev[overColumn]];
      const fromIndex = from.indexOf(activeTaskId);
      if (fromIndex < 0) return prev;

      const [moved] = from.splice(fromIndex, 1);

      if (isColumnId(overId)) {
        to.push(moved);
      } else {
        const overIndex = to.indexOf(overId);
        const insertAt = overIndex < 0 ? to.length : overIndex;
        to.splice(insertAt, 0, moved);
      }

      return {
        ...prev,
        [activeColumn]: from,
        [overColumn]: to,
      };
    });

    // Persist status change to backend
    if (activeColumn !== overColumn) {
      const activeIndex = columns[activeColumn].indexOf(activeTaskId);

      setTasks((prev) => {
        const existing = prev[activeTaskId];
        if (!existing) return prev;
        return {
          ...prev,
          [activeTaskId]: {
            ...existing,
            status: overColumn,
          },
        };
      });

      apiClient(`/api/tasks/${activeTaskId}`, {
        method: "PATCH",
        body: { status: overColumn },
      }).catch((err) => {
        console.error("Failed to persist task status change:", err);
        setTasks((prev) => {
          const existing = prev[activeTaskId];
          if (!existing) return prev;
          return {
            ...prev,
            [activeTaskId]: {
              ...existing,
              status: activeColumn,
            },
          };
        });

        setColumns((prev) => {
          const next: Record<KanbanColumnId, string[]> = { ...prev };
          for (const col of KANBAN_COLUMN_IDS) {
            if (next[col].includes(activeTaskId)) {
              next[col] = next[col].filter((id) => id !== activeTaskId);
            }
          }

          const list = [...next[activeColumn]];
          const insertAt = activeIndex < 0 ? list.length : Math.min(activeIndex, list.length);
          list.splice(insertAt, 0, activeTaskId);

          return {
            ...next,
            [activeColumn]: list,
          };
        });
      });
    }
  }

  function onDragCancel() {
    setActiveId(null);
  }

  const handleOpenAddTask = (status: string) => {
    setCreateTaskStatus(status);
    setIsCreateOpen(true);
  };

  const handleOpenTaskDetails = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  if (projectsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
        <p className="text-sm text-muted-foreground">Loading projects...</p>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-20 rounded-xl border border-border/30 bg-card/10 space-y-4">
        <FolderKanban className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
        <div className="space-y-1 max-w-sm mx-auto">
          <h3 className="font-bold text-md text-foreground">No Projects Found</h3>
          <p className="text-xs text-muted-foreground">
            You must create a project in this workspace before you can add collaborative task boards.
          </p>
        </div>
        <Link
          href="/dashboard/projects"
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-indigo-500 hover:shadow-indigo-600/20 active:scale-95 transition-all w-fit cursor-pointer"
        >
          Go to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Realtime toolbar with project selection */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between rounded-lg border bg-card/30 p-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0">
            Selected Project:
          </span>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground focus:outline-none"
          >
            {projects.map((p) => (
              <option key={p._id || p.id} value={p._id || p.id}>
                {p.title || p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-yellow-500"}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {isConnected ? "Realtime Live Sync" : "Connecting..."}
            </span>
          </div>

          <button
            onClick={() => handleOpenAddTask("todo")}
            className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 cursor-pointer shadow-sm transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Task
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
          <p className="text-sm text-muted-foreground">Loading tasks...</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragCancel={onDragCancel}
        >
          <div className="flex flex-row overflow-x-auto gap-4 min-h-[min(70vh,720px)] pb-4 select-none">
            {KANBAN_COLUMN_IDS.map((columnId) => (
              <div key={columnId} className="w-[280px] sm:w-[320px] lg:flex-1 shrink-0 flex flex-col min-w-0">
                <KanbanColumn
                  columnId={columnId}
                  taskIds={columns[columnId] || []}
                  tasks={tasks}
                  onTaskClick={handleOpenTaskDetails}
                  onAddTaskClick={handleOpenAddTask}
                />
              </div>
            ))}
          </div>

          <DragOverlay dropAnimation={dropAnimation}>
            {activeTask ? (
              <div className="max-w-[280px] rotate-2 cursor-grabbing opacity-95 shadow-xl">
                <KanbanTaskCard task={activeTask} isOverlay />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Create Task Modal */}
      {workspaceId && selectedProjectId && (
        <CreateTaskModal
          isOpen={isCreateOpen}
          onClose={setIsCreateOpen}
          workspaceId={workspaceId}
          projectId={selectedProjectId}
          defaultStatus={createTaskStatus}
          members={workspaceMembers}
        />
      )}

      {/* Task Details Modal */}
      {selectedTaskId && (
        <TaskDetailsModal
          isOpen={!!selectedTaskId}
          onClose={(open) => {
            if (!open) {
              setSelectedTaskId(null);
            }
          }}
          taskId={selectedTaskId}
          members={workspaceMembers}
          onDeleteSuccess={fetchTasks}
        />
      )}
    </div>
  );
}
