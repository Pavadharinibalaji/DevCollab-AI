import { NextResponse, type NextRequest } from "next/server";
import { connectMongoose } from "@/lib/db/mongoose";
import { getCurrentMongoUser } from "@/lib/server/auth/getCurrentMongoUser";
import { UserKeyModel, USER_KEY_PROVIDERS, type UserKeyProvider } from "@/models/UserKey";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentMongoUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const provider = String(body?.provider || "").trim() as UserKeyProvider;

    const validProviders = USER_KEY_PROVIDERS as unknown as string[];
    if (!validProviders.includes(provider)) {
      return NextResponse.json({ error: "Unsupported provider" }, { status: 400 });
    }

    const conn = await connectMongoose();
    if (!conn) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }

    // Verify key exists for this provider
    const targetKey = await UserKeyModel.findOne({ userId: String(user._id), provider }).lean();
    if (!targetKey) {
      return NextResponse.json({ error: `No saved API key found for provider: ${provider}` }, { status: 400 });
    }

    // Set all other keys to inactive, and this one to active
    await UserKeyModel.updateMany({ userId: String(user._id) }, { $set: { isActive: false } });
    await UserKeyModel.updateOne({ userId: String(user._id), provider }, { $set: { isActive: true } });

    return NextResponse.json({ success: true, activeProvider: provider }, { status: 200 });
  } catch (err) {
    console.error("POST /api/ai/set-active error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
