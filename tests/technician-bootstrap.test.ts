import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import prisma from '../src/lib/prisma';
import { assertLocalTestEnvironment } from './local-safety';
import { startRegistrationServicesStub } from './registration-services-stub';
const exec = promisify(execFile);
assertLocalTestEnvironment();
async function run(overrides: Record<string, string> = {}) {
  const env: NodeJS.ProcessEnv = { ...process.env, NODE_ENV: 'development', FIXTRACK_ALLOW_LOCAL_BOOTSTRAP: '1', SEED_TECHNICIAN_EMAIL: 'tech@gmail.com', TECHNICIAN_HEAD_EMAIL: 'tech@gmail.com', SEED_TECHNICIAN_PASSWORD: `Synthetic-${randomUUID()}!`, ...overrides };
  try { const result = await exec(process.execPath, ['node_modules/tsx/dist/cli.mjs', 'prisma/seed-technician-head.ts'], { env, timeout: 45000 }); return { code: 0, text: result.stdout + result.stderr }; }
  catch (error) { const result = error as { code: number; stdout?: string; stderr?: string }; return { code: result.code, text: (result.stdout || '') + (result.stderr || '') }; }
}
test('technician bootstrap is local-only, creates one active head, never overwrites users, and cleans failed Auth creation', async () => {
  const stub = await startRegistrationServicesStub();
  try {
    assert.equal(await prisma.user.count({ where: { email: 'tech@gmail.com' } }), 0, 'Use a NEW isolated test database; existing accounts are never overwritten.');
    const cases: Record<string, string>[] = [
      { FIXTRACK_ALLOW_LOCAL_BOOTSTRAP: '' }, { NODE_ENV: 'production' },
      { DATABASE_URL: 'postgresql://synthetic:synthetic@example.invalid/test' },
      { DIRECT_URL: 'postgresql://synthetic:synthetic@example.invalid/test' },
      { NEXT_PUBLIC_SUPABASE_URL: 'https://example.invalid' },
      { DIRECT_URL: 'postgresql://synthetic:synthetic@127.0.0.1:5432/different' },
      { SEED_TECHNICIAN_EMAIL: 'other@example.test' }, { SEED_TECHNICIAN_PASSWORD: 'short' },
    ];
    for (const values of cases) { assert.notEqual((await run(values)).code, 0); }
    assert.equal(stub.state.authCreates, 0);
    const password = `Synthetic-${randomUUID()}!`;
    const created = await run({ SEED_TECHNICIAN_PASSWORD: password }); assert.equal(created.code, 0, created.text);
    const user = await prisma.user.findUniqueOrThrow({ where: { email: 'tech@gmail.com' } });
    assert.equal(user.role, 'TECHNICIAN'); assert.equal(user.accountStatus, 'ACTIVE'); assert.equal(user.specialization, 'GENERAL'); assert.ok(await bcrypt.compare(password, user.passwordHash)); assert.equal(stub.authUsers.has(user.id), true);
    assert.equal((await run()).code, 0); assert.deepEqual(await prisma.user.findUniqueOrThrow({ where: { id: user.id } }), user); assert.equal(stub.state.authCreates, 1);
    const marker = randomUUID(), blockedEmail = `blocked-${marker}@example.test`;
    const blocked = await prisma.user.create({ data: { email: blockedEmail, firstName: 'Synthetic', lastName: 'Student', idNumber: marker, passwordHash: 'synthetic', role: 'STUDENT', accountStatus: 'PENDING' } });
    assert.notEqual((await run({ SEED_TECHNICIAN_EMAIL: blockedEmail, TECHNICIAN_HEAD_EMAIL: blockedEmail })).code, 0); assert.deepEqual(await prisma.user.findUniqueOrThrow({ where: { id: blocked.id } }), blocked);
    const failEmail = `failed-${marker}@example.test`;
    stub.state.failAuth = true;
    assert.notEqual((await run({ SEED_TECHNICIAN_EMAIL: failEmail, TECHNICIAN_HEAD_EMAIL: failEmail })).code, 0);
    stub.state.failAuth = false; assert.equal(await prisma.user.findUnique({ where: { email: failEmail } }), null);
    const objects = stub.authUsers.size; stub.state.nextAuthId = user.id;
    const preserved = stub.authUsers.get(user.id)!;
    // Model a duplicate Prisma primary key with an Auth stub; preserve the existing stub entry afterward.
    assert.notEqual((await run({ SEED_TECHNICIAN_EMAIL: failEmail, TECHNICIAN_HEAD_EMAIL: failEmail })).code, 0);
    assert.equal(stub.authUsers.has(user.id), false); stub.authUsers.set(user.id, preserved);
    assert.equal(stub.authUsers.size, objects); assert.deepEqual(await prisma.user.findUniqueOrThrow({ where: { id: user.id } }), user);
    assert.equal(await prisma.user.findUnique({ where: { email: failEmail } }), null);
  } finally { await stub.close(); await prisma.$disconnect(); }
});
