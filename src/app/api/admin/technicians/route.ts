import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createClient } from '@supabase/supabase-js';
import bcryptjs from 'bcryptjs';

// ── Supabase Admin Client (uses service-role key — server-side only) ─────────
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// ── Admin guard ───────────────────────────────────────────────────────────────
async function verifyAdmin() {
  const session = await getServerSession(authOptions);
  const authUser = session?.user;

  if (!authUser) return { error: 'Unauthorized', status: 401 as const };
  if (authUser.role !== 'ADMIN') return { error: 'Forbidden', status: 403 as const };

  return { userId: authUser.id };
}

// ── GET /api/admin/technicians — list all technicians ────────────────────────
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const technicians = await prisma.user.findMany({
      where: { role: 'TECHNICIAN' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        idNumber: true,
        contactNumber: true,
        specialization: true,
        accountStatus: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ technicians });
  } catch (error) {
    console.error('[GET /api/admin/technicians]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ── POST /api/admin/technicians — create a new technician ────────────────────
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
    contactNumber,
    specialization,
    password,
    accountStatus,
  } = body;

  // ── Server-side validation ─────────────────────────────────────────────────
  if (!firstName || !lastName || !email || !idNumber || !specialization || !password) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters' },
      { status: 400 }
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
  }

  // ── Uniqueness checks (Prisma DB) ──────────────────────────────────────────
  try {
    const emailExists = await prisma.user.findUnique({ where: { email } });
    if (emailExists) {
      return NextResponse.json(
        { error: 'A user with this email already exists.' },
        { status: 409 }
      );
    }

    const idExists = await prisma.user.findUnique({ where: { idNumber } });
    if (idExists) {
      return NextResponse.json(
        { error: 'A user with this ID number already exists.' },
        { status: 409 }
      );
    }
  } catch (error) {
    console.error('[POST /api/admin/technicians] Uniqueness check failed:', error);
    return NextResponse.json({ error: 'Database error during validation' }, { status: 500 });
  }

  // ── Step 1: Create user in Supabase Auth ───────────────────────────────────
  // This ensures the account is visible in the Supabase Authentication dashboard
  // and the user ID is consistent across both systems.
  let supabaseUserId: string | null = null;

  try {
    const supabaseAdmin = getSupabaseAdmin();

    const { data: supabaseUser, error: supabaseError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // skip email confirmation — admin-created accounts are pre-verified
      user_metadata: {
        firstName,
        lastName,
        role: 'TECHNICIAN',
      },
    });

    if (supabaseError || !supabaseUser?.user) {
      console.error('[POST /api/admin/technicians] Supabase Auth error:', supabaseError);
      return NextResponse.json(
        { error: supabaseError?.message || 'Failed to create authentication account in Supabase.' },
        { status: 500 }
      );
    }

    supabaseUserId = supabaseUser.user.id;
  } catch (error) {
    console.error('[POST /api/admin/technicians] Supabase Admin client error:', error);
    return NextResponse.json(
      { error: 'Authentication service unavailable. Check SUPABASE_SERVICE_ROLE_KEY.' },
      { status: 500 }
    );
  }

  // ── Step 2: Hash password for Prisma storage ───────────────────────────────
  const passwordHash = await bcryptjs.hash(password, 12);

  // ── Step 3: Create user in Prisma DB (using Supabase ID for consistency) ───
  let newUser: any;
  try {
    newUser = await prisma.user.create({
      data: {
        id: supabaseUserId,           // Keep IDs in sync between Supabase Auth and Prisma
        firstName,
        lastName,
        email,
        idNumber,
        contactNumber: contactNumber || null,
        role: 'TECHNICIAN',
        specialization,
        passwordHash,
        accountStatus: (accountStatus as 'ACTIVE' | 'INACTIVE') || 'ACTIVE',
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
  } catch (prismaError) {
    // ── Rollback: Delete the Supabase Auth user if Prisma fails ───────────────
    console.error('[POST /api/admin/technicians] Prisma create failed, rolling back Supabase user:', prismaError);
    try {
      const supabaseAdmin = getSupabaseAdmin();
      await supabaseAdmin.auth.admin.deleteUser(supabaseUserId!);
      console.info(`[POST /api/admin/technicians] Rolled back Supabase user ${supabaseUserId}`);
    } catch (rollbackError) {
      console.error('[POST /api/admin/technicians] Rollback failed — orphaned Supabase user:', supabaseUserId, rollbackError);
    }

    return NextResponse.json({ error: 'Failed to create technician record in database.' }, { status: 500 });
  }

  // ── Step 4: Audit log ──────────────────────────────────────────────────────
  try {
    await prisma.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'USER_CREATED',
        affectedRecordId: newUser.id,
        affectedRecordType: 'User',
        details: `Admin created technician ${firstName} ${lastName} (${email}) with specialization ${specialization}`,
      },
    });
  } catch (auditError) {
    // Audit log failure is non-fatal — log it but don't fail the request
    console.error('[POST /api/admin/technicians] Audit log failed (non-fatal):', auditError);
  }

  return NextResponse.json(newUser, { status: 201 });
}
