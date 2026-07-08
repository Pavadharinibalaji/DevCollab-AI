import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { userService } from "@/lib/server/services/user.service";
import { WorkspaceModel } from "@/lib/db/models";
import { connectMongoose } from "@/lib/db/mongoose";

export const runtime = "nodejs";

export async function GET() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }

    await connectMongoose();
    const dbUser = await userService.syncUser(clerkUser);
    if (!dbUser) {
      return NextResponse.json({ success: false, data: null, error: "User sync failed" }, { status: 500 });
    }

    const workspace = await WorkspaceModel.findOne({ "members.userId": dbUser._id }).lean();

    return NextResponse.json({
      success: true,
      data: {
        user: dbUser,
        workspace: workspace || null,
      },
      error: null
    }, { status: 200 });
  } catch (err) {
    console.error("GET /api/users/me error:", err);
    return NextResponse.json({ success: false, data: null, error: String(err) }, { status: 500 });
  }
}

