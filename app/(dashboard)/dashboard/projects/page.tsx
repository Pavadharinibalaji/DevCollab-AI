"use client";

import { useState, useEffect } from "react";
import { Plus, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectFilters } from "@/components/projects/project-filters";
import { CreateProjectModal } from "@/components/projects/create-project-modal";
import { projectService } from "@/services";
import { useSocket } from "@/hooks/use-socket";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { socket } = useSocket({ projectId: "global" });

  const fetchProjects = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const list = await projectService.list();
      const formatted = list.map((p: any) => ({
        id: p._id || p.id,
        title: p.title || p.name || "Untitled Project",
        description: p.description || "Collaborative dev workspace project.",
        progress: p.progress || 0,
        priority: p.priority || "medium",
        status: p.status || "active",
        dueDate: p.dueDate ? new Date(p.dueDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        members: (p.members || []).map((m: any) => ({
          id: m._id || m.id,
          name: m.name || "Member",
          initials: m.name ? m.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) : "M",
          role: m.role || "Developer",
          avatarColor: "bg-indigo-600 text-indigo-100",
        })),
        tasks: p.tasks || [],
        activities: p.activities || [],
      }));
      setProjects(formatted);
    } catch (err) {
      console.error("Failed to load projects:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects(true);

    // Fetch workspace members for assignee mapping
    fetch("/api/workspace")
      .then((res) => res.json())
      .then((data) => {
        if (data.workspace) {
          const list = (data.workspace.members || []).map((m: any) => {
            const u = m.userId;
            if (!u) return null;
            return {
              id: u._id || u.id,
              name: u.name || "Member",
              initials: u.name ? u.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) : "M",
            };
          }).filter(Boolean);
          setMembers(list);
        }
      })
      .catch((err) => console.error("Error loading members for project creations:", err));
  }, []);

  useEffect(() => {
    if (!socket) return;

    const onProjectCreated = (newProject: any) => {
      console.log("[Projects] Socket projectCreated received:", newProject);
      fetchProjects();
    };

    const onProjectUpdated = (updatedProject: any) => {
      console.log("[Projects] Socket projectUpdated received:", updatedProject);
      fetchProjects();
    };

    socket.on("projectCreated", onProjectCreated);
    socket.on("projectUpdated", onProjectUpdated);

    return () => {
      socket.off("projectCreated", onProjectCreated);
      socket.off("projectUpdated", onProjectUpdated);
    };
  }, [socket]);

  const handleCreateProject = async (newProject: any) => {
    try {
      await projectService.create({
        title: newProject.title,
        description: newProject.description,
        status: newProject.status,
        priority: newProject.priority,
        dueDate: newProject.dueDate,
        members: newProject.members?.map((m: any) => m.id),
      });
      await fetchProjects();
    } catch (err) {
      console.error("Failed to create project:", err);
      throw err;
    }
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || project.status === statusFilter;

    const matchesPriority =
      priorityFilter === "all" || project.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Collaborative Projects"
          description="Manage repositories, track goals, and review milestones across your workspace."
        />
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-600/10 hover:bg-indigo-500 hover:shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer w-fit"
        >
          <Plus className="h-4 w-4" />
          New Project
        </button>
      </div>

      {/* Project Filters */}
      <ProjectFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
      />

      {/* Grid of Projects */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
          <p className="text-sm text-muted-foreground">Loading workspace projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20 px-4 rounded-xl border border-dashed border-border/30 bg-card/10 space-y-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20">
            <Plus className="h-6 w-6" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h4 className="text-sm font-semibold text-foreground">No projects created yet</h4>
            <p className="text-xs text-muted-foreground">Get started by setting up a project to manage your software tasks and code workflows.</p>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md hover:bg-indigo-500 transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Create First Project
          </button>
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 rounded-xl border border-border/30 bg-card/10 space-y-3">
          <p className="text-sm text-muted-foreground">No projects found matching the current search criteria.</p>
          <button
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
              setPriorityFilter("all");
            }}
            className="text-xs font-semibold text-indigo-400 hover:underline hover:text-indigo-300"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateOpen}
        onClose={setIsCreateOpen}
        onCreateProject={handleCreateProject}
        members={members}
      />
    </div>
  );
}
