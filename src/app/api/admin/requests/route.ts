import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

// ── Auth helper ───────────────────────────────────────────────────────────────

async function verifyAdmin() {
  const session = await getServerSession(authOptions);
  const authUser = session?.user;

  if (!authUser) return { error: 'Unauthorized', status: 401 as const };

  if (authUser.role !== 'ADMIN') return { error: 'Forbidden', status: 403 as const };

  return { userId: authUser.id };
}

// ── GET — paginated, filtered requests ───────────────────────────────────────

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = request.nextUrl;

  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = Math.max(1, parseInt(searchParams.get('limit') ?? '10', 10));
  const skip = (page - 1) * limit;

  const search = searchParams.get('search')?.trim() ?? '';
  const status = searchParams.get('status')?.trim() ?? '';
  const urgency = searchParams.get('urgency')?.trim() ?? '';
  const building = searchParams.get('building')?.trim() ?? '';
  const assignedTo = searchParams.get('assignedTo')?.trim() ?? '';
  const issueType = searchParams.get('issueType')?.trim() ?? '';
  const dateFrom = searchParams.get('dateFrom')?.trim() ?? '';
  const dateTo = searchParams.get('dateTo')?.trim() ?? '';

  // Build dynamic where clause
  const where: Prisma.MaintenanceRequestWhereInput = {};

  if (status) where.status = status as Prisma.EnumRequestStatusFilter;
  if (urgency) where.urgencyLevel = urgency as Prisma.EnumUrgencyLevelFilter;
  if (building) where.building = building as Prisma.EnumBuildingFilter;
  if (assignedTo) where.assignedToId = assignedTo;
  if (issueType) where.issueType = issueType as Prisma.EnumIssueTypeFilter;

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      where.createdAt.lte = to;
    }
  }

  if (search) {
    where.OR = [
      { requestCode: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      {
        submitter: {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
          ],
        },
      },
    ];
  }

  try {
    const [requests, total] = await Promise.all([
      prisma.maintenanceRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          submitter: {
            select: { firstName: true, lastName: true },
          },
          assignee: {
            select: { firstName: true, lastName: true },
          },
          assigner: {
            select: { firstName: true, lastName: true },
          },
        },
      }),
      prisma.maintenanceRequest.count({ where }),
    ]);

    // Cap total to 2 as requested to mimic mock data limits
    const cappedTotal = Math.min(total, 2);

    return NextResponse.json({
      requests,
      total: cappedTotal,
      page,
      limit,
      totalPages: Math.ceil(cappedTotal / limit),
    });
  } catch (error) {
    console.error('[GET /api/admin/requests]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ── PATCH — bulk assign ───────────────────────────────────────────────────────

export async function PATCH(request: NextRequest) {
  const auth = await verifyAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { action, requestIds, technicianId } = body as {
    action: string;
    requestIds: string[];
    technicianId: string;
  };

  if (action !== 'bulkAssign') {
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }

  if (!Array.isArray(requestIds) || requestIds.length === 0) {
    return NextResponse.json({ error: 'requestIds must be a non-empty array' }, { status: 400 });
  }

  if (!technicianId) {
    return NextResponse.json({ error: 'technicianId is required' }, { status: 400 });
  }

  try {
    const now = new Date();

    // Fetch the target requests to get requestCode and current status for history/logs
    const targetRequests = await prisma.maintenanceRequest.findMany({
      where: { id: { in: requestIds } },
      select: { id: true, requestCode: true, status: true },
    });

    // Update all target requests
    await prisma.maintenanceRequest.updateMany({
      where: { id: { in: requestIds } },
      data: {
        assignedToId: technicianId,
        assignedById: auth.userId,
        assignedAt: now,
        status: 'ONGOING',
      },
    });

    // Create RequestAssignment records for each
    await prisma.requestAssignment.createMany({
      data: requestIds.map((requestId) => ({
        requestId,
        assignedToId: technicianId,
        assignedById: auth.userId,
        assignedAt: now,
        isActive: true,
      })),
      skipDuplicates: true,
    });

    // FIXED: BUG-13 — Add missing StatusHistory, AuditLog, and Notifications
    // that the single-assign flow creates but the bulk path was silently skipping.
    for (const req of targetRequests) {
      // Status history entry per request
      await prisma.requestStatusHistory.create({
        data: {
          requestId: req.id,
          changedById: auth.userId,
          previousStatus: req.status,
          newStatus: 'ONGOING',
          remarks: `Bulk assigned to technician ${technicianId}`,
        },
      });

      // Audit log entry per request
      await prisma.auditLog.create({
        data: {
          userId: auth.userId,
          action: 'TASK_ASSIGNED',
          affectedRecordId: req.requestCode,
          affectedRecordType: 'MaintenanceRequest',
          details: `Bulk assignment: ${req.requestCode} assigned to technician ${technicianId}`,
        },
      });

      // Notification for the assigned technician
      await prisma.notification.create({
        data: {
          userId: technicianId,
          type: 'TASK_ASSIGNED',
          title: 'New Task Assigned',
          message: `${req.requestCode} has been assigned to you via bulk assignment.`,
          requestId: req.id,
        },
      });
    }

    return NextResponse.json({ success: true, updated: requestIds.length });
  } catch (error) {
    console.error('[PATCH /api/admin/requests]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

