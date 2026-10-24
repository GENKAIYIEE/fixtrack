import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import sharp from 'sharp';
import { verifyTurnstile, RegistrationError } from '../src/lib/registration/turnstile';
import { registrationFields, registrationIdPhoto, MAX_ID_PHOTO_BYTES } from '../src/lib/registration/validation';
const config = { secret: 'synthetic-unit-secret', hostnames: 'localhost', production: false };
const reply = (body: unknown, status = 200) => (async () => new Response(JSON.stringify(body), { status })) as typeof fetch;
test('CAPTCHA requires a bounded nonempty token and missing configuration fails closed', async () => {
  for (const token of [undefined, null, '', [], 50, 'x'.repeat(2049)]) await assert.rejects(() => verifyTurnstile(token, config), RegistrationError);
  await assert.rejects(() => verifyTurnstile('token', { production: false }), (e: unknown) => e instanceof RegistrationError && e.status === 503);
});
test('valid Siteverify success binds registration action and allowed hostname; request uses official endpoint', async () => {
  let calls = 0;
  const send = (async (url, init) => {
    calls++; assert.equal(url, 'https://challenges.cloudflare.com/turnstile/v0/siteverify'); assert.equal(init?.method, 'POST');
    const params = new URLSearchParams(String(init?.body)); assert.equal(params.get('secret'), config.secret); assert.equal(params.get('response'), 'valid-token');
    return new Response(JSON.stringify({ success: true, action: 'register', hostname: 'localhost' }));
  }) as typeof fetch;
  await verifyTurnstile('valid-token', config, send); assert.equal(calls, 1);
  for (const body of [{ success: true, action: 'login', hostname: 'localhost' }, { success: true, action: 'register', hostname: 'attacker.test' }, { success: 'true' }]) await assert.rejects(() => verifyTurnstile('token', config, reply(body)));
});
test('invalid, expired/spent and failed provider responses are rejected', async () => {
  for (const code of ['invalid-input-response', 'timeout-or-duplicate', 'bad-request', 'missing-input-response']) {
    await assert.rejects(() => verifyTurnstile('token', config, reply({ success: false, 'error-codes': [code] })), (e: unknown) => e instanceof RegistrationError && e.status === 400);
  }
});
test('provider outage, timeout, non-JSON and secret configuration errors fail closed', async () => {
  for (const send of [reply({}, 503), reply({ success: false, 'error-codes': ['invalid-input-secret'] }), reply({ success: false, 'error-codes': ['internal-error'] }), reply(null), (async () => { throw new DOMException('Timed out', 'TimeoutError'); }) as typeof fetch, (async () => new Response('not JSON')) as typeof fetch]) {
    await assert.rejects(() => verifyTurnstile('token', config, send), (e: unknown) => e instanceof RegistrationError && e.status === 503);
  }
});
test('public test secrets cannot enable production registration or skip verification', async () => {
  const secret = '1x0000000000000000000000000000000AA';
  await assert.rejects(() => verifyTurnstile('XXXX.DUMMY.TOKEN.XXXX', { secret, hostnames: 'example.com', production: true }), (e: unknown) => e instanceof RegistrationError && e.status === 503);
  await assert.rejects(() => verifyTurnstile('token', { ...config, production: true, hostnames: '' }));
  await assert.rejects(() => verifyTurnstile('fake-token', { secret, production: false }));
  let called = false;
  await verifyTurnstile('XXXX.DUMMY.TOKEN.XXXX', { secret, production: false }, (async () => { called = true; return new Response('{"success":true}'); }) as typeof fetch);
  assert.equal(called, true);
});
function fields() { const f = new FormData(); for (const [k,v] of Object.entries({ firstName: 'Test', lastName: 'Registrant', email: 'TEST@EXAMPLE.TEST', department: 'BSIT', password: 'Synthetic-test-123!' })) f.set(k,v); return f; }
test('server validates original registration fields and rejects weak passwords', () => {
  assert.equal(registrationFields(fields()).email, 'test@example.test');
  for (const [key,value] of [['email','bad'],['department','UNKNOWN'],['password','password'],['firstName',''],['password','x'.repeat(129)]]) {
    const f = fields(); f.set(key,value); assert.throws(() => registrationFields(f), RegistrationError);
  }
});
test('registration no longer requires or accepts a client ID number', () => {
  const f = fields(); assert.equal('idNumber' in registrationFields(f), false);
  f.set('idNumber', 'forged-id'); assert.equal('idNumber' in registrationFields(f), false);
});
test('private ID upload requires exactly one valid supported image within 3MB', async () => {
  const image = readFileSync('tests/fixtures/evidence.png');
  const f = fields(); await assert.rejects(() => registrationIdPhoto(f));
  f.set('idPhoto',new File([image],'id.png',{type:'image/png'})); assert.equal((await registrationIdPhoto(f)).mimeType,'image/jpeg');
  f.append('idPhoto',new File([image],'id.png',{type:'image/png'})); await assert.rejects(() => registrationIdPhoto(f));
  for (const file of [new File(['not an image'],'id.png',{type:'image/png'}),new File([image],'id.svg',{type:'image/svg+xml'}),new File([new Uint8Array(MAX_ID_PHOTO_BYTES+1)],'id.png',{type:'image/png'})]) {
    f.set('idPhoto',file); await assert.rejects(() => registrationIdPhoto(f), RegistrationError);
  }
});

test('ID images are decoded, metadata removed and re-encoded, rather than trusting headers/filenames', async () => {
  for (const extension of ['png','jpeg','webp']) {
    const input=readFileSync(`tests/fixtures/evidence.${extension}`);
    const f=fields();f.set('idPhoto',new File([input],'../../executable.php',{type:`image/${extension}`}));
    const output=await registrationIdPhoto(f);assert.equal(output.extension,'jpg');
    const metadata=await sharp(output.buffer).metadata();assert.equal(metadata.format,'jpeg');assert.equal(metadata.exif,undefined);
  }
  const f=fields();f.set('idPhoto',new File([Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),Buffer.from('not a decodable image')])],'spoof.png',{type:'image/png'}));
  await assert.rejects(()=>registrationIdPhoto(f),RegistrationError);
  const tagged=await sharp(readFileSync('tests/fixtures/evidence.png')).withMetadata({exif:{IFD0:{Artist:'Synthetic fixture'}}}).png().toBuffer();
  f.set('idPhoto',new File([new Uint8Array(tagged)],'id.png',{type:'image/png'}));assert.equal((await sharp((await registrationIdPhoto(f)).buffer).metadata()).exif,undefined);
});

test('ID decoder rejects small compressed files with excessive decoded pixel dimensions', async () => {
  const image = await sharp({ create: { width: 5001, height: 4000, channels: 3, background: '#ffffff' } }).png().toBuffer();
  assert.ok(image.length < MAX_ID_PHOTO_BYTES);
  const f = fields(); f.set('idPhoto', new File([new Uint8Array(image)], 'large-dimensions.png', { type: 'image/png' }));
  await assert.rejects(() => registrationIdPhoto(f), RegistrationError);
});
