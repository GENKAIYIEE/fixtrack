import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// ── GET /api/user/requests/[id] — fetch a single request belonging to the session user ──
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const request = await prisma.maintenanceRequest.findFirst({
      where: { id, submittedById: session.user.id },
    });

    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    return NextResponse.json(request);
  } catch (error) {
    console.error(`[GET /api/user/requests/${id}]`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ── DELETE /api/user/requests/[id] — cancel a PENDING request owned by the session user ──
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existing = await prisma.maintenanceRequest.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Users can only cancel their own requests
    if (existing.submittedById !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Only PENDING requests can be cancelled by the user
    if (existing.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Only pending requests can be cancelled.' },
        { status: 409 }
      );
    }

    const now = new Date();

    await prisma.$transaction([
      prisma.maintenanceRequest.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancellationReason: 'Cancelled by requester',
          updatedAt: now,
        },
      }),
      prisma.requestStatusHistory.create({
        data: {
          requestId: id,
          changedById: session.user.id,
          previousStatus: 'PENDING',
          newStatus: 'CANCELLED',
          remarks: 'Request cancelled by the requester.',
        },
      }),
      prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'REQUEST_CANCELLED',
          affectedRecordId: id,
          affectedRecordType: 'MaintenanceRequest',
          details: `Request ${existing.requestCode} cancelled by requester.`,
        },
      }),
    ]);

    return NextResponse.json({ success: true, message: 'Request cancelled successfully.' });
  } catch (error) {
    console.error(`[DELETE /api/user/requests/${id}]`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
