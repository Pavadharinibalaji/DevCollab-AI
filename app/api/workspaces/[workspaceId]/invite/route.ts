import { NextResponse } from 'next/server';
import { invitationService } from '@/lib/server/services/invitation.service';
import { getCurrentMongoUser } from '@/lib/server/auth/getCurrentMongoUser';

export async function POST(request: Request, context: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await context.params;
  const user = await getCurrentMongoUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  const { email, role } = await request.json();
  try {
    const { invitation, resent } = await invitationService.createInvitation(
      workspaceId,
      user._id.toString(),
      email,
      role
    );
    return NextResponse.json({ success: true, invitationId: (invitation as any)._id, resent });
  } catch (err: any) {
    console.error('Invitation creation error:', err);
    return NextResponse.json({ error: err.message || 'Failed to create invitation' }, { status: err.statusCode || 400 });
  }
}
