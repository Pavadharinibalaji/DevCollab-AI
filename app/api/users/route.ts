import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { userService } from "@/lib/server/services/user.service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }

    const users = await userService.listUsers();
    return NextResponse.json({ success: true, data: { users }, error: null }, { status: 200 });
  } catch (err) {
    console.error("GET /api/users error:", err);
    return NextResponse.json({ success: false, data: null, error: String(err) }, { status: 500 });
  }
}
