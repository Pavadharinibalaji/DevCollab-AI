import { NextResponse } from "next/server";
import { activityService } from "@/lib/server/services/activity.service";
import { connectMongoose } from "@/lib/db/mongoose";
import { getCurrentMongoUser } from "@/lib/server/auth/getCurrentMongoUser";
import { getActiveWorkspace } from "@/lib/server/auth/getActiveWorkspace";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getCurrentMongoUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongoose();
    const workspace = await getActiveWorkspace(user);
    if (!workspace) {
      return NextResponse.json({ activities: [] }, { status: 200 });
    }
    const activities = await activityService.list(workspace._id.toString());
    
    return NextResponse.json({ activities }, { status: 200 });
  } catch (err) {
    console.error("GET /api/activities error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
