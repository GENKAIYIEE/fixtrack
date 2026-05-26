import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const requests = await prisma.maintenanceRequest.findMany({
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
    });

    const mappedRequests = requests.map(req => ({
      ...req,
      title: req.description ? (req.description.length > 50 ? req.description.substring(0, 50) + '...' : req.description) : 'No description provided'
    }));

    return NextResponse.json({ requests: mappedRequests });
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const title = formData.get('title') as string;
    const category = formData.get('category') as string;
    const description = formData.get('description') as string;
    const images = (formData.getAll('images') as File[]).filter(
      (f) => f instanceof File && f.size > 0
    );

    // Validate
    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    if (!category) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }
    if (!description || !description.trim()) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }
    if (images.length > 3) {
      return NextResponse.json({ error: 'Maximum 3 images allowed' }, { status: 400 });
    }

    // Process images - save first image only (due to schema limitation)
    let photoUrl: string | undefined;
    if (images.length > 0) {
      const image = images[0];
      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Ensure uploads directory exists
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Generate unique filename
      const fileExtension = image.name.split('.').pop();
      const filename = `${uuidv4()}.${fileExtension}`;
      const filePath = path.join(uploadsDir, filename);

      // Save file
      fs.writeFileSync(filePath, buffer);

      // Construct URL
      photoUrl = `/uploads/${filename}`;
    }

    // Map category value to IssueType enum
    const categoryMap: Record<string, string> = {
      plumbing: 'PLUMBING',
      electrical: 'ELECTRICAL',
      hvac: 'HVAC',
      carpentry: 'CARPENTRY',
      structural: 'STRUCTURAL',
      other: 'OTHERS',
      others: 'OTHERS',
    };
    const parsedIssueType = categoryMap[category.toLowerCase()] ?? 'OTHERS';

    // Generate a collision-safe requestCode using UUID
    const generateRequestCode = () => `REQ-${uuidv4().replace(/-/g, '').slice(0, 8).toUpperCase()}`;

    // Retry up to 3 times in the unlikely event of a code collision
    let newRequest;
    let attempts = 0;
    while (attempts < 3) {
      try {
        newRequest = await prisma.maintenanceRequest.create({
          data: {
            issueType: parsedIssueType as any,
            description: `${title.trim()}\n\n${description.trim()}`,
            photoUrl,
            submittedById: session.user.id,
            status: 'PENDING',
            priorityLevel: 'NORMAL',
            urgencyLevel: 'NORMAL',
            requestCode: generateRequestCode(),
            building: 'OTHERS',
            roomNumber: 'TBD',
          },
        });
        break; // success
      } catch (createErr: any) {
        // P2002 = unique constraint violation (duplicate requestCode)
        if (createErr?.code === 'P2002' && attempts < 2) {
          attempts++;
          continue;
        }
        throw createErr; // rethrow non-collision errors or exhausted retries
      }
    }

    if (!newRequest) {
      throw new Error('Failed to create request after multiple attempts.');
    }

    // Create notification for user
    try {
      await prisma.notification.create({
        data: {
          userId: session.user.id,
          type: 'REQUEST_SUBMITTED',
          title: 'Request Submitted',
          message: `Your request "${title.trim()}" has been submitted and is pending review.`,
          requestId: newRequest.id,
        },
      });
    } catch (notifErr) {
      // Non-critical — log but don't fail the request
      console.warn('[api/user/requests] Failed to create notification:', notifErr);
    }

    // Also create an audit log entry for the submission
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'REQUEST_SUBMITTED',
          affectedRecordId: newRequest.requestCode,
          affectedRecordType: 'MaintenanceRequest',
          details: `Request ${newRequest.requestCode} submitted by user ${session.user.id}`,
        },
      });
    } catch (auditErr) {
      // Non-critical — log but don't fail the request
      console.warn('[api/user/requests] Failed to create audit log:', auditErr);
    }

    return NextResponse.json({ success: true, request: newRequest }, { status: 201 });
  } catch (error: any) {
    console.error('[api/user/requests] Error:', error);
    // Return a meaningful error message to help debug
    const message =
      error?.message?.includes('Unique constraint') || error?.code === 'P2002'
        ? 'A request with this code already exists. Please try again.'
        : 'Internal Server Error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}