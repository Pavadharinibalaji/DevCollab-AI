import { NextResponse, type NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectMongoose } from "@/lib/db/mongoose";
import { WorkspaceModel, UserModel, TaskModel } from "@/lib/db/models";
import { getCurrentMongoUser } from "@/lib/server/auth/getCurrentMongoUser";
import { getActiveWorkspace } from "@/lib/server/auth/getActiveWorkspace";
import { activityService } from "@/lib/server/services/activity.service";
import { realtimeBroker } from "@/lib/server/realtime-broker";

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await getCurrentMongoUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId: memberId } = await params;
    const body = await req.json().catch(() => ({}));
    const { role } = body;

    if (!role || !["admin", "member"].includes(role)) {
      return NextResponse.json({ error: "Invalid role specified" }, { status: 400 });
    }

    await connectMongoose();
    const workspace = await getActiveWorkspace(user);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Get current user's role in this workspace
    const currentUserMember = workspace.members.find(
      (m: any) => m.userId?._id?.toString() === user._id.toString() || m.userId?.toString() === user._id.toString()
    );
    if (!currentUserMember || (currentUserMember.role !== "owner" && currentUserMember.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized: only owners or admins can change roles" }, { status: 403 });
    }

    // Verify membership of targeted user
    const memberToUpdate = workspace.members.find(
      (m: any) => m.userId?._id?.toString() === memberId || m.userId?.toString() === memberId
    );
    if (!memberToUpdate) {
      return NextResponse.json({ error: "Member not found in workspace" }, { status: 404 });
    }

    // Verify ownership security
    const ownerIdStr = workspace.ownerId.toString();
    if (memberId === ownerIdStr) {
      return NextResponse.json({ error: "Cannot change the role of the workspace owner" }, { status: 400 });
    }

    // If current user is admin, they cannot modify other admins or owner
    if (currentUserMember.role === "admin") {
      if (memberToUpdate.role === "admin" || memberId === ownerIdStr) {
        return NextResponse.json({ error: "Admins cannot change role of other admins or the owner" }, { status: 403 });
      }
    }

    // Perform update
    await WorkspaceModel.updateOne(
      { 
        _id: workspace._id, 
        "members.userId": new mongoose.Types.ObjectId(memberId) 
      },
      { $set: { "members.$.role": role } }
    );

    const updatedUser = await UserModel.findById(memberId);
    const targetName = updatedUser ? updatedUser.name : "Member";
    const initials = user.name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

    await activityService.create({
      workspaceId: workspace._id.toString(),
      user: { name: user.name, initials, avatarUrl: user.avatarUrl },
      action: `changed role of ${targetName} to`,
      target: role,
    });

    await realtimeBroker.publish("global", "teamUpdated", {});

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("PATCH /api/workspace/members error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await getCurrentMongoUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId: memberId } = await params;

    await connectMongoose();
    const workspace = await getActiveWorkspace(user);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Get current user's role in this workspace
    const currentUserMember = workspace.members.find(
      (m: any) => m.userId?._id?.toString() === user._id.toString() || m.userId?.toString() === user._id.toString()
    );
    if (!currentUserMember || (currentUserMember.role !== "owner" && currentUserMember.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized: only owners or admins can remove members" }, { status: 403 });
    }

    // Verify membership of targeted user
    const memberToDelete = workspace.members.find(
      (m: any) => m.userId?._id?.toString() === memberId || m.userId?.toString() === memberId
    );
    if (!memberToDelete) {
      return NextResponse.json({ error: "Member not found in workspace" }, { status: 404 });
    }

    // Verify ownership security
    const ownerIdStr = workspace.ownerId.toString();
    if (memberId === ownerIdStr) {
      return NextResponse.json({ error: "Cannot remove the workspace owner" }, { status: 400 });
    }

    // If current user is admin, they cannot modify other admins or owner
    if (currentUserMember.role === "admin") {
      if (memberToDelete.role === "admin" || memberId === ownerIdStr) {
        return NextResponse.json({ error: "Admins cannot remove other admins or the owner" }, { status: 403 });
      }
    }

    // Perform delete
    await WorkspaceModel.updateOne(
      { _id: workspace._id },
      { $pull: { members: { userId: new mongoose.Types.ObjectId(memberId) } } }
    );

    // Unassign tasks from this user in this workspace
    await TaskModel.updateMany(
      { workspaceId: workspace._id, assigneeId: new mongoose.Types.ObjectId(memberId) },
      { $unset: { assigneeId: 1 } }
    );

    const deletedUser = await UserModel.findById(memberId);
    const targetName = deletedUser ? deletedUser.name : "Member";
    const initials = user.name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

    await activityService.create({
      workspaceId: workspace._id.toString(),
      user: { name: user.name, initials, avatarUrl: user.avatarUrl },
      action: `removed member`,
      target: targetName,
    });

    await realtimeBroker.publish("global", "teamUpdated", {});

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("DELETE /api/workspace/members error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
