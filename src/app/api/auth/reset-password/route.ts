import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcryptjs from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, otp, password } = await request.json();

    if (!email || !otp || !password) {
      return NextResponse.json({ error: 'Email, OTP, and new password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Verify OTP again just before resetting the password
    if (!user.resetOtp || user.resetOtp !== otp) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }

    if (!user.resetOtpExpiry || new Date() > user.resetOtpExpiry) {
      return NextResponse.json({ error: 'OTP has expired' }, { status: 400 });
    }

    // Hash the new password
    const passwordHash = await bcryptjs.hash(password, 10);

    // Update password and clear OTP fields
    await prisma.user.update({
      where: { email },
      data: {
        passwordHash,
        resetOtp: null,
        resetOtpExpiry: null,
      },
    });

    return NextResponse.json({ message: 'Password reset successfully' }, { status: 200 });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
