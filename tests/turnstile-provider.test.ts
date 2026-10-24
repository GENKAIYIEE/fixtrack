/** Uses ONLY Cloudflare's publicly documented test keys; no DB, user accounts or production credentials. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyTurnstile, RegistrationError } from '../src/lib/registration/turnstile';
const enabled = process.env.FIXTRACK_ALLOW_PROVIDER_TESTS === '1';
for (const [label, prefix, expected] of [['success','1',undefined],['failure','2',400],['spent/expired response','3',400]] as const) {
  test(`official Siteverify test configuration: ${label}`, { skip: !enabled }, async () => {
    const operation = () => verifyTurnstile('XXXX.DUMMY.TOKEN.XXXX', { secret: `${prefix}x0000000000000000000000000000000AA`, production: false });
    if (expected) await assert.rejects(operation, (e: unknown) => e instanceof RegistrationError && e.status === expected);
    else await operation();
  });
}
