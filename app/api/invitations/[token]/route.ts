import { NextResponse } from 'next/server';
import { invitationService } from '@/lib/server/services/invitation.service';
import { auth } from '@clerk/nextjs/server';
import { getCurrentMongoUser } from '@/lib/server/auth/getCurrentMongoUser';
import { connectMongoose } from '@/lib/db/mongoose';
import { InvitationModel, WorkspaceModel } from '@/lib/db/models';
import { realtimeBroker } from '@/lib/server/realtime-broker';

/**
 * GET /api/invitations/[token]
 * Validate token and return basic invitation info.
 */
export async function GET(request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  try {
    const invitation = await invitationService.validateToken(token);
    const workspace = (invitation as any).workspaceId as any;
    return NextResponse.json({
      success: true,
      data: {
        invitation: {
          email: invitation.email,
          role: invitation.role,
          workspaceId: invitation.workspaceId,
          workspaceName: workspace?.name,
        },
      },
      error: null
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, data: null, error: err.message || 'Invalid invitation' }, { status: 400 });
  }
}

/**
 * POST /api/invitations/[token]
 * Accept invitation for the currently logged‑in user.
 */
export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ success: false, data: null, error: 'Unauthenticated' }, { status: 401 });
  }
  try {
    const result = await invitationService.acceptInvitation(token, userId);
    return NextResponse.json({ success: true, data: { workspaceId: result.workspaceId, userId: result.userId }, error: null });
  } catch (err: any) {
    console.error('Accept invitation error:', err);
    return NextResponse.json({ success: false, data: null, error: err.message || 'Failed to accept invitation' }, { status: 400 });
  }
}

/**
 * DELETE /api/invitations/[token]
 * Revoke invitation (workspace owners and admins only).
 */
export async function DELETE(request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const user = await getCurrentMongoUser();
  if (!user) {
    return NextResponse.json({ success: false, data: null, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const conn = await connectMongoose();
    if (!conn) throw new Error('Database connection failed');

    const invitation = await InvitationModel.findOne({ token }).lean();
    if (!invitation) {
      return NextResponse.json({ success: false, data: null, error: 'Invitation not found' }, { status: 404 });
    }

    const workspace = await WorkspaceModel.findById(invitation.workspaceId).lean();
    if (!workspace) {
      return NextResponse.json({ success: false, data: null, error: 'Workspace not found' }, { status: 404 });
    }

    const isAuthorized = workspace.members.some(
      (m: any) => m.userId.toString() === user._id.toString() && (m.role === 'owner' || m.role === 'admin')
    );
    if (!isAuthorized) {
      return NextResponse.json({ success: false, data: null, error: 'Only workspace owners or admins can revoke invitation links' }, { status: 403 });
    }

    await InvitationModel.deleteOne({ token });

    // Emit Socket.IO realtime event
    await realtimeBroker.publish("global", "invitationsUpdated", { workspaceId: invitation.workspaceId.toString() });

    return NextResponse.json({ success: true, data: { message: 'Invitation revoked successfully' }, error: null });
  } catch (err: any) {
    console.error('Revoke invitation error:', err);
    return NextResponse.json({ success: false, data: null, error: err.message || 'Failed to revoke invitation' }, { status: 500 });
  }
}
