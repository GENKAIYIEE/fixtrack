import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const authUser = session?.user;

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { role: true },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await prisma.systemSettings.findMany();
    const settingsMap = Object.fromEntries(settings.map(s => [s.key, s.value]));
    
    return NextResponse.json(settingsMap);
  } catch (error) {
    console.error('Settings GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const authUser = session?.user;

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { role: true },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { settings } = body;

    if (!settings || !Array.isArray(settings)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Upsert settings in a loop
    for (const { key, value } of settings) {
      await prisma.systemSettings.upsert({
        where: { key },
        update: { 
          value: String(value), 
          updatedById: authUser.id, 
          updatedAt: new Date() 
        },
        create: { 
          key, 
          value: String(value), 
          updatedById: authUser.id 
        }
      });
    }

    // FIXED: BUG-12 — Added [SETTINGS] prefix to details and affectedRecordId so
    // these entries are distinguishable from genuine USER_UPDATED events in the audit log.
    // (AuditAction enum has no SETTINGS_UPDATED variant, so USER_UPDATED is reused.)
    await prisma.auditLog.create({
      data: {
        userId: authUser.id,
        action: 'USER_UPDATED',
        details: `[SETTINGS] System settings updated by admin`,
        affectedRecordType: 'SystemSettings',
        affectedRecordId: Object.keys(settings).join(', '),
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Settings POST Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
