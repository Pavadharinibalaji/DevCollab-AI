import { connectMongoose } from "@/lib/db/mongoose";
import { UserModel } from "@/lib/db/models";

export const userService = {
  async syncUser(clerkUser: any) {
    if (!clerkUser) return null;
    const conn = await connectMongoose();
    if (!conn) throw new Error("Database connection failed");
    
    const email = clerkUser.emailAddresses?.[0]?.emailAddress || clerkUser.email || "";
    const name = clerkUser.fullName || 
                 (clerkUser.firstName && clerkUser.lastName ? `${clerkUser.firstName} ${clerkUser.lastName}` : clerkUser.firstName || clerkUser.lastName || email.split("@")[0] || "User");
    const avatarUrl = clerkUser.imageUrl || clerkUser.avatarUrl || "";

    try {
      const existing = await UserModel.findOne({ clerkUserId: clerkUser.id });
      if (existing) {
        let needsSave = false;
        if (existing.name !== name) { existing.name = name; needsSave = true; }
        if (existing.avatarUrl !== avatarUrl) { existing.avatarUrl = avatarUrl; needsSave = true; }
        if (existing.email !== email) { existing.email = email; needsSave = true; }
        if (needsSave) {
          await existing.save();
        }
        return existing;
      }

      const created = await UserModel.create({
        clerkUserId: clerkUser.id,
        email,
        name,
        avatarUrl,
      });
      return created;
    } catch (err) {
      if (err && (err as any).code === 11000) {
        try {
          const user = await UserModel.findOne({ clerkUserId: clerkUser.id });
          if (user) return user;
        } catch {
          // ignore nested errors
        }
      }
      throw err;
    }
  },

  async listUsers() {
    const conn = await connectMongoose();
    if (!conn) throw new Error("Database connection failed");
    try {
      return await UserModel.find().sort({ name: 1 }).lean();
    } catch (err) {
      console.error("Failed to list users:", err);
      return [];
    }
  },

  async getUserById(id: string) {
    const conn = await connectMongoose();
    if (!conn) throw new Error("Database connection failed");
    try {
      return await UserModel.findById(id).lean();
    } catch {
      return null;
    }
  }
};
