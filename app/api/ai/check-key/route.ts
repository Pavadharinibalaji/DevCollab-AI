import { NextResponse } from "next/server";
import { connectMongoose } from "@/lib/db/mongoose";
import { getCurrentMongoUser } from "@/lib/server/auth/getCurrentMongoUser";
import { UserKeyModel } from "@/lib/db/models";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getCurrentMongoUser();
    if (!user) {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }

    const conn = await connectMongoose();
    if (!conn) {
      return NextResponse.json({ success: false, data: null, error: "Database connection failed" }, { status: 500 });
    }

    const keyDocs = await UserKeyModel.find({ userId: String(user._id) }).select("provider isActive").lean();
    
    let activeProvider: string | null = null;
    const savedProviders = keyDocs.map((k) => k.provider);
    
    const activeDoc = keyDocs.find((k) => k.isActive);
    if (activeDoc) {
      activeProvider = activeDoc.provider;
    }

    const workspaceProvider = (process.env.AI_PROVIDER || "gemini").toLowerCase();
    const workspaceModel = workspaceProvider === "openai" ? "gpt-4o-mini" : "gemini-1.5-flash";
    const workspaceConfigured = workspaceProvider === "openai" 
      ? !!process.env.OPENAI_API_KEY 
      : !!process.env.GEMINI_API_KEY;

    return NextResponse.json({
      success: true,
      data: {
        hasKey: keyDocs.length > 0,
        activeProvider,
        savedProviders,
        useOwnKey: !!activeProvider,
        workspaceProvider,
        workspaceModel,
        workspaceConfigured,
      },
      error: null
    }, { status: 200 });
  } catch (err) {
    console.error("GET /api/ai/check-key error:", err);
    return NextResponse.json({ success: false, data: null, error: "Server error" }, { status: 500 });
  }
}

