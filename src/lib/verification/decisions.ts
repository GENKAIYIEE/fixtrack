import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { verificationId, verificationInput, VerificationError } from './validation';
export { VerificationError } from './validation';
/** One decision, status, audit and notification commit together. Never changes role or ID storage. */
export async function decideVerification(actorId: string, targetId: string, input: unknown) {
  verificationId(targetId); const { action, reason } = verificationInput(input);
  if (actorId === targetId) throw new VerificationError('You cannot verify your own account.', 403);
  try {
    return await prisma.$transaction(async tx => {
      const actor = await tx.user.findUnique({ where: { id: actorId }, select: { role: true, accountStatus: true } });
      if (actor?.role !== 'ADMIN' || actor.accountStatus !== 'ACTIVE') throw new VerificationError('Only an active administrator can verify accounts.', 403);
      const target = await tx.user.findUnique({ where: { id: targetId }, select: { accountStatus: true, registrationIdPath: true } });
      if (!target) throw new VerificationError('Account not found.', 404);
      if (target.accountStatus !== 'PENDING') throw new VerificationError('This account is no longer pending. Refresh to see the recorded decision.', 409);
      if (!target.registrationIdPath) throw new VerificationError('No submitted ID is on file. Keep this legacy account pending until its documentation is resolved.', 409);
      const accountStatus = action === 'APPROVE' ? 'ACTIVE' : 'REJECTED';
      const updated = await tx.user.updateMany({ where: { id: targetId, accountStatus: 'PENDING' }, data: { accountStatus, verificationRejectionReason: action === 'REJECT' ? reason || null : null } });
      if (updated.count !== 1) throw new VerificationError('Another administrator has already decided this account. Refresh the list.', 409);
      await tx.auditLog.create({ data: { userId: actorId, action: 'USER_UPDATED', affectedRecordId: targetId, affectedRecordType: 'User', details: `Account verification ${action === 'APPROVE' ? 'APPROVED' : 'REJECTED'}` } });
      await tx.notification.create({ data: { userId: targetId, type: 'STATUS_UPDATED', title: action === 'APPROVE' ? 'Account approved' : 'Account rejected', message: action === 'APPROVE' ? 'Your registration was approved. You may sign in with your existing account role.' : 'Your registration was rejected. Sign in to view your account-status explanation.' } });
      return { id: targetId, accountStatus, message: action === 'APPROVE' ? 'Account approved. Existing role and permissions were preserved.' : 'Account rejected. Its submitted ID remains private and retained.' };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && ['P2034','P2025'].includes(error.code)) throw new VerificationError('The account changed during review. Refresh before trying again.', 409);
    throw error;
  }
}
