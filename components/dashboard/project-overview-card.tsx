"use client";

import Link from "next/link";
import { Calendar, CheckCircle2, CircleDot, PlayCircle, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DashboardProject {
  id: string;
  title: string;
  description: string;
  progress: number;
  status: "planning" | "active" | "paused" | "completed" | "archived";
  deadline: string;
  members: Array<{
    id: string;
    name: string;
    initials: string;
    avatarUrl?: string;
  }>;
  accentColor: string;
}

interface ProjectOverviewCardProps extends DashboardProject {
  className?: string;
}

export function ProjectOverviewCard({
  id,
  title,
  description,
  progress,
  status,
  deadline,
  members,
  accentColor,
  className,
}: ProjectOverviewCardProps) {
  return (
    <Link
      href={`/dashboard/projects?focus=${id}`}
      className={cn(
        "group relative block overflow-hidden rounded-xl border border-border/50 bg-linear-to-br from-card/40 to-card/10 p-5 transition-all duration-300 hover:border-border hover:bg-card/50 hover:shadow-lg hover:shadow-black/30",
        className
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-linear-to-br blur-3xl opacity-30 transition-opacity duration-300 group-hover:opacity-50",
          accentColor
        )}
      />

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-base">
            {title}
          </h3>
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground pr-4">
            {description}
          </p>
        </div>

        <span
          className={cn(
            "flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border",
            status === "planning" && "bg-purple-500/10 text-purple-400 border-purple-500/20",
            status === "active" && "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
            status === "paused" && "bg-amber-500/10 text-amber-400 border-amber-500/20",
            status === "completed" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
            status === "archived" && "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
          )}
        >
          {status === "planning" && <Circle className="h-2.5 w-2.5" />}
          {status === "active" && <CircleDot className="h-2.5 w-2.5 animate-pulse" />}
          {status === "paused" && <PlayCircle className="h-2.5 w-2.5" />}
          {status === "completed" && <CheckCircle2 className="h-2.5 w-2.5" />}
          {status}
        </span>
      </div>

      <div className="mt-6 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-medium flex items-center gap-1">
            Progress
          </span>
          <span className="font-mono font-semibold text-foreground">{progress}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted/50 overflow-hidden">
          <div
            className="h-full rounded-full bg-linear-to-r from-primary to-indigo-400 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-border/40 pt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          <span>Due {deadline}</span>
        </div>

        <div className="flex items-center">
          <div className="flex -space-x-1.5 overflow-hidden">
            {members.map((member) => (
              <div
                key={member.id}
                title={member.name}
                className="inline-flex h-6 w-6 select-none items-center justify-center rounded-full border border-card bg-accent text-[9px] font-bold text-foreground ring-1 ring-border/30 hover:scale-110 hover:z-10 transition-transform cursor-help"
              >
                {member.initials}
              </div>
            ))}
          </div>
          {members.length > 0 && (
            <span className="ml-2 text-[10px] text-muted-foreground" title={`${members.length} team members`}>
              ({members.length})
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function ProjectOverviewCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/40 bg-card/20 p-5 space-y-5 animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="h-5 w-1/2 rounded bg-muted/60" />
          <div className="h-3 w-5/6 rounded bg-muted/60" />
          <div className="h-3 w-4/6 rounded bg-muted/60" />
        </div>
        <div className="h-5 w-16 rounded-full bg-muted/60" />
      </div>
      <div className="space-y-2 pt-2">
        <div className="flex justify-between">
          <div className="h-3 w-12 rounded bg-muted/60" />
          <div className="h-3 w-8 rounded bg-muted/60" />
        </div>
        <div className="h-2 w-full rounded-full bg-muted/60" />
      </div>
      <div className="flex items-center justify-between pt-2">
        <div className="h-4 w-28 rounded bg-muted/60" />
        <div className="flex -space-x-1.5">
          <div className="h-6 w-6 rounded-full bg-muted/60" />
          <div className="h-6 w-6 rounded-full bg-muted/60" />
          <div className="h-6 w-6 rounded-full bg-muted/60" />
        </div>
      </div>
    </div>
  );
}
