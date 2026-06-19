import { Schema, model, models, type InferSchemaType } from "mongoose";

export const UserSchema = new Schema(
  {
    clerkUserId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, index: true },
    name: { type: String, required: true },
    avatarUrl: { type: String },
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof UserSchema>;

export const UserModel = models.User ?? model("User", UserSchema);

