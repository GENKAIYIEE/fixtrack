import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/admin/diagnostics/auth
 * 
 * Admin-only diagnostic endpoint to audit:
 * 1. All technician accounts in the Prisma DB
 * 2. Whether those accounts exist in Supabase Auth
 * 3. Account status health
 * 
 * REMOVE THIS ENDPOINT IN PRODUCTION.
 */
export async function GET() {
  // Basic security: only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  const results: any = {
    timestamp: new Date().toISOString(),
    prismaUsers: [],
    supabaseAuthUsers: [],
    issues: [],
  };

  // ── Check Prisma technician accounts ──────────────────────────────────────
  try {
    const technicians = await prisma.user.findMany({
      where: { role: 'TECHNICIAN' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        accountStatus: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    results.prismaUsers = technicians;
    results.prismaCount = technicians.length;

    // Flag PENDING accounts (cannot log in)
    const pendingAccounts = technicians.filter((u) => u.accountStatus === 'PENDING');
    const inactiveAccounts = technicians.filter((u) => u.accountStatus === 'INACTIVE');

    if (pendingAccounts.length > 0) {
      results.issues.push({
        severity: 'ERROR',
        code: 'PENDING_ACCOUNTS_CANNOT_LOGIN',
        message: `${pendingAccounts.length} technician(s) have PENDING status and CANNOT log in.`,
        affected: pendingAccounts.map((u) => ({ id: u.id, email: u.email })),
        fix: 'PATCH /api/admin/diagnostics/auth with { ids: [...], action: "activate" }',
      });
    }

    if (inactiveAccounts.length > 0) {
      results.issues.push({
        severity: 'WARNING',
        code: 'INACTIVE_ACCOUNTS',
        message: `${inactiveAccounts.length} technician(s) are deactivated (INACTIVE).`,
        affected: inactiveAccounts.map((u) => ({ id: u.id, email: u.email })),
      });
    }
  } catch (error: any) {
    results.issues.push({
      severity: 'CRITICAL',
      code: 'PRISMA_CONNECTION_FAILED',
      message: `Cannot connect to database: ${error.message}`,
    });
  }

  // ── Check Supabase Auth accounts ──────────────────────────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    results.issues.push({
      severity: 'ERROR',
      code: 'MISSING_SUPABASE_ENV',
      message: 'NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set.',
    });
  } else {
    try {
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });

      if (error) {
        results.issues.push({
          severity: 'ERROR',
          code: 'SUPABASE_AUTH_LIST_FAILED',
          message: `Failed to list Supabase Auth users: ${error.message}`,
        });
      } else {
        results.supabaseAuthUsers = data.users.map((u) => ({
          id: u.id,
          email: u.email,
          emailConfirmed: !!u.email_confirmed_at,
          createdAt: u.created_at,
        }));
        results.supabaseCount = data.users.length;

        // Cross-reference: which Prisma technicians are MISSING from Supabase Auth
        const supabaseEmails = new Set(data.users.map((u) => u.email));
        const missingFromSupabase = results.prismaUsers.filter(
          (u: any) => !supabaseEmails.has(u.email)
        );

        if (missingFromSupabase.length > 0) {
          results.issues.push({
            severity: 'ERROR',
            code: 'TECHNICIANS_NOT_IN_SUPABASE_AUTH',
            message: `${missingFromSupabase.length} technician(s) exist in the DB but NOT in Supabase Auth. These accounts exist but weren't created with the Supabase Auth sync.`,
            affected: missingFromSupabase.map((u: any) => ({ id: u.id, email: u.email })),
            note: 'These accounts CAN still log in via Prisma credentials (NextAuth), but they do not appear in Supabase Authentication dashboard.',
          });
        }
      }
    } catch (error: any) {
      results.issues.push({
        severity: 'ERROR',
        code: 'SUPABASE_ADMIN_CLIENT_FAILED',
        message: `Supabase admin client error: ${error.message}`,
      });
    }
  }

  // ── Check NEXTAUTH_SECRET ─────────────────────────────────────────────────
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret || secret === 'YOUR_RANDOM_SECRET_KEY_HERE') {
    results.issues.push({
      severity: 'CRITICAL',
      code: 'WEAK_NEXTAUTH_SECRET',
      message: 'NEXTAUTH_SECRET is using the placeholder value. JWT signing is insecure. Update .env with a strong random secret.',
    });
  }

  results.healthy = results.issues.filter((i: any) => i.severity === 'CRITICAL' || i.severity === 'ERROR').length === 0;

  return NextResponse.json(results, {
    status: results.healthy ? 200 : 207,
  });
}

/**
 * PATCH /api/admin/diagnostics/auth
 * Activate technician accounts stuck in PENDING status.
 */
export async function PATCH(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { action, ids } = body;

  if (action !== 'activate' || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json(
      { error: 'Body must be: { action: "activate", ids: ["id1", "id2"] }' },
      { status: 400 }
    );
  }

  try {
    const result = await prisma.user.updateMany({
      where: {
        id: { in: ids },
        role: 'TECHNICIAN',
        accountStatus: 'PENDING',
      },
      data: { accountStatus: 'ACTIVE' },
    });

    return NextResponse.json({
      message: `Activated ${result.count} technician account(s).`,
      count: result.count,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
