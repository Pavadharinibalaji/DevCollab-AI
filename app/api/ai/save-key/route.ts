import { NextResponse, type NextRequest } from "next/server";
import { connectMongoose } from "@/lib/db/mongoose";
import { getCurrentMongoUser } from "@/lib/server/auth/getCurrentMongoUser";
import { encrypt } from "@/lib/crypto";
import { UserKeyModel, USER_KEY_PROVIDERS, type UserKeyProvider } from "@/models/UserKey";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentMongoUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const apiKey = String(body?.apiKey || "").trim();
    const provider = String(body?.provider || "openai").trim() as UserKeyProvider;

    if (!apiKey) {
      return NextResponse.json({ error: "Missing apiKey" }, { status: 400 });
    }
    
    const validProviders = USER_KEY_PROVIDERS as unknown as string[];
    if (!validProviders.includes(provider)) {
      return NextResponse.json({ error: "Unsupported provider" }, { status: 400 });
    }

    const conn = await connectMongoose();
    if (!conn) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }

    const encrypted = encrypt(apiKey);

    // If there is no active key for the user, or if explicitly requested, make this active
    const activeKeyExists = await UserKeyModel.findOne({ userId: String(user._id), isActive: true }).lean();
    const makeActive = !activeKeyExists || body?.makeActive === true;

    if (makeActive) {
      // Deactivate other providers' keys first
      await UserKeyModel.updateMany({ userId: String(user._id) }, { $set: { isActive: false } });
    }

    const query = { userId: user._id, provider } as any;
    await UserKeyModel.findOneAndUpdate(
      query,
      { $set: { apiKey: encrypted, isActive: makeActive } },
      { upsert: true, new: true },
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("POST /api/ai/save-key error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

