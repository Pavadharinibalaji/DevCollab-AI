"use client";

import { useState } from "react";
import AgentSidebar from "@/components/chatbot/AgentSidebar";
import { DashboardFrame } from "@/components/layout/dashboard-frame";

type DashboardShellProps = {
  children: React.ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  const [isAgentOpen, setIsAgentOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground antialiased select-none">
      {/* Main workspace layout content */}
      <div
        className={`relative flex flex-col h-full transition-all duration-300 ease-in-out ${
          isAgentOpen ? "w-[82%]" : "w-full"
        }`}
      >
        {/* Toggle bar / Header override if needed, or simply let the frame handle page content */}
        <div className="flex justify-end items-center px-6 py-3 border-b border-border/40 bg-secondary/10 shrink-0">
          <button
            onClick={() => setIsAgentOpen((prev) => !prev)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold tracking-wide shadow-sm transition-all duration-200 active:scale-[0.98] ${
              isAgentOpen
                ? "bg-purple-600/10 text-purple-400 border border-purple-500/20 hover:bg-purple-600/20"
                : "bg-purple-600 text-white hover:bg-purple-500 hover:shadow-md hover:shadow-purple-900/10"
            }`}
          >
            {isAgentOpen ? "Close Agent" : "AI Agent"}
          </button>
        </div>

        {/* Existing child layout frames */}
        <div className="flex-1 overflow-hidden min-h-0">
          <DashboardFrame isAgentOpen={isAgentOpen}>{children}</DashboardFrame>
        </div>
      </div>

      {/* Slide-out Agent AI Sidebar panel */}
      {isAgentOpen && (
        <div className="w-[18%] h-full shrink-0 border-l border-border/40 bg-neutral-950 flex flex-col overflow-hidden animate-fade-in">
          <AgentSidebar />
        </div>
      )}
    </div>
  );
}