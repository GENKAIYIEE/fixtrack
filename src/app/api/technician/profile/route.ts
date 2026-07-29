import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Specialization } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'TECHNICIAN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        idNumber: true,
        department: true,
        contactNumber: true,
        role: true,
        specialization: true,
        accountStatus: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const prefKeys = [
      `notif_pref_task_assigned_${session.user.id}`,
      `notif_pref_reminders_${session.user.id}`,
      `notif_pref_admin_updates_${session.user.id}`,
    ];

    const prefs = await prisma.systemSettings.findMany({
      where: { key: { in: prefKeys } },
    });

    const prefsMap = Object.fromEntries(prefs.map((p) => [p.key, p.value]));

    return NextResponse.json({
      user,
      preferences: {
        taskAssigned: prefsMap[prefKeys[0]] !== 'false', // default true
        reminders: prefsMap[prefKeys[1]] !== 'false', // default true
        adminUpdates: prefsMap[prefKeys[2]] === 'true', // default false
      },
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'TECHNICIAN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { firstName, lastName, email, contactNumber, specialization, preferences, avatarUrl } = body;

    // FIXED: MINOR #2 — Added input validation to profile PATCH
    if (!firstName || typeof firstName !== 'string' || firstName.trim().length < 1) {
      return NextResponse.json({ error: 'First name is required' }, { status: 400 });
    }
    if (!lastName || typeof lastName !== 'string' || lastName.trim().length < 1) {
      return NextResponse.json({ error: 'Last name is required' }, { status: 400 });
    }
    if (firstName.trim().length > 100 || lastName.trim().length > 100) {
      return NextResponse.json({ error: 'Name fields must be under 100 characters' }, { status: 400 });
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 });
    }
    if (contactNumber && contactNumber.length > 20) {
      return NextResponse.json({ error: 'Contact number must be under 20 characters' }, { status: 400 });
    }
    const validSpecializations = ['HVAC', 'ELECTRICAL', 'PLUMBING', 'CARPENTRY', 'GENERAL'];
    if (specialization && !validSpecializations.includes(specialization)) {
      return NextResponse.json({ error: 'Invalid specialization value' }, { status: 400 });
    }

    const existing = await prisma.user.findFirst({
      where: { email, NOT: { id: session.user.id } },
    });

    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { avatarUrl: true },
    });

    let finalAvatarUrl = avatarUrl;
    if (avatarUrl && avatarUrl.startsWith('data:image')) {
      if (avatarUrl.length > 7500000) {
        return NextResponse.json({ error: 'Image exceeds 5MB limit' }, { status: 400 });
      }

      try {
        const { supabaseAdmin } = await import('@/lib/supabase/admin');
        const matches = avatarUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        
        if (matches && matches.length === 3) {
          const mimeType = matches[1];
          const base64Data = matches[2];

          const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
          if (!allowedMimeTypes.includes(mimeType)) {
            return NextResponse.json({ error: 'Invalid image format. Only JPG, PNG, and WEBP are allowed.' }, { status: 400 });
          }

          const buffer = Buffer.from(base64Data, 'base64');
          const fileExt = mimeType.split('/')[1] || 'jpeg';
          const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
          
          if (currentUser?.avatarUrl && currentUser.avatarUrl.includes('/storage/v1/object/public/avatars/')) {
            const oldFileName = currentUser.avatarUrl.split('/').pop();
            if (oldFileName) {
              await supabaseAdmin.storage.from('avatars').remove([oldFileName]);
            }
          }

          const { error: uploadError } = await supabaseAdmin.storage
            .from('avatars')
            .upload(fileName, buffer, {
              contentType: mimeType,
              upsert: true
            });

          if (uploadError) {
            console.error('Supabase upload error:', uploadError);
            return NextResponse.json({ error: 'Failed to upload avatar image' }, { status: 500 });
          }

          const { data: { publicUrl } } = supabaseAdmin.storage
            .from('avatars')
            .getPublicUrl(fileName);

          finalAvatarUrl = publicUrl;
        }
      } catch (err) {
        console.error('Error processing avatar:', err);
        return NextResponse.json({ error: 'Failed to process avatar image' }, { status: 500 });
      }
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        firstName,
        lastName,
        email,
        contactNumber: contactNumber || null,
        specialization: specialization as Specialization,
        ...(finalAvatarUrl !== undefined && { avatarUrl: finalAvatarUrl }),
      },
    });

    if (preferences) {
      const prefUpdates = [
        { key: `notif_pref_task_assigned_${session.user.id}`, value: String(preferences.taskAssigned) },
        { key: `notif_pref_reminders_${session.user.id}`, value: String(preferences.reminders) },
        { key: `notif_pref_admin_updates_${session.user.id}`, value: String(preferences.adminUpdates) },
      ];

      for (const pref of prefUpdates) {
        await prisma.systemSettings.upsert({
          where: { key: pref.key },
          update: { value: pref.value, updatedById: session.user.id },
          create: { key: pref.key, value: pref.value, updatedById: session.user.id },
        });
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'USER_UPDATED',
        affectedRecordId: session.user.id,
        affectedRecordType: 'User',
        details: 'Technician updated their profile and notification preferences',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
