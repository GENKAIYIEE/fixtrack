import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { RequestStatus, AuditAction, NotifType } from '@prisma/client';

async function verifyAdmin() {
  const session = await getServerSession(authOptions);
  const authUser = session?.user;

  if (!authUser) return { error: 'Unauthorized', status: 401 as const };

  if (authUser.role !== 'ADMIN') return { error: 'Forbidden', status: 403 as const };

  return { userId: authUser.id };
}

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  try {
    if (type === 'unassigned') {
      const requests = await prisma.maintenanceRequest.findMany({
        where: {
          status: 'PENDING',
          assignedToId: null,
        },
        include: {
          submitter: { select: { firstName: true, lastName: true } },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      // Sort by urgency level manually to ensure correct order
      const urgencyMap: Record<string, number> = {
        URGENT: 4,
        HIGH: 3,
        NORMAL: 2,
        LOW: 1,
      };

      requests.sort((a, b) => {
        const uA = urgencyMap[a.urgencyLevel] || 0;
        const uB = urgencyMap[b.urgencyLevel] || 0;
        if (uA !== uB) return uB - uA;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });

      return NextResponse.json({ requests });
    } else if (type === 'technicians') {
      const technicians = await prisma.user.findMany({
        where: {
          role: 'TECHNICIAN',
          accountStatus: 'ACTIVE',
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          specialization: true,
          assignmentsReceived: {
            where: { isActive: true },
            select: { id: true }
          }
        },
      });

      const formatted = technicians.map((tech) => ({
        id: tech.id,
        firstName: tech.firstName,
        lastName: tech.lastName,
        specialization: tech.specialization,
        activeTaskCount: tech.assignmentsReceived.length,
      }));

      return NextResponse.json({ technicians: formatted });
    } else {
      return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }
  } catch (error) {
    console.error('[GET /api/admin/assignments]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { requestId, technicianId } = body;
  if (!requestId || !technicianId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const maintenanceReq = await prisma.maintenanceRequest.findUnique({
      where: { id: requestId },
    });

    if (!maintenanceReq) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (maintenanceReq.status !== 'PENDING' || maintenanceReq.assignedToId !== null) {
      return NextResponse.json({ error: 'This request has already been assigned' }, { status: 400 });
    }

    const techUser = await prisma.user.findUnique({
      where: { id: technicianId },
    });

    if (!techUser || techUser.role !== 'TECHNICIAN' || techUser.accountStatus !== 'ACTIVE') {
      return NextResponse.json({ error: 'Invalid or inactive technician' }, { status: 400 });
    }

    const now = new Date();

    const updatedRequest = await prisma.$transaction(async (tx) => {
      // 3. Update MaintenanceRequest
      const updated = await tx.maintenanceRequest.update({
        where: { id: requestId },
        data: {
          assignedToId: technicianId,
          assignedById: auth.userId,
          assignedAt: now,
          status: 'ONGOING',
          reviewedById: auth.userId,
          reviewedAt: now,
        },
      });

      // 4. Create RequestAssignment
      await tx.requestAssignment.create({
        data: {
          requestId: requestId,
          assignedToId: technicianId,
          assignedById: auth.userId,
          isActive: true,
        },
      });

      // 5. Create RequestStatusHistory
      await tx.requestStatusHistory.create({
        data: {
          requestId: requestId,
          changedById: auth.userId,
          previousStatus: 'PENDING',
          newStatus: 'ONGOING',
          remarks: 'Task assigned to technician',
        },
      });

      // 6. Create AuditLog
      await tx.auditLog.create({
        data: {
          userId: auth.userId,
          action: 'TASK_ASSIGNED',
          affectedRecordId: maintenanceReq.requestCode,
          affectedRecordType: 'MaintenanceRequest',
          details: `Assigned task to technician ${technicianId}`,
        },
      });

      // 7. Notification for technician
      await tx.notification.create({
        data: {
          userId: technicianId,
          type: 'TASK_ASSIGNED',
          title: 'New Task Assigned',
          message: `You have been assigned to request REQ-${maintenanceReq.requestCode}`,
          requestId: requestId,
        },
      });

      // 8. Notification for requester
      await tx.notification.create({
        data: {
          userId: maintenanceReq.submittedById,
          type: 'REQUEST_APPROVED',
          title: 'Your request has been assigned',
          message: `Your request REQ-${maintenanceReq.requestCode} has been assigned to a technician.`,
          requestId: requestId,
        },
      });

      return updated;
    });

    // 9. Return updated request
    return NextResponse.json({ success: true, request: updatedRequest });
  } catch (error) {
    console.error('[POST /api/admin/assignments]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
