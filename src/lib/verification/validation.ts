export class VerificationError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export function verificationId(id: unknown): string {
  if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(id)) throw new VerificationError('Invalid account identifier.');
  return id;
}
export function verificationInput(body: unknown) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new VerificationError('Invalid verification decision.');
  const data = body as Record<string, unknown>;
  if (Object.keys(data).some(key => !['action', 'reason'].includes(key)) || (data.action !== 'APPROVE' && data.action !== 'REJECT')) throw new VerificationError('Choose Approve or Reject; account roles cannot be changed here.');
  if (data.reason !== undefined && typeof data.reason !== 'string') throw new VerificationError('The rejection reason must be text.');
  const reason = typeof data.reason === 'string' ? data.reason.trim() : '';
  if (reason.length > 300 || [...reason].some(c => c.charCodeAt(0) < 32 && c !== '\n')) throw new VerificationError('Use a brief rejection reason of up to 300 characters.');
  if (data.action === 'APPROVE' && reason) throw new VerificationError('An approval cannot include a rejection reason.');
  return { action: data.action as 'APPROVE' | 'REJECT', reason };
}
