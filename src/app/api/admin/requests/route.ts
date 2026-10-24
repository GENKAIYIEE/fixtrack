import { NextRequest, NextResponse } from 'next/server';
import { getActiveSession } from '@/lib/auth/access';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { isActiveAdmin, relayRequests, workflowErrorResponse, technicianHeadEmail } from '@/lib/requests/assignment';

// ── Auth helper ───────────────────────────────────────────────────────────────

async function verifyAdmin() {
  const session = await getActiveSession(['ADMIN']);
  const authUser = session?.user;

  if (!authUser) return { error: 'Unauthorized', status: 401 as const };

  if (authUser.role !== 'ADMIN' || !await isActiveAdmin(authUser.id)) return { error: 'Forbidden', status: 403 as const };

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
  const priority = searchParams.get('priority')?.trim() ?? '';
  const building = searchParams.get('building')?.trim() ?? '';
  const assignedTo = searchParams.get('assignedTo')?.trim() ?? '';
  const issueType = searchParams.get('issueType')?.trim() ?? '';
  const dateFrom = searchParams.get('dateFrom')?.trim() ?? '';
  const dateTo = searchParams.get('dateTo')?.trim() ?? '';

  // Build dynamic where clause
  const where: Prisma.MaintenanceRequestWhereInput = {};

  if (status) where.status = status as Prisma.EnumRequestStatusFilter;
  if (priority && !['HIGH', 'MEDIUM', 'LOW'].includes(priority)) return NextResponse.json({ error: 'Invalid requested priority' }, { status: 400 });
  if (priority) where.requestedPriority = priority as Prisma.EnumRequestedPriorityNullableFilter;
  if (building) where.building = building as Prisma.EnumBuildingNullableFilter;
  if (assignedTo) where.assignedToId = assignedTo;
  if (issueType) where.issueType = issueType as Prisma.EnumIssueTypeNullableFilter;

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) {
      const to = new Date(dateTo);
      to.setUTCHours(23, 59, 59, 999);
      where.createdAt.lte = to;
    }
  }

  if (search) {
    where.OR = [
      { requestCode: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { workLocation: { contains: search, mode: 'insensitive' } },
      { requestingParty: { contains: search, mode: 'insensitive' } },
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
            select: { firstName: true, lastName: true, email: true },
          },
          assigner: {
            select: { firstName: true, lastName: true },
          },
        },
      }),
      prisma.maintenanceRequest.count({ where }),
    ]);

    return NextResponse.json({
      requests: requests.map(row => ({ ...row, assignedToDesignatedHead: row.assignee ? row.assignee.email.toLowerCase() === technicianHeadEmail() : null })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('[GET /api/admin/requests]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ── PATCH — bulk assign ───────────────────────────────────────────────────────

export async function PATCH(request: NextRequest) {
  const auth = await verifyAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }
  if (!body || body.action !== 'bulkAssign') return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  try {
    const result = await relayRequests(auth.userId, body.requestIds, body.technicianId);
    return NextResponse.json({ success: true, ...result });
  } catch (error) { return workflowErrorResponse(error); }
}
