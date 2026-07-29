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
    const { issueType, building, roomNumber, locationNotes, description, photos } = body;

    // Server-side validation
    const required = { issueType, building, roomNumber, description };
    for (const [key, val] of Object.entries(required)) {
      if (!val?.toString().trim()) {
        return Response.json({ error: `${key} is required` }, { status: 400 });
      }
    }

    // Generate unique collision-resistant requestCode
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const datePrefix = new Date().toISOString().slice(2, 7).replace('-', ''); // YYMM
    const requestCode = `REQ-${datePrefix}-${randomHex}`;

    // Handle photos — upload to Supabase Storage
    let photoUrl = null;
    const uploadedFileNames: string[] = []; // Track for rollback
    
    if (photos && photos.length > 0) {
      try {
        const { supabaseAdmin } = await import('@/lib/supabase/admin');
        const uploadedUrls: string[] = [];
        
        for (let i = 0; i < Math.min(photos.length, 3); i++) {
          const photoBase64 = photos[i];
          if (photoBase64 && photoBase64.startsWith('data:image')) {
            if (photoBase64.length > 7500000) {
              return Response.json({ error: `Photo ${i + 1} exceeds 5MB limit` }, { status: 400 });
            }

            const matches = photoBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
              const mimeType = matches[1];
              
              const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
              if (!allowedMimeTypes.includes(mimeType)) {
                return Response.json({ error: `Invalid image format for photo ${i + 1}. Only JPG, PNG, and WEBP are allowed.` }, { status: 400 });
              }

              const base64Data = matches[2];
              const buffer = Buffer.from(base64Data, 'base64');
              
              const fileExt = mimeType.split('/')[1] || 'jpeg';
              const fileName = `${session.user.id}-${requestCode}-${i}-${Date.now()}.${fileExt}`;
              
              const { error: uploadError } = await supabaseAdmin.storage
                .from('request-photos')
                .upload(fileName, buffer, {
                  contentType: mimeType,
                  upsert: true
                });

              if (!uploadError) {
                uploadedFileNames.push(fileName);
                const { data: { publicUrl } } = supabaseAdmin.storage
                  .from('request-photos')
                  .getPublicUrl(fileName);
                uploadedUrls.push(publicUrl);
              } else {
                console.error('Supabase request photo upload error:', uploadError);
              }
            }
          }
        }
        
        if (uploadedUrls.length > 0) {
          photoUrl = JSON.stringify(uploadedUrls);
        }
      } catch (err) {
        console.error('Error processing request photos:', err);
        return Response.json({ error: 'Failed to process photos' }, { status: 500 });
      }
    }

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', accountStatus: 'ACTIVE' },
      select: { id: true }
    });

    let newRequest;
    try {
      newRequest = await prisma.$transaction(async (tx) => {
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
            description: description.trim(),
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
              message: `${session.user.firstName || 'Student'} ${session.user.lastName || ''} submitted a request at ${building.replace(/_/g, ' ')}, ${roomNumber} (${requestCode}): "${description.trim().substring(0, 80)}${description.trim().length > 80 ? '...' : ''}"`,
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
    } catch (dbError) {
      if (uploadedFileNames.length > 0) {
        try {
          const { supabaseAdmin } = await import('@/lib/supabase/admin');
          await supabaseAdmin.storage.from('request-photos').remove(uploadedFileNames);
          console.log(`Rolled back ${uploadedFileNames.length} orphaned files.`);
        } catch (cleanupError) {
          console.error('Failed to cleanup orphaned files:', cleanupError);
        }
      }
      throw dbError; // Re-throw to be caught by outer catch
    }

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