import { cookies } from "next/headers";
import mongoose from "mongoose";
import { connectMongoose } from "@/lib/db/mongoose";
import { WorkspaceModel } from "@/lib/db/models/workspace.model";

export async function getActiveWorkspace(user: { _id: mongoose.Types.ObjectId | string }) {
  await connectMongoose();
  const cookieStore = await cookies();
  const workspaceIdFromCookie = cookieStore.get("workspaceId")?.value;

  const userId = typeof user._id === "string" ? new mongoose.Types.ObjectId(user._id) : user._id;

  if (workspaceIdFromCookie && mongoose.isValidObjectId(workspaceIdFromCookie)) {
    const workspace = await WorkspaceModel.findOne({
      _id: new mongoose.Types.ObjectId(workspaceIdFromCookie),
      "members.userId": userId,
    }).populate("members.userId");

    if (workspace) {
      return workspace;
    }
  }

  // Fallback to first workspace the user belongs to
  const workspace = await WorkspaceModel.findOne({ "members.userId": userId })
    .populate("members.userId");

  if (workspace) {
    // Sync the cookie
    try {
      cookieStore.set("workspaceId", workspace._id.toString(), {
        path: "/",
        maxAge: 60 * 60 * 24 * 365, // 1 year
      });
    } catch (e) {
      // In Next.js App Router, cookies() cannot be modified in GET handlers or Server Components.
      // We catch this to prevent crashing the request.
      console.log("Unable to set workspaceId cookie in GET request or server component rendering context:", e);
    }
    return workspace;
  }

  return null;
}
