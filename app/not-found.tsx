import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-4xl font-semibold">404</h1>
      <p className="text-muted-foreground">This page could not be found.</p>
      <Link href="/">
        <Button>Back to home</Button>
      </Link>
    </main>
  );
}
