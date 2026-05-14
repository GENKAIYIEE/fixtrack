import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { AuditAction, Prisma } from '@prisma/client';

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

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = Math.max(1, parseInt(searchParams.get('limit') ?? '15', 10));
  const search = searchParams.get('search')?.trim() ?? '';
  const action = searchParams.get('action')?.trim() ?? '';
  const dateFrom = searchParams.get('dateFrom')?.trim() ?? '';
  const dateTo = searchParams.get('dateTo')?.trim() ?? '';
  const exportAll = searchParams.get('export') === 'true';

  const where: Prisma.AuditLogWhereInput = {
    ...(search && {
      OR: [
        { details: { contains: search, mode: 'insensitive' } },
        { ipAddress: { contains: search, mode: 'insensitive' } },
        { affectedRecordId: { contains: search, mode: 'insensitive' } }
      ]
    }),
    ...(action && { action: action as AuditAction }),
    ...((dateFrom || dateTo) && {
      createdAt: {
        ...(dateFrom && { gte: new Date(dateFrom) }),
        ...(dateTo && { lte: new Date(new Date(dateTo).setHours(23, 59, 59, 999)) })
      }
    })
  };

  try {
    const take = exportAll ? 10000 : limit;
    const skip = exportAll ? 0 : (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, role: true }
          }
        }
      }),
      prisma.auditLog.count({ where })
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('[GET /api/admin/audit-logs]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
