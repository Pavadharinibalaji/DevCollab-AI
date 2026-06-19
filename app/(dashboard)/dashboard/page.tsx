import type { Metadata } from "next";
import { currentUser } from "@clerk/nextjs/server";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";

export const metadata: Metadata = {
  title: "Dashboard Overview",
};

export default async function DashboardPage() {
  // Fetch current user from Clerk context on the server side
  const user = await currentUser();

  // Determine user display name
  const name = user
    ? user.firstName
      ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
      : user.username || "Developer"
    : "Developer";

  const avatarUrl = user?.imageUrl;

  return (
    <DashboardOverview userDisplayName={name} userAvatarUrl={avatarUrl} />
  );
}
