import { Schema, model, models, type InferSchemaType } from "mongoose";

export const INVITATION_STATUSES = ["pending", "accepted", "expired"] as const;
export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

export const InvitationSchema = new Schema(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    email: { type: String, required: true, index: true },
    role: { type: String, enum: ["admin", "member"], required: true, default: "member" },
    token: { type: String, required: true, unique: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: INVITATION_STATUSES, default: "pending" },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

InvitationSchema.index({ workspaceId: 1, email: 1, status: 1 });

export type InvitationDoc = InferSchemaType<typeof InvitationSchema>;

export const InvitationModel = models.Invitation ?? model("Invitation", InvitationSchema);
