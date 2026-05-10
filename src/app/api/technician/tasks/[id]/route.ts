import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { RequestStatus } from '@prisma/client';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'TECHNICIAN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const task = await prisma.maintenanceRequest.findFirst({
      where: {
        id: id,
        assignedToId: session.user.id,
      },
      include: {
        submitter: { select: { firstName: true, lastName: true } },
        assignee: { select: { firstName: true, lastName: true, specialization: true } },
        repairNote: true,
        statusHistory: {
          orderBy: { changedAt: 'desc' },
          include: {
            actor: { select: { firstName: true, lastName: true, role: true } },
          },
        },
      },
    });

    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error fetching task details:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'TECHNICIAN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, repairNotes, partsReplaced, status } = body;

    const task = await prisma.maintenanceRequest.findFirst({
      where: { id: id, assignedToId: session.user.id },
    });

    if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (action === 'update') {
      await prisma.$transaction(async (tx) => {
        // Upsert repair note
        await tx.repairNote.upsert({
          where: { requestId: id },
          update: { notes: repairNotes, partsReplaced: partsReplaced || null, updatedAt: new Date() },
          create: { requestId: id, technicianId: session.user.id, notes: repairNotes, partsReplaced: partsReplaced || null },
        });

        // Update status if changed
        if (status && status !== task.status) {
          await tx.maintenanceRequest.update({
            where: { id: id },
            data: { status: status as RequestStatus, updatedAt: new Date() },
          });

          await tx.requestStatusHistory.create({
            data: {
              requestId: id,
              changedById: session.user.id,
              previousStatus: task.status,
              newStatus: status as RequestStatus,
              remarks: repairNotes,
            },
          });
        }

        // AuditLog
        await tx.auditLog.create({
          data: {
            userId: session.user.id,
            action: 'STATUS_UPDATED',
            affectedRecordId: id,
            affectedRecordType: 'MaintenanceRequest',
            details: `Technician updated repair notes for ${task.requestCode}`,
          },
        });
      });
    }

    if (action === 'complete') {
      await prisma.$transaction(async (tx) => {
        await tx.maintenanceRequest.update({
          where: { id: id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            updatedAt: new Date(),
          },
        });

        await tx.requestStatusHistory.create({
          data: {
            requestId: id,
            changedById: session.user.id,
            previousStatus: task.status,
            newStatus: 'COMPLETED',
            remarks: 'Task marked as completed by technician',
          },
        });

        await tx.notification.create({
          data: {
            userId: task.submittedById,
            type: 'TASK_COMPLETED',
            title: 'Your Request Has Been Completed',
            message: `Your maintenance request ${task.requestCode} has been successfully completed.`,
            requestId: id,
          },
        });

        await tx.auditLog.create({
          data: {
            userId: session.user.id,
            action: 'TASK_COMPLETED',
            affectedRecordId: id,
            affectedRecordType: 'MaintenanceRequest',
            details: `Technician marked ${task.requestCode} as completed`,
          },
        });
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
