import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcryptjs from 'bcryptjs';
import type { Prisma } from '@prisma/client';

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
  const limit = Math.max(1, parseInt(searchParams.get('limit') ?? '10', 10));
  const search = searchParams.get('search')?.trim() ?? '';
  const role = searchParams.get('role')?.trim() ?? '';
  const status = searchParams.get('status')?.trim() ?? '';

  const where: Prisma.UserWhereInput = {
    ...(search && {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { idNumber: { contains: search, mode: 'insensitive' } }
      ]
    }),
    ...(role && { role: role as Prisma.EnumUserRoleFilter }),
    ...(status && { accountStatus: status as Prisma.EnumAccountStatusFilter })
  };

  try {
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
      }),
      prisma.user.count({ where })
    ]);

    return NextResponse.json({
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('[GET /api/admin/users]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ── POST /api/admin/users — Create a new user ──────────────────────────────
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
    role,
    specialization,
    password,
    accountStatus,
  } = body;

  // Server-side required field validation
  if (!firstName || !lastName || !email || !idNumber || !department || !role || !password) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  if (role === 'TECHNICIAN' && !specialization) {
    return NextResponse.json({ error: 'Specialization is required for Technicians' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
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
    const passwordHash = await bcryptjs.hash(password, 12);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        idNumber,
        department,
        contactNumber: contactNumber || null,
        role,
        specialization: role === 'TECHNICIAN' ? specialization : null,
        passwordHash,
        accountStatus: accountStatus || 'PENDING',
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
        details: `Admin created user ${firstName} ${lastName} (${email}) with role ${role}`,
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('[POST /api/admin/users]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
