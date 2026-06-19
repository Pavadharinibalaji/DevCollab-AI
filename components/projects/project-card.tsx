"use client";

import Link from "next/link";
import { Calendar, CircleDot, PlayCircle, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  progress: number;
  priority: "low" | "medium" | "high" | "urgent";
  status: "planning" | "active" | "paused" | "completed" | "archived";
  dueDate: string;
  members: Array<{
    id: string;
    name: string;
    initials: string;
    role: string;
    avatarColor?: string;
  }>;
}

interface ProjectCardProps {
  project: ProjectItem;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const { id, title, description, progress, priority, status, dueDate, members } = project;

  // Status mapping
  const statusStyles = {
    planning: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    active: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    paused: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    archived: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  };

  const statusIcons = {
    planning: <Circle className="h-3 w-3" />,
    active: <CircleDot className="h-3 w-3 animate-pulse" />,
    paused: <PlayCircle className="h-3 w-3" />,
    completed: <CheckCircle2 className="h-3 w-3" />,
    archived: <Circle className="h-3 w-3 opacity-60" />,
  };

  // Priority mapping
  const priorityStyles = {
    low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    medium: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    high: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    urgent: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  };

  return (
    <Link
      href={`/dashboard/projects/${id}`}
      className="group relative block overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-card/60 to-card/20 p-5 transition-all duration-300 hover:border-indigo-500/40 hover:bg-card/80 hover:shadow-xl hover:shadow-black/40"
    >
      {/* Glow effect on hover */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-32 w-32 rounded-full bg-indigo-500/5 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5 flex-1">
          <h3 className="font-bold text-foreground text-lg group-hover:text-indigo-400 transition-colors">
            {title}
          </h3>
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground pr-3">
            {description}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border", statusStyles[status])}>
            {statusIcons[status]}
            {status}
          </span>
          <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider border", priorityStyles[priority])}>
            {priority}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-6 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-medium">Progress</span>
          <span className="font-mono font-semibold text-foreground">{progress}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted/40 overflow-hidden border border-border/10">
          <div
            className={cn(
              "h-full rounded-full bg-gradient-to-r transition-all duration-500 ease-out",
              status === "completed" ? "from-emerald-500 to-teal-400" : "from-indigo-500 to-indigo-400"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-5 flex items-center justify-between border-t border-border/30 pt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-indigo-400" />
          <span>Due {new Date(dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
        </div>

        {/* Member Avatar Stack */}
        <div className="flex items-center">
          <div className="flex -space-x-1.5 overflow-hidden">
            {members.map((member) => (
              <div
                key={member.id}
                title={`${member.name} - ${member.role}`}
                className={cn(
                  "inline-flex h-6 w-6 select-none items-center justify-center rounded-full border border-card text-[9px] font-bold ring-1 ring-border/30 hover:scale-110 hover:z-10 transition-all cursor-pointer",
                  member.avatarColor || "bg-indigo-600 text-white"
                )}
              >
                {member.initials}
              </div>
            ))}
          </div>
          {members.length > 0 && (
            <span className="ml-2 text-[10px] text-muted-foreground font-medium">
              ({members.length})
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
