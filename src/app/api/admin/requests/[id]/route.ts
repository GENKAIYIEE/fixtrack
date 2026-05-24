import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { RequestStatus, PriorityLevel, AuditAction, NotifType } from '@prisma/client';

async function verifyAdmin() {
  const session = await getServerSession(authOptions);
  const authUser = session?.user;

  if (!authUser) return { error: 'Unauthorized', status: 401 as const };

  if (authUser.role !== 'ADMIN') return { error: 'Forbidden', status: 403 as const };

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
        assignee: { select: { firstName: true, lastName: true, specialization: true, avatarUrl: true } },
        reviewer: { select: { firstName: true, lastName: true } },
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

    return NextResponse.json(maintenanceRequest);
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

  const { action } = body;

  try {
    const currentRequest = await prisma.maintenanceRequest.findUnique({
      where: { id },
    });

    if (!currentRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const now = new Date();
    const previousStatus = currentRequest.status;

    if (action === 'approve') {
      const { priorityLevel, adminNotes } = body;

      const isPending = previousStatus === 'PENDING';
      const newStatus = isPending ? ('APPROVED' as any) : previousStatus;

      // Update request — triage fields only; assignment is handled separately
      const updatedReq = await prisma.maintenanceRequest.update({
        where: { id },
        data: {
          status: newStatus,
          ...(priorityLevel && { priorityLevel: priorityLevel as PriorityLevel }),
          ...(adminNotes !== undefined && { adminNotes }),
          ...(isPending && { reviewedById: auth.userId, reviewedAt: now }),
        },
      });

      // Status history
      if (isPending) {
        await prisma.requestStatusHistory.create({
          data: {
            requestId: id,
            changedById: auth.userId,
            previousStatus,
            newStatus,
            remarks: 'Request Approved',
          },
        });
      }

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: auth.userId,
          action: 'REQUEST_APPROVED',
          affectedRecordId: id,
          affectedRecordType: 'MaintenanceRequest',
          details: `Request approved. Priority: ${priorityLevel || currentRequest.priorityLevel}`,
        },
      });

      // Notify submitter
      if (isPending) {
        await prisma.notification.create({
          data: {
            userId: currentRequest.submittedById,
            type: 'REQUEST_APPROVED',
            title: 'Request Approved',
            message: `Your request REQ-${currentRequest.requestCode} has been approved and will be dispatched to a technician shortly.`,
            requestId: id,
          },
        });
      }

      return NextResponse.json({ success: true, updatedReq });

    } else if (action === 'reject') {
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

      await prisma.$transaction([
        prisma.maintenanceRequest.update({
          where: { id },
          data: {
            status: newStatus,
            rejectionReason: trimmedReason,
            reviewedById: auth.userId,
            reviewedAt: now,
            updatedAt: now,
          },
        }),
        prisma.requestStatusHistory.create({
          data: {
            requestId: id,
            changedById: auth.userId,
            previousStatus,
            newStatus,
            remarks: trimmedReason,
          },
        }),
        prisma.notification.create({
          data: {
            userId: currentRequest.submittedById,
            type: 'REQUEST_REJECTED' as NotifType,
            title: 'Your Request Has Been Rejected',
            message: `Your maintenance request ${currentRequest.requestCode} has been rejected. Reason: ${trimmedReason}`,
            requestId: id,
          },
        }),
        prisma.auditLog.create({
          data: {
            userId: auth.userId,
            action: 'REQUEST_REJECTED' as AuditAction,
            affectedRecordId: id,
            affectedRecordType: 'MaintenanceRequest',
            details: `Request ${currentRequest.requestCode} rejected. Reason: ${trimmedReason}`,
          },
        }),
      ]);

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

    } else if (action === 'updatePriority') {
      const { priorityLevel } = body;

      await prisma.maintenanceRequest.update({
        where: { id },
        data: { priorityLevel: priorityLevel as PriorityLevel },
      });

      await prisma.auditLog.create({
        data: {
          userId: auth.userId,
          action: 'STATUS_UPDATED',
          affectedRecordId: id,
          affectedRecordType: 'MaintenanceRequest',
          details: `Priority updated to ${priorityLevel}`,
        }
      });
      
      // Update history for priority? Prompt doesn't strictly say it, but it powers activity log.
      await prisma.requestStatusHistory.create({
        data: {
          requestId: id,
          changedById: auth.userId,
          previousStatus,
          newStatus: previousStatus,
          remarks: `Priority updated to ${priorityLevel}`,
        }
      });

      return NextResponse.json({ success: true });

    } else if (action === 'assign') {
      const { technicianId } = body;

      if (!technicianId) {
        return NextResponse.json({ error: 'technicianId is required' }, { status: 400 });
      }

      await prisma.maintenanceRequest.update({
        where: { id },
        data: {
          assignedToId: technicianId,
          assignedById: auth.userId,
          assignedAt: now,
        },
      });

      await prisma.requestAssignment.updateMany({
        where: { requestId: id, isActive: true },
        data: { isActive: false, revokedAt: now },
      });

      await prisma.requestAssignment.create({
        data: {
          requestId: id,
          assignedToId: technicianId,
          assignedById: auth.userId,
          isActive: true,
        }
      });

      await prisma.auditLog.create({
        data: {
          userId: auth.userId,
          action: currentRequest.assignedToId ? 'TASK_REASSIGNED' : 'TASK_ASSIGNED',
          affectedRecordId: id,
          affectedRecordType: 'MaintenanceRequest',
          details: `Assigned task to technician ${technicianId}`,
        }
      });
      
      await prisma.requestStatusHistory.create({
        data: {
          requestId: id,
          changedById: auth.userId,
          previousStatus,
          newStatus: previousStatus,
          remarks: `Task assigned to technician`,
        }
      });
      
      await prisma.notification.create({
        data: {
          userId: technicianId,
          type: 'TASK_ASSIGNED',
          title: 'Task Assigned',
          message: `You have been assigned to request REQ-${currentRequest.requestCode}`,
          requestId: id
        }
      });

      return NextResponse.json({ success: true });

    } else {
      return NextResponse.json({ error: 'Invalid action type' }, { status: 400 });
    }

  } catch (error) {
    console.error(`[PATCH /api/admin/requests/${id}]`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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
