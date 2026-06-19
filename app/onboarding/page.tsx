"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import { Loader2, Sparkles, Building2, Globe, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Sync workspace slug with workspace name
  useEffect(() => {
    const generatedSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    setSlug(generatedSlug);
  }, [name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      // Create user sync check to ensure UserModel entry exists
      await fetch("/api/users/me");

      const response = await fetch("/api/workspace", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, slug, description }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to create workspace");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      console.error("Workspace creation failed:", err);
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Preparing onboarding...</p>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12 bg-background text-foreground selection:bg-primary/30">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <span className="text-xs text-muted-foreground">{user?.emailAddresses?.[0]?.emailAddress}</span>
        <UserButton />
      </div>

      <div className="w-full max-w-md space-y-8 rounded-2xl border border-border/50 bg-gradient-to-br from-card/60 to-card/10 p-8 shadow-2xl backdrop-blur-xl">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/10">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Welcome to DevCollab
          </h2>
          <p className="text-sm text-muted-foreground">
            Let&apos;s create a workspace to collaborate on your software projects.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-primary/70" />
              Workspace Name
            </label>
            <input
              id="name"
              type="text"
              placeholder="e.g. Acme Engineering"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="slug" className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-primary/70" />
              Workspace URL Slug
            </label>
            <div className="flex rounded-lg border border-border bg-background/50 overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all">
              <span className="bg-muted px-3 py-2 text-xs font-medium text-muted-foreground flex items-center select-none border-r border-border/50">
                devcollab.com/
              </span>
              <input
                id="slug"
                type="text"
                placeholder="e.g. acme-engineering"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                className="w-full bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="description" className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-primary/70" />
              Description
            </label>
            <textarea
              id="description"
              placeholder="Provide a description for your engineering teams..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all resize-none"
            />
          </div>

          {error && (
            <p className="text-xs font-medium text-red-400 mt-2">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full justify-center mt-3 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Create Workspace
          </Button>
        </form>
      </div>
    </main>
  );
}
