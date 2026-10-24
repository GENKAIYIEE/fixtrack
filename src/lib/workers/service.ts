import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { requireTechnicianHead, WorkflowError } from '@/lib/requests/assignment';
import { expectedVersion, workerFields, workerIds } from './validation';
export const ACTIVE_WORKER_STATUSES = ['ONGOING', 'ON_HOLD'] as const;
export const recordedWorkerInclude = { orderBy: { assignedAt: 'asc' as const }, include: { worker: { select: { isAvailable: true, isArchived: true,
  assignments: { where: { releasedAt: null, request: { status: { in: [...ACTIVE_WORKER_STATUSES] } } }, select: { id: true } },
} } } };
export const currentWorkerInclude = { ...recordedWorkerInclude, where: { releasedAt: null } };
export async function saveWorker(actorId: string, input: unknown, id?: string, version?: unknown) {
  const fields = workerFields(input);
  return prisma.$transaction(async tx => {
    await requireTechnicianHead(actorId, tx);
    if (id) {
      const current = await tx.maintenanceWorker.findUnique({ where: { id } });
      if (!current) throw new WorkflowError('Worker not found.', 404);
      if (current.updatedAt.getTime() !== expectedVersion(version).getTime()) throw new WorkflowError('This worker changed. Cancel edit, refresh, and reopen the record before saving.', 409);
      const busy = await tx.taskWorkerAssignment.count({ where: { workerId: id, releasedAt: null, request: { status: { in: [...ACTIVE_WORKER_STATUSES] } } } });
      if (fields.isArchived && busy) throw new WorkflowError('Remove this worker from active tasks before archiving.', 409);
      await tx.maintenanceWorker.update({ where: { id }, data: fields });
      await tx.auditLog.create({ data: { userId: actorId, action: 'STATUS_UPDATED', affectedRecordType: 'MaintenanceWorker', affectedRecordId: id, details: fields.isArchived ? 'Technician head archived a worker directory record.' : 'Technician head updated a worker directory record.' } });
      return { id };
    }
    if (fields.isArchived) throw new WorkflowError('Create a worker before archiving.');
    const worker = await tx.maintenanceWorker.create({ data: { ...fields, createdById: actorId } });
    await tx.auditLog.create({ data: { userId: actorId, action: 'STATUS_UPDATED', affectedRecordType: 'MaintenanceWorker', affectedRecordId: worker.id, details: 'Technician head created a worker directory record (no login account).' } });
    return { id: worker.id };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
export async function setTaskWorkers(actorId: string, requestId: string, inputIds: unknown, version: unknown) {
  const ids = workerIds(inputIds), date = expectedVersion(version);
  return prisma.$transaction(async tx => {
    await requireTechnicianHead(actorId, tx);
    const task = await tx.maintenanceRequest.findFirst({ where: { id: requestId, assignedToId: actorId } });
    if (!task) throw new WorkflowError('Task not found for the designated technician head.', 404);
    if (!ACTIVE_WORKER_STATUSES.includes(task.status as typeof ACTIVE_WORKER_STATUSES[number])) throw new WorkflowError('Worker selection is only available for ongoing or on-hold tasks.', 409);
    if (task.updatedAt.getTime() !== date.getTime()) throw new WorkflowError('This task changed. Cancel selection and reopen Choose workers before saving.', 409);
    const current = await tx.taskWorkerAssignment.findMany({ where: { requestId, releasedAt: null } });
    const selected = await tx.maintenanceWorker.findMany({ where: { id: { in: ids } }, orderBy: { id: 'asc' } });
    if (selected.length !== ids.length) throw new WorkflowError('A selected worker was not found.', 404);
    const newIds = ids.filter(id => !current.some(row => row.workerId === id));
    const busy = newIds.length ? await tx.taskWorkerAssignment.count({ where: { workerId: { in: newIds }, releasedAt: null, request: { status: { in: [...ACTIVE_WORKER_STATUSES] } } } }) : 0;
    if (busy || selected.some(worker => newIds.includes(worker.id) && (!worker.isAvailable || worker.isArchived))) throw new WorkflowError('A selected worker is busy, unavailable or archived. Refresh and select available workers.', 409);
    const removed = current.filter(row => !ids.includes(row.workerId));
    if (!newIds.length && !removed.length) return { message: 'Worker selection is unchanged.' };
    // Serialize competing allocations/availability edits through the shared worker rows.
    const affected = [...new Set([...ids, ...removed.map(row => row.workerId)])].sort();
    for (const id of affected) await tx.maintenanceWorker.update({ where: { id }, data: { updatedAt: new Date() } });
    const now = new Date();
    const updated = await tx.maintenanceRequest.updateMany({ where: { id: requestId, assignedToId: actorId, status: task.status, updatedAt: date }, data: { updatedAt: now } });
    if (!updated.count) throw new WorkflowError('The task changed concurrently. Refresh and try again.', 409);
    if (removed.length) await tx.taskWorkerAssignment.updateMany({ where: { id: { in: removed.map(row => row.id) }, releasedAt: null }, data: { releasedAt: now } });
    for (const worker of selected.filter(row => newIds.includes(row.id))) await tx.taskWorkerAssignment.create({ data: { requestId, workerId: worker.id, recordedById: actorId, workerName: worker.name, contactNumber: worker.contactNumber, specialization: worker.specialization, assignedAt: now } });
    await tx.auditLog.create({ data: { userId: actorId, action: 'TASK_REASSIGNED', affectedRecordType: 'MaintenanceRequest', affectedRecordId: requestId, details: `Technician head recorded worker selection: added ${newIds.length}, removed ${removed.length}. External contact/work is not automatically verified.` } });
    return { message: 'Worker selection recorded. Contact workers outside FixTrack.' };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15000 });
}

export function workerErrorResponse(error: unknown): Response {
  if (error instanceof WorkflowError) return Response.json({ error: error.message }, { status: error.status });
  if (error instanceof Prisma.PrismaClientKnownRequestError && ['P2034', 'P2002'].includes(error.code)) return Response.json({ error: 'The task or worker changed concurrently. Refresh and try again.' }, { status: 409 });
  console.error('[worker workflow] Operation failed; check database schema and availability.');
  return Response.json({ error: 'Worker records could not be processed. Check database migrations and try again.' }, { status: 500 });
}
