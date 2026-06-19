import { DashboardShell } from "@/components/layout/dashboard-shell";
import { redirect } from "next/navigation";

import { SocketProvider } from "@/providers/socket-provider";
import { connectMongoose } from "@/lib/db/mongoose";
import { WorkspaceModel } from "@/lib/db/models";
import { getCurrentMongoUser } from "@/lib/server/auth/getCurrentMongoUser";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const dbUser = await getCurrentMongoUser();
  if (!dbUser) {
    redirect("/sign-in");
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
