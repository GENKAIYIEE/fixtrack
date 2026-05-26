import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { RequestStatus } from '@prisma/client';

export async function GET() {
  try {
    const req = await prisma.maintenanceRequest.findFirst();
    if (!req) return NextResponse.json({ msg: 'No request found' });

    await prisma.maintenanceRequest.update({
      where: { id: req.id },
      data: { status: 'ON_HOLD' as RequestStatus },
    });

    return NextResponse.json({ msg: 'Success' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unknown error', stack: error.stack }, { status: 500 });
  }
}
