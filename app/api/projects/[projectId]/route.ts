import { NextResponse, type NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectMongoose } from "@/lib/db/mongoose";
import { ProjectModel, TaskModel, ActivityModel } from "@/lib/db/models";
import { projectService } from "@/lib/server/services/project.service";
import { getCurrentMongoUser } from "@/lib/server/auth/getCurrentMongoUser";

export const runtime = "nodejs";

function mapUserToMember(user: any) {
  if (!user) return null;
  if (typeof user === "string") {
    return {
      id: user,
      name: "Invited Member",
      initials: "IM",
      role: "Developer",
      avatarColor: "bg-indigo-500 text-indigo-100",
      avatarUrl: undefined,
    };
  }
  const name = user.name || "User";
  const initials = name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";
  return {
    id: user._id?.toString() || user.id || "",
    name,
    initials,
    role: "Developer",
    avatarColor: "bg-indigo-500 text-indigo-100",
    avatarUrl: user.avatarUrl || undefined,
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const user = await getCurrentMongoUser();
    if (!user) {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    const conn = await connectMongoose();
    if (!conn) {
      return NextResponse.json({ success: false, data: null, error: "Database connection failed" }, { status: 500 });
    }

    const pObjectId = new mongoose.Types.ObjectId(projectId);

    const projectDoc = await ProjectModel.findById(pObjectId).populate("members").lean({ virtuals: true });
    if (!projectDoc) {
      return NextResponse.json({ success: false, data: null, error: "Project not found" }, { status: 404 });
    }

    const taskDocs = await TaskModel.find({ projectId: pObjectId }).populate("assigneeId").lean();
    const activityDocs = await ActivityModel.find({ projectId: pObjectId }).sort({ timestamp: -1 }).limit(15).lean();

    const members = (projectDoc.members || []).map(mapUserToMember).filter(Boolean);

    const tasks = taskDocs.map((t) => {
      const assigneeUser = t.assigneeId;
      const assignee = assigneeUser
        ? mapUserToMember(assigneeUser)
        : { id: "unassigned", name: "Unassigned", initials: "U", role: "Unassigned", avatarColor: "bg-muted text-muted-foreground" };
      return {
        id: t._id.toString(),
        title: t.title,
        status: t.status,
        priority: t.priority,
        assignee,
        dueDate: t.dueDate ? new Date(t.dueDate).toISOString().split("T")[0] : "",
      };
    });

    const activities = activityDocs.map((a) => {
      return {
        id: a._id.toString(),
        user: {
          name: a.user.name,
          initials: a.user.initials,
          avatarUrl: a.user.avatarUrl,
        },
        action: a.action,
        target: a.target,
        timestamp: a.timestamp ? new Date(a.timestamp).toLocaleString() : "Just now",
      };
    });

    const project = {
      id: projectDoc._id.toString(),
      workspaceId: projectDoc.workspaceId?.toString() || "",
      title: projectDoc.title || projectDoc.name,
      description: projectDoc.description || "",
      progress: projectDoc.progress || 0,
      priority: projectDoc.priority || "medium",
      status: projectDoc.status || "planning",
      dueDate: projectDoc.dueDate ? new Date(projectDoc.dueDate).toISOString().split("T")[0] : "",
      members,
      tasks,
      activities,
    };

    return NextResponse.json({ success: true, data: { project }, error: null }, { status: 200 });
  } catch (err) {
    console.error("GET /api/projects/[projectId] error:", err);
    return NextResponse.json({ success: false, data: null, error: String(err) }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const user = await getCurrentMongoUser();
    if (!user) {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;
    const body = await req.json();

    const updated = await projectService.update(projectId, {
      name: body.name || body.title,
      description: body.description,
      status: body.status,
      priority: body.priority,
      progress: body.progress,
      dueDate: body.dueDate,
      members: body.members,
      user: body.user,
    });

    return NextResponse.json({ success: true, data: { project: updated }, error: null }, { status: 200 });
  } catch (err) {
    console.error("PATCH /api/projects/[projectId] error:", err);
    return NextResponse.json({ success: false, data: null, error: String(err) }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const user = await getCurrentMongoUser();
    if (!user) {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    const success = await projectService.delete(projectId);
    if (!success) {
      return NextResponse.json({ success: false, data: null, error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { message: "Project deleted successfully" }, error: null }, { status: 200 });
  } catch (err) {
    console.error("DELETE /api/projects/[projectId] error:", err);
    return NextResponse.json({ success: false, data: null, error: String(err) }, { status: 500 });
  }
}

