import type { NavItem } from "@/types";

export const appConfig = {
  name: "DevCollab",
  description: "Collaborative SaaS dashboard for development teams",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
} as const;

export const dashboardNav: NavItem[] = [
  { title: "Overview", href: "/dashboard", icon: "layout-dashboard" },
  { title: "Board", href: "/dashboard/board", icon: "columns" },
  { title: "Projects", href: "/dashboard/projects", icon: "folder-kanban" },
  { title: "Team", href: "/dashboard/team", icon: "users" },
  { title: "Settings", href: "/dashboard/settings", icon: "settings" },
];
