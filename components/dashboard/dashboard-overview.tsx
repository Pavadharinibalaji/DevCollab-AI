"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  PlusCircle,
  UserPlus,
  FolderKanban,
  Calendar,
  Sparkle,
  ArrowRight,
} from "lucide-react";

// Components
import {
  DashboardStatCard,
  DashboardStatCardSkeleton,
} from "./dashboard-stat-card";
import {
  ProjectOverviewCard,
  ProjectOverviewCardSkeleton,
} from "./project-overview-card";
import { ActivityFeed, ActivityFeedSkeleton } from "./activity-feed";
import dynamic from "next/dynamic";
import { ProductivityChartSkeleton } from "./productivity-chart";

const ProductivityChart = dynamic(
  () => import("./productivity-chart").then((mod) => mod.ProductivityChart),
  {
    loading: () => <ProductivityChartSkeleton />,
    ssr: false,
  }
);

// Dialog components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// Services & Sockets
import { useSocket } from "@/hooks/use-socket";
import { workspaceService, projectService, activityService } from "@/services";
import type { WorkspaceMetrics } from "@/services/workspace.service";

interface DashboardOverviewProps {
  userDisplayName?: string;
  userAvatarUrl?: string;
}

const ACCENT_GRADIENTS = [
  "from-violet-500/20 to-fuchsia-500/5",
  "from-sky-500/20 to-cyan-500/5",
  "from-emerald-500/20 to-teal-500/5",
  "from-amber-500/15 to-orange-500/5",
  "from-indigo-500/20 to-purple-500/5",
];

function formatTimeAgo(dateInput: any) {
  if (!dateInput) return "Just now";
  const date = new Date(dateInput);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function DashboardOverview({
  userDisplayName = "Developer",
}: DashboardOverviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<WorkspaceMetrics | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  const { socket } = useSocket({
    projectId: "global",
  });

  // Quick Action Dialog states
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  // Form states
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");

  const fetchDashboardData = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const [workspaceRes, projectsList, activitiesList] = await Promise.all([
        workspaceService.getWorkspaceWithMetrics(),
        projectService.list(),
        activityService.list(),
      ]);

      setMetrics(workspaceRes.metrics);
      setProjects(projectsList);

      const formattedActivities = activitiesList.map((a: any) => {
        const actionStr = a.action || "updated";
        const type = actionStr.includes("task")
          ? "task"
          : actionStr.includes("project")
          ? "project"
          : actionStr.includes("invite") || actionStr.includes("join") || actionStr.includes("member")
          ? "team"
          : "system";

        return {
          id: a._id || a.id,
          user: {
            name: a.user?.name || "System",
            initials: a.user?.initials || "SYS",
            avatarUrl: a.user?.avatarUrl,
          },
          action: actionStr,
          target: a.target || "",
          projectName: a.projectId ? "Project" : undefined,
          timestamp: formatTimeAgo(a.timestamp || a.createdAt),
          type,
        };
      });
      setActivities(formattedActivities);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(true);
  }, []);

  useEffect(() => {
    if (!socket) return;

    const onProjectCreated = (newProject: any) => {
      console.log("[Dashboard] Socket: projectCreated received", newProject);
      fetchDashboardData();
    };

    const onProjectUpdated = (updatedProject: any) => {
      console.log("[Dashboard] Socket: projectUpdated received", updatedProject);
      fetchDashboardData();
    };

    const onActivityCreated = (newActivity: any) => {
      console.log("[Dashboard] Socket: activityCreated received", newActivity);
      fetchDashboardData();
    };

    socket.on("projectCreated", onProjectCreated);
    socket.on("projectUpdated", onProjectUpdated);
    socket.on("activityCreated", onActivityCreated);

    return () => {
      socket.off("projectCreated", onProjectCreated);
      socket.off("projectUpdated", onProjectUpdated);
      socket.off("activityCreated", onActivityCreated);
    };
  }, [socket]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      await projectService.create({
        title: newProjectName,
        description: newProjectDesc || "Collaborative workspace project.",
        status: "active",
        user: { name: userDisplayName, initials: userDisplayName.slice(0, 2).toUpperCase() },
      });

      setNewProjectName("");
      setNewProjectDesc("");
      setIsNewProjectOpen(false);
    } catch (err) {
      console.error("Failed to create project:", err);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      await workspaceService.inviteMember(inviteEmail, inviteRole);
      setInviteEmail("");
      setIsInviteOpen(false);
      fetchDashboardData();
    } catch (err) {
      console.error("Failed to invite user:", err);
    }
  };



  const stats = [
    {
      label: "Active Projects",
      value: String(metrics?.activeProjects ?? 0),
      change: "In progress",
      trend: "stable" as const,
      iconName: "folder-kanban" as const,
      colorClass: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    },
    {
      label: "Tasks Completed",
      value: String(metrics?.tasksCompleted ?? 0),
      change: "Completed items",
      trend: "stable" as const,
      iconName: "check-circle" as const,
      colorClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      label: "Pending Tasks",
      value: String(metrics?.pendingTasks ?? 0),
      change: "Active backlog",
      trend: "stable" as const,
      iconName: "clock" as const,
      colorClass: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    {
      label: "Overdue Tasks",
      value: String(metrics?.overdueTasks ?? 0),
      change: metrics?.overdueTasks && metrics.overdueTasks > 0 ? "Requires action" : "All clean",
      trend: (metrics?.overdueTasks && metrics.overdueTasks > 0 ? "down" : "stable") as "up" | "down" | "stable",
      iconName: "alert-circle" as const,
      colorClass: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header and Welcome */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-border/20 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2">
            Overview
            <Sparkle className="h-5 w-5 text-indigo-400 fill-indigo-400 animate-pulse" />
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Hi, <span className="font-semibold text-foreground">{userDisplayName}</span>. Welcome back to your workspace.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-lg border border-border/30 w-fit">
          <Calendar className="h-3.5 w-3.5" />
          <span>{new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</span>
        </div>
      </div>

      {/* Analytics Stats Cards Grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <DashboardStatCardSkeleton key={i} />)
          : stats.map((stat) => (
              <DashboardStatCard key={stat.label} {...stat} />
            ))}
      </section>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Productivity Chart */}
          {isLoading ? (
            <ProductivityChartSkeleton />
          ) : (
            <ProductivityChart
              data={
                metrics?.velocity && metrics.velocity.length > 0
                  ? metrics.velocity
                  : Array.from({ length: 7 }, (_, i) => {
                      const d = new Date();
                      d.setDate(new Date().getDate() - (6 - i));
                      const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                      return {
                        name: daysOfWeek[d.getDay()],
                        completed: 0,
                        created: 0,
                      };
                    })
              }
            />
          )}

          {/* Projects Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                  Active Projects
                </h2>
                <p className="text-xs text-muted-foreground">
                  Manage goals and monitor progress
                </p>
              </div>
              <Link
                href="/dashboard/projects"
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:underline"
              >
                View all projects
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => <ProjectOverviewCardSkeleton key={i} />)}
              </div>
            ) : projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 border border-dashed border-border/40 rounded-xl bg-card/5">
                <FolderKanban className="h-8 w-8 text-muted-foreground opacity-60 animate-pulse" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">No projects created yet</p>
                  <p className="text-xs text-muted-foreground">
                    Get started by creating your first collaborative project.
                  </p>
                </div>
                <button
                  onClick={() => setIsNewProjectOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/10 hover:bg-indigo-500 hover:shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  Create Project
                </button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {projects.map((project, idx) => {
                  const mappedProj = {
                    id: project._id || project.id,
                    title: project.title || project.name || "Untitled Project",
                    description: project.description || "Collaborative dev workspace project.",
                    progress: project.progress || 0,
                    status: project.status || "active",
                    deadline: project.dueDate ? new Date(project.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "No deadline",
                    accentColor: project.accentColor || ACCENT_GRADIENTS[idx % ACCENT_GRADIENTS.length],
                    members: (project.members || []).map((m: any) => ({
                      id: m._id || m.id,
                      name: m.name || "Member",
                      initials: m.initials || "M",
                      avatarUrl: m.avatarUrl
                    }))
                  };
                  return (
                    <ProjectOverviewCard key={mappedProj.id} {...mappedProj} />
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Quick Actions & Activity Feed */}
        <div className="space-y-6">
          <div className="rounded-xl border border-border/50 bg-card/30 p-5 space-y-4">
            <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/dashboard/board"
                className="flex flex-col items-center justify-center p-4 rounded-lg bg-card border border-border/40 hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all text-center group"
              >
                <PlusCircle className="h-5 w-5 text-indigo-400 group-hover:scale-105 transition-transform" />
                <span className="text-xs font-semibold text-foreground mt-2">Create Task</span>
              </Link>
              <button
                onClick={() => setIsNewProjectOpen(true)}
                className="flex flex-col items-center justify-center p-4 rounded-lg bg-card border border-border/40 hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all text-center group cursor-pointer"
              >
                <FolderKanban className="h-5 w-5 text-emerald-400 group-hover:scale-105 transition-transform" />
                <span className="text-xs font-semibold text-foreground mt-2">New Project</span>
              </button>
              <button
                onClick={() => setIsInviteOpen(true)}
                className="flex flex-col items-center justify-center p-4 rounded-lg bg-card border border-border/40 hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all text-center group cursor-pointer col-span-2"
              >
                <UserPlus className="h-5 w-5 text-sky-400 group-hover:scale-105 transition-transform" />
                <span className="text-xs font-semibold text-foreground mt-2">Invite Team</span>
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-card/30 p-5 space-y-4">
            <div>
              <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider">
                Recent Activity
              </h3>
              <p className="text-[10px] text-muted-foreground">
                Live updates from your workspace
              </p>
            </div>

            {isLoading ? <ActivityFeedSkeleton /> : <ActivityFeed activities={activities} />}
          </div>
        </div>
      </div>

      {/* dialog / modals */}

      {/* New Project Dialog */}
      <Dialog open={isNewProjectOpen} onOpenChange={setIsNewProjectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Initialize a new collaborative development project in this workspace.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateProject} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label htmlFor="pname" className="text-xs font-semibold text-foreground">
                Project Name
              </label>
              <input
                id="pname"
                type="text"
                placeholder="e.g. Developer Portal Docs"
                required
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="pdesc" className="text-xs font-semibold text-foreground">
                Description
              </label>
              <textarea
                id="pdesc"
                placeholder="Explain the scope and targets of this project..."
                rows={3}
                value={newProjectDesc}
                onChange={(e) => setNewProjectDesc(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsNewProjectOpen(false)}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
              >
                Create Project
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Invite Member Dialog */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Collaborator</DialogTitle>
            <DialogDescription>
              Add developers or managers to collaborate in this workspace.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInviteUser} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-foreground">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="developer@example.com"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="role" className="text-xs font-semibold text-foreground">
                Workspace Role
              </label>
              <select
                id="role"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value="member">Member (Read & Write)</option>
                <option value="admin">Admin (Full Control)</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsInviteOpen(false)}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
              >
                Send Invitation
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>


    </div>
  );
}
