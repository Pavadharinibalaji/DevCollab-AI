import { InvitationModel } from '@/lib/db/models/invitation.model';
import { WorkspaceModel } from '@/lib/db/models/workspace.model';
import { UserModel } from '@/lib/db/models/user.model';
import { generateInvitationToken } from '@/lib/utils/tokenUtils';
import { connectMongoose } from '@/lib/db/mongoose';
import type { InvitationDoc } from '@/lib/db/models/invitation.model';
import { realtimeBroker } from '@/lib/server/realtime-broker';

export const invitationService = {
  /**
   * Create a new invitation and send email.
   * @param workspaceId - ID of the workspace
   * @param inviterId - clerkUserId of the user sending the invite
   * @param email - email address of the invitee
   * @param role - role to assign (admin | member)
   */
  async createInvitation(
    workspaceId: string,
    inviterId: string,
    email: string,
    role: 'admin' | 'member' = 'member'
  ): Promise<{ invitation: InvitationDoc; resent: boolean }> {
    const conn = await connectMongoose();
    if (!conn) throw new Error('Database connection failed');

    // Verify workspace exists and inviter is owner or admin
    const workspace = await WorkspaceModel.findById(workspaceId);
    if (!workspace) throw new Error('Workspace not found');
    const isAuthorized = workspace.members.some(
      (m: any) => m.userId.toString() === inviterId && (m.role === 'owner' || m.role === 'admin')
    );
    if (!isAuthorized) throw new Error('Only owners or admins can invite members');

    // Check if user is already a member of the workspace
    const userWithEmail = await UserModel.findOne({ email });
    if (userWithEmail) {
      const isAlreadyMember = workspace.members.some(
        (m: any) => m.userId.toString() === userWithEmail._id.toString()
      );
      if (isAlreadyMember) {
        const err = new Error('User is already a member of this workspace');
        (err as any).statusCode = 409;
        throw err;
      }
    }

    // Check for existing pending unexpired invitation for same email + workspace
    const existing = await InvitationModel.findOne({
      workspaceId,
      email,
      status: 'pending',
      expiresAt: { $gt: new Date() },
    });

    let resent = false;
    if (existing) {
      // delete the old invitation to keep DB clean
      await InvitationModel.deleteOne({ _id: existing._id });
      resent = true;
    } else {
      // Clean up any other expired/pending invitations for this user and workspace to avoid duplicates
      await InvitationModel.deleteMany({ workspaceId, email, status: { $in: ['pending', 'expired'] } });
    }



    const token = generateInvitationToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration (configurable)

    const invitation = await InvitationModel.create({
      workspaceId,
      email,
      role,
      token,
      invitedBy: inviterId,
      expiresAt,
    });

    // Emit realtime event
    await realtimeBroker.publish("global", "invitationsUpdated", { workspaceId: workspaceId.toString() });

    return { invitation, resent };
  },

  /** Validate a token (used by GET /invite/[token]) */
  async validateToken(token: string) {
    const conn = await connectMongoose();
    if (!conn) throw new Error('Database connection failed');
    const invitation = await InvitationModel.findOne({ token }).populate('workspaceId');
    if (!invitation) throw new Error('Invalid invitation token');
    if (invitation.status !== 'pending') throw new Error('Invitation already used or expired');
    if (invitation.expiresAt < new Date()) {
      invitation.status = 'expired';
      await invitation.save();
      throw new Error('Invitation has expired');
    }
    return invitation;
  },

  /** Accept an invitation after user is authenticated */
  async acceptInvitation(token: string, userClerkId: string) {
    const conn = await connectMongoose();
    if (!conn) throw new Error('Database connection failed');
    const invitation = await InvitationModel.findOne({ token });
    if (!invitation) throw new Error('Invalid invitation token');
    if (invitation.status !== 'pending') throw new Error('Invitation already used or expired');
    if (invitation.expiresAt < new Date()) {
      invitation.status = 'expired';
      await invitation.save();
      throw new Error('Invitation has expired');
    }

    // Ensure user exists (or create a placeholder if not yet in DB)
    let user = await UserModel.findOne({ clerkUserId: userClerkId });
    if (!user) {
      try {
        // Create minimal user record – email is already known from invitation
        user = await UserModel.create({
          clerkUserId: userClerkId,
          email: invitation.email,
          name: invitation.email.split('@')[0],
          avatarUrl: '',
        });
      } catch (err: any) {
        // Handle concurrent registration race condition (duplicate key error)
        if (err && (err.code === 11000 || err.message?.includes("E11000"))) {
          user = await UserModel.findOne({ clerkUserId: userClerkId });
        }
        if (!user) throw err;
      }
    }

    // Add user to workspace members
    await WorkspaceModel.updateOne(
      { _id: invitation.workspaceId },
      { $push: { members: { userId: user._id, role: invitation.role } } }
    );

    // Update invitation status
    invitation.status = 'accepted';
    await invitation.save();

    // Broadcast realtime updates
    await realtimeBroker.publish("global", "teamUpdated", { workspaceId: invitation.workspaceId.toString() });
    await realtimeBroker.publish("global", "invitationsUpdated", { workspaceId: invitation.workspaceId.toString() });

    return { workspaceId: invitation.workspaceId, userId: user._id };
  },

  /** Optional cleanup – mark pending invites past expiration as expired */
  async expireOldInvitations() {
    const conn = await connectMongoose();
    if (!conn) throw new Error('Database connection failed');
    await InvitationModel.updateMany({ status: 'pending', expiresAt: { $lt: new Date() } }, { status: 'expired' });
  },
};
