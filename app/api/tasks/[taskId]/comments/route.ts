import { NextResponse, type NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectMongoose } from "@/lib/db/mongoose";
import { TaskModel } from "@/lib/db/models";
import { getCurrentMongoUser } from "@/lib/server/auth/getCurrentMongoUser";
import { activityService } from "@/lib/server/services/activity.service";
import { realtimeBroker } from "@/lib/server/realtime-broker";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const user = await getCurrentMongoUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId } = await params;
    const body = await req.json().catch(() => ({}));
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    await connectMongoose();
    const task = await TaskModel.findByIdAndUpdate(
      new mongoose.Types.ObjectId(taskId),
      {
        $push: { comments: { userId: user._id, content } }
      },
      { new: true }
    ).populate("assigneeId").populate("comments.userId");

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const initials = user.name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

    // Log activity
    await activityService.create({
      workspaceId: task.workspaceId.toString(),
      projectId: task.projectId.toString(),
      taskId: task._id.toString(),
      user: { name: user.name, initials, avatarUrl: user.avatarUrl },
      action: "commented on task",
      target: task.title,
    });

    // Broadcast update
    const assigneeDoc = task.assigneeId;
    const name = assigneeDoc?.name || "Unassigned";
    const assigneeInitials = name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

    const mapped = {
      id: task._id.toString(),
      title: task.title,
      priority: task.priority,
      status: task.status,
      assignee: {
        id: assigneeDoc?._id?.toString() || "unassigned",
        name,
        initials: assigneeInitials,
        avatarUrl: assigneeDoc?.avatarUrl || undefined,
      },
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
    };

    await realtimeBroker.publish(task.projectId.toString(), "taskUpdated", mapped);

    return NextResponse.json({ comments: task.comments }, { status: 201 });
  } catch (err) {
    console.error("POST /api/tasks/[taskId]/comments error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
