"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  priorityFilter: string;
  setPriorityFilter: (priority: string) => void;
}

export function ProjectFilters({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
}: ProjectFiltersProps) {
  const statuses = [
    { value: "all", label: "All Statuses" },
    { value: "active", label: "Active" },
    { value: "planning", label: "Planning" },
    { value: "paused", label: "Paused" },
    { value: "completed", label: "Completed" },
  ];

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-card/10 p-4 rounded-xl border border-border/40">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search projects by title or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-border bg-background/50 pl-10 pr-4 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
        />
      </div>

      {/* Filter Tabs & Dropdowns */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/30 overflow-x-auto">
          {statuses.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={cn(
                "px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap",
                statusFilter === s.value
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Priority Dropdown */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-lg border border-border bg-background/50 px-3 py-1.5 text-xs font-semibold text-foreground focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
            <option value="urgent">Urgent Priority</option>
          </select>
        </div>
      </div>
    </div>
  );
}
