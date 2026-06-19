import { NextResponse } from "next/server";
import { connectMongoose } from "@/lib/db/mongoose";
import { UserKeyModel } from "@/models/UserKey";

export const runtime = "nodejs";

export async function GET() {
  const conn = await connectMongoose();
  const keys = await UserKeyModel.find({}).lean();
  return NextResponse.json({ keys });
}
