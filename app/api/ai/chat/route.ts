import { NextResponse, type NextRequest } from "next/server";
import { connectMongoose } from "@/lib/db/mongoose";
import { getCurrentMongoUser } from "@/lib/server/auth/getCurrentMongoUser";
import { AICoordinator } from "@/lib/ai/coordinator/coordinator";
import { AIRequest } from "@/lib/ai/types/request";

export const runtime = "nodejs";

/**
 * Chat API endpoint connects the chatbot UI to the AICoordinator.
 * Decrypts user settings API keys, binds context identifiers, and triggers executions.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentMongoUser();
    if (!user) {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const message = String(body?.message || "").trim();
    const projectId = body?.projectId ? String(body.projectId).trim() : "";

    if (!message) {
      return NextResponse.json({ success: false, data: null, error: "Message is required" }, { status: 400 });
    }

    const conn = await connectMongoose();
    if (!conn) {
      return NextResponse.json({ success: false, data: null, error: "Database connection failed" }, { status: 500 });
    }

    // Build standard AIRequest payload configuration
    const aiRequest: AIRequest = {
      id: "chat_" + Math.random().toString(36).substring(2, 15),
      prompt: message,
      context: {
        userId: String(user._id),
        projectId: projectId || undefined,
      },
    };

    // Execute through the AI Coordinator pipeline
    const coordinator = new AICoordinator();
    const response = await coordinator.execute(aiRequest);

    if (response.success) {
      return NextResponse.json({
        success: true,
        data: { reply: response.content },
        error: null,
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        data: null,
        error: response.error || response.content || "Execution failed",
      }, { status: 400 });
    }
  } catch (err) {
    console.error("POST /api/ai/chat error:", err);
    return NextResponse.json({ success: false, data: null, error: "Server error" }, { status: 500 });
  }
}
