"use client";

import { CheckCircle2, FolderKanban, Users, ShieldAlert, GitCommit } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ActivityItem {
  id: string;
  user: {
    name: string;
    initials: string;
    avatarUrl?: string;
  };
  action: string;
  target: string;
  projectName?: string;
  timestamp: string;
  type: "task" | "project" | "team" | "system";
}

const iconMap = {
  task: CheckCircle2,
  project: FolderKanban,
  team: Users,
  system: ShieldAlert,
};

const colorMap = {
  task: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  project: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  team: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  system: "text-rose-400 bg-rose-500/10 border-rose-500/20",
};

interface ActivityFeedProps {
  activities: ActivityItem[];
  className?: string;
}

export function ActivityFeed({ activities, className }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center space-y-2 border border-dashed border-border/40 rounded-xl bg-card/5">
        <GitCommit className="h-5 w-5 text-muted-foreground animate-pulse" />
        <p className="text-xs text-muted-foreground">No recent activity found. Action logs will appear here as your team works.</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="relative pl-6 space-y-6 before:absolute before:left-2.75 before:top-2 before:bottom-2 before:w-px before:bg-border/50">
        {activities.map((activity) => {
          const Icon = iconMap[activity.type] || GitCommit;
          const iconColorClass = colorMap[activity.type] || "text-muted-foreground bg-muted";

          return (
            <div key={activity.id} className="relative group/item">
              <div
                className={cn(
                  "absolute -left-6.75 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border bg-background text-[10px] transition-transform duration-200 group-hover/item:scale-110",
                  iconColorClass
                )}
              >
                <Icon className="h-3 w-3" />
              </div>

              <div className="flex flex-col space-y-1 rounded-lg border border-border/20 bg-card/10 p-3 transition-colors hover:border-border/40 hover:bg-card/20">
                <div className="flex items-start justify-between gap-4">
                  <div className="text-xs text-foreground font-medium">
                    <span className="font-semibold text-foreground hover:text-primary cursor-pointer">
                      {activity.user.name}
                    </span>{" "}
                    <span className="text-muted-foreground">{activity.action}</span>{" "}
                    <span className="font-semibold text-foreground hover:underline cursor-pointer">
                      {activity.target}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono shrink-0 pt-0.5">
                    {activity.timestamp}
                  </span>
                </div>

                {activity.projectName && (
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/60" />
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                      {activity.projectName}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ActivityFeedSkeleton() {
  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.75 before:top-2 before:bottom-2 before:w-px before:bg-border/40 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="relative">
          <div className="absolute -left-6.75 top-1.5 h-6 w-6 rounded-full border border-border/40 bg-muted/40" />
          <div className="space-y-2 rounded-lg border border-border/20 bg-card/5 p-3">
            <div className="flex justify-between items-center">
              <div className="h-3 w-40 rounded bg-muted/60" />
              <div className="h-3 w-8 rounded bg-muted/60" />
            </div>
            <div className="h-3.5 w-24 rounded bg-muted/60" />
          </div>
        </div>
      ))}
    </div>
  );
}
