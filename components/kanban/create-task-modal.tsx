"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  workspaceId: string;
  projectId: string;
  defaultStatus: string;
  members: any[];
}

export function CreateTaskModal({
  isOpen,
  onClose,
  workspaceId,
  projectId,
  defaultStatus,
  members,
}: CreateTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState(defaultStatus);
  const [priority, setPriority] = useState("medium");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          projectId,
          title,
          description,
          status,
          priority,
          assigneeId: assigneeId || undefined,
          dueDate: dueDate || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create task");
      }

      // Reset fields
      setTitle("");
      setDescription("");
      setStatus(defaultStatus);
      setPriority("medium");
      setAssigneeId("");
      setDueDate("");
      onClose(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border border-border/60 text-foreground shadow-2xl backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-1.5">
            <Plus className="h-5 w-5 text-indigo-400" />
            Create Task
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Add a new item to your project board. Submitting will sync it in realtime.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-3">
          <div className="space-y-1">
            <label htmlFor="task-title" className="text-xs font-semibold text-muted-foreground">
              Task Title
            </label>
            <input
              id="task-title"
              type="text"
              required
              placeholder="e.g. Implement refresh tokens"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="task-desc" className="text-xs font-semibold text-muted-foreground">
              Description
            </label>
            <textarea
              id="task-desc"
              placeholder="Provide context or instructions for this task..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:border-indigo-500 focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="task-status" className="text-xs font-semibold text-muted-foreground">
                Status
              </label>
              <select
                id="task-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:border-indigo-500 focus:outline-none"
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="in-review">In Review</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="task-priority" className="text-xs font-semibold text-muted-foreground">
                Priority
              </label>
              <select
                id="task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:border-indigo-500 focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="task-assignee" className="text-xs font-semibold text-muted-foreground">
                Assignee
              </label>
              <select
                id="task-assignee"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:border-indigo-500 focus:outline-none"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="task-due" className="text-xs font-semibold text-muted-foreground">
                Due Date
              </label>
              <input
                id="task-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:border-indigo-500 focus:outline-none font-sans"
              />
            </div>
          </div>

          {error && <p className="text-xs text-rose-400 font-semibold">{error}</p>}

          <div className="flex justify-end gap-2 pt-2 border-t border-border/20">
            <button
              type="button"
              onClick={() => onClose(false)}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 cursor-pointer"
            >
              Cancel
            </button>
            <Button
              type="submit"
              disabled={loading || !title.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 cursor-pointer"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Create Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
