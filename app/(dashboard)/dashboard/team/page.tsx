"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import {
  Users,
  UserPlus,
  Search,
  Mail,
  Loader2,
  Shield,
  Clock,
  Sparkles,
  CheckCircle2,
  Copy,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { useSocket } from "@/hooks/use-socket";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function TeamPage() {
  const { user: clerkUser } = useUser();
  const [users, setUsers] = useState<any[]>([]);
  const [workspace, setWorkspace] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Invite Modal State
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [inviteResent, setInviteResent] = useState(false);
  const [inviteError, setInviteError] = useState("");

  const [invitations, setInvitations] = useState<any[]>([]);
  const [generatedToken, setGeneratedToken] = useState("");

  const { socket } = useSocket();

  useEffect(() => {
    fetchData(true);
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleRefresh = () => {
      console.log("[TeamPage] Realtime event received, refreshing data...");
      fetchData();
    };

    socket.on("invitationsUpdated", handleRefresh);
    socket.on("teamUpdated", handleRefresh);

    return () => {
      socket.off("invitationsUpdated", handleRefresh);
      socket.off("teamUpdated", handleRefresh);
    };
  }, [socket]);

  const fetchData = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const response = await fetch('/api/workspace');
      if (!response.ok) throw new Error('Failed to fetch workspace data');
      const data = await response.json();
      const ws = data.workspace;
      
      const workspaceUsers = ws?.members?.map((m: any) => {
        const u = m.userId;
        if (!u) return null;
        const isPopulated = typeof u === 'object';
        const userIdStr = isPopulated ? (u._id?.toString() || u.id) : u.toString();
        return {
          _id: userIdStr,
          id: userIdStr,
          clerkUserId: isPopulated ? u.clerkUserId : userIdStr,
          name: isPopulated ? (u.name || 'Teammate') : 'Teammate',
          email: isPopulated ? (u.email || '') : '',
          avatarUrl: isPopulated ? (u.avatarUrl || '') : '',
        };
      })?.filter(Boolean) || [];
      
      setUsers(workspaceUsers);
      setWorkspace(ws);
      setMetrics(data.metrics);
      setInvitations(data.invitations || []);
    } catch (err) {
      console.error("Failed to load team data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setIsInviting(true);
    setInviteError("");
    setInviteSuccess(false);

    try {
      const inviteRes = await fetch('/api/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      });
      if (inviteRes.ok) {
        const result = await inviteRes.json();
        if (result.success) {
          setInviteResent(!!result.resent);
          setGeneratedToken(result.invitation?.token || "");
          setInviteSuccess(true);
          setInviteEmail("");
          await fetchData();
        } else {
          setInviteError(result.error || 'Failed to invite team member.');
        }
      } else {
        let errMsg = 'Failed to invite team member.';
        try {
          const errData = await inviteRes.json();
          errMsg = errData.error || errMsg;
        } catch {
          const errText = await inviteRes.text();
          errMsg = errText || errMsg;
        }
        setInviteError(errMsg);
      }
    } catch (err: any) {
      console.error("Failed to invite member:", err);
      setInviteError(err?.message || "Something went wrong while sending invite.");
    } finally {
      setIsInviting(false);
    }
  };

  const handleRevokeInvite = async (token: string) => {
    if (!confirm("Are you sure you want to revoke this invitation link?")) return;
    try {
      const res = await fetch(`/api/invitations/${token}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to revoke invitation.");
      }
    } catch (err) {
      console.error("Revoke error:", err);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/workspace/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        await fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update role");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member from the workspace?")) return;
    try {
      const res = await fetch(`/api/workspace/members/${memberId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to remove member");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helper to determine role for a user
  const getUserRole = (user: any) => {
    if (!workspace) return "member";
    const userId = String(user._id || user.id);
    const ownerId = typeof workspace.ownerId === "object" ? String(workspace.ownerId._id || workspace.ownerId.id) : String(workspace.ownerId);

    if (userId === ownerId) {
      return "owner";
    }

    const memberMatch = workspace.members?.find((m: any) => {
      const mId = typeof m.userId === "object" ? String(m.userId._id || m.userId.id) : String(m.userId);
      return mId === userId;
    });

    return memberMatch?.role || "member";
  };

  // Get current user's role
  const currentUserRecord = users.find((u) => u.clerkUserId === clerkUser?.id);
  const currentUserRole = currentUserRecord ? getUserRole(currentUserRecord) : "member";

  // Filter members
  const filteredUsers = users.filter((user) => {
    const role = getUserRole(user);
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === "all" || role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const roleStyles = {
    owner: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    admin: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    member: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Workspace Team"
          description="Manage collaborators, assign security roles, and view active members."
        />
        <button
          onClick={() => setIsInviteOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-600/10 hover:bg-indigo-500 hover:shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer w-fit"
        >
          <UserPlus className="h-4 w-4" />
          Invite Member
        </button>
      </div>

      {/* Stats Summary Section */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 rounded-xl border border-border/40 bg-card/10 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border/50 bg-gradient-to-br from-card/40 to-card/10 p-5 flex items-center gap-4">
            <div className="rounded-lg bg-indigo-500/10 p-3 text-indigo-400 border border-indigo-500/10">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Members
              </p>
              <h3 className="text-2xl font-bold font-mono text-foreground mt-0.5">
                {metrics?.totalMembers || users.length}
              </h3>
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-gradient-to-br from-card/40 to-card/10 p-5 flex items-center gap-4">
            <div className="rounded-lg bg-emerald-500/10 p-3 text-emerald-400 border border-emerald-500/10">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Active Connections
              </p>
              <h3 className="text-2xl font-bold font-mono text-foreground mt-0.5">
                {metrics?.onlineMembers || Math.max(1, Math.round(users.length * 0.75))}
              </h3>
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-gradient-to-br from-card/40 to-card/10 p-5 flex items-center gap-4">
            <div className="rounded-lg bg-purple-500/10 p-3 text-purple-400 border border-purple-500/10">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Workspace
              </p>
              <h3 className="text-lg font-bold text-foreground truncate mt-1">
                {workspace?.name || "Acme Engineering"}
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-card/10 border border-border/30 rounded-xl p-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-background/50 pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground font-semibold">Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
          >
            <option value="all">All Roles</option>
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
            <option value="member">Member</option>
          </select>
        </div>
      </div>

      {/* Team Grid list */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
          <p className="text-sm text-muted-foreground">Loading workspace members...</p>
        </div>
      ) : filteredUsers.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredUsers.map((user) => {
            const role = getUserRole(user);
            const isSelf = user.clerkUserId === clerkUser?.id;
            const canManage = !isSelf && 
              (currentUserRole === "owner" || (currentUserRole === "admin" && role === "member"));

            return (
              <div
                key={user._id || user.id}
                className="group relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-card/60 to-card/20 p-5 transition-all duration-300 hover:border-indigo-500/40 hover:bg-card/85 hover:shadow-xl hover:shadow-black/30"
              >
                {/* Profile header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 rounded-full overflow-hidden border border-border/20 shadow-sm shrink-0 flex items-center justify-center bg-indigo-600 text-indigo-100 font-bold text-sm">
                      {user.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={user.avatarUrl}
                          alt={user.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        getInitials(user.name)
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-foreground text-sm truncate group-hover:text-indigo-400 transition-colors">
                        {user.name}
                      </h4>
                      <p className="text-[11px] text-muted-foreground truncate font-mono mt-0.5">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Additional metadata & role controls */}
                <div className="mt-5 pt-4 border-t border-border/20 flex items-center justify-between text-[11px]">
                  {canManage ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="rounded border border-border bg-background px-2 py-1 text-[10px] font-semibold text-foreground focus:outline-none"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        onClick={() => handleRemoveMember(user.id)}
                        className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 p-1.5 rounded transition-all cursor-pointer"
                        title="Remove Member"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border",
                        roleStyles[role as keyof typeof roleStyles] || roleStyles.member
                      )}
                    >
                      {role}
                    </span>
                  )}
                  <span className="text-muted-foreground flex items-center gap-1 font-mono">
                    <Clock className="h-3 w-3 text-indigo-400" />
                    Joined
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 rounded-xl border border-border/30 bg-card/10 space-y-3">
          <p className="text-sm text-muted-foreground">
            No team members found matching the search criteria.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setRoleFilter("all");
            }}
            className="text-xs font-semibold text-indigo-400 hover:underline hover:text-indigo-300"
          >
            Clear search
          </button>
        </div>
      )}
      
      {/* Pending Invitations Section */}
      {!isLoading && invitations.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-border/20">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-foreground">Pending Invitations</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            These people have been invited to your workspace. They can accept their invitations using the links below.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {invitations.map((invite) => {
              const expiresStr = invite.expiresAt ? new Date(invite.expiresAt).toLocaleDateString() : "";
              return (
                <div
                  key={invite._id || invite.id}
                  className="group relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-card/40 to-card/10 p-5 transition-all duration-300 hover:border-indigo-500/25 hover:bg-card/70"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-foreground text-sm truncate" title={invite.email}>
                        {invite.email}
                      </h4>
                      <p className="text-[10px] text-muted-foreground truncate font-mono mt-0.5">
                        Invited by: {invite.invitedBy?.name || invite.invitedBy?.email || "Teammate"}
                      </p>
                    </div>
                    <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border border-amber-500/20 text-amber-400 shrink-0">
                      {invite.role}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/10 flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground font-mono">
                      Expires: {expiresStr}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          const inviteUrl = `${window.location.origin}/invite/${invite.token}`;
                          navigator.clipboard.writeText(inviteUrl);
                          alert("Invitation link copied!");
                        }}
                        className="rounded-md border border-border bg-background/50 hover:bg-background px-2 py-1 text-[10px] font-semibold text-foreground transition-all cursor-pointer flex items-center gap-1"
                        title="Copy Link"
                      >
                        <Copy className="h-3 w-3" />
                        Copy Link
                      </button>
                      <button
                        onClick={() => handleRevokeInvite(invite.token)}
                        className="rounded-md border border-rose-500/20 bg-rose-500/5 hover:bg-rose-600 hover:text-white px-2 py-1 text-[10px] font-semibold text-rose-400 transition-all cursor-pointer flex items-center gap-1"
                        title="Revoke Link"
                      >
                        <Trash2 className="h-3 w-3" />
                        Revoke
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Invite Dialog */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card border border-border/60 text-foreground shadow-2xl backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Invite Team Member</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Add collaborators to {workspace?.name || "the workspace"}. Synced members can contribute to Kanban workflows instantly.
            </DialogDescription>
          </DialogHeader>

          {inviteSuccess ? (
            <div className="space-y-4 py-4 text-center">
              <div className="flex flex-col items-center justify-center gap-2">
                <CheckCircle2 className="h-12 w-12 text-emerald-400 animate-bounce" />
                <h4 className="font-bold text-sm text-foreground">
                  {inviteResent ? "Invitation Link Regenerated!" : "Invitation Link Generated!"}
                </h4>
                <p className="text-xs text-muted-foreground">
                  Share this unique URL with your team member to let them join the workspace.
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-border bg-background/50 p-2 overflow-hidden">
                <input
                  type="text"
                  readOnly
                  value={`${typeof window !== "undefined" ? window.location.origin : ""}/invite/${generatedToken}`}
                  className="w-full bg-transparent px-2 py-1 text-xs font-mono text-muted-foreground focus:outline-none"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/invite/${generatedToken}`);
                    alert("Invitation link copied to clipboard!");
                  }}
                  className="rounded bg-indigo-600 px-3 py-1 text-[10px] font-semibold text-white hover:bg-indigo-500 cursor-pointer shrink-0"
                >
                  Copy Link
                </button>
              </div>

              <div className="flex justify-end pt-2 border-t border-border/20">
                <button
                  onClick={() => {
                    setIsInviteOpen(false);
                    setInviteSuccess(false);
                    setGeneratedToken("");
                    setInviteResent(false);
                  }}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleInviteSubmit} className="space-y-4 pt-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    className="w-full rounded-lg border border-border bg-background/50 pl-10 pr-4 py-2 text-sm text-foreground focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:border-indigo-500 focus:outline-none"
                >
                  <option value="member">Member (Can view and update tasks)</option>
                  <option value="admin">Admin (Full administrative controls)</option>
                </select>
              </div>

              {inviteError && (
                <p className="text-xs text-rose-400 font-medium">{inviteError}</p>
              )}

              <div className="flex justify-end gap-2.5 pt-2 border-t border-border/20">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isInviting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40 cursor-pointer"
                >
                  {isInviting && <Loader2 className="h-3 w-3 animate-spin" />}
                  Send Invitation
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
