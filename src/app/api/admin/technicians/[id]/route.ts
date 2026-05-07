import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

async function verifyAdmin() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return { error: 'Unauthorized', status: 401 as const };

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { id: true, role: true },
  });

  if (!user) return { error: 'Unauthorized', status: 401 as const };
  if (user.role !== 'ADMIN') return { error: 'Forbidden', status: 403 as const };

  return { userId: user.id };
}

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

    if (user.role !== 'TECHNICIAN') {
      return NextResponse.json({ error: 'User is not a technician' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error(`[GET /api/admin/technicians/${id}]`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

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
    specialization,
    accountStatus,
  } = body;

  if (!firstName || !lastName || !email || !idNumber || !department || !specialization) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    // Check if user is technician
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { role: true }
    });

    if (!existingUser || existingUser.role !== 'TECHNICIAN') {
      return NextResponse.json({ error: 'Target user is not a technician' }, { status: 403 });
    }

    // Check email uniqueness excluding self
    const emailConflict = await prisma.user.findFirst({
      where: { email, NOT: { id } },
    });
    if (emailConflict) {
      return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 409 });
    }

    // Check idNumber uniqueness excluding self
    const idConflict = await prisma.user.findFirst({
      where: { idNumber, NOT: { id } },
    });
    if (idConflict) {
      return NextResponse.json({ error: 'A user with this ID number already exists.' }, { status: 409 });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email,
        idNumber,
        department,
        contactNumber: contactNumber || null,
        specialization,
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
        details: `Admin updated technician ${firstName} ${lastName} (${email})`,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error(`[PUT /api/admin/technicians/${id}]`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
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
    const existingUser = await prisma.user.findUnique({
      where: { id: userIdToUpdate }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (existingUser.role !== 'TECHNICIAN') {
      return NextResponse.json({ error: 'User is not a technician' }, { status: 403 });
    }

    if (accountStatus) {
      if (!['ACTIVE', 'INACTIVE', 'PENDING'].includes(accountStatus)) {
        return NextResponse.json({ error: 'Invalid account status' }, { status: 400 });
      }

      const updatedUser = await prisma.user.update({
        where: { id: userIdToUpdate },
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
          updatedAt: true,
        }
      });

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
      if (newPassword.length < 10) {
        return NextResponse.json({ error: 'Password must be at least 10 characters' }, { status: 400 });
      }

      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);

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
          updatedAt: true,
        }
      });

      await prisma.auditLog.create({
        data: {
          userId: auth.userId,
          action: 'PASSWORD_RESET',
          affectedRecordId: userIdToUpdate,
          affectedRecordType: 'User',
          details: 'Admin reset technician password'
        }
      });

      return NextResponse.json(updatedUser);
    }

    return NextResponse.json({ error: 'No valid update data provided' }, { status: 400 });
  } catch (error) {
    console.error(`[PATCH /api/admin/technicians/${userIdToUpdate}]`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
