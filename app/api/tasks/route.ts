import { NextResponse, type NextRequest } from "next/server";

import { taskController } from "@/lib/server/tasks/task.controller";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    return await taskController.listByProject(req);
  } catch (error) {
    console.error("GET /api/tasks Error:", error);
    // Fallback to avoid 500 if anything unhandled throws
    return NextResponse.json({ tasks: [], error: "Fallback mode active" }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    return await taskController.create(req);
  } catch (error) {
    console.error("POST /api/tasks Error:", error);
    return NextResponse.json({ error: "Failed to create task in fallback mode" }, { status: 400 });
  }
}

