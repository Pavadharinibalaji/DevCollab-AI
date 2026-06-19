"use client";

import { Calendar, CircleDot, PlayCircle, CheckCircle2, Circle, AlertCircle, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProjectDetail {
  id: string;
  title: string;
  description: string;
  progress: number;
  priority: "low" | "medium" | "high" | "urgent";
  status: "planning" | "active" | "paused" | "completed" | "archived";
  dueDate: string;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate: string;
  }>;
}

interface ProjectOverviewPanelProps {
  project: ProjectDetail;
}

export function ProjectOverviewPanel({ project }: ProjectOverviewPanelProps) {
  const { description, progress, priority, status, dueDate, tasks } = project;

  // Task stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "done").length;
  const inReviewTasks = tasks.filter((t) => t.status === "in-review").length;
  const activeTasks = tasks.filter((t) => t.status === "in-progress").length;
  const todoTasks = tasks.filter((t) => t.status === "todo").length;

  // Priority mapping
  const priorityStyles = {
    low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    medium: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    high: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    urgent: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  };

  // Status mapping
  const statusStyles = {
    planning: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    active: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    paused: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    archived: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Description & Key Details */}
      <div className="md:col-span-2 space-y-6">
        <div className="rounded-xl border border-border/40 bg-card/25 p-6 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Project Description
            </h3>
            <p className="text-foreground text-sm leading-relaxed mt-2 whitespace-pre-wrap">
              {description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-border/20 pt-4">
            <div>
              <span className="text-xs text-muted-foreground block">Project Status</span>
              <span className={cn("inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider mt-1 border px-2 py-0.5 rounded-full", statusStyles[status])}>
                {status === "planning" && <Circle className="h-2.5 w-2.5" />}
                {status === "active" && <CircleDot className="h-2.5 w-2.5 animate-pulse" />}
                {status === "paused" && <PlayCircle className="h-2.5 w-2.5" />}
                {status === "completed" && <CheckCircle2 className="h-2.5 w-2.5" />}
                {status === "archived" && <Circle className="h-2.5 w-2.5 opacity-65" />}
                {status}
              </span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Project Priority</span>
              <span className={cn("inline-flex text-xs font-bold uppercase tracking-wider mt-1 border px-2 py-0.5 rounded-full", priorityStyles[priority])}>
                {priority}
              </span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Target Completion Date</span>
              <span className="flex items-center gap-1.5 text-xs text-foreground mt-1 font-medium">
                <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                {dueDate ? new Date(dueDate).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }) : "No deadline"}
              </span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Workspace Progress</span>
              <span className="text-xs text-foreground font-mono font-bold mt-1 block">
                {progress}% complete
              </span>
            </div>
          </div>
        </div>

        {/* Task progress cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl border border-border/30 bg-card/10 text-center">
            <span className="text-2xl font-bold text-foreground block font-mono">{totalTasks}</span>
            <span className="text-[10px] text-muted-foreground uppercase font-semibold">Total Tasks</span>
          </div>
          <div className="p-4 rounded-xl border border-border/30 bg-card/10 text-center">
            <span className="text-2xl font-bold text-emerald-400 block font-mono">{completedTasks}</span>
            <span className="text-[10px] text-muted-foreground uppercase font-semibold">Completed</span>
          </div>
          <div className="p-4 rounded-xl border border-border/30 bg-card/10 text-center">
            <span className="text-2xl font-bold text-indigo-400 block font-mono">{activeTasks}</span>
            <span className="text-[10px] text-muted-foreground uppercase font-semibold">In Progress</span>
          </div>
          <div className="p-4 rounded-xl border border-border/30 bg-card/10 text-center">
            <span className="text-2xl font-bold text-amber-400 block font-mono">{inReviewTasks + todoTasks}</span>
            <span className="text-[10px] text-muted-foreground uppercase font-semibold">Remaining</span>
          </div>
        </div>
      </div>

      {/* Right Column: Health Status Cards */}
      <div className="space-y-4">
        {/* Project Health Index */}
        <div className="rounded-xl border border-border/40 bg-card/25 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-indigo-400" />
            Project Health
          </h3>
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Task Completion Rate</span>
              <span className="text-xs text-foreground font-semibold font-mono">
                {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Urgent Issues Pending</span>
              <span className={cn("text-xs font-semibold font-mono", tasks.some((t) => t.priority === "urgent" && t.status !== "done") ? "text-rose-400" : "text-foreground")}>
                {tasks.filter((t) => t.priority === "urgent" && t.status !== "done").length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Review Milestones</span>
              <span className="text-xs text-foreground font-semibold font-mono">{inReviewTasks} ready</span>
            </div>
          </div>
        </div>

        {/* Milestone Warnings */}
        {tasks.some((t) => t.status !== "done" && t.dueDate && new Date(t.dueDate) < new Date()) && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 flex gap-3 items-start">
            <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider">Overdue Items detected</h4>
              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                Some tasks in this project have passed their target dates without being marked as Completed.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
