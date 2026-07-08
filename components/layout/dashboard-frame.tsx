"use client";

import { useEffect, useState } from "react";

import { SidebarContent } from "@/components/layout/sidebar-content";
import { Topbar } from "@/components/layout/topbar";
import { DevBotChat } from "@/components/chatbot/devbot-chat";

type DashboardFrameProps = {
  children: React.ReactNode;
  isAgentOpen?: boolean;
};

export function DashboardFrame({ children, isAgentOpen }: DashboardFrameProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  return (
    <div className="flex h-full min-h-0 w-full">
      <aside className="hidden w-[260px] shrink-0 flex-col border-r border-border/70 bg-secondary/30 lg:flex">
        <SidebarContent />
      </aside>

      {mobileOpen ? (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-[min(280px,100vw-3rem)] flex-col border-r border-border/70 bg-secondary/95 shadow-2xl shadow-black/40 backdrop-blur-xl lg:hidden">
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-background px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>

      {/* DevBot floating chat — available across all dashboard pages */}
      <DevBotChat isAgentOpen={isAgentOpen} />
    </div>
  );
}
