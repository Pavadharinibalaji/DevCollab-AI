import { NextResponse, type NextRequest } from "next/server";
import { projectService } from "@/lib/server/services/project.service";
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
      return NextResponse.json({ projects: [] }, { status: 200 });
    }
    const projects = await projectService.list(workspace._id.toString());
    return NextResponse.json({ projects }, { status: 200 });
  } catch (err) {
    console.error("GET /api/projects error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentMongoUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    await connectMongoose();
    const workspace = await getActiveWorkspace(user);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const project = await projectService.create(workspace._id.toString(), {
      name: body.name || body.title,
      description: body.description,
      status: body.status,
      priority: body.priority,
      progress: body.progress,
      dueDate: body.dueDate,
      members: body.members,
      user: body.user,
      createdBy: user._id.toString(),
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (err) {
    console.error("POST /api/projects error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
