import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { RequestStatus, PriorityLevel, AuditAction, NotifType } from '@prisma/client';

async function verifyAdmin() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return { error: 'Unauthorized', status: 401 as const };

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { id: true, role: true },
  });

  if (!user) return { error: 'Unauthorized', status: 401 as const };
  if (user.role !== 'ADMIN') return { error: 'Forbidden', status: 403 as const };

  return { userId: user.id };
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
      const { priorityLevel, adminNotes, assignedToId } = body;
      
      const isPending = previousStatus === 'PENDING';
      const newStatus = isPending ? 'ONGOING' : previousStatus;

      // Update request
      const updatedReq = await prisma.maintenanceRequest.update({
        where: { id },
        data: {
          status: newStatus,
          priorityLevel: priorityLevel as PriorityLevel,
          adminNotes,
          assignedToId: assignedToId || currentRequest.assignedToId,
          ...(assignedToId && assignedToId !== currentRequest.assignedToId && {
            assignedById: auth.userId,
            assignedAt: now,
          }),
          ...(isPending && { reviewedById: auth.userId, reviewedAt: now }),
        },
      });

      // Create history
      if (isPending) {
        await prisma.requestStatusHistory.create({
          data: {
            requestId: id,
            changedById: auth.userId,
            previousStatus,
            newStatus,
            remarks: 'Request Approved and set to Ongoing',
          }
        });
      }

      // Create assignment if changed
      if (assignedToId && assignedToId !== currentRequest.assignedToId) {
        // Deactivate old assignment
        await prisma.requestAssignment.updateMany({
          where: { requestId: id, isActive: true },
          data: { isActive: false, revokedAt: now },
        });

        await prisma.requestAssignment.create({
          data: {
            requestId: id,
            assignedToId,
            assignedById: auth.userId,
            isActive: true,
          }
        });
        
        // Notify tech
        await prisma.notification.create({
          data: {
            userId: assignedToId,
            type: 'TASK_ASSIGNED',
            title: 'Task Assigned',
            message: `You have been assigned to request REQ-${currentRequest.requestCode}`,
            requestId: id
          }
        });
      }

      // Create AuditLog
      await prisma.auditLog.create({
        data: {
          userId: auth.userId,
          action: 'REQUEST_APPROVED',
          affectedRecordId: id,
          affectedRecordType: 'MaintenanceRequest',
          details: `Approved action plan. Priority: ${priorityLevel}`,
        }
      });

      // Notify submitter
      if (isPending) {
        await prisma.notification.create({
          data: {
            userId: currentRequest.submittedById,
            type: 'REQUEST_APPROVED',
            title: 'Request Approved',
            message: `Your request REQ-${currentRequest.requestCode} has been approved.`,
            requestId: id
          }
        });
      }

      return NextResponse.json({ success: true, updatedReq });

    } else if (action === 'reject') {
      const { rejectReason } = body;
      
      const newStatus = 'REJECTED';
      await prisma.maintenanceRequest.update({
        where: { id },
        data: {
          status: newStatus,
          rejectionReason: rejectReason,
          reviewedById: auth.userId,
          reviewedAt: now,
        },
      });

      await prisma.requestStatusHistory.create({
        data: {
          requestId: id,
          changedById: auth.userId,
          previousStatus,
          newStatus,
          remarks: `Request Rejected. Reason: ${rejectReason}`,
        }
      });

      await prisma.auditLog.create({
        data: {
          userId: auth.userId,
          action: 'REQUEST_REJECTED',
          affectedRecordId: id,
          affectedRecordType: 'MaintenanceRequest',
          details: `Request rejected. Reason: ${rejectReason}`,
        }
      });

      await prisma.notification.create({
        data: {
          userId: currentRequest.submittedById,
          type: 'REQUEST_REJECTED',
          title: 'Request Rejected',
          message: `Your request REQ-${currentRequest.requestCode} has been rejected.`,
          requestId: id
        }
      });

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
