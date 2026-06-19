import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

export const USER_KEY_PROVIDERS = ["openai", "groq", "anthropic", "gemini"] as const;
export type UserKeyProvider = (typeof USER_KEY_PROVIDERS)[number];

export const UserKeySchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    provider: { type: String, enum: USER_KEY_PROVIDERS, required: true, default: "openai" },
    apiKey: { type: String, required: true }, // encrypted
    isActive: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Compound unique index so a user can save at most one key per provider
UserKeySchema.index({ userId: 1, provider: 1 }, { unique: true });

export type UserKeyDoc = InferSchemaType<typeof UserKeySchema>;

export const UserKeyModel = (models.UserKey as Model<UserKeyDoc>) || model<UserKeyDoc>("UserKey", UserKeySchema);
