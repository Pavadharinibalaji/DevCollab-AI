"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Folder,
  Palette,
  Trash2,
  ShieldAlert,
  Loader2,
  Check,
  Mail,
  Bell,
  Volume2,
  KeyRound,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "profile" | "workspace" | "appearance" | "notifications" | "ai" | "danger"
  >("profile");
  
  // Loading & State
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [workspace, setWorkspace] = useState<any>(null);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [savingKey, setSavingKey] = useState(false);
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>("openai");
  const [savedProviders, setSavedProviders] = useState<string[]>([]);
  const [activeProvider, setActiveProvider] = useState<string>("openai");

  // Form States
  const [wsName, setWsName] = useState("");
  const [wsSlug, setWsSlug] = useState("");
  const [wsDescription, setWsDescription] = useState("");
  
  // Notification States
  const [notifyAssign, setNotifyAssign] = useState(true);
  const [notifyComment, setNotifyComment] = useState(true);
  const [notifySound, setNotifySound] = useState(false);

  // Danger Zone verification
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users/me");
      if (!res.ok) throw new Error("Failed to load user settings");
      const data = await res.json();
      
      setUser(data.user);
      setWorkspace(data.workspace);
      
      if (data.workspace) {
        setWsName(data.workspace.name || "");
        setWsSlug(data.workspace.slug || "");
        setWsDescription(data.workspace.description || "");
      }
      // check if user already has an API key
      try {
        const keyRes = await fetch("/api/ai/check-key");
        if (keyRes.ok) {
          const keyData = await keyRes.json();
          setHasKey(!!keyData?.hasKey);
          setSavedProviders(keyData?.savedProviders || []);
          setActiveProvider(keyData?.activeProvider || "openai");
        }
      } catch {
        setHasKey(null);
        setSavedProviders([]);
        setActiveProvider("openai");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to load settings data. Please reload.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Load notification states from localStorage
    if (typeof window !== "undefined") {
      setNotifyAssign(localStorage.getItem("notifyAssign") !== "false");
      setNotifyComment(localStorage.getItem("notifyComment") !== "false");
      setNotifySound(localStorage.getItem("notifySound") === "true");
    }
  }, []);

  const handleUpdateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wsName.trim() || !wsSlug.trim()) return;
    
    setUpdating(true);
    setErrorMsg("");
    setSuccessMsg("");
    
    try {
      const res = await fetch("/api/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: wsName,
          slug: wsSlug,
          description: wsDescription,
        }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update workspace settings");
      }
      
      setWorkspace(data.workspace);
      setSuccessMsg("Workspace settings updated successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred");
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("notifyAssign", String(notifyAssign));
    localStorage.setItem("notifyComment", String(notifyComment));
    localStorage.setItem("notifySound", String(notifySound));
    setSuccessMsg("Notification preferences updated successfully!");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleDeleteWorkspace = async () => {
    if (!workspace) return;
    if (deleteConfirmText !== workspace.name) {
      setErrorMsg("Workspace name confirmation does not match");
      return;
    }
    
    setUpdating(true);
    setErrorMsg("");
    
    try {
      const res = await fetch("/api/workspace", {
        method: "DELETE",
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete workspace");
      }
      
      router.push("/onboarding");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Could not delete workspace");
      setUpdating(false);
      setShowDeleteModal(false);
    }
  };

  const ownerIdStr = workspace?.ownerId
    ? (typeof workspace.ownerId === "object"
        ? String(workspace.ownerId._id || workspace.ownerId.id || "")
        : String(workspace.ownerId))
    : "";
  const isOwner = !!(user && workspace && ownerIdStr && ownerIdStr === String(user._id || user.id || ""));

  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = apiKeyInput.trim();
    if (!trimmed) return;

    setSavingKey(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/ai/save-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: trimmed,
          provider: selectedProvider,
          makeActive: true,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to save API key");
      }

      setApiKeyInput("");
      await fetchData();
      setSuccessMsg(`${selectedProvider.toUpperCase()} API key saved and activated successfully. Agent sidebar is enabled.`);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Could not save API key");
    } finally {
      setSavingKey(false);
    }
  };

  const handleSetActiveProvider = async (provider: string) => {
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/ai/set-active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to set active provider");
      }
      setActiveProvider(provider);
      setSuccessMsg(`${provider.toUpperCase()} is now your active chat provider.`);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Could not switch active provider");
    }
  };

  const tabs = [
    { id: "profile" as const, label: "My Profile", icon: User },
    { id: "workspace" as const, label: "Workspace Settings", icon: Folder },
    { id: "appearance" as const, label: "Appearance", icon: Palette },
    { id: "notifications" as const, label: "Notifications", icon: Bell },
    { id: "ai" as const, label: "AI Settings", icon: KeyRound },
    { id: "danger" as const, label: "Danger Zone", icon: Trash2 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Settings"
        description="Manage your account preferences, workspace customization, and security parameters."
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
          <p className="text-sm text-muted-foreground">Loading settings configurations...</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-4">
          {/* Sidebar Nav */}
          <div className="md:col-span-1 flex flex-col gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setErrorMsg("");
                    setSuccessMsg("");
                  }}
                  className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-all text-left cursor-pointer ${
                    activeTab === tab.id
                      ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/40 border border-transparent"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Main Workspace Content */}
          <div className="md:col-span-3 rounded-xl border border-border/50 bg-card/30 p-6 shadow-sm">
            {errorMsg && (
              <div className="mb-4 flex items-center gap-2 p-3 text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 flex items-center gap-2 p-3 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <Check className="h-4 w-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-foreground">My Profile</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your personal profile information is managed and synchronized through your identity provider.
                  </p>
                </div>

                <div className="flex items-center gap-4 p-4 border border-border/30 rounded-lg bg-card/20">
                  {user?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatarUrl}
                      alt={user?.name || "Avatar"}
                      className="h-16 w-16 rounded-full border border-border object-cover"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full border border-border/40 bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-lg">
                      {user?.name?.slice(0, 2).toUpperCase() || "ME"}
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">{user?.name || "No name set"}</h4>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <Mail className="h-3 w-3" />
                      {user?.email || "No email linked"}
                    </p>
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase">
                      ID: {user?.clerkUserId || "N/A"}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Display Name</label>
                    <input
                      type="text"
                      value={user?.name || ""}
                      disabled
                      className="w-full rounded-lg border border-border/40 bg-muted/20 px-3 py-2 text-sm text-muted-foreground cursor-not-allowed opacity-80"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Registered Email</label>
                    <input
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="w-full rounded-lg border border-border/40 bg-muted/20 px-3 py-2 text-sm text-muted-foreground cursor-not-allowed opacity-80"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium italic">
                    * Need to modify details? Please update your details directly inside your Clerk account settings.
                  </p>
                </div>
              </div>
            )}

            {/* Workspace Settings Tab */}
            {activeTab === "workspace" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Workspace Configuration</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Configure your workspace metadata, slug route, and public information.
                  </p>
                </div>

                {!workspace ? (
                  <div className="p-6 border border-dashed border-border/30 rounded-lg text-center text-xs text-muted-foreground">
                    No active workspace detected. Create one on the onboarding flow.
                  </div>
                ) : (
                  <form onSubmit={handleUpdateWorkspace} className="space-y-4">
                    <div className="space-y-1.5">
                      <label htmlFor="ws-name" className="text-xs font-semibold text-foreground">
                        Workspace Name
                      </label>
                      <input
                        id="ws-name"
                        type="text"
                        required
                        disabled={!isOwner}
                        value={wsName}
                        onChange={(e) => setWsName(e.target.value)}
                        placeholder="e.g. Acme Engineering"
                        className={`w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                          !isOwner ? "opacity-75 cursor-not-allowed bg-muted/20" : ""
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="ws-slug" className="text-xs font-semibold text-foreground">
                        Workspace Slug (URL slug identifier)
                      </label>
                      <input
                        id="ws-slug"
                        type="text"
                        required
                        disabled={!isOwner}
                        value={wsSlug}
                        onChange={(e) =>
                          setWsSlug(
                            e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9-_]/g, "")
                          )
                        }
                        placeholder="e.g. acme-engineering"
                        className={`w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                          !isOwner ? "opacity-75 cursor-not-allowed bg-muted/20" : ""
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="ws-desc" className="text-xs font-semibold text-foreground">
                        Description
                      </label>
                      <textarea
                        id="ws-desc"
                        rows={4}
                        disabled={!isOwner}
                        value={wsDescription}
                        onChange={(e) => setWsDescription(e.target.value)}
                        placeholder="Brief overview of workspace activities..."
                        className={`w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none ${
                          !isOwner ? "opacity-75 cursor-not-allowed bg-muted/20" : ""
                        }`}
                      />
                    </div>

                    {isOwner ? (
                      <div className="flex justify-end pt-2">
                        <button
                          type="submit"
                          disabled={updating}
                          className="px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-600/10 disabled:opacity-50"
                        >
                          {updating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                          Save Changes
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-3 text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                        <ShieldAlert className="h-4 w-4 shrink-0" />
                        <span>Only the workspace owner can modify workspace configurations.</span>
                      </div>
                    )}
                  </form>
                )}
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === "appearance" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Theme & Interface Settings</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Manage UI styling, dashboard density, and visualization aesthetics.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 border border-border/30 rounded-lg bg-card/20 space-y-3">
                    <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Active Color Theme</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {/* Dark Theme Card */}
                      <div className="p-4 rounded-lg border border-indigo-500/40 bg-indigo-500/5 flex flex-col justify-between h-24">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground">Deep Charcoal Dark</span>
                          <span className="h-4 w-4 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] text-white">
                            ✓
                          </span>
                        </div>
                        <div className="flex gap-1.5">
                          <span className="h-3 w-3 rounded-full bg-zinc-950 border border-zinc-800" />
                          <span className="h-3 w-3 rounded-full bg-indigo-600" />
                          <span className="h-3 w-3 rounded-full bg-zinc-800" />
                        </div>
                      </div>

                      {/* Light Theme Card */}
                      <div className="p-4 rounded-lg border border-border/20 bg-muted/10 flex flex-col justify-between h-24 opacity-40 cursor-not-allowed">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-muted-foreground">Studio Light</span>
                          <span className="text-[9px] font-bold text-muted-foreground px-1 bg-muted rounded">Blocked</span>
                        </div>
                        <div className="flex gap-1.5">
                          <span className="h-3 w-3 rounded-full bg-white border border-zinc-300" />
                          <span className="h-3 w-3 rounded-full bg-zinc-300" />
                          <span className="h-3 w-3 rounded-full bg-zinc-100" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-indigo-950/20 border border-indigo-500/20 rounded-lg text-[11px] text-indigo-400 font-medium">
                    * DevCollab enforces a global dark theme across all landing pages and dashboard widgets for premium, distraction-free SaaS visual excellence.
                  </div>
                </div>
              </div>
            )}

            {/* Notification Preferences Tab */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Notification Preferences</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Manage how and when you receive workspace status notifications.
                  </p>
                </div>

                <form onSubmit={handleSaveNotifications} className="space-y-5">
                  <div className="space-y-4">
                    {/* Assign Alert */}
                    <div className="flex items-center justify-between p-4 border border-border/30 rounded-lg bg-card/20">
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <Mail className="h-4 w-4 text-indigo-400" />
                          Task Assignment Alerts
                        </h4>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          Receive email notifications whenever a task is assigned to you.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifyAssign}
                        onChange={(e) => setNotifyAssign(e.target.checked)}
                        className="h-4 w-4 accent-indigo-600 rounded cursor-pointer"
                      />
                    </div>

                    {/* Comments Alert */}
                    <div className="flex items-center justify-between p-4 border border-border/30 rounded-lg bg-card/20">
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <Bell className="h-4 w-4 text-indigo-400" />
                          Task Comment Alerts
                        </h4>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          Notify me when comments are added to tasks I am watching or assigned to.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifyComment}
                        onChange={(e) => setNotifyComment(e.target.checked)}
                        className="h-4 w-4 accent-indigo-600 rounded cursor-pointer"
                      />
                    </div>

                    {/* Realtime Audio Alert */}
                    <div className="flex items-center justify-between p-4 border border-border/30 rounded-lg bg-card/20">
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <Volume2 className="h-4 w-4 text-indigo-400" />
                          Realtime Audio Alerts
                        </h4>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          Play a subtle audio alert when a collaborative task changes in real time.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifySound}
                        onChange={(e) => setNotifySound(e.target.checked)}
                        className="h-4 w-4 accent-indigo-600 rounded cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-border/20">
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer shadow-md shadow-indigo-600/10"
                    >
                      Save Preferences
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* AI Settings Tab */}
            {activeTab === "ai" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-foreground">AI Integration</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Configure your own keys from multiple AI providers to enable project-aware assistance.
                  </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {/* Left Column: Manage Key */}
                  <div className="p-5 border border-border/40 rounded-xl bg-card/20 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                        <KeyRound className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Manage API Keys</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Keys are encrypted and stored securely on our database.
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleSaveApiKey} className="space-y-4 pt-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">AI Provider</label>
                        <select
                          value={selectedProvider}
                          onChange={(e) => setSelectedProvider(e.target.value)}
                          className="w-full rounded-lg border border-border bg-zinc-950 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        >
                          <option value="openai">OpenAI (GPT-4o-mini)</option>
                          <option value="groq">Groq (Llama 3.3)</option>
                          <option value="anthropic">Anthropic (Claude 3.5)</option>
                          <option value="gemini">Google Gemini (Gemini 2.5)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">API Key</label>
                        <input
                          type="password"
                          value={apiKeyInput}
                          onChange={(e) => setApiKeyInput(e.target.value)}
                          placeholder={`Enter your ${selectedProvider.toUpperCase()} key`}
                          className="w-full rounded-lg border border-border bg-zinc-950 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        />
                        {savedProviders.includes(selectedProvider) && (
                          <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                            A key is already saved for this provider. Submitting will overwrite it.
                          </p>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={savingKey || !apiKeyInput.trim()}
                        className="w-full px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        {savingKey && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        Save & Activate Key
                      </button>
                    </form>
                  </div>

                  {/* Right Column: Providers Status */}
                  <div className="p-5 border border-border/40 rounded-xl bg-card/20 space-y-4 flex flex-col">
                    <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Your Providers Status</p>

                    <div className="space-y-3 flex-1">
                      {[
                        { id: "openai", name: "OpenAI", model: "gpt-4o-mini" },
                        { id: "groq", name: "Groq", model: "llama-3.3" },
                        { id: "anthropic", name: "Anthropic", model: "claude-3-5-sonnet" },
                        { id: "gemini", name: "Gemini", model: "gemini-1.5-flash-latest" },
                      ].map((provider) => {
                        const isSaved = savedProviders.includes(provider.id);
                        const isActive = activeProvider === provider.id;

                        return (
                          <div
                            key={provider.id}
                            className={`p-3 rounded-lg border flex items-center justify-between transition-all ${
                              isActive
                                ? "bg-indigo-600/5 border-indigo-500/30"
                                : isSaved
                                  ? "bg-zinc-900/40 border-border/40"
                                  : "bg-zinc-950/20 border-border/20 opacity-60"
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-foreground">{provider.name}</span>
                                {isActive ? (
                                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold uppercase tracking-wide">
                                    Active
                                  </span>
                                ) : isSaved ? (
                                  <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] font-bold uppercase tracking-wide">
                                    Saved
                                  </span>
                                ) : null}
                              </div>
                              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                                Model: <code className="text-foreground/80 font-mono text-[9px] bg-zinc-900 px-1 py-0.5 rounded">{provider.model}</code>
                              </span>
                            </div>

                            {isSaved && !isActive && (
                              <button
                                onClick={() => handleSetActiveProvider(provider.id)}
                                className="px-2.5 py-1 text-[10px] font-bold rounded bg-zinc-800 hover:bg-zinc-700 text-foreground transition-all cursor-pointer"
                              >
                                Activate
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-indigo-950/10 border border-indigo-500/15 rounded-lg text-[11px] text-indigo-300 leading-relaxed">
                  💡 **Pro Tip:** You can configure keys for multiple providers and easily toggle between them using the &quot;Activate&quot; buttons. The Agent sidebar will dynamically use your active provider for all chat interactions with full project context.
                </div>
              </div>
            )}

            {/* Danger Zone Tab */}
            {activeTab === "danger" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-rose-400">Danger Zone</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Irreversible administrative actions concerning your workspace data.
                  </p>
                </div>

                {!workspace ? (
                  <div className="p-6 border border-dashed border-border/30 rounded-lg text-center text-xs text-muted-foreground">
                    No active workspace detected.
                  </div>
                ) : (
                  <div className="p-4 border border-rose-500/30 rounded-lg bg-rose-500/5 space-y-4">
                    <div className="flex items-start gap-3">
                      <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-foreground">Delete Workspace & Permanent Cascade</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          This action permanently deletes the workspace <span className="font-semibold text-rose-400">&quot;{workspace.name}&quot;</span>, 
                          including all associated projects, tasks, and activity logs. All workspace links will break, and data cannot be recovered.
                        </p>
                      </div>
                    </div>

                    {isOwner ? (
                      <div className="pt-2 border-t border-rose-500/10 flex justify-between items-center">
                        <span className="text-[11px] text-rose-400 font-medium font-mono">Status: Owner authorization granted</span>
                        <button
                          type="button"
                          onClick={() => setShowDeleteModal(true)}
                          className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-md shadow-rose-600/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete Workspace
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 bg-rose-950/20 border border-rose-500/20 rounded-lg text-[11px] text-rose-400 font-semibold">
                        Error: You are not the owner of this workspace. Only the owner ({workspace.ownerId ? "Owner Role" : "N/A"}) can execute workspace deletion.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Dialog Modal */}
      {showDeleteModal && workspace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-rose-500/30 bg-zinc-950 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 text-rose-400">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <h3 className="font-bold text-md text-foreground">Are you absolutely sure?</h3>
            </div>
            
            <p className="text-xs text-muted-foreground leading-relaxed">
              This operation is <span className="font-bold text-rose-400">irreversible</span>. It will permanently delete 
              the <span className="font-bold text-foreground">&quot;{workspace.name}&quot;</span> workspace and destroy all projects, boards, 
              members list, and task metrics.
            </p>

            <div className="space-y-2 bg-rose-500/5 p-3 rounded-lg border border-rose-500/10">
              <p className="text-[11px] text-muted-foreground font-semibold">
                Please type <span className="text-foreground font-mono select-all">&quot;{workspace.name}&quot;</span> below to confirm:
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={workspace.name}
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
                disabled={deleteConfirmText !== workspace.name || updating}
                onClick={handleDeleteWorkspace}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-all cursor-pointer flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {updating && <Loader2 className="h-3 w-3 animate-spin" />}
                Yes, delete workspace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
