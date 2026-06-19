"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  onCreateProject: (project: any) => void;
  members: any[];
}

export function CreateProjectModal({ isOpen, onClose, onCreateProject, members }: CreateProjectModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [status, setStatus] = useState<"planning" | "active" | "paused" | "completed">("planning");
  const [dueDate, setDueDate] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  const toggleMemberSelection = (id: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((mid) => mid !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;

    // Resolve selected member objects
    const projectMembers = members.filter((m) => selectedMemberIds.includes(m.id));

    // Construct project input payload
    const newProject = {
      title,
      description: description || "Collaborative dev workspace project.",
      progress: status === "completed" ? 100 : 0,
      priority,
      status,
      dueDate,
      members: projectMembers,
    };

    onCreateProject(newProject);
    
    // Reset forms
    setTitle("");
    setDescription("");
    setPriority("medium");
    setStatus("planning");
    setDueDate("");
    setSelectedMemberIds([]);
    onClose(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Initialize New Project</DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            Add a collaborative project to track delivery status, activity, and tasks.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Title */}
          <div className="space-y-1.5">
            <label htmlFor="proj-title" className="text-xs font-semibold text-foreground">
              Project Title *
            </label>
            <input
              id="proj-title"
              type="text"
              required
              placeholder="e.g. API V3 Migration"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label htmlFor="proj-desc" className="text-xs font-semibold text-foreground">
              Description
            </label>
            <textarea
              id="proj-desc"
              placeholder="Explain the scope and targets of this project..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Status */}
            <div className="space-y-1.5">
              <label htmlFor="proj-status" className="text-xs font-semibold text-foreground">
                Status
              </label>
              <select
                id="proj-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as "planning" | "active" | "paused" | "completed")}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
              >
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <label htmlFor="proj-priority" className="text-xs font-semibold text-foreground">
                Priority
              </label>
              <select
                id="proj-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high" | "urgent")}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-1.5">
            <label htmlFor="proj-due" className="text-xs font-semibold text-foreground">
              Target Due Date *
            </label>
            <input
              id="proj-due"
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            />
          </div>

          {/* Team Members */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-foreground block">
              Collaborators (Select all that apply)
            </span>
            <div className="grid grid-cols-2 gap-2 bg-background/50 border border-border/60 p-3 rounded-lg max-h-32 overflow-y-auto">
              {members.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleMemberSelection(m.id)}
                  className={`flex items-center gap-2 p-1.5 rounded-md text-xs font-medium cursor-pointer transition-all border ${
                    selectedMemberIds.includes(m.id)
                      ? "bg-indigo-600/15 border-indigo-500/40 text-indigo-400"
                      : "border-transparent hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <span className="h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-bold bg-indigo-600 text-indigo-100">
                    {m.initials}
                  </span>
                  <span className="truncate">{m.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-3 border-t border-border/30">
            <button
              type="button"
              onClick={() => onClose(false)}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
            >
              Create Project
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
