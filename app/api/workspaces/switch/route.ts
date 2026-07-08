import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { connectMongoose } from "@/lib/db/mongoose";
import { WorkspaceModel } from "@/lib/db/models/workspace.model";
import { getCurrentMongoUser } from "@/lib/server/auth/getCurrentMongoUser";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentMongoUser();
    if (!user) {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId } = await req.json().catch(() => ({}));
    if (!workspaceId) {
      return NextResponse.json({ success: false, data: null, error: "workspaceId is required" }, { status: 400 });
    }

    await connectMongoose();
    const workspace = await WorkspaceModel.findOne({
      _id: workspaceId,
      "members.userId": user._id,
    });

    if (!workspace) {
      return NextResponse.json({ success: false, data: null, error: "Workspace not found or access denied" }, { status: 404 });
    }

    const cookieStore = await cookies();
    cookieStore.set("workspaceId", workspaceId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      httpOnly: false, // Make it readable by client js if needed, but standard http cookie
      sameSite: "lax",
    });

    return NextResponse.json({ success: true, data: { workspaceId }, error: null }, { status: 200 });
  } catch (err) {
    console.error("POST /api/workspaces/switch error:", err);
    return NextResponse.json({ success: false, data: null, error: String(err) }, { status: 500 });
  }
}
