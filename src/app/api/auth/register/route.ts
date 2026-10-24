import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import bcryptjs from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { verifyTurnstile, RegistrationError } from '@/lib/registration/turnstile';
import { privateIdBucket } from '@/lib/registration/private-storage';
import { registrationFields, registrationIdPhoto } from '@/lib/registration/validation';

export const runtime = 'nodejs';
export async function POST(request: Request) {
  let cleanup: (() => Promise<void>) | undefined;
  let committed = false;
  try {
    const length = Number(request.headers.get('content-length') || 0);
    if (length > 4 * 1024 * 1024) throw new RegistrationError('Registration upload is too large.', 413);
    if (!request.headers.get('content-type')?.startsWith('multipart/form-data')) throw new RegistrationError('Submit the registration form with an ID photo.', 415);
    let form: FormData;
    try {
      // Bound streamed requests too; Content-Length alone is attacker-controlled.
      const reader = request.body?.getReader();
      if (!reader) throw new RegistrationError('The registration form is empty.');
      const chunks: Uint8Array[] = []; let total = 0;
      try {
        while (true) {
          const { value, done } = await reader.read(); if (done) break;
          total += value.length;
          if (total > 4 * 1024 * 1024) { await reader.cancel(); throw new RegistrationError('Registration upload is too large.', 413); }
          chunks.push(value);
        }
      } finally { reader.releaseLock(); }
      form = await new Response(new Uint8Array(Buffer.concat(chunks)), { headers: { 'Content-Type': request.headers.get('content-type')! } }).formData();
    } catch (error) {
      if (error instanceof RegistrationError) throw error;
      throw new RegistrationError('The registration form could not be read. Please try again.');
    }
    // No database/storage/auth side effects can occur before successful Siteverify.
    await verifyTurnstile(form.get('turnstileToken'));
    const fields = registrationFields(form);
    const photo = await registrationIdPhoto(form);
    const duplicate = await prisma.user.findFirst({ where: { email: fields.email }, select: { id: true } });
    if (duplicate) throw new RegistrationError('An account with these details already exists.', 409);
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new RegistrationError('Registration storage is not configured. Contact the administrator.', 503);
    const { supabaseAdmin } = await import('@/lib/supabase/admin');
    const bucket = await privateIdBucket(supabaseAdmin, true);
    const path = `${randomUUID()}/id.${photo.extension}`;
    let uploaded = false;
    const owned: { authId?: string } = {};
    cleanup = async () => {
      // Independent cleanup attempts: an Auth failure must not skip removing the new ID.
      const attempts: Promise<void>[] = [];
      if (owned.authId) attempts.push((async () => {
        const { error } = await supabaseAdmin.auth.admin.deleteUser(owned.authId!);
        if (error) throw new Error('Auth cleanup failed');
      })());
      if (uploaded) attempts.push((async () => {
        const { error } = await bucket.remove([path]);
        if (error) throw new Error('ID cleanup failed');
      })());
      const results = await Promise.allSettled(attempts);
      if (results.some(result => result.status === 'rejected')) console.error('[registration cleanup] Newly owned resources need administrator reconciliation.');
    };
    const { error: uploadError } = await bucket.upload(path, photo.buffer, { contentType: photo.mimeType, upsert: false, cacheControl: '0' });
    if (uploadError) throw new RegistrationError('Could not securely upload the ID photo. Please retry.', 503);
    uploaded = true;
    // Preserve the existing Supabase Auth integration; FixTrack approval is enforced in Prisma/NextAuth.
    const { data, error: authError } = await supabaseAdmin.auth.admin.createUser({ email: fields.email, password: fields.password, email_confirm: true });
    if (authError || !data.user) throw new RegistrationError('Could not create the account. If already registered, contact the administrator.', 409);
    const authId = data.user.id;
    owned.authId = authId;
    const passwordHash = await bcryptjs.hash(fields.password, 12);
    await prisma.user.create({ data: {
      id: authId, email: fields.email, passwordHash, firstName: fields.firstName, lastName: fields.lastName,
      department: fields.department, role: 'STUDENT', accountStatus: 'PENDING', registrationIdPath: path,
    } });
    committed = true;
    return NextResponse.json({ message: 'Registration submitted. Your account is pending administrator review. You cannot log in until it is approved.' }, { status: 201 });
  } catch (error) {
    if (!committed && cleanup) {
      try { await cleanup(); } catch { console.error('[registration cleanup] Newly created resources need administrator reconciliation.'); }
    }
    if (error instanceof RegistrationError) return NextResponse.json({ message: error.message }, { status: error.status });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return NextResponse.json({ message: 'An account with these details already exists.' }, { status: 409 });
    // Do not log provider errors, tokens, passwords, request bodies or identity-document paths.
    console.error('[registration] Account creation failed; check database schema and service availability.');
    return NextResponse.json({ message: 'Registration could not be completed. Please retry or contact the administrator.' }, { status: 500 });
  }
}
