import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const settings = await prisma.systemSettings.findMany({
      where: {
        key: {
          in: ['platform_name', 'institution_name', 'logo_url']
        }
      }
    });
    
    const settingsMap = Object.fromEntries(settings.map(s => [s.key, s.value]));
    
    return NextResponse.json(settingsMap);
  } catch (error) {
    console.error('Public Settings GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
