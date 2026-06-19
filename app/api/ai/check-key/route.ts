import { NextResponse } from "next/server";
import { connectMongoose } from "@/lib/db/mongoose";
import { getCurrentMongoUser } from "@/lib/server/auth/getCurrentMongoUser";
import { UserKeyModel } from "@/models/UserKey";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getCurrentMongoUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conn = await connectMongoose();
    if (!conn) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }

    const keyDocs = await UserKeyModel.find({ userId: String(user._id) }).select("provider isActive").lean();
    
    let activeProvider: string | null = null;
    const savedProviders = keyDocs.map((k) => k.provider);
    
    const activeDoc = keyDocs.find((k) => k.isActive);
    if (activeDoc) {
      activeProvider = activeDoc.provider;
    } else if (keyDocs.length > 0) {
      // Auto-default first key to active
      await UserKeyModel.updateOne({ _id: keyDocs[0]._id }, { $set: { isActive: true } });
      activeProvider = keyDocs[0].provider;
    }

    return NextResponse.json({
      hasKey: keyDocs.length > 0,
      activeProvider,
      savedProviders,
    }, { status: 200 });
  } catch (err) {
    console.error("GET /api/ai/check-key error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

