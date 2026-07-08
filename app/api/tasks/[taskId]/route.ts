import { NextResponse, type NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectMongoose } from "@/lib/db/mongoose";
import { TaskModel, ActivityModel } from "@/lib/db/models";
import { taskController } from "@/lib/server/tasks/task.controller";
import { getCurrentMongoUser } from "@/lib/server/auth/getCurrentMongoUser";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
     const user = await getCurrentMongoUser();
     if (!user) {
       return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
     }

     const { taskId } = await params;

     const conn = await connectMongoose();
     if (!conn) {
       return NextResponse.json({ success: false, data: null, error: "Database connection failed" }, { status: 500 });
     }

     const task = await TaskModel.findById(new mongoose.Types.ObjectId(taskId))
       .populate("assigneeId")
       .populate("comments.userId")
       .lean();

     if (!task) {
       return NextResponse.json({ success: false, data: null, error: "Task not found" }, { status: 404 });
     }

     const activities = await ActivityModel.find({ taskId: task._id })
       .sort({ timestamp: -1 })
       .lean();

     return NextResponse.json({ success: true, data: { task, activities }, error: null }, { status: 200 });
  } catch (error) {
    console.error("GET /api/tasks/[taskId] Error:", error);
    return NextResponse.json({ success: false, data: null, error: String(error) }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const { taskId } = await params;
    return await taskController.update(taskId, request);
  } catch (error) {
    console.error("PATCH /api/tasks/[taskId] Error:", error);
    return NextResponse.json({ success: false, data: null, error: "Failed to update task" }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    return await taskController.remove(taskId);
  } catch (error) {
    console.error("DELETE /api/tasks/[taskId] Error:", error);
    return NextResponse.json({ success: false, data: null, error: "Failed to delete task" }, { status: 400 });
  }
}
