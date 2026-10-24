/** Explicit, localhost-only technician-head bootstrap. Never promotes existing users. */
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

class SetupError extends Error {}
function required(name: string) {
  const value = process.env[name];
  if (!value) throw new SetupError(`Set ${name} in this terminal before running setup.`);
  return value;
}
function localUrl(name: string, schemes: string[]) {
  let url: URL;
  try { url = new URL(required(name)); } catch { throw new SetupError(`${name} must be a valid localhost URL.`); }
  if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || !schemes.includes(url.protocol)) {
    throw new SetupError(`${name} must point to localhost. Hosted services are not allowed by this script.`);
  }
  return url;
}
async function main() {
  if (process.env.NODE_ENV === 'production' || process.env.FIXTRACK_ALLOW_LOCAL_BOOTSTRAP !== '1') {
    throw new SetupError('Local setup only. Set FIXTRACK_ALLOW_LOCAL_BOOTSTRAP=1 explicitly; production is not supported.');
  }
  const db = localUrl('DATABASE_URL', ['postgres:', 'postgresql:']);
  const direct = localUrl('DIRECT_URL', ['postgres:', 'postgresql:']);
  const host = (url: URL) => url.hostname === 'localhost' ? '127.0.0.1' : url.hostname;
  if (host(db) !== host(direct) || (db.port || '5432') !== (direct.port || '5432') || db.pathname !== direct.pathname || db.searchParams.get('schema') !== direct.searchParams.get('schema')) {
    throw new SetupError('DATABASE_URL and DIRECT_URL must point to the same local database and schema.');
  }
  const api = localUrl('NEXT_PUBLIC_SUPABASE_URL', ['http:', 'https:']);
  const serviceKey = required('SUPABASE_SERVICE_ROLE_KEY');
  const email = required('SEED_TECHNICIAN_EMAIL').trim().toLowerCase();
  const configuredHead = (process.env.TECHNICIAN_HEAD_EMAIL || 'tech@gmail.com').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email !== configuredHead) {
    throw new SetupError('SEED_TECHNICIAN_EMAIL must be the configured TECHNICIAN_HEAD_EMAIL (default tech@gmail.com).');
  }
  const password = required('SEED_TECHNICIAN_PASSWORD');
  if (password.length < 12 || password.length > 128) throw new SetupError('Choose a local technician password of 12–128 characters.');
  const pool = new Pool({ connectionString: db.toString(), max: 1, connectionTimeoutMillis: 10000 });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  const supabase = createClient(api.toString(), serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  let ownedAuthId: string | undefined;
  let committed = false;
  try {
    const existing = await prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } }, select: { role: true, accountStatus: true } });
    if (existing) {
      if (existing.role !== 'TECHNICIAN' || existing.accountStatus !== 'ACTIVE') {
        throw new SetupError('An account already uses this email but is not an ACTIVE TECHNICIAN. Nothing was changed; review it with your administrator.');
      }
      console.log('Technician head already exists. No password, role, status or historical records were changed. Use the existing password.');
      return;
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
    if (error || !data.user) throw new SetupError('Could not create the local Auth account. Check local Supabase settings; an existing Auth-only account must be reviewed manually.');
    ownedAuthId = data.user.id;
    await prisma.user.create({ data: {
      id: ownedAuthId, email, passwordHash,
      firstName: 'Technician', lastName: 'Head',
      // Synthetic reference for LOCAL testing, not a real institutional/employee ID.
      idNumber: `LOCAL-TECH-${randomUUID()}`,
      role: 'TECHNICIAN', specialization: 'GENERAL', accountStatus: 'ACTIVE',
    } });
    committed = true;
    console.log('Local technician head created successfully. Email: ' + email);
    console.log('Role: TECHNICIAN; status: ACTIVE. Sign in with the password entered in your terminal.');
  } catch (error) {
    if (ownedAuthId && !committed) {
      try {
        const result = await supabase.auth.admin.deleteUser(ownedAuthId);
        if (result.error) throw new Error('Cleanup unavailable');
      } catch { console.error('Could not remove a newly created local Auth account after setup failed. Administrator reconciliation is required; no existing Prisma user was removed.'); }
    }
    throw error;
  } finally { await prisma.$disconnect(); await pool.end(); }
}
main().catch(error => {
  console.error(error instanceof SetupError ? error.message : 'Local technician setup failed. Check local database schema and service availability. No existing account was intentionally changed.');
  process.exitCode = 1;
});
