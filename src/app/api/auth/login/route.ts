import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { message: 'Missing user ID' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, accountStatus: true },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'User account not found in the system.' },
        { status: 404 }
      );
    }

    if (user.accountStatus === 'INACTIVE') {
      return NextResponse.json(
        { message: 'Your account has been deactivated. Please contact the administrator.' },
        { status: 403 }
      );
    }

    return NextResponse.json({ role: user.role }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error in /api/auth/login:', error);
    let debugMessage = 'Unknown error';
    let stackTrace = '';
    
    if (error instanceof Error) {
      debugMessage = error.message;
      stackTrace = error.stack || '';
    }

    return NextResponse.json(
      { 
        message: 'Internal server error',
        debug: debugMessage,
        stack: stackTrace 
      },
      { status: 500 }
    );
  }
}
