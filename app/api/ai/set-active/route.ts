import { NextResponse, type NextRequest } from "next/server";
import { connectMongoose } from "@/lib/db/mongoose";
import { getCurrentMongoUser } from "@/lib/server/auth/getCurrentMongoUser";
import { UserKeyModel, USER_KEY_PROVIDERS, type UserKeyProvider } from "@/lib/db/models";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentMongoUser();
    if (!user) {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const useOwnKey = body?.useOwnKey;

    const conn = await connectMongoose();
    if (!conn) {
      return NextResponse.json({ success: false, data: null, error: "Database connection failed" }, { status: 500 });
    }

    if (useOwnKey !== undefined) {
      if (useOwnKey === false) {
        await UserKeyModel.updateMany({ userId: String(user._id) }, { $set: { isActive: false } });
        return NextResponse.json({ success: true, data: { useOwnKey: false, activeProvider: null }, error: null }, { status: 200 });
      } else {
        const firstKey = await UserKeyModel.findOne({ userId: String(user._id) });
        if (!firstKey) {
          return NextResponse.json({ success: false, data: null, error: "Please configure at least one API key first." }, { status: 400 });
        }
        await UserKeyModel.updateMany({ userId: String(user._id) }, { $set: { isActive: false } });
        await UserKeyModel.updateOne({ _id: firstKey._id }, { $set: { isActive: true } });
        return NextResponse.json({ success: true, data: { useOwnKey: true, activeProvider: firstKey.provider }, error: null }, { status: 200 });
      }
    }

    const provider = String(body?.provider || "").trim() as UserKeyProvider;
    const validProviders = USER_KEY_PROVIDERS as unknown as string[];
    if (!validProviders.includes(provider)) {
      return NextResponse.json({ success: false, data: null, error: "Unsupported provider" }, { status: 400 });
    }

    // Verify key exists for this provider
    const targetKey = await UserKeyModel.findOne({ userId: String(user._id), provider }).lean();
    if (!targetKey) {
      return NextResponse.json({ success: false, data: null, error: `No saved API key found for provider: ${provider}` }, { status: 400 });
    }

    // Set all other keys to inactive, and this one to active
    await UserKeyModel.updateMany({ userId: String(user._id) }, { $set: { isActive: false } });
    await UserKeyModel.updateOne({ userId: String(user._id), provider }, { $set: { isActive: true } });

    return NextResponse.json({ success: true, data: { activeProvider: provider }, error: null }, { status: 200 });
  } catch (err) {
    console.error("POST /api/ai/set-active error:", err);
    return NextResponse.json({ success: false, data: null, error: "Server error" }, { status: 500 });
  }
}
