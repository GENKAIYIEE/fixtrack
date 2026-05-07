import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, idNumber, department, password } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !idNumber || !department || !password) {
      return NextResponse.json({ message: 'All fields are required.' }, { status: 400 });
    }

    // Step 1: Check for duplicate email
    const existingUserEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUserEmail) {
      return NextResponse.json({ message: 'An account with this email already exists.' }, { status: 409 });
    }

    // Step 2: Check for duplicate ID number
    const existingUserIdNumber = await prisma.user.findUnique({
      where: { idNumber },
    });

    if (existingUserIdNumber) {
      return NextResponse.json({ message: 'An account with this ID number already exists.' }, { status: 409 });
    }

    // Create supabase admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // fallback if service_role is not provided locally
    );

    // Step 3: Create Supabase Auth user
    const { data: supabaseUser, error: supabaseError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (supabaseError || !supabaseUser.user) {
      return NextResponse.json(
        { message: supabaseError?.message || 'Error creating user in Supabase.' },
        { status: 500 }
      );
    }

    // Hash password for Prisma
    const hashedPassword = await bcrypt.hash(password, 12);

    // Step 4: Create Prisma User record — role is always USER for public registration
    await prisma.user.create({
      data: {
        id: supabaseUser.user.id,
        email,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        idNumber,
        department,
        role: 'USER',
        accountStatus: 'ACTIVE',
      },
    });

    // Step 5: Return success
    return NextResponse.json(
      { message: 'Registration successful. Your account is now active — you can log in immediately.' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
