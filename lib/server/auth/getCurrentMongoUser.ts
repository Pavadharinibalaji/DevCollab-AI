import { auth, currentUser } from "@clerk/nextjs/server";
import { connectMongoose } from "@/lib/db/mongoose";
import { UserModel } from "@/lib/db/models/user.model";
import { userService } from "@/lib/server/services/user.service";

export async function getCurrentMongoUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const conn = await connectMongoose();
  if (!conn) throw new Error("Database connection failed");

  let user = await UserModel.findOne({ clerkUserId: userId });
  if (!user) {
    const clerkUser = await currentUser();
    if (clerkUser) {
      user = await userService.syncUser(clerkUser);
    }
  }
  return user;
}
