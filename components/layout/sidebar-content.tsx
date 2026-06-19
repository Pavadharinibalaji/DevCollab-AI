"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  ChevronDown,
  Columns3,
  FolderKanban,
  LayoutDashboard,
  Plus,
  Settings,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { appConfig, dashboardNav } from "@/lib/constants";
import { workspaceService } from "@/services/workspace.service";

const iconMap: Record<string, LucideIcon> = {
  "layout-dashboard": LayoutDashboard,
  columns: Columns3,
  "folder-kanban": FolderKanban,
  users: Users,
  settings: Settings,
};

function navLinkActive(href: string, pathname: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

type SidebarContentProps = {
  onNavigate?: () => void;
  className?: string;
};

export function SidebarContent({ onNavigate, className }: SidebarContentProps) {
  const pathname = usePathname();
  const [workspace, setWorkspace] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    fetch("/api/workspace")
      .then((res) => res.json())
      .then((data) => {
        if (data.workspace) setWorkspace(data.workspace);
        if (data.metrics) setMetrics(data.metrics);
      })
      .catch((err) => console.error("Error fetching workspace details:", err));

    workspaceService.list()
      .then((list) => setWorkspaces(list))
      .catch((err) => console.error("Error listing workspaces:", err));
  }, []);

  const handleSwitchWorkspace = async (id: string) => {
    try {
      await workspaceService.switchWorkspace(id);
      window.location.reload();
    } catch (err) {
      console.error("Failed to switch workspace:", err);
    }
  };

  return (
    <div className={cn("flex h-full min-h-0 flex-1 flex-col", className)}>
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border/60 px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Sparkles className="h-4 w-4" aria-hidden />
        </div>
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="truncate text-[15px] font-semibold tracking-tight text-foreground"
        >
          {appConfig.name}
        </Link>
      </div>

      <div className="relative border-b border-border/60 p-3">
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex w-full items-center gap-3 rounded-lg border border-border/60 bg-card/50 px-3 py-2.5 text-left transition-colors hover:bg-accent/80 cursor-pointer"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Building2 className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{workspace?.name || "Loading..."}</p>
            <p className="truncate text-xs text-muted-foreground">
              Free plan · {metrics?.totalMembers ?? 1} {metrics?.totalMembers === 1 ? "member" : "members"}
            </p>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        </button>

        {dropdownOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
            <div className="absolute left-3 right-3 top-full z-20 mt-1 rounded-lg border border-border/60 bg-zinc-950 p-1.5 shadow-xl animate-in fade-in slide-in-from-top-1 duration-150">
              <p className="px-2.5 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Switch Workspace
              </p>
              <div className="max-h-40 overflow-y-auto mt-1 space-y-0.5">
                {workspaces.map((ws) => (
                  <button
                    key={ws._id}
                    onClick={() => {
                      setDropdownOpen(false);
                      handleSwitchWorkspace(ws._id);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-accent cursor-pointer",
                      ws._id === workspace?._id ? "text-indigo-400 bg-indigo-500/5 font-semibold" : "text-foreground"
                    )}
                  >
                    <Building2 className="h-3.5 w-3.5 opacity-70" />
                    <span className="truncate">{ws.name}</span>
                  </button>
                ))}
              </div>
              <div className="border-t border-border/60 mt-1.5 pt-1">
                <Link
                  href="/onboarding"
                  onClick={() => setDropdownOpen(false)}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs text-indigo-400 hover:bg-accent font-semibold transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create workspace
                </Link>
              </div>
            </div>
          </>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3" aria-label="Main">
        <p className="mb-1 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Workspace
        </p>
        {dashboardNav.map((item) => {
          const Icon = iconMap[item.icon] ?? LayoutDashboard;
          const active = navLinkActive(item.href, pathname ?? "");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
                active
                  ? "bg-accent text-foreground shadow-sm ring-1 ring-border/80"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  active ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                )}
                aria-hidden
              />
              {item.title}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-border/60 p-3">
        <Link href="/dashboard/projects" onClick={onNavigate}>
          <Button
            variant="secondary"
            size="sm"
            className="w-full justify-center gap-2 border border-border/60 bg-card/40 text-foreground hover:bg-accent"
          >
            <Plus className="h-4 w-4" aria-hidden />
            New project
          </Button>
        </Link>
      </div>
    </div>
  );
}
