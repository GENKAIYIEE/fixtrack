import { NextRequest, NextResponse } from 'next/server';
import { getActiveSession } from '@/lib/auth/access';
import prisma from '@/lib/prisma';
import { currentWorkerInclude } from '@/lib/workers/service';
import { isActiveAdmin, getTechnicianHead, relayRequests, workflowErrorResponse, technicianHeadEmail } from '@/lib/requests/assignment';

export async function GET(request: NextRequest) {
  const session = await getActiveSession(['ADMIN']);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'ADMIN' || !await isActiveAdmin(session.user.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const type = request.nextUrl.searchParams.get('type');
    if (type === 'approved') {
      const page = Number(request.nextUrl.searchParams.get('page') || 1);
      const limit = Number(request.nextUrl.searchParams.get('limit') || 10);
      if (!Number.isInteger(page) || page < 1 || page > 100000 || !Number.isInteger(limit) || limit < 1 || limit > 50) return NextResponse.json({ error: 'Invalid page.' }, { status: 400 });
      const where = { status: { in: ['APPROVED', 'ONGOING', 'ON_HOLD', 'COMPLETED'] as ('APPROVED' | 'ONGOING' | 'ON_HOLD' | 'COMPLETED')[] } };
      const [requests, total] = await Promise.all([
        prisma.maintenanceRequest.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
          include: { submitter: { select: { firstName: true, lastName: true } }, assignee: { select: { firstName: true, lastName: true, email: true } }, workerAssignments: currentWorkerInclude } }),
        prisma.maintenanceRequest.count({ where }),
      ]);
      return NextResponse.json({ requests: requests.map(row => ({ ...row, assignedToDesignatedHead: row.assignee ? row.assignee.email.toLowerCase() === technicianHeadEmail() : false })), total, page, totalPages: Math.max(1, Math.ceil(total / limit)) }, { headers: { 'Cache-Control': 'no-store' } });
    }
    if (type === 'unassigned') {
      const requests = await prisma.maintenanceRequest.findMany({
        where: { status: 'APPROVED', assignedToId: null }, take: 200,
        include: { submitter: { select: { firstName: true, lastName: true } } }, orderBy: { createdAt: 'asc' },
      });
      const rank: Record<string, number> = { URGENT: 4, HIGH: 3, NORMAL: 2, LOW: 1 };
      requests.sort((a, b) => rank[b.priorityLevel] - rank[a.priorityLevel] || a.createdAt.getTime() - b.createdAt.getTime());
      return NextResponse.json({ requests });
    }
    if (type === 'technicians') {
      const head = await getTechnicianHead();
      const activeTaskCount = await prisma.maintenanceRequest.count({
        where: { assignedToId: head.id, status: { in: ['ONGOING', 'ON_HOLD'] } },
      });
      return NextResponse.json({ technicians: [{ ...head, activeTaskCount }] });
    }
    return NextResponse.json({ error: 'Use ?type=unassigned, ?type=technicians or ?type=approved' }, { status: 400 });
  } catch (error) { return workflowErrorResponse(error); }
}
export async function POST(request: NextRequest) {
  const session = await getActiveSession(['ADMIN']);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'ADMIN' || !await isActiveAdmin(session.user.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  try {
    const result = await relayRequests(session.user.id, [body.requestId], body.technicianId);
    return NextResponse.json({ success: true, ...result, message: 'Request relayed to the technician head.' });
  } catch (error) { return workflowErrorResponse(error); }
}
