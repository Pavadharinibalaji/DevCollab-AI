import { DashboardShell } from "@/components/layout/dashboard-shell";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { SocketProvider } from "@/providers/socket-provider";
import { connectMongoose } from "@/lib/db/mongoose";
import { WorkspaceModel } from "@/lib/db/models";
import { getCurrentMongoUser } from "@/lib/server/auth/getCurrentMongoUser";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Check Clerk session first
  const { userId } = await auth();
  if (!userId) {
    // If not signed in to Clerk, redirect to sign-in
    redirect("/sign-in");
  }

  const dbUser = await getCurrentMongoUser();
  if (!dbUser) {
    // User has Clerk session but isn't synced in MongoDB yet, redirect to onboarding
    redirect("/onboarding");
  }

  await connectMongoose();
  const userWorkspace = await WorkspaceModel.findOne({ "members.userId": dbUser._id });
  if (!userWorkspace) {
    redirect("/onboarding");
  }

  return (
    <SocketProvider>
      <DashboardShell>{children}</DashboardShell>
    </SocketProvider>
  );
}
