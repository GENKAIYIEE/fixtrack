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

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

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
    password,
    accountStatus,
  } = body;

  // Server-side validation
  if (!firstName || !lastName || !email || !idNumber || !department || !specialization || !password) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (password.length < 10) {
    return NextResponse.json({ error: 'Password must be at least 10 characters' }, { status: 400 });
  }

  try {
    // Check email uniqueness
    const emailExists = await prisma.user.findUnique({ where: { email } });
    if (emailExists) {
      return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 409 });
    }

    // Check idNumber uniqueness
    const idExists = await prisma.user.findUnique({ where: { idNumber } });
    if (idExists) {
      return NextResponse.json({ error: 'A user with this ID number already exists.' }, { status: 409 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user with hardcoded role
    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        idNumber,
        department,
        contactNumber: contactNumber || null,
        role: 'TECHNICIAN',
        specialization,
        passwordHash,
        accountStatus: accountStatus || 'ACTIVE',
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
        action: 'USER_CREATED',
        affectedRecordId: newUser.id,
        affectedRecordType: 'User',
        details: `Admin created technician ${firstName} ${lastName} (${email})`,
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('[POST /api/admin/technicians]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
