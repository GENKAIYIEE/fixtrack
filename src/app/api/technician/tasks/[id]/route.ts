import { recordedWorkerInclude } from '@/lib/workers/service';
import { NextResponse } from 'next/server';
import { getActiveSession } from '@/lib/auth/access';
import prisma from '@/lib/prisma';
import { WorkflowError, workflowErrorResponse, requireTechnicianHead } from '@/lib/requests/assignment';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getActiveSession(['TECHNICIAN']);
    if (!session?.user || session.user.role !== 'TECHNICIAN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await requireTechnicianHead(session.user.id);
    const task = await prisma.maintenanceRequest.findFirst({
      where: { id, assignedToId: session.user.id },
      include: { workerAssignments: recordedWorkerInclude, submitter: { select: { firstName: true, lastName: true } },
        assignee: { select: { firstName: true, lastName: true, specialization: true } }, repairNote: true,
        statusHistory: { orderBy: { changedAt: 'desc' }, include: { actor: { select: { firstName: true, lastName: true, role: true } } } } },
    });
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    return NextResponse.json(task);
  } catch (error) { return workflowErrorResponse(error); }
}
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getActiveSession(['TECHNICIAN']);
  if (!session?.user || session.user.role !== 'TECHNICIAN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }
  if (!body || !['update', 'complete'].includes(body.action)) return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  if (body.action === 'update' && (typeof body.repairNotes !== 'string' || body.repairNotes.length > 10000 ||
      (body.partsReplaced !== undefined && (typeof body.partsReplaced !== 'string' || body.partsReplaced.length > 2000)) ||
      (body.status !== undefined && !['ONGOING', 'ON_HOLD'].includes(body.status)))) {
    return NextResponse.json({ error: 'Invalid notes, parts, or task status' }, { status: 400 });
  }
  try {
    await prisma.$transaction(async tx => {
      await requireTechnicianHead(session.user.id, tx);
      const task = await tx.maintenanceRequest.findFirst({ where: { id, assignedToId: session.user.id } });
      if (!task) throw new WorkflowError('Task not found', 404);
      if (!['ONGOING', 'ON_HOLD'].includes(task.status)) throw new WorkflowError('Only ongoing or on-hold tasks can be updated.', 409);
      const newStatus = body.action === 'complete' ? 'COMPLETED' : body.status || task.status;
      const now = new Date();
      const updated = await tx.maintenanceRequest.updateMany({ where: { id, assignedToId: session.user.id, status: task.status, updatedAt: task.updatedAt },
        data: { status: newStatus, ...(body.action === 'complete' && { completedAt: now }),
          ...(newStatus === 'ONGOING' && !task.startedAt && { startedAt: now }), updatedAt: now } });
      if (!updated.count) throw new WorkflowError('The task changed concurrently. Refresh and try again.', 409);
      if (body.action === 'update') await tx.repairNote.upsert({ where: { requestId: id },
        update: { notes: body.repairNotes, partsReplaced: body.partsReplaced || null },
        create: { requestId: id, technicianId: session.user.id, notes: body.repairNotes, partsReplaced: body.partsReplaced || null } });
      if (newStatus !== task.status) await tx.requestStatusHistory.create({ data: {
        requestId: id, changedById: session.user.id, previousStatus: task.status, newStatus,
        remarks: body.action === 'complete' ? 'Task marked completed by the designated technician head' : body.repairNotes,
      } });
      await tx.auditLog.create({ data: { userId: session.user.id, action: body.action === 'complete' ? 'TASK_COMPLETED' : 'STATUS_UPDATED',
        affectedRecordId: id, affectedRecordType: 'MaintenanceRequest', details: `Technician head ${body.action === 'complete' ? 'completed' : 'updated'} ${task.requestCode}` } });
      if (body.action === 'complete') await tx.notification.create({ data: { userId: task.submittedById,
        type: 'TASK_COMPLETED', title: 'Your Request Has Been Completed',
        message: `Your maintenance request ${task.requestCode} has been completed.`, requestId: id } });
    });
    return NextResponse.json({ success: true });
  } catch (error) { return workflowErrorResponse(error); }
}
