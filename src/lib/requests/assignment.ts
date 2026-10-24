import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';

export class WorkflowError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
/** Explicit deployment configuration; never pick an arbitrary technician. */
export function technicianHeadEmail(): string {
  return (process.env.TECHNICIAN_HEAD_EMAIL || 'tech@gmail.com').trim().toLowerCase();
}
export async function getTechnicianHead(db: Prisma.TransactionClient = prisma) {
  const head = await db.user.findFirst({
    where: { email: { equals: technicianHeadEmail(), mode: 'insensitive' } },
    select: { id: true, email: true, role: true, accountStatus: true, firstName: true, lastName: true,
      specialization: true, department: true, avatarUrl: true },
  });
  if (!head || head.role !== 'TECHNICIAN' || head.accountStatus !== 'ACTIVE') {
    throw new WorkflowError(`The designated technician head (${technicianHeadEmail()}) must be an existing ACTIVE TECHNICIAN account. No request was relayed.`, 409);
  }
  return head;
}
/** Recheck live identity/status on every task operation, including reads. */
export async function requireTechnicianHead(userId: string, db: Prisma.TransactionClient = prisma) {
  let head;
  try { head = await getTechnicianHead(db); }
  catch (error) {
    if (error instanceof WorkflowError) throw new WorkflowError('Only the designated active technician head can access maintenance tasks.', 403);
    throw error;
  }
  if (head.id !== userId) throw new WorkflowError('Only the designated active technician head can access maintenance tasks.', 403);
  return head;
}
export async function isActiveAdmin(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, accountStatus: true } });
  return user?.role === 'ADMIN' && user.accountStatus === 'ACTIVE';
}
export function workflowErrorResponse(error: unknown): Response {
  if (error instanceof WorkflowError) return Response.json({ error: error.message }, { status: error.status });
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
    return Response.json({ error: 'The request changed concurrently. Refresh and try again.' }, { status: 409 });
  }
  console.error('[request workflow]', error);
  return Response.json({ error: 'Internal Server Error' }, { status: 500 });
}
export async function relayRequests(adminId: string, inputIds: unknown, targetId?: unknown, transaction?: Prisma.TransactionClient) {
  if (!Array.isArray(inputIds) || inputIds.length < 1 || inputIds.length > 100 ||
      inputIds.some(id => typeof id !== 'string' || !id.trim())) {
    throw new WorkflowError('Provide between 1 and 100 request IDs.');
  }
  if (targetId !== undefined && (typeof targetId !== 'string' || !targetId)) {
    throw new WorkflowError('Invalid technician ID.');
  }
  const ids = [...new Set(inputIds as string[])];
  const execute = async (tx: Prisma.TransactionClient) => {
    const admin = await tx.user.findUnique({ where: { id: adminId }, select: { role: true, accountStatus: true } });
    if (admin?.role !== 'ADMIN' || admin.accountStatus !== 'ACTIVE') throw new WorkflowError('Forbidden', 403);
    const head = await getTechnicianHead(tx);
    if (targetId !== undefined && targetId !== head.id) throw new WorkflowError('Requests can only be relayed to the designated technician head.', 400);
    const requests = await tx.maintenanceRequest.findMany({ where: { id: { in: ids } } });
    if (requests.length !== ids.length) throw new WorkflowError('A maintenance request was not found.', 404);
    if (requests.some(r => r.status !== 'APPROVED' || r.assignedToId)) {
      throw new WorkflowError('Only APPROVED, unassigned requests can be relayed. Refresh the list.', 409);
    }
    const now = new Date();
    const updated = await tx.maintenanceRequest.updateMany({
      where: { id: { in: ids }, status: 'APPROVED', assignedToId: null },
      data: { assignedToId: head.id, assignedById: adminId, assignedAt: now, status: 'ONGOING' },
    });
    if (updated.count !== ids.length) throw new WorkflowError('Another administrator changed the request. Refresh and try again.', 409);
    for (const req of requests) {
      await tx.requestAssignment.updateMany({ where: { requestId: req.id, isActive: true }, data: { isActive: false, revokedAt: now } });
      await tx.requestAssignment.create({ data: { requestId: req.id, assignedToId: head.id, assignedById: adminId, assignedAt: now } });
      await tx.requestStatusHistory.create({ data: {
        requestId: req.id, changedById: adminId, previousStatus: 'APPROVED', newStatus: 'ONGOING', changedAt: now,
        remarks: `Relayed to technician head ${head.firstName} ${head.lastName}`,
      } });
      await tx.auditLog.create({ data: {
        userId: adminId, action: 'TASK_ASSIGNED', affectedRecordId: req.id, affectedRecordType: 'MaintenanceRequest',
        details: `Relayed ${req.requestCode} to designated technician head (${head.id})`,
      } });
      await tx.notification.createMany({ data: [
        { userId: head.id, type: 'TASK_ASSIGNED', title: 'Maintenance Request Relayed', requestId: req.id,
          message: `${req.requestCode} has been relayed to you. Coordinate with the appropriate maintenance worker outside FixTrack.` },
        { userId: req.submittedById, type: 'REQUEST_APPROVED', title: 'Request Relayed to Technician Head', requestId: req.id,
          message: `${req.requestCode} is now being handled by the technician head.` },
      ] });
    }
    return { updated: ids.length, technicianId: head.id };
  };
  return transaction ? execute(transaction) : prisma.$transaction(execute, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15000 });
}

/** Approval and forwarding share ONE transaction; no partially approved request can escape. */
export async function approveAndRelayRequest(adminId: string, requestId: string) {
  return prisma.$transaction(async tx => {
    const admin = await tx.user.findUnique({ where: { id: adminId }, select: { role: true, accountStatus: true } });
    if (admin?.role !== 'ADMIN' || admin.accountStatus !== 'ACTIVE') throw new WorkflowError('Forbidden', 403);
    await getTechnicianHead(tx); // Refuse unavailable/wrong-role heads before any decision is written.
    const request = await tx.maintenanceRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new WorkflowError('Request not found.', 404);
    if (request.status !== 'PENDING' || request.assignedToId) throw new WorkflowError('Only pending, unassigned requests can be approved and forwarded.', 409);
    const priorityLevel = request.requestedPriority === 'MEDIUM' ? 'NORMAL'
      : request.requestedPriority === 'HIGH' || request.requestedPriority === 'LOW' ? request.requestedPriority : request.priorityLevel;
    const updated = await tx.maintenanceRequest.updateMany({
      where: { id: requestId, status: 'PENDING', assignedToId: null },
      data: { status: 'APPROVED', reviewedById: adminId, reviewedAt: new Date(), priorityLevel },
    });
    if (updated.count !== 1) throw new WorkflowError('The request was already reviewed. Refresh and try again.', 409);
    await tx.requestStatusHistory.create({ data: { requestId, changedById: adminId, previousStatus: 'PENDING', newStatus: 'APPROVED', changedAt: new Date(), remarks: 'Request approved; automatic forwarding to the technician head' } });
    await tx.auditLog.create({ data: { userId: adminId, action: 'REQUEST_APPROVED', affectedRecordId: requestId, affectedRecordType: 'MaintenanceRequest', details: 'Request approved for automatic forwarding; requester priority preserved.' } });
    const result = await relayRequests(adminId, [requestId], undefined, tx);
    return { ...result, message: 'Request approved and automatically forwarded to the technician head.' };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15000 });
}
