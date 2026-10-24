import test from 'node:test';
import assert from 'node:assert/strict';
import { setupLocalIdStorage } from '../scripts/setup-local-id-storage';
const env: NodeJS.ProcessEnv = { NODE_ENV: 'development', FIXTRACK_ALLOW_LOCAL_STORAGE_SETUP: '1', NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321', SUPABASE_SERVICE_ROLE_KEY: 'synthetic-local-test-only' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
test('local ID storage setup refuses remote, production, missing opt-in, and missing keys before network', async () => {
  let calls = 0; const network: typeof fetch = async () => { calls++; return json({}); };
  const overrides: Partial<NodeJS.ProcessEnv>[] = [{ NEXT_PUBLIC_SUPABASE_URL: 'https://example.invalid' }, { NODE_ENV: 'production' }, { FIXTRACK_ALLOW_LOCAL_STORAGE_SETUP: '' }, { SUPABASE_SERVICE_ROLE_KEY: '' }];
  for (const override of overrides) {
    await assert.rejects(setupLocalIdStorage({ ...env, ...override }, network));
  }
  assert.equal(calls, 0);
});
test('existing private bucket is read only; existing public bucket is refused', async () => {
  for (const isPublic of [false, true]) {
    const methods: string[] = [];
    const network: typeof fetch = async (_url, options) => { methods.push(options?.method || 'GET'); return json({ id: 'registration-ids', public: isPublic }); };
    if (isPublic) await assert.rejects(setupLocalIdStorage(env, network), /not private/);
    else assert.match(await setupLocalIdStorage(env, network), /verified as private/);
    assert.deepEqual(methods, ['GET']);
  }
});
test('missing bucket is created privately with image and size limits then reverified', async () => {
  const methods: string[] = []; let bucketExists = false;
  const network: typeof fetch = async (_url, options) => {
    const method = options?.method || 'GET'; methods.push(method);
    if (method === 'POST') {
      const body = JSON.parse(String(options?.body));
      assert.equal(body.public, false); assert.equal(body.file_size_limit, 3145728);
      assert.deepEqual(body.allowed_mime_types, ['image/jpeg', 'image/png', 'image/webp']);
      bucketExists = true; return json({ name: 'registration-ids' });
    }
    return bucketExists ? json({ id: 'registration-ids', public: false }) : json({ statusCode: '404', message: 'Not found', error: 'not_found' }, 404);
  };
  await setupLocalIdStorage(env, network); assert.deepEqual(methods, ['GET', 'POST', 'GET']);
});
test('permission failures do not trigger bucket creation or expose provider messages', async () => {
  const methods: string[] = [];
  const network: typeof fetch = async (_url, options) => { methods.push(options?.method || 'GET'); return json({ message: 'sensitive-provider-detail', statusCode: '403', error: 'Forbidden' }, 403); };
  await assert.rejects(setupLocalIdStorage(env, network), error => error instanceof Error && !error.message.includes('sensitive-provider-detail'));
  assert.deepEqual(methods, ['GET']);
});
