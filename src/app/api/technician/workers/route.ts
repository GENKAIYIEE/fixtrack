import { NextResponse } from 'next/server';
import { getActiveSession } from '@/lib/auth/access';
import prisma from '@/lib/prisma';
import { requireTechnicianHead, WorkflowError } from '@/lib/requests/assignment';
import { ACTIVE_WORKER_STATUSES, saveWorker, workerErrorResponse } from '@/lib/workers/service';
import { boundedJson } from '@/lib/workers/validation';
export async function GET(request: Request) {
  try {
    const session = await getActiveSession(['TECHNICIAN']);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await requireTechnicianHead(session.user.id);
    const params = new URL(request.url).searchParams;
    const page = Number(params.get('page') || 1), limit = Number(params.get('limit') || 20), search = (params.get('search') || '').trim();
    if (!Number.isInteger(page) || page < 1 || page > 100000 || !Number.isInteger(limit) || limit < 1 || limit > 100 || search.length > 100) throw new WorkflowError('Invalid page or search.');
    const where = { ...(params.get('archived') !== 'true' && { isArchived: false }), ...(search && { OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { contactNumber: { contains: search } }] }) };
    const [rows, total] = await Promise.all([prisma.maintenanceWorker.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: [{ name: 'asc' }, { id: 'asc' }], include: { assignments: { where: { releasedAt: null, request: { status: { in: [...ACTIVE_WORKER_STATUSES] } } }, select: { requestId: true } } } }), prisma.maintenanceWorker.count({ where })]);
    const ratingGroups = await prisma.workerRating.groupBy({ by: ['workerId'], where: { workerId: { in: rows.map(w => w.id) }, request: { status: 'COMPLETED' } }, _avg: { score: true }, _count: { score: true } });
    const workers = rows.map(({ assignments, ...worker }) => ({ ...worker, ratingAverage: ratingGroups.find(r => r.workerId === worker.id)?._avg.score ?? null, ratingCount: ratingGroups.find(r => r.workerId === worker.id)?._count.score ?? 0, activeTaskCount: assignments.length, availability: worker.isArchived ? 'ARCHIVED' : assignments.length ? 'BUSY' : worker.isAvailable ? 'AVAILABLE' : 'UNAVAILABLE' }));
    return NextResponse.json({ workers, total, page, totalPages: Math.max(1, Math.ceil(total / limit)) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return workerErrorResponse(error); }
}
export async function POST(request: Request) {
  try {
    const session = await getActiveSession(['TECHNICIAN']);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await requireTechnicianHead(session.user.id);
    return NextResponse.json(await saveWorker(session.user.id, await boundedJson(request)), { status: 201 });
  } catch (error) { return workerErrorResponse(error); }
}
