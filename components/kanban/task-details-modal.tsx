"use client";

import { useEffect, useState } from "react";
import { Loader2, Calendar, User, AlertCircle, MessageSquare, Clock, Trash2, Check } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TaskDetailsModalProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  taskId: string;
  members: any[];
  onDeleteSuccess?: () => void;
}

export function TaskDetailsModal({
  isOpen,
  onClose,
  taskId,
  members,
  onDeleteSuccess,
}: TaskDetailsModalProps) {
  const toast = useToast();
  const [task, setTask] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Comments
  const [commentContent, setCommentContent] = useState("");
  const [commenting, setCommenting] = useState(false);

  const fetchTaskDetails = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      if (!res.ok) throw new Error("Failed to fetch task details");
      const payload = await res.json();
      const data = payload.data || {};
      setTask(data.task);
      setActivities(data.activities || []);

      // Set form fields
      if (data.task) {
        setTitle(data.task.title || "");
        setDescription(data.task.description || "");
        setStatus(data.task.status || "todo");
        setPriority(data.task.priority || "medium");
        setAssigneeId(
          data.task.assigneeId && typeof data.task.assigneeId === "object"
            ? data.task.assigneeId._id || data.task.assigneeId.id
            : data.task.assigneeId || ""
        );
        setDueDate(
          data.task.dueDate ? new Date(data.task.dueDate).toISOString().split("T")[0] : ""
        );
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load task details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && taskId) {
      fetchTaskDetails();
    }
  }, [isOpen, taskId]);

  const handleUpdate = async (fieldsToUpdate?: Record<string, any>) => {
    setIsUpdating(true);
    setUpdateSuccess(false);
    try {
      const body = fieldsToUpdate || {
        title,
        description,
        status,
        priority,
        assigneeId: assigneeId || "",
        dueDate: dueDate || "",
      };

      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update task");

      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 2000);
      
      // Refresh task details to log status change in activities list
      if (fieldsToUpdate) {
        fetchTaskDetails();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to update task");
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    setCommenting(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentContent }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post comment");

      setCommentContent("");
      // Refresh task details to show comments
      fetchTaskDetails();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to post comment");
    } finally {
      setCommenting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete task");
      
      toast.success("Task deleted successfully");
      if (onDeleteSuccess) onDeleteSuccess();
      onClose(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to delete task");
    }
  };

  const formatActivityTime = (timestamp: string) => {
    const d = new Date(timestamp);
    return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl bg-card border border-border/60 text-foreground shadow-2xl backdrop-blur-md max-h-[85vh] overflow-y-auto flex flex-col p-6">
        <DialogHeader className="border-b border-border/20 pb-4 shrink-0">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Task Details
            </span>
            <div className="flex items-center gap-1.5 pr-6">
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded hover:bg-rose-500 hover:text-white cursor-pointer transition-all"
              >
                <Trash2 className="h-3 w-3" />
                Delete Task
              </button>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
            <p className="text-sm text-muted-foreground">Loading task configurations...</p>
          </div>
        ) : error ? (
          <div className="py-10 text-center space-y-2">
            <AlertCircle className="h-8 w-8 text-rose-500 mx-auto" />
            <p className="text-sm font-semibold text-foreground">{error}</p>
          </div>
        ) : (
          <div className="space-y-6 pt-4 flex-1">
            {/* Title & Description Fields */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => handleUpdate()}
                  className="w-full text-md font-bold bg-transparent border-b border-transparent hover:border-border focus:border-indigo-500 focus:outline-none py-1 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={() => handleUpdate()}
                  rows={2}
                  placeholder="No description provided."
                  className="w-full text-xs text-muted-foreground bg-transparent border border-transparent hover:border-border/50 focus:border-indigo-500 focus:outline-none p-1.5 rounded transition-all resize-none"
                />
              </div>
            </div>

            {/* Meta dropdown controls */}
            <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-xl border border-border/40 text-xs">
              <div className="space-y-1.5">
                <span className="font-semibold text-muted-foreground block">Status</span>
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    handleUpdate({ status: e.target.value });
                  }}
                  className="w-full bg-background border border-border rounded px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="in-review">In Review</option>
                  <option value="done">Done</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <span className="font-semibold text-muted-foreground block">Priority</span>
                <select
                  value={priority}
                  onChange={(e) => {
                    setPriority(e.target.value);
                    handleUpdate({ priority: e.target.value });
                  }}
                  className="w-full bg-background border border-border rounded px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <span className="font-semibold text-muted-foreground block">Assignee</span>
                <select
                  value={assigneeId}
                  onChange={(e) => {
                    setAssigneeId(e.target.value);
                    handleUpdate({ assigneeId: e.target.value || "" });
                  }}
                  className="w-full bg-background border border-border rounded px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <span className="font-semibold text-muted-foreground block">Due Date</span>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => {
                    setDueDate(e.target.value);
                    handleUpdate({ dueDate: e.target.value || "" });
                  }}
                  className="w-full bg-background border border-border rounded px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
                />
              </div>
            </div>

            {updateSuccess && (
              <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <Check className="h-3.5 w-3.5" />
                Changes saved automatically
              </p>
            )}

            {/* Split tabs: Comments and Activities timeline */}
            <div className="grid gap-6 md:grid-cols-2 pt-2 border-t border-border/20">
              {/* Comments Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4 text-indigo-400" />
                  Comments ({task?.comments?.length || 0})
                </h4>

                <div className="max-h-52 overflow-y-auto space-y-2.5 pr-1.5">
                  {task?.comments?.length > 0 ? (
                    task.comments.map((comment: any) => {
                      const commenter = comment.userId || {};
                      const name = commenter.name || "Teammate";
                      const initials = name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2) || "M";

                      return (
                        <div key={comment._id} className="p-2.5 rounded-lg border border-border/30 bg-muted/10 space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="h-5 w-5 rounded-full bg-indigo-600 text-white font-bold text-[8px] flex items-center justify-center">
                              {commenter.avatarUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={commenter.avatarUrl} alt={name} className="h-full w-full object-cover rounded-full" />
                              ) : (
                                initials
                              )}
                            </div>
                            <span className="text-[10px] font-bold text-foreground truncate">{name}</span>
                            <span className="text-[8px] text-muted-foreground ml-auto font-mono">
                              {formatActivityTime(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-[11px] leading-relaxed text-muted-foreground pl-7">
                            {comment.content}
                          </p>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-muted-foreground py-6 text-center italic">No comments yet.</p>
                  )}
                </div>

                <form onSubmit={handlePostComment} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Write a comment..."
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    required
                    className="flex-1 rounded-lg border border-border bg-background/50 px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={commenting || !commentContent.trim()}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors"
                  >
                    {commenting ? "Posting..." : "Post"}
                  </button>
                </form>
              </div>

              {/* Activity Timeline Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-indigo-400" />
                  Activity History
                </h4>

                <div className="max-h-60 overflow-y-auto space-y-3 pr-1.5 font-sans">
                  {activities.length > 0 ? (
                    activities.map((act) => (
                      <div key={act._id} className="flex gap-2.5 text-[11px] leading-relaxed relative pl-2 border-l border-border/40 last:border-transparent">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0 -ml-[13px]" />
                        <div className="flex-1">
                          <p className="text-muted-foreground">
                            <span className="font-semibold text-foreground">{act.user.name}</span>{" "}
                            {act.action}{" "}
                            <span className="font-medium text-foreground">&quot;{act.target}&quot;</span>
                          </p>
                          <span className="text-[9px] text-muted-foreground block mt-0.5 font-mono">
                            {formatActivityTime(act.timestamp || act.createdAt)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground py-6 text-center italic">No activity logged.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
