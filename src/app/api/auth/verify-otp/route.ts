import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid OTP or email' }, { status: 400 });
    }

    if (!user.resetOtp || user.resetOtp !== otp) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }

    if (!user.resetOtpExpiry || new Date() > user.resetOtpExpiry) {
      return NextResponse.json({ error: 'OTP has expired' }, { status: 400 });
    }

    // OTP is valid. In a fully secure flow, we might generate a temporary reset token here,
    // but for simplicity, we can let the client proceed to the reset step 
    // and they must send the OTP again along with the new password.
    
    return NextResponse.json({ message: 'OTP verified successfully' }, { status: 200 });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
