import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { IssueType, UrgencyLevel, Building, NotifType } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check for valid requester role
    if (session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      prisma.maintenanceRequest.findMany({
      where: { submittedById: userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        requestCode: true,
        description: true,
        issueType: true,
        building: true,
        roomNumber: true,
        status: true,
        priorityLevel: true,
        urgencyLevel: true,
        photoUrl: true,
        createdAt: true,
        updatedAt: true,
      },
      skip,
      take: limit,
    }),
    prisma.maintenanceRequest.count({
      where: { submittedById: userId }
    })
  ]);

    const mappedRequests = requests.map(req => ({
      ...req,
      title: req.description ? (req.description.length > 50 ? req.description.substring(0, 50) + '...' : req.description) : 'No description provided'
    }));

    return NextResponse.json({ 
      requests: mappedRequests,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('[api/user/requests] Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check for valid requester role
    if (session.user.role !== 'STUDENT') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { issueType, building, roomNumber, locationNotes, title, description, photos } = body;

    // Server-side validation
    const required = { issueType, building, roomNumber, title, description };
    for (const [key, val] of Object.entries(required)) {
      if (!val?.toString().trim()) {
        return Response.json({ error: `${key} is required` }, { status: 400 });
      }
    }
    if (description.trim().length < 20) {
      return Response.json({ error: 'Description too short' }, { status: 400 });
    }

    // Generate unique collision-resistant requestCode
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const datePrefix = new Date().toISOString().slice(2, 7).replace('-', ''); // YYMM
    const requestCode = `REQ-${datePrefix}-${randomHex}`;

    // Handle photos — store as JSON array string
    const photoUrl = photos && photos.length > 0
      ? JSON.stringify(photos.slice(0, 3))
      : null;

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', accountStatus: 'ACTIVE' },
      select: { id: true }
    });

    const newRequest = await prisma.$transaction(async (tx) => {
      // Step 1: Create the MaintenanceRequest
      const req = await tx.maintenanceRequest.create({
        data: {
          requestCode,
          submittedById: session.user.id,
          issueType: issueType as IssueType,
          urgencyLevel: 'NORMAL',
          building: building as Building,
          roomNumber: roomNumber.trim(),
          locationNotes: locationNotes?.trim() || null,
          description: `${title.trim()}\n\n${description.trim()}`,
          status: 'PENDING',
          priorityLevel: 'NORMAL',
          photoUrl
        }
      });

      // Step 2: RequestStatusHistory
      await tx.requestStatusHistory.create({
        data: {
          requestId: req.id,
          changedById: session.user.id,
          previousStatus: null,
          newStatus: 'PENDING',
          remarks: 'Request submitted by student'
        }
      });

      // Step 3: Notify all active admins
      if (admins.length > 0) {
        await tx.notification.createMany({
          data: admins.map(admin => ({
            userId: admin.id,
            type: 'REQUEST_SUBMITTED' as NotifType,
            title: 'New Maintenance Request',
            message: `${session.user.firstName || 'Student'} ${session.user.lastName || ''} submitted: "${title.trim()}" at ${building.replace(/_/g, ' ')}, ${roomNumber} (${requestCode})`,
            requestId: req.id
          }))
        });
      }

      // Step 4: AuditLog
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'REQUEST_SUBMITTED',
          affectedRecordId: req.id,
          affectedRecordType: 'MaintenanceRequest',
          details: `Student submitted ${requestCode}: ${issueType} issue at ${building}, ${roomNumber}`
        }
      });

      return req;
    });

    return Response.json({
      success: true,
      requestCode,
      requestId: newRequest.id
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('[api/user/requests] POST Error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}