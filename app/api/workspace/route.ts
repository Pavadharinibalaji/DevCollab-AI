import { NextResponse, type NextRequest } from "next/server";
import { workspaceService } from "@/lib/server/services/workspace.service";
import { WorkspaceModel, InvitationModel } from "@/lib/db/models";
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
      return NextResponse.json({ workspace: null, metrics: null }, { status: 200 });
    }

    const metrics = await workspaceService.getMetrics(workspace._id.toString());

    const invitations = await InvitationModel.find({
      workspaceId: workspace._id,
      status: "pending",
      expiresAt: { $gt: new Date() },
    }).populate("invitedBy", "name email");

    return NextResponse.json({
      workspace,
      metrics,
      invitations,
    }, { status: 200 });
  } catch (err) {
    console.error("GET /api/workspace error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentMongoUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongoose();
    const body = await req.json();

    if (body.name && body.slug) {
      // Create Workspace
      const workspace = await workspaceService.createWorkspace(
        user._id.toString(),
        body.name,
        body.slug,
        body.description
      );
      return NextResponse.json({ success: true, workspace }, { status: 201 });
    } else if (body.email) {
      // Invite Member
      const workspace = await getActiveWorkspace(user);
      if (!workspace) {
        return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
      }
      const res = await workspaceService.inviteMember(
        workspace._id.toString(),
        body.email,
        body.role,
        user._id.toString()
      );
      if (!res.success) {
        return NextResponse.json({ error: res.error }, { status: res.statusCode || 400 });
      }
      return NextResponse.json(res, { status: 200 });
    } else {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }
  } catch (err) {
    console.error("POST /api/workspace error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const user = await getCurrentMongoUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongoose();
    const activeWs = await getActiveWorkspace(user);
    if (!activeWs) {
      return NextResponse.json({ error: "Workspace not found or unauthorized to delete" }, { status: 404 });
    }

    const workspace = await WorkspaceModel.findOne({ _id: activeWs._id, ownerId: user._id });
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found or unauthorized to delete" }, { status: 404 });
    }

    await workspaceService.deleteWorkspace(workspace._id.toString());

    return NextResponse.json({ success: true, message: "Workspace deleted successfully" }, { status: 200 });
  } catch (err) {
    console.error("DELETE /api/workspace error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentMongoUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongoose();
    const body = await req.json();

    // Get user's active workspace
    const workspace = await getActiveWorkspace(user);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Check permissions (only owner or admin)
    const memberRecord = workspace.members.find((m: any) => m.userId?._id?.toString() === user._id.toString() || m.userId?.toString() === user._id.toString());
    if (!memberRecord || (memberRecord.role !== "owner" && memberRecord.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized to update workspace" }, { status: 403 });
    }

    const { name, slug, description } = body;
    const updateData: any = {};
    if (name) updateData.name = name;
    if (slug) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;

    // Verify slug uniqueness if it changed
    if (slug && slug !== workspace.slug) {
      const existing = await WorkspaceModel.findOne({ slug });
      if (existing) {
        return NextResponse.json({ error: "Workspace slug already in use" }, { status: 400 });
      }
    }

    const updatedWorkspace = await WorkspaceModel.findByIdAndUpdate(
      workspace._id,
      { $set: updateData },
      { new: true }
    );

    return NextResponse.json({ success: true, workspace: updatedWorkspace }, { status: 200 });
  } catch (err) {
    console.error("PATCH /api/workspace error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
