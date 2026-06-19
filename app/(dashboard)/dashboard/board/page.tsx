import type { Metadata } from "next";
import Link from "next/link";

import { KanbanBoard } from "@/components/kanban/kanban-board";
import { PageHeader } from "@/components/shared/page-header";
import { buttonClassName } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Board",
};

export default function BoardPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Board"
        description="Drag cards between columns to update status. Keyboard navigation supported."
        action={
          <Link
            href="/dashboard/projects"
            className={buttonClassName({ variant: "outline", size: "sm", className: "text-foreground" })}
          >
            Project list
          </Link>
        }
      />
      <KanbanBoard />
    </div>
  );
}
