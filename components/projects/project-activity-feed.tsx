"use client";

import { GitPullRequest, CheckCircle2, Pause, CircleDot, User } from "lucide-react";

export interface ProjectActivityItem {
  id: string;
  user: {
    name: string;
    initials: string;
    avatarUrl?: string;
  };
  action: string;
  target: string;
  timestamp: string;
}

interface ProjectActivityFeedProps {
  activities: ProjectActivityItem[];
}

export function ProjectActivityFeed({ activities }: ProjectActivityFeedProps) {
  const getActivityIcon = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes("complete")) {
      return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />;
    }
    if (act.includes("started") || act.includes("created")) {
      return <CircleDot className="h-3.5 w-3.5 text-indigo-400" />;
    }
    if (act.includes("paused")) {
      return <Pause className="h-3.5 w-3.5 text-amber-400" />;
    }
    if (act.includes("code") || act.includes("push") || act.includes("commit")) {
      return <GitPullRequest className="h-3.5 w-3.5 text-sky-400" />;
    }
    return <User className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-10 rounded-xl border border-border/30 bg-card/10">
        <p className="text-sm text-muted-foreground">No recent activity logged for this project.</p>
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {activities.map((act, actIdx) => (
          <li key={act.id}>
            <div className="relative pb-8">
              {actIdx !== activities.length - 1 ? (
                <span
                  className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-border/20"
                  aria-hidden="true"
                />
              ) : null}

              <div className="relative flex space-x-3">
                <div>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/60 border border-border/40 select-none">
                    {getActivityIcon(act.action)}
                  </span>
                </div>

                <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-bold text-foreground mr-1">
                        {act.user.name}
                      </span>
                      {act.action}
                      <span className="font-semibold text-indigo-400 hover:underline cursor-pointer ml-1">
                        {act.target}
                      </span>
                    </p>
                  </div>
                  <div className="text-right text-[10px] whitespace-nowrap text-muted-foreground font-mono">
                    <time>{act.timestamp}</time>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
