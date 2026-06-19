"use client";

import { FolderKanban, CheckCircle, Clock, Users, ArrowUpRight, ArrowDownRight, Minus, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DashboardStat {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down" | "stable";
  iconName: "folder-kanban" | "check-circle" | "clock" | "users" | "alert-circle";
  colorClass: string;
}

const iconMap = {
  "folder-kanban": FolderKanban,
  "check-circle": CheckCircle,
  "clock": Clock,
  "users": Users,
  "alert-circle": AlertCircle,
};

interface DashboardStatCardProps extends DashboardStat {
  className?: string;
}

export function DashboardStatCard({
  label,
  value,
  change,
  trend,
  iconName,
  colorClass,
  className,
}: DashboardStatCardProps) {
  const Icon = iconMap[iconName];

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border/50 bg-card/30 p-5 transition-all duration-300 hover:border-border hover:bg-card/50 hover:shadow-md hover:shadow-black/25",
        className
      )}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-primary/5 blur-2xl transition-all duration-300 group-hover:bg-primary/10" />

      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg border text-sm transition-transform duration-300 group-hover:scale-105",
            colorClass
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {value}
        </span>
        <span
          className={cn(
            "flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-md",
            trend === "up" && "bg-emerald-500/10 text-emerald-400",
            trend === "down" && "bg-rose-500/10 text-rose-400",
            trend === "stable" && "bg-muted text-muted-foreground"
          )}
        >
          {trend === "up" && <ArrowUpRight className="h-3 w-3" />}
          {trend === "down" && <ArrowDownRight className="h-3 w-3" />}
          {trend === "stable" && <Minus className="h-3 w-3" />}
          {change}
        </span>
      </div>
    </div>
  );
}

export function DashboardStatCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/40 bg-card/20 p-5 space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-4 w-24 rounded bg-muted/60" />
        <div className="h-9 w-9 rounded-lg bg-muted/60" />
      </div>
      <div className="flex items-baseline gap-2 pt-2">
        <div className="h-8 w-16 rounded bg-muted/60" />
        <div className="h-5 w-20 rounded bg-muted/60" />
      </div>
    </div>
  );
}
