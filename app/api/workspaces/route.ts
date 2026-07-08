import { NextResponse } from "next/server";
import { connectMongoose } from "@/lib/db/mongoose";
import { WorkspaceModel } from "@/lib/db/models/workspace.model";
import { getCurrentMongoUser } from "@/lib/server/auth/getCurrentMongoUser";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getCurrentMongoUser();
    if (!user) {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }

    await connectMongoose();
    const workspaces = await WorkspaceModel.find({ "members.userId": user._id }).lean();
    return NextResponse.json({ success: true, data: { workspaces }, error: null }, { status: 200 });
  } catch (err) {
    console.error("GET /api/workspaces error:", err);
    return NextResponse.json({ success: false, data: null, error: String(err) }, { status: 500 });
  }
}
