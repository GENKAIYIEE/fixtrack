import { NextResponse } from 'next/server';
import { getActiveSession } from '@/lib/auth/access';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getActiveSession();
    const user = session?.user;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
    }

    // Verify ownership
    const notif = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notif) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (notif.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.notification.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete Notification Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
