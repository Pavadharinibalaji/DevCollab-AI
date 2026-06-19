"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  LayoutDashboard,
  CheckSquare,
  Users,
  History,
  Plus,
  PlusCircle,
  Calendar,
  Check,
  Briefcase,
  Loader2,
  Trash2,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProjectOverviewPanel } from "@/components/projects/project-overview-panel";
import { ProjectActivityFeed } from "@/components/projects/project-activity-feed";
import { projectService, userService } from "@/services";
import { useSocket } from "@/hooks/use-socket";
import { apiClient } from "@/lib/api-client";

type TabType = "overview" | "tasks" | "team" | "activity";

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params?.projectId as string;

  const [project, setProject] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [showAddTask, setShowAddTask] = useState(false);
  
  // Team invite state
  const [selectedInviteMemberId, setSelectedInviteMemberId] = useState("");

  // Delete project state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const router = useRouter();

  const handleDeleteProject = async () => {
    if (!project) return;
    if (deleteConfirmText !== project.title) {
      alert("Project title confirmation does not match.");
      return;
    }

    setIsDeleting(true);
    try {
      await projectService.delete(project.id);
      router.push("/dashboard/projects");
      router.refresh();
    } catch (err) {
      console.error("Failed to delete project:", err);
      alert("Failed to delete project. Please try again.");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const { socket } = useSocket({ projectId });

  const fetchProjectDetails = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const data = await projectService.getById(projectId);
      setProject(data);
    } catch (err) {
      console.error("Failed to load project details:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const users = await userService.list();
      setAllUsers(users || []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  // Load project and users on mount/id change
  useEffect(() => {
    if (projectId) {
      fetchProjectDetails(true);
      fetchUsers();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Handle socket.io realtime events
  useEffect(() => {
    if (!socket) return;

    const handleTaskEvent = () => {
      console.log("[Project Detail] Socket task event received, refreshing project details...");
      fetchProjectDetails();
    };

    const handleProjectUpdated = (updatedProj: any) => {
      console.log("[Project Detail] Socket projectUpdated received:", updatedProj);
      const updatedId = updatedProj.id || updatedProj._id;
      if (updatedId === projectId) {
        fetchProjectDetails();
      }
    };

    socket.on("taskCreated", handleTaskEvent);
    socket.on("taskUpdated", handleTaskEvent);
    socket.on("taskMoved", handleTaskEvent);
    socket.on("taskDeleted", handleTaskEvent);
    socket.on("projectUpdated", handleProjectUpdated);

    return () => {
      socket.off("taskCreated", handleTaskEvent);
      socket.off("taskUpdated", handleTaskEvent);
      socket.off("taskMoved", handleTaskEvent);
      socket.off("taskDeleted", handleTaskEvent);
      socket.off("projectUpdated", handleProjectUpdated);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, projectId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
        <p className="text-sm text-muted-foreground">Loading project details...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-muted-foreground">Loading workspace details or project not found...</p>
        <Link href="/dashboard/projects" className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:underline">
          <ArrowLeft className="h-4.5 w-4.5" />
          Back to Projects list
        </Link>
      </div>
    );
  }

  // Calculate stats
  const completedTasksCount = (project.tasks || []).filter((t: any) => t.status === "done").length;
  const totalTasksCount = (project.tasks || []).length;

  // Toggle task status (Done <-> Todo)
  const handleToggleTask = async (taskId: string) => {
    if (!project) return;
    const task = project.tasks.find((t: any) => t.id === taskId);
    if (!task) return;

    const newStatus = task.status === "done" ? "todo" : "done";

    try {
      // Optimistic update
      setProject((prev: any) => {
        if (!prev) return null;
        const updatedTasks = prev.tasks.map((t: any) =>
          t.id === taskId ? { ...t, status: newStatus as "todo" | "done" } : t
        );
        const total = updatedTasks.length;
        const completed = updatedTasks.filter((t: any) => t.status === "done").length;
        const newProgress = total > 0 ? Math.round((completed / total) * 100) : 0;
        return {
          ...prev,
          tasks: updatedTasks,
          progress: newProgress,
        };
      });

      // Call API
      await apiClient(`/api/tasks/${taskId}`, {
        method: "PATCH",
        body: { status: newStatus },
      });
    } catch (err) {
      console.error("Failed to toggle task status:", err);
      fetchProjectDetails();
    }
  };

  // Add task handler
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !newTaskDueDate || !project) return;

    try {
      const assigneeId = newTaskAssigneeId || undefined;
      
      await apiClient<{ task: any }>("/api/tasks", {
        method: "POST",
        body: {
          workspaceId: project.workspaceId || "65b1cd78385ff29402517e5a",
          projectId: project.id,
          title: newTaskTitle,
          status: "todo",
          priority: newTaskPriority,
          assigneeId,
          dueDate: newTaskDueDate,
        },
      });

      // Reset inputs
      setNewTaskTitle("");
      setNewTaskPriority("medium");
      setNewTaskDueDate("");
      setNewTaskAssigneeId("");
      setShowAddTask(false);
      
      fetchProjectDetails();
    } catch (err) {
      console.error("Failed to add task:", err);
    }
  };

  // Invite member handler
  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInviteMemberId || !project) return;

    // Check if already in project
    if (project.members.some((m: any) => m.id === selectedInviteMemberId)) {
      alert("Collaborator is already a team member of this project.");
      return;
    }

    const currentMemberIds = project.members.map((m: any) => m.id);
    const updatedMembers = [...currentMemberIds, selectedInviteMemberId];

    try {
      await projectService.update(project.id, {
        members: updatedMembers,
      });

      setSelectedInviteMemberId("");
      fetchProjectDetails();
    } catch (err) {
      console.error("Failed to add member to project:", err);
    }
  };

  // Priority badge coloring helper
  const taskPriorityStyles = {
    low: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
    medium: "text-sky-400 border-sky-500/20 bg-sky-500/5",
    high: "text-amber-400 border-amber-500/20 bg-amber-500/5",
    urgent: "text-rose-400 border-rose-500/20 bg-rose-500/5",
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/dashboard/projects" className="hover:text-foreground transition-colors">
          Projects
        </Link>
        <span>/</span>
        <span className="text-foreground font-semibold">{project.title}</span>
      </div>

      {/* Detail Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border/20 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
              {project.title}
            </h1>
          </div>
          <p className="text-xs text-muted-foreground font-mono">
            Project ID: <span className="text-indigo-400 font-semibold">{project.id}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Tab navigation */}
          <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/30 overflow-x-auto w-fit">
            <button
              onClick={() => setActiveTab("overview")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap",
                activeTab === "overview"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab("tasks")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap",
                activeTab === "tasks"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <CheckSquare className="h-3.5 w-3.5" />
              Tasks ({totalTasksCount})
            </button>
            <button
              onClick={() => setActiveTab("team")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap",
                activeTab === "team"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Users className="h-3.5 w-3.5" />
              Team ({(project.members || []).length})
            </button>
            <button
              onClick={() => setActiveTab("activity")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap",
                activeTab === "activity"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <History className="h-3.5 w-3.5" />
              Activity
            </button>
          </div>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600/10 border border-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-600 hover:text-white transition-all cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete Project
          </button>
        </div>
      </div>

      {/* Render Dynamic Tab Panels */}
      <div className="mt-4 transition-all duration-300">
        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <ProjectOverviewPanel project={project} />
        )}

        {/* Tab 2: Tasks Checklist */}
        {activeTab === "tasks" && (
          <div className="space-y-6 max-w-4xl">
            {/* Header control */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">
                  Project Tasks Checklist
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Completed {completedTasksCount} of {totalTasksCount} tasks ({project.progress}%)
                </p>
              </div>

              <button
                onClick={() => setShowAddTask(!showAddTask)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 bg-indigo-500/5 px-2.5 py-1.5 rounded-lg cursor-pointer hover:bg-indigo-500/10"
              >
                <PlusCircle className="h-4 w-4" />
                Add Project Task
              </button>
            </div>

            {/* Quick Inline Task Add Form */}
            {showAddTask && (
              <form onSubmit={handleAddTask} className="rounded-xl border border-border/40 bg-card/20 p-4 space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label htmlFor="tsk-title" className="text-[10px] font-semibold text-muted-foreground uppercase">Task Title</label>
                    <input
                      id="tsk-title"
                      type="text"
                      required
                      placeholder="e.g. Design WebSocket schemas"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="tsk-assign" className="text-[10px] font-semibold text-muted-foreground uppercase">Assignee</label>
                    <select
                      id="tsk-assign"
                      value={newTaskAssigneeId}
                      onChange={(e) => setNewTaskAssigneeId(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none"
                    >
                      <option value="">Select Assignee</option>
                      {(project.members || []).map((m: any) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label htmlFor="tsk-due" className="text-[10px] font-semibold text-muted-foreground uppercase">Due Date</label>
                    <input
                      id="tsk-due"
                      type="date"
                      required
                      value={newTaskDueDate}
                      onChange={(e) => setNewTaskDueDate(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="tsk-priority" className="text-[10px] font-semibold text-muted-foreground uppercase">Priority</label>
                    <select
                      id="tsk-priority"
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value as "low" | "medium" | "high" | "urgent")}
                      className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border/10">
                  <button
                    type="button"
                    onClick={() => setShowAddTask(false)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 cursor-pointer"
                  >
                    Add Task
                  </button>
                </div>
              </form>
            )}

            {/* Task list render */}
            {(project.tasks || []).length > 0 ? (
              <div className="rounded-xl border border-border/40 bg-card/10 overflow-hidden divide-y divide-border/20">
                {(project.tasks || []).map((task: any) => {
                  const isDone = task.status === "done";
                  const assignee = task.assignee || { id: "unassigned", name: "Unassigned", initials: "U", role: "Unassigned", avatarColor: "bg-muted text-muted-foreground" };
                  return (
                    <div
                      key={task.id}
                      className={cn(
                        "flex items-center justify-between p-4 transition-colors",
                        isDone ? "bg-muted/5 opacity-70" : "hover:bg-muted/10"
                      )}
                    >
                      {/* Left side: checkbox and title */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggleTask(task.id)}
                          className={cn(
                            "flex h-4.5 w-4.5 items-center justify-center rounded border transition-all cursor-pointer",
                            isDone
                              ? "bg-indigo-600 border-indigo-600 text-white"
                              : "border-border hover:border-indigo-500/50"
                          )}
                        >
                          {isDone && <Check className="h-3 w-3 stroke-[3]" />}
                        </button>
                        <span className={cn("text-sm font-medium", isDone ? "line-through text-muted-foreground" : "text-foreground")}>
                          {task.title}
                        </span>
                      </div>

                      {/* Right side details */}
                      <div className="flex items-center gap-3 shrink-0">
                        {/* Priority */}
                        <span className={cn("text-[9px] font-bold border px-1.5 py-0.5 rounded-full uppercase tracking-wider", taskPriorityStyles[task.priority as keyof typeof taskPriorityStyles] || taskPriorityStyles.medium)}>
                          {task.priority}
                        </span>

                        {/* Assignee */}
                        <div
                          title={`${assignee.name} - ${assignee.role}`}
                          className={cn("h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold border border-border/30 cursor-pointer", assignee.avatarColor || "bg-indigo-500 text-indigo-100")}
                        >
                          {assignee.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={assignee.avatarUrl} alt={assignee.name} className="h-full w-full rounded-full object-cover" />
                          ) : (
                            assignee.initials
                          )}
                        </div>

                        {/* Due date */}
                        <span className="text-[10px] text-muted-foreground font-mono hidden sm:inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "No due date"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 rounded-xl border border-border/30 bg-card/10">
                <p className="text-xs text-muted-foreground">No tasks defined for this project yet. Add one above to begin.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Team Section */}
        {activeTab === "team" && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">
                  Project Collaborators
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Developers and leads assigned to {project.title}
                </p>
              </div>

              {/* Add Member form */}
              <form onSubmit={handleInviteMember} className="flex items-center gap-2 shrink-0">
                <select
                  value={selectedInviteMemberId}
                  onChange={(e) => setSelectedInviteMemberId(e.target.value)}
                  className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground focus:outline-none"
                  required
                >
                  <option value="">Choose Developer</option>
                  {allUsers
                    .filter((u) => !project.members.some((pm: any) => pm.id === u._id || pm.id === u.id))
                    .map((u) => (
                      <option key={u._id || u.id} value={u._id || u.id}>{u.name}</option>
                    ))}
                </select>
                <button
                  type="submit"
                  disabled={!selectedInviteMemberId}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 px-3 py-1.5 rounded-lg cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </button>
              </form>
            </div>

            {/* Team Grid */}
            {(project.members || []).length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {(project.members || []).map((member: any) => (
                  <div key={member.id} className="rounded-xl border border-border/40 bg-card/25 p-4 flex items-center gap-3">
                    <div className={cn("h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-sm border border-border/10 overflow-hidden", member.avatarColor || "bg-indigo-500 text-indigo-100")}>
                      {member.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={member.avatarUrl} alt={member.name} className="h-full w-full object-cover" />
                      ) : (
                        member.initials
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-foreground text-sm truncate">{member.name}</h4>
                      <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                        <Briefcase className="h-3 w-3 text-indigo-400" />
                        {member.role || "Developer"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 rounded-xl border border-border/30 bg-card/10">
                <p className="text-xs text-muted-foreground">No collaborators assigned to this project yet.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Activity logs */}
        {activeTab === "activity" && (
          <div className="max-w-xl space-y-4">
            <div>
              <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">
                Workspace Log History
              </h3>
              <p className="text-[11px] text-muted-foreground mb-4">
                Chronological list of updates made to this project
              </p>
            </div>

            <ProjectActivityFeed activities={project.activities || []} />
          </div>
        )}
      </div>

      {/* Project Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-rose-500/30 bg-zinc-950 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 text-rose-400">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <h3 className="font-bold text-md text-foreground">Delete Project?</h3>
            </div>
            
            <p className="text-xs text-muted-foreground leading-relaxed">
              This will permanently delete the project <span className="font-bold text-foreground">&quot;{project.title}&quot;</span> 
              and all of its associated tasks and activities. This action is irreversible.
            </p>

            <div className="space-y-2 bg-rose-500/5 p-3 rounded-lg border border-rose-500/10">
              <p className="text-[11px] text-muted-foreground font-semibold">
                Please type <span className="text-foreground font-mono select-all">&quot;{project.title}&quot;</span> to confirm:
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={project.title}
                className="w-full rounded-lg border border-rose-500/30 bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText("");
                }}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-zinc-800 text-muted-foreground hover:bg-zinc-700 hover:text-foreground transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmText !== project.title || isDeleting}
                onClick={handleDeleteProject}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-all cursor-pointer flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isDeleting && <Loader2 className="h-3 w-3 animate-spin" />}
                Yes, delete project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
