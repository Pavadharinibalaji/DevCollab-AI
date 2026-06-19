import crypto from 'crypto';

export function generateInvitationToken(): string {
  // 32-byte hex string => 64 chars
  return crypto.randomBytes(32).toString('hex');
}
