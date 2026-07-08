import { NextResponse } from "next/server";
import { connectMongoose } from "@/lib/db/mongoose";
import { UserKeyModel } from "@/lib/db/models";

export const runtime = "nodejs";

export async function GET() {
  try {
    const conn = await connectMongoose();
    const keys = await UserKeyModel.find({}).lean();
    return NextResponse.json({ success: true, data: { keys }, error: null });
  } catch (err) {
    return NextResponse.json({ success: false, data: null, error: String(err) }, { status: 500 });
  }
}
