import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
    // ── Unassigned (APPROVED + no assignee) requests ──────────────────────────
    if (type === 'unassigned') {
      const requests = await prisma.maintenanceRequest.findMany({
        where: {
          status: 'APPROVED',
          assignedToId: null,
        },
        include: {
          submitter: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'asc' },
      });

      // Sort by priority/urgency descending, then by age ascending (FIFO within same priority)
      const priorityMap: Record<string, number> = {
        URGENT: 4,
        HIGH: 3,
        NORMAL: 2,
        LOW: 1,
      };

      requests.sort((a, b) => {
        const pA = priorityMap[a.priorityLevel] ?? priorityMap[a.urgencyLevel] ?? 0;
        const pB = priorityMap[b.priorityLevel] ?? priorityMap[b.urgencyLevel] ?? 0;
        if (pA !== pB) return pB - pA;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });

      return NextResponse.json({ requests });
    }

    // ── Active technicians with real-time workload ────────────────────────────
    if (type === 'technicians') {
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
          avatarUrl: true,
          department: true,
          // FIX: Count ONGOING requests directly assigned to the technician
          // instead of using assignmentsReceived (which counts history entries,
          // not current active tasks). This gives the true real-time workload.
          assignedRequests: {
            where: {
              status: 'ONGOING',
            },
            select: { id: true },
          },
        },
        orderBy: { firstName: 'asc' },
      });

      const formatted = technicians.map((tech) => ({
        id: tech.id,
        firstName: tech.firstName,
        lastName: tech.lastName,
        specialization: tech.specialization,
        avatarUrl: tech.avatarUrl ?? null,
        department: tech.department ?? null,
        // FIX: Use the actual count of ONGOING maintenance requests assigned to
        // this technician — NOT a hardcoded name-based filter.
        activeTaskCount: tech.assignedRequests.length,
      }));

      return NextResponse.json({ technicians: formatted });
    }

    return NextResponse.json({ error: 'Invalid type parameter. Use ?type=unassigned or ?type=technicians' }, { status: 400 });

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
    return NextResponse.json({ error: 'Missing required fields: requestId and technicianId' }, { status: 400 });
  }

  try {
    // ── Validate the maintenance request ────────────────────────────────────
    const maintenanceReq = await prisma.maintenanceRequest.findUnique({
      where: { id: requestId },
    });

    if (!maintenanceReq) {
      return NextResponse.json({ error: 'Maintenance request not found.' }, { status: 404 });
    }

    // FIX: The unassigned panel queries for APPROVED requests.
    // The guard must match — allow assignment only for APPROVED + unassigned.
    if (maintenanceReq.status !== 'APPROVED') {
      return NextResponse.json({
        error: `Cannot assign a request with status "${maintenanceReq.status}". Only APPROVED requests can be assigned.`,
      }, { status: 400 });
    }

    if (maintenanceReq.assignedToId !== null) {
      return NextResponse.json({
        error: 'This request has already been assigned to a technician.',
      }, { status: 409 });
    }

    // ── Validate the technician ──────────────────────────────────────────────
    const techUser = await prisma.user.findUnique({
      where: { id: technicianId },
      select: { id: true, role: true, accountStatus: true, firstName: true, lastName: true },
    });

    if (!techUser) {
      return NextResponse.json({ error: 'Technician not found.' }, { status: 404 });
    }

    if (techUser.role !== 'TECHNICIAN') {
      return NextResponse.json({ error: 'The specified user is not a technician.' }, { status: 400 });
    }

    if (techUser.accountStatus !== 'ACTIVE') {
      return NextResponse.json({
        error: `Technician account is ${techUser.accountStatus}. Only ACTIVE technicians can be assigned tasks.`,
      }, { status: 400 });
    }

    const now = new Date();

    // ── Atomic transaction: assign the request ──────────────────────────────
    const updatedRequest = await prisma.$transaction(async (tx) => {
      // 1. Update the MaintenanceRequest — move to ONGOING
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

      // 2. Create RequestAssignment history record
      await tx.requestAssignment.create({
        data: {
          requestId,
          assignedToId: technicianId,
          assignedById: auth.userId,
          isActive: true,
          assignedAt: now,
        },
      });

      // 3. Create RequestStatusHistory
      await tx.requestStatusHistory.create({
        data: {
          requestId,
          changedById: auth.userId,
          previousStatus: 'APPROVED',
          newStatus: 'ONGOING',
          remarks: `Task assigned to technician ${techUser.firstName} ${techUser.lastName}`,
        },
      });

      // 4. Audit log
      await tx.auditLog.create({
        data: {
          userId: auth.userId,
          action: 'TASK_ASSIGNED',
          affectedRecordId: maintenanceReq.requestCode,
          affectedRecordType: 'MaintenanceRequest',
          details: `Assigned ${maintenanceReq.requestCode} to ${techUser.firstName} ${techUser.lastName} (${technicianId})`,
        },
      });

      // 5. Notify the technician
      await tx.notification.create({
        data: {
          userId: technicianId,
          type: 'TASK_ASSIGNED',
          title: 'New Task Assigned',
          message: `You have been assigned to maintenance request ${maintenanceReq.requestCode}.`,
          requestId,
        },
      });

      // 6. Notify the original requester
      await tx.notification.create({
        data: {
          userId: maintenanceReq.submittedById,
          type: 'REQUEST_APPROVED',
          title: 'Your request has been assigned',
          message: `Your maintenance request ${maintenanceReq.requestCode} has been assigned to a technician and is now in progress.`,
          requestId,
        },
      });

      return updated;
    });

    return NextResponse.json({
      success: true,
      request: updatedRequest,
      message: `Request ${maintenanceReq.requestCode} successfully assigned to ${techUser.firstName} ${techUser.lastName}.`,
    });

  } catch (error) {
    console.error('[POST /api/admin/assignments]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
