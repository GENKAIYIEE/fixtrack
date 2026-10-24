import { NextRequest, NextResponse } from 'next/server';
import { getActiveSession } from '@/lib/auth/access';
import { prisma } from '@/lib/prisma';
import bcryptjs from 'bcryptjs';
import { decideVerification, VerificationError } from '@/lib/verification/decisions';
import { isActiveAdmin } from '@/lib/requests/assignment';

async function verifyAdmin() {
  const session = await getActiveSession(['ADMIN']);
  const authUser = session?.user;

  if (!authUser) return { error: 'Unauthorized', status: 401 as const };

  if (authUser.role !== 'ADMIN' || !await isActiveAdmin(authUser.id)) return { error: 'Forbidden', status: 403 as const };

  return { userId: authUser.id };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id: userIdToUpdate } = await params;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { accountStatus, newPassword } = body;

  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userIdToUpdate }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (accountStatus) {
      if (!['ACTIVE', 'INACTIVE', 'PENDING', 'REJECTED'].includes(accountStatus)) {
        return NextResponse.json({ error: 'Invalid account status' }, { status: 400 });
      }

      if (existingUser.accountStatus === 'PENDING' && accountStatus !== 'PENDING') {
        // Compatibility for the old PATCH action; the same single-decision transaction is mandatory.
        const decision = await decideVerification(auth.userId, userIdToUpdate, { action: accountStatus === 'ACTIVE' ? 'APPROVE' : 'REJECT' });
        return NextResponse.json(decision);
      }
      if (accountStatus === existingUser.accountStatus) return NextResponse.json({ id: existingUser.id, accountStatus });
      if (auth.userId === userIdToUpdate) return NextResponse.json({ error: 'You cannot change your own account status.' }, { status: 403 });
      if (existingUser.accountStatus === 'REJECTED' || !['ACTIVE', 'INACTIVE'].includes(accountStatus)) return NextResponse.json({ error: 'Verification decisions cannot be reset here. Use the pending-account verification section.' }, { status: 409 });

      const updatedUser = await prisma.user.update({
        where: { id: userIdToUpdate, accountStatus: existingUser.accountStatus },
        data: { accountStatus },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          idNumber: true,
          department: true,
          role: true,
          specialization: true,
          accountStatus: true,
          avatarUrl: true,
          createdAt: true,
        }
      });

      // Log action
      await prisma.auditLog.create({
        data: {
          userId: auth.userId,
          action: 'USER_UPDATED',
          affectedRecordId: userIdToUpdate,
          affectedRecordType: 'User',
          details: `Account status updated to ${accountStatus}`
        }
      });

      return NextResponse.json(updatedUser);
    }

    if (newPassword) {
      if (newPassword.length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
      }

      const saltRounds = 12;
      const passwordHash = await bcryptjs.hash(newPassword, saltRounds);

      const updatedUser = await prisma.user.update({
        where: { id: userIdToUpdate },
        data: { passwordHash },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          idNumber: true,
          department: true,
          role: true,
          specialization: true,
          accountStatus: true,
          avatarUrl: true,
          createdAt: true,
        }
      });

      // Log action
      await prisma.auditLog.create({
        data: {
          userId: auth.userId,
          action: 'PASSWORD_RESET',
          affectedRecordId: userIdToUpdate,
          affectedRecordType: 'User',
          details: 'Admin reset user password'
        }
      });

      return NextResponse.json(updatedUser);
    }

    return NextResponse.json({ error: 'No valid update data provided' }, { status: 400 });
  } catch (error) {
    if (error instanceof VerificationError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof Error && 'code' in error && error.code === 'P2025') return NextResponse.json({ error: 'Account changed. Refresh and retry.' }, { status: 409 });
    console.error(`[PATCH /api/admin/users/${userIdToUpdate}]`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ── GET /api/admin/users/[id] — Fetch single user ──────────────────────────
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        idNumber: true,
        department: true,
        contactNumber: true,
        role: true,
        specialization: true,
        accountStatus: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error(`[GET /api/admin/users/${id}]`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ── PUT /api/admin/users/[id] — Full user update ───────────────────────────
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const {
    firstName,
    lastName,
    email,
    idNumber,
    department,
    contactNumber,
    role,
    specialization,
    accountStatus,
  } = body;

  // Server-side validation
  if (!firstName || !lastName || !email || !role) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  if (role === 'TECHNICIAN' && !specialization) {
    return NextResponse.json({ error: 'Specialization is required for Technicians' }, { status: 400 });
  }

  try {
    const current = await prisma.user.findUnique({ where: { id }, select: { accountStatus: true, idNumber: true } });
    if (!current) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (accountStatus && accountStatus !== current.accountStatus &&
        (id === auth.userId || ['PENDING','REJECTED'].includes(current.accountStatus) || !['ACTIVE','INACTIVE'].includes(accountStatus))) {
      return NextResponse.json({ error: 'Use the pending-account verification section for approval or rejection. Recorded decisions cannot be reset here.' }, { status: 409 });
    }
    // Check email uniqueness excluding self
    const emailConflict = await prisma.user.findFirst({
      where: { email, NOT: { id } },
    });
    if (emailConflict) {
      return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 409 });
    }

    // Preserve an existing ID number; do not invent one for accounts registered without it.
    const finalIdNumber = typeof idNumber === 'string' && idNumber.trim() ? idNumber.trim() : current.idNumber;

    // Check idNumber uniqueness excluding self
    const idConflict = finalIdNumber ? await prisma.user.findFirst({
      where: { idNumber: finalIdNumber, NOT: { id } },
    }) : null;
    if (idConflict) {
      return NextResponse.json({ error: 'A user with this ID number already exists.' }, { status: 409 });
    }

    const updatedUser = await prisma.user.update({
      where: { id, accountStatus: current.accountStatus },
      data: {
        firstName,
        lastName,
        email,
        idNumber: finalIdNumber,
        department: department || null,
        contactNumber: contactNumber || null,
        role,
        specialization: role === 'TECHNICIAN' ? specialization : null,
        accountStatus,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        idNumber: true,
        department: true,
        contactNumber: true,
        role: true,
        specialization: true,
        accountStatus: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'USER_UPDATED',
        affectedRecordId: id,
        affectedRecordType: 'User',
        details: `Admin updated user ${firstName} ${lastName} (${email})`,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'P2025') return NextResponse.json({ error: 'Account changed. Refresh and retry.' }, { status: 409 });
    console.error(`[PUT /api/admin/users/${id}]`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
