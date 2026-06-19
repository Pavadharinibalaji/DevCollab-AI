import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6">
      <div className="max-w-2xl text-center">
        <p className="mb-3 text-sm font-medium uppercase tracking-wider text-primary">
          DevCollab
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Ship faster with your team
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          A modern SaaS dashboard for planning, tracking, and collaborating on
          software projects.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link href="/dashboard">
          <Button>Open dashboard</Button>
        </Link>
        <Link href="/sign-in">
          <Button variant="outline">Sign in</Button>
        </Link>
      </div>
    </main>
  );
}
