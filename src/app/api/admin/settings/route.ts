import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

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
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

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

    // Log to AuditLog
    await prisma.auditLog.create({
      data: {
        userId: authUser.id,
        action: 'USER_UPDATED',
        details: 'System settings updated',
        affectedRecordType: 'SystemSettings',
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Settings POST Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
