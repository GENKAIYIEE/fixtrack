import { readRequestJson, RequestBodyError } from '@/lib/requests/body-limit';
import { requestSubmissionFailure } from '@/lib/requests/submission-errors';
import { PhotoEvidenceError, validateEvidencePhotos, uploadEvidencePhotos } from '@/lib/requests/photo-storage';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getActiveSession } from '@/lib/auth/access';
import prisma from '@/lib/prisma';
import { validateRequestInput, requestDateToday } from '@/lib/requests/form';

export async function GET(request: Request) {
  try {
    const session = await getActiveSession(['STUDENT']);

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
        workLocation: true,
        requestDate: true,
        requestingParty: true,
        requestedPriority: true,
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
    const session = await getActiveSession(['STUDENT']);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.user.role !== 'STUDENT') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const requester = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!requester || requester.role !== 'STUDENT' || requester.accountStatus !== 'ACTIVE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    let body: unknown;
    try { body = await readRequestJson(request); }
    catch (error) {
      if (error instanceof RequestBodyError) return NextResponse.json({ error: error.message }, { status: error.status });
      return NextResponse.json({ error: 'The request body could not be read. Please retry.' }, { status: 400 });
    }
    const result = validateRequestInput(body);
    if (result.errors) return NextResponse.json({ error: 'Please check the request form.', errors: result.errors }, { status: 400 });
    const { workLocation, description, requestedPriority } = result.data;
    const photos = validateEvidencePhotos((body as Record<string, unknown>).photos);
    const today = requestDateToday();
    const requestCode = `REQ-${today.slice(2, 7).replace('-', '')}-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
    // Do not trust browser-supplied names, dates, status, assignees, or admin priority.
    const requestingParty = `${requester.firstName} ${requester.lastName}`.trim();
    const evidence = await uploadEvidencePhotos(photos, requester.id, requestCode);
    let newRequest;
    try {
    newRequest = await prisma.$transaction(async tx => {
      const req = await tx.maintenanceRequest.create({ data: {
        requestCode, submittedById: requester.id, requestDate: new Date(`${today}T00:00:00.000Z`),
        requestingParty, workLocation, description, requestedPriority,
        urgencyLevel: requestedPriority === 'MEDIUM' ? 'NORMAL' : requestedPriority,
        priorityLevel: requestedPriority === 'MEDIUM' ? 'NORMAL' : requestedPriority, status: 'PENDING', photoUrl: evidence.photoUrl,
      } });
      await tx.requestStatusHistory.create({ data: {
        requestId: req.id, changedById: requester.id, previousStatus: null, newStatus: 'PENDING',
        remarks: 'Maintenance / Custodial Work Request submitted',
      } });
      const admins = await tx.user.findMany({ where: { role: 'ADMIN', accountStatus: 'ACTIVE' }, select: { id: true } });
      if (admins.length) await tx.notification.createMany({ data: admins.map(admin => ({
        userId: admin.id, type: 'REQUEST_SUBMITTED' as const, title: 'New Maintenance Request',
        message: `${requestingParty} submitted ${requestCode} at ${workLocation}: ${description.slice(0, 80)}`,
        requestId: req.id,
      })) });
      await tx.auditLog.create({ data: {
        userId: requester.id, action: 'REQUEST_SUBMITTED', affectedRecordId: req.id,
        affectedRecordType: 'MaintenanceRequest', details: `Submitted ${requestCode} at ${workLocation}; requested priority ${requestedPriority}`,
      } });
      return req;
    });
    } catch (error) {
      try { await evidence.rollback(); } catch { console.error('[request photos] Cleanup after a failed database write requires administrator review.'); }
      throw error;
    }
    return NextResponse.json({ success: true, requestCode, requestId: newRequest.id }, { status: 201 });
  } catch (error) {
    if (error instanceof PhotoEvidenceError) return NextResponse.json({ error: error.message }, { status: 400 });
    const failure = requestSubmissionFailure(error);
    console.error('[api/user/requests] Submission failed:', failure.code);
    return NextResponse.json({ error: failure.error, code: failure.code }, { status: failure.status });
  }
}
