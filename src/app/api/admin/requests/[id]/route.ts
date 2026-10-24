import { recordedWorkerInclude } from '@/lib/workers/service';
import { NextRequest, NextResponse } from 'next/server';
import { getActiveSession } from '@/lib/auth/access';
import { prisma } from '@/lib/prisma';
import { RequestStatus } from '@prisma/client';
import { technicianHeadEmail, isActiveAdmin, relayRequests, approveAndRelayRequest, workflowErrorResponse, WorkflowError } from '@/lib/requests/assignment';

async function verifyAdmin() {
  const session = await getActiveSession(['ADMIN']);
  const authUser = session?.user;

  if (!authUser) return { error: 'Unauthorized', status: 401 as const };

  if (authUser.role !== 'ADMIN' || !await isActiveAdmin(authUser.id)) return { error: 'Forbidden', status: 403 as const };

  return { userId: authUser.id };
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await verifyAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  try {
    const maintenanceRequest = await prisma.maintenanceRequest.findUnique({
      where: { id },
      include: {
        submitter: { select: { firstName: true, lastName: true, department: true, avatarUrl: true } },
        assignee: { select: { firstName: true, lastName: true, email: true, specialization: true, avatarUrl: true } },
        reviewer: { select: { firstName: true, lastName: true } },
        workerAssignments: recordedWorkerInclude,
        repairNote: true,
        statusHistory: {
          include: { actor: { select: { firstName: true, lastName: true, role: true } } },
          orderBy: { changedAt: 'desc' }
        },
        assignments: {
          include: { assignee: { select: { firstName: true, lastName: true, specialization: true } } },
          orderBy: { assignedAt: 'desc' }
        }
      }
    });

    if (!maintenanceRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    return NextResponse.json({ ...maintenanceRequest,
      assignedToDesignatedHead: maintenanceRequest.assignee?.email.toLowerCase() === technicianHeadEmail(),
    });
  } catch (error) {
    console.error(`[GET /api/admin/requests/${id}]`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await verifyAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  const { action } = body;
  if (action === 'assign') {
    try { return NextResponse.json({ success: true, ...await relayRequests(auth.userId, [id], body.technicianId) }); }
    catch (error) { return workflowErrorResponse(error); }
  }
  if (action === 'updatePriority') return NextResponse.json({ error: 'Admin priority changes are no longer supported. The requester-selected priority is preserved.' }, { status: 400 });
  if (action === 'approve') {
    if (Object.keys(body).some(key => key !== 'action')) return NextResponse.json({ error: 'Approval accepts only the action. Priority, notes, status and receiving account cannot be overridden.' }, { status: 400 });
    try { return NextResponse.json({ success: true, ...await approveAndRelayRequest(auth.userId, id) }); }
    catch (error) { return workflowErrorResponse(error); }
  }

  try {
    const currentRequest = await prisma.maintenanceRequest.findUnique({
      where: { id },
    });

    if (!currentRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const now = new Date();
    const previousStatus = currentRequest.status;

    if (action === 'reject') {
      const { rejectionReason } = body;

      if (!rejectionReason || !String(rejectionReason).trim()) {
        return NextResponse.json({ error: 'Rejection reason is required', message: 'Rejection reason is required.' }, { status: 400 });
      }

      // Only PENDING requests may be rejected
      if (previousStatus !== 'PENDING') {
        return NextResponse.json(
          { error: 'Conflict', message: `Cannot reject a request with status ${previousStatus}.` },
          { status: 409 }
        );
      }

      const trimmedReason = String(rejectionReason).trim();
      const newStatus: RequestStatus = 'REJECTED';

      await prisma.$transaction(async tx => {
        const admin = await tx.user.findUnique({ where: { id: auth.userId }, select: { role: true, accountStatus: true } });
        if (admin?.role !== 'ADMIN' || admin.accountStatus !== 'ACTIVE') throw new WorkflowError('Forbidden', 403);
        const updated = await tx.maintenanceRequest.updateMany({ where: { id, status: 'PENDING', assignedToId: null }, data: {
          status: newStatus, rejectionReason: trimmedReason, reviewedById: auth.userId, reviewedAt: now,
        } });
        if (updated.count !== 1) throw new WorkflowError('The request was already reviewed. Refresh and try again.', 409);
        await tx.requestStatusHistory.create({ data: { requestId: id, changedById: auth.userId, previousStatus: 'PENDING', newStatus, remarks: trimmedReason } });
        await tx.notification.create({ data: { userId: currentRequest.submittedById, type: 'REQUEST_REJECTED', title: 'Your Request Has Been Rejected', message: `${currentRequest.requestCode} was rejected. Reason: ${trimmedReason}`, requestId: id } });
        await tx.auditLog.create({ data: { userId: auth.userId, action: 'REQUEST_REJECTED', affectedRecordId: id, affectedRecordType: 'MaintenanceRequest', details: `Request ${currentRequest.requestCode} rejected. Reason: ${trimmedReason}` } });
      }, { isolationLevel: 'Serializable', timeout: 15000 });

      return NextResponse.json({ success: true });

    } else if (action === 'cancel') {
      const { cancelReason } = body;
      
      const newStatus = 'CANCELLED';
      await prisma.maintenanceRequest.update({
        where: { id },
        data: {
          status: newStatus,
          cancellationReason: cancelReason,
        },
      });

      await prisma.requestStatusHistory.create({
        data: {
          requestId: id,
          changedById: auth.userId,
          previousStatus,
          newStatus,
          remarks: `Request Cancelled. Reason: ${cancelReason}`,
        }
      });

      await prisma.auditLog.create({
        data: {
          userId: auth.userId,
          action: 'REQUEST_CANCELLED',
          affectedRecordId: id,
          affectedRecordType: 'MaintenanceRequest',
          details: `Request cancelled. Reason: ${cancelReason}`,
        }
      });

      await prisma.notification.create({
        data: {
          userId: currentRequest.submittedById,
          type: 'REQUEST_CANCELLED',
          title: 'Request Cancelled',
          message: `Your request REQ-${currentRequest.requestCode} has been cancelled.`,
          requestId: id
        }
      });

      return NextResponse.json({ success: true });

    } else {
      return NextResponse.json({ error: 'Invalid action type' }, { status: 400 });
    }

  } catch (error) {
    console.error(`[PATCH /api/admin/requests/${id}]`, error);
    return workflowErrorResponse(error);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  try {
    const existing = await prisma.maintenanceRequest.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Delete related records manually to avoid foreign key constraints since there is no Cascade
    await prisma.$transaction([
      prisma.requestAssignment.deleteMany({ where: { requestId: id } }),
      prisma.requestStatusHistory.deleteMany({ where: { requestId: id } }),
      prisma.repairNote.deleteMany({ where: { requestId: id } }),

      prisma.auditLog.deleteMany({ where: { affectedRecordId: id } }),
      prisma.maintenanceRequest.delete({ where: { id } }),
    ]);

    // Optional: Also delete notifications, but they don't have a strict FK on requestId in schema.
    await prisma.notification.deleteMany({ where: { requestId: id } });

    return NextResponse.json({ success: true, message: 'Request permanently deleted' });
  } catch (error) {
    console.error(`[DELETE /api/admin/requests/${id}]`, error);
    return NextResponse.json({ error: 'Failed to delete request' }, { status: 500 });
  }
}
