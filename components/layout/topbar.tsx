"use client";

import { Bell, Menu, Search } from "lucide-react";
import Link from "next/link";
import { Show, UserButton } from "@clerk/nextjs";
import { clerkTheme } from "@/lib/clerk-theme";

import { Button } from "@/components/ui/button";
import { buttonClassName } from "@/components/ui/button";

type TopbarProps = {
  onMenuClick?: () => void;
};

export function Topbar({ onMenuClick }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border/70 bg-background/80 px-3 backdrop-blur-md sm:gap-4 sm:px-4 lg:px-6">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="shrink-0 text-muted-foreground hover:text-foreground lg:hidden"
        aria-label="Open navigation"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="relative min-w-0 flex-1 max-w-xl">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          type="search"
          placeholder="Search or jump to…"
          className="h-9 w-full rounded-lg border border-border/60 bg-secondary/40 py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none ring-primary/40 transition-shadow focus:border-border focus:bg-card/60 focus:ring-2"
          aria-label="Search"
        />
        <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border border-border/60 bg-muted/80 px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline">
          ⌘K
        </kbd>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>
        <div className="hidden h-6 w-px bg-border/80 sm:block" aria-hidden />
        <Show when="signed-out">
          <Link
            href="/sign-in"
            className={buttonClassName({ variant: "outline", size: "sm", className: "border-border/80 bg-background/40 hover:bg-accent" })}
          >
            Sign in
          </Link>
        </Show>
        <Show when="signed-in">
          <UserButton
            appearance={{
              ...clerkTheme,
              elements: {
                ...clerkTheme.elements,
                userButtonAvatarBox: "h-8 w-8",
              },
            }}
          />
        </Show>
      </div>
    </header>
  );
}
