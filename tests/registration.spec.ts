import { test, expect, request as requests, APIRequestContext } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import bcrypt from 'bcryptjs';
import prisma from '../src/lib/prisma';
import { assertLocalTestEnvironment } from './local-safety';
import { startRegistrationServicesStub } from './registration-services-stub';
assertLocalTestEnvironment();
test.describe.configure({ mode:'serial' });
const baseURL=process.env.NEXTAUTH_URL || 'http://localhost:3100';
const marker=randomUUID(),password=`Synthetic-${randomUUID()}!`;
const image=readFileSync('tests/fixtures/evidence.png');
let stub: Awaited<ReturnType<typeof startRegistrationServicesStub>>;
let anonymous:APIRequestContext,admin:APIRequestContext,student:APIRequestContext,adminId:string,registeredId:string;
let registeredEmail='';
async function login(email:string) {
  const context=await requests.newContext({baseURL});
  const csrf=await (await context.get('/api/auth/csrf')).json();
  await context.post('/api/auth/callback/credentials',{form:{csrfToken:csrf.csrfToken,email,password,json:'true',callbackUrl:baseURL}});
  return context;
}
function form(overrides:Record<string,unknown>={}) {
  const id=randomUUID();
  return {firstName:'Synthetic',lastName:'Registrant',email:`registration-${id}@example.test`,department:'BSIT',password,
    turnstileToken:'XXXX.DUMMY.TOKEN.XXXX',idPhoto:{name:'synthetic-id.png',mimeType:'image/png',buffer:image},...overrides};
}
const widgetScript=`window.turnstile={render(el,options){
 const button=document.createElement('button');button.type='button';button.textContent='Complete test CAPTCHA';button.onclick=()=>options.callback('XXXX.DUMMY.TOKEN.XXXX');el.appendChild(button);
 const expired=()=>options['expired-callback'](),failure=()=>options['error-callback'](),timeout=()=>options['timeout-callback']();
 window.addEventListener('test-captcha-expired',expired);window.addEventListener('test-captcha-error',failure);window.addEventListener('test-captcha-timeout',timeout);
 el.__cleanup=()=>{window.removeEventListener('test-captcha-expired',expired);window.removeEventListener('test-captcha-error',failure);window.removeEventListener('test-captcha-timeout',timeout);el.replaceChildren();};window.__captchaElement=el;return 'synthetic-widget';
 },remove(){window.__captchaElement?.__cleanup?.();}};`;

test.beforeAll(async()=>{
  if(process.env.TURNSTILE_SECRET_KEY!=='1x0000000000000000000000000000000AA' || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!=='1x00000000000000000000AA') throw new Error('Registration browser tests require Cloudflare documented public always-pass test keys.');
  stub=await startRegistrationServicesStub();
  const passwordHash=await bcrypt.hash(password,4);
  const create=(role:'ADMIN'|'STUDENT')=>prisma.user.create({data:{id:randomUUID(),email:`registration-${role}-${marker}@example.test`,firstName:'Synthetic',lastName:role,idNumber:`${role}-${marker}`,role,accountStatus:'ACTIVE',passwordHash}});
  adminId=(await create('ADMIN')).id;await create('STUDENT');
  anonymous=await requests.newContext({baseURL});admin=await login(`registration-ADMIN-${marker}@example.test`);student=await login(`registration-STUDENT-${marker}@example.test`);
});

test('direct API registration cannot bypass CAPTCHA or ID validation and creates no side effects',async()=>{
  const users=await prisma.user.count(),uploads=stub.state.uploads,authCreates=stub.state.authCreates;
  for(const token of ['', 'invalid-token', 'x'.repeat(2049)]) expect((await anonymous.post('/api/auth/register',{multipart:form({turnstileToken:token})})).status()).toBe(400);
  expect((await anonymous.post('/api/auth/register',{data:form({idPhoto:undefined})})).status()).toBe(415);
  for(const idPhoto of ['', {name:'id.svg',mimeType:'image/svg+xml',buffer:Buffer.from('<svg/>')},{name:'bad.png',mimeType:'image/png',buffer:Buffer.from('not an image')},{name:'big.png',mimeType:'image/png',buffer:Buffer.alloc(3*1024*1024+1)}]) {
    expect((await anonymous.post('/api/auth/register',{multipart:form({idPhoto})})).status()).toBe(400);
  }
  expect((await anonymous.post('/api/auth/register',{multipart:form({password:'weak'})})).status()).toBe(400);
  expect(await prisma.user.count()).toBe(users);expect(stub.state.uploads).toBe(uploads);expect(stub.state.authCreates).toBe(authCreates);
});

test('successful verified registration ignores forged role/status and remains pending; login is blocked',async()=>{
  const data=form({role:'ADMIN',accountStatus:'ACTIVE',idNumber:'client-supplied-id-must-be-ignored'});registeredEmail=data.email;
  const response=await anonymous.post('/api/auth/register',{multipart:data});expect(response.status()).toBe(201);
  expect((await response.json()).message).toContain('pending administrator review');
  const user=await prisma.user.findUniqueOrThrow({where:{email:registeredEmail}});registeredId=user.id;
  expect(user.idNumber).toBeNull();expect(user.accountStatus).toBe('PENDING');expect(user.role).toBe('STUDENT');expect(user.registrationIdPath).not.toBeNull();
  expect(stub.objects.has(user.registrationIdPath!)).toBe(true);
  expect((await anonymous.get(`http://127.0.0.1:55433/storage/v1/object/public/registration-ids/${user.registrationIdPath}`)).status()).toBe(404);
  const pending=await login(registeredEmail);expect((await (await pending.get('/api/auth/session')).json()).user).toBeUndefined();await pending.dispose();
  expect((await anonymous.post('/api/auth/login',{data:{userId:registeredId}})).status()).toBe(401);
});

test('ID review and approval require current active administrator; pending account becomes usable only after approval',async({browser})=>{
  expect((await anonymous.get(`/api/admin/users/${registeredId}/id-photo`)).status()).toBe(401);
  expect((await student.get(`/api/admin/users/${registeredId}/id-photo`)).status()).toBe(403);
  expect((await student.patch(`/api/admin/users/${registeredId}`,{data:{accountStatus:'ACTIVE'}})).status()).toBe(403);
  await prisma.user.update({where:{id:adminId},data:{accountStatus:'INACTIVE'}});
  try {
    expect((await admin.get(`/api/admin/users/${registeredId}/id-photo`)).status()).toBe(403);
    expect((await admin.patch(`/api/admin/users/${registeredId}`,{data:{accountStatus:'ACTIVE'}})).status()).toBe(403);
  } finally {await prisma.user.update({where:{id:adminId},data:{accountStatus:'ACTIVE'}});}
  const signed=await admin.get(`/api/admin/users/${registeredId}/id-photo`);expect(signed.status()).toBe(200);expect(signed.headers()['cache-control']).toContain('no-store');
  const link=await signed.json();expect(link.expiresIn).toBe(60);expect((await anonymous.get(link.url)).status()).toBe(200);
  const page=await browser.newPage({baseURL,storageState:await admin.storageState()});
  await page.goto('/admin/users');await page.getByPlaceholder('Search users by name, email, or ID...').fill(registeredEmail);
  const row=page.getByRole('row').filter({hasText:registeredEmail});
  await row.getByTitle('Edit User').click();await page.getByRole('button',{name:'Review ID photo',exact:true}).click();
  await expect(page.getByAltText('Submitted valid ID for administrator review')).toBeVisible();await page.close();
  expect((await admin.patch(`/api/admin/users/${registeredId}`,{data:{accountStatus:'ACTIVE'}})).status()).toBe(200);
  const approved=await login(registeredEmail);expect((await (await approved.get('/api/auth/session')).json()).user?.role).toBe('STUDENT');await approved.dispose();
});

test('private bucket checks and failed uploads/auth creation leave no new account or orphan ID',async()=>{
  const users=await prisma.user.count(),objects=stub.objects.size,authUsers=stub.authUsers.size;
  const uploads=stub.state.uploads, authCreates=stub.state.authCreates;
  for (const flag of ['publicBucket','missingBucket','deniedBucket'] as const) {
    stub.state[flag]=true;
    try {
      const response=await anonymous.post('/api/auth/register',{multipart:form()});
      expect(response.status()).toBe(503);expect((await response.json()).message).toContain('Private ID storage is unavailable');
    } finally {stub.state[flag]=false;}
  }
  expect(stub.state.uploads).toBe(uploads);expect(stub.state.authCreates).toBe(authCreates);
  stub.state.failUpload=true;try{expect((await anonymous.post('/api/auth/register',{multipart:form()})).status()).toBe(503);}finally{stub.state.failUpload=false;}
  stub.state.failAuth=true;try{expect((await anonymous.post('/api/auth/register',{multipart:form()})).status()).toBe(409);}finally{stub.state.failAuth=false;}
  expect(await prisma.user.count()).toBe(users);expect(stub.objects.size).toBe(objects);expect(stub.authUsers.size).toBe(authUsers);
});

test('database write failure cleans only newly owned Auth/ID resources and preserves existing account',async()=>{
  const before=await prisma.user.findUniqueOrThrow({where:{id:adminId}}),objects=stub.objects.size,authUsers=stub.authUsers.size;
  // Only the LOCAL Auth stub returns a synthetic colliding UUID; real DB records are never removed.
  stub.state.nextAuthId=adminId;
  expect((await anonymous.post('/api/auth/register',{multipart:form()})).status()).toBe(409);
  expect(await prisma.user.findUniqueOrThrow({where:{id:adminId}})).toEqual(before);
  expect(stub.objects.size).toBe(objects);expect(stub.authUsers.size).toBe(authUsers);
});

test('registration UI handles CAPTCHA completion, expiry, errors, timeout and retry without losing fields',async({browser})=>{
  const page=await browser.newPage({baseURL});await page.route('https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit',route=>route.fulfill({contentType:'application/javascript',body:widgetScript}));
  await page.goto('/register');const submit=page.getByRole('button',{name:'Register',exact:true});await expect(submit).toBeDisabled();
  await page.getByLabel('First Name',{exact:true}).fill('Retained');
  for(const event of ['expired','error','timeout']) {
    await page.getByRole('button',{name:'Complete test CAPTCHA'}).click();await expect(submit).toBeEnabled();
    await page.evaluate(name=>window.dispatchEvent(new Event(name)),`test-captcha-${event}`);await expect(submit).toBeDisabled();
    await page.getByRole('button',{name:'Retry CAPTCHA'}).click();await expect(page.getByRole('button',{name:'Complete test CAPTCHA'})).toBeVisible();
    await expect(page.getByLabel('First Name',{exact:true})).toHaveValue('Retained');
  }
  await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);await page.close();
});

test('CAPTCHA script loading failure is recoverable',async({browser})=>{
  const page=await browser.newPage({baseURL});let fail=true;
  await page.route('https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit',route=>fail?route.abort():route.fulfill({contentType:'application/javascript',body:widgetScript}));
  await page.goto('/register');await expect(page.getByText('CAPTCHA could not load.',{exact:false})).toBeVisible();
  fail=false;await page.getByRole('button',{name:'Retry CAPTCHA'}).click();await page.getByRole('button',{name:'Complete test CAPTCHA'}).click();
  await expect(page.getByRole('button',{name:'Register',exact:true})).toBeEnabled();await page.close();
});

test('browser submits ID and verified CAPTCHA, then displays pending-review success',async({browser})=>{
  const page=await browser.newPage({baseURL});await page.route('https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit',route=>route.fulfill({contentType:'application/javascript',body:widgetScript}));
  await page.goto('/register');const email=`browser-registration-${randomUUID()}@example.test`;
  await page.getByLabel('First Name',{exact:true}).fill('Browser');await page.getByLabel('Last Name',{exact:true}).fill('Registrant');await page.getByLabel('Email',{exact:true}).fill(email);
  await expect(page.getByLabel('ID Number',{exact:true})).toHaveCount(0);await page.getByLabel('Department',{exact:true}).selectOption('BSIT');
  await page.getByLabel('Password',{exact:true}).fill(password);await page.getByLabel('Confirm Password',{exact:true}).fill(password);
  await page.getByLabel('Photo of Valid ID',{exact:true}).setInputFiles({name:'synthetic-id.png',mimeType:'image/png',buffer:image});
  await page.getByRole('button',{name:'Complete test CAPTCHA'}).click();await page.getByRole('button',{name:'Register',exact:true}).click();
  await expect(page.getByText('Registration submitted. Your account is pending administrator review.',{exact:false})).toBeVisible();
  expect((await prisma.user.findUniqueOrThrow({where:{email}})).accountStatus).toBe('PENDING');await page.close();
});

test('failed registration resets CAPTCHA and retains form/ID for a successful retry',async({browser})=>{
  const page=await browser.newPage({baseURL});await page.route('https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit',route=>route.fulfill({contentType:'application/javascript',body:widgetScript}));
  await page.goto('/register');const email=`retry-registration-${randomUUID()}@example.test`;
  await page.getByLabel('First Name',{exact:true}).fill('Retry');await page.getByLabel('Last Name',{exact:true}).fill('Registrant');await page.getByLabel('Email',{exact:true}).fill(email);
  await page.getByLabel('Department',{exact:true}).selectOption('BSIT');
  await page.getByLabel('Password',{exact:true}).fill(password);await page.getByLabel('Confirm Password',{exact:true}).fill(password);
  await page.getByLabel('Photo of Valid ID',{exact:true}).setInputFiles({name:'synthetic-id.png',mimeType:'image/png',buffer:image});
  stub.state.failUpload=true;
  try {
    await page.getByRole('button',{name:'Complete test CAPTCHA'}).click();await page.getByRole('button',{name:'Register',exact:true}).click();
    await expect(page.locator('form [role="alert"]')).toContainText('Could not securely upload');
    await expect(page.getByRole('button',{name:'Register',exact:true})).toBeDisabled();
    await expect(page.getByLabel('First Name',{exact:true})).toHaveValue('Retry');
    expect(await prisma.user.findUnique({where:{email}})).toBeNull();
  } finally {stub.state.failUpload=false;}
  await page.getByRole('button',{name:'Complete test CAPTCHA'}).click();await page.getByRole('button',{name:'Register',exact:true}).click();
  await expect(page.getByText('Registration submitted. Your account is pending administrator review.',{exact:false})).toBeVisible();
  expect((await prisma.user.findUniqueOrThrow({where:{email}})).accountStatus).toBe('PENDING');await page.close();
});


test('visible ID button opens picker, shows selection, supports change/remove and rejects invalid files', async ({ browser }) => {
  const page = await browser.newPage({ baseURL, viewport: { width: 390, height: 844 } });
  await page.route('https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit', route => route.fulfill({ contentType: 'application/javascript', body: widgetScript }));
  await page.goto('/register');
  const upload = page.getByRole('button', { name: 'Upload valid ID photo', exact: true });
  await expect(upload).toBeVisible();
  const chosen = page.waitForEvent('filechooser'); await upload.click();
  await (await chosen).setFiles({ name: 'synthetic-id.png', mimeType: 'image/png', buffer: image });
  await expect(page.getByText(/Selected: synthetic-id.png/)).toBeVisible();
  const change = page.getByRole('button', { name: 'Change ID photo', exact: true }); await expect(change).toBeVisible();
  const changed = page.waitForEvent('filechooser'); await change.click();
  await (await changed).setFiles({ name: 'replacement-id.png', mimeType: 'image/png', buffer: image });
  await expect(page.getByText(/Selected: replacement-id.png/)).toBeVisible();
  await page.getByRole('button', { name: 'Remove ID photo', exact: true }).click();
  await expect(page.getByText('No ID photo selected.', { exact: true })).toBeVisible();
  expect(await page.getByLabel('Photo of Valid ID', { exact: true }).evaluate((input: HTMLInputElement) => input.files?.length)).toBe(0);
  for (const file of [{ name: 'unsupported.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg/>') }, { name: 'oversized.png', mimeType: 'image/png', buffer: Buffer.alloc(3 * 1024 * 1024 + 1) }]) {
    await page.getByLabel('Photo of Valid ID', { exact: true }).setInputFiles(file);
    await expect(page.locator('form').getByRole('alert')).toHaveText('Choose one JPG, PNG, or WEBP image, no larger than 3MB.');
    await expect(upload).toBeVisible();
  }
  await page.getByLabel('Photo of Valid ID', { exact: true }).setInputFiles({ name: 'retry-id.png', mimeType: 'image/png', buffer: image });
  await expect(page.locator('form').getByRole('alert')).toHaveCount(0); await expect(change).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/registration-visible-upload-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.screenshot({ path: 'test-results/registration-visible-upload-desktop.png', fullPage: true });
  await page.close();
});

test('official public Turnstile test widget completes on localhost',async({browser})=>{
  const page=await browser.newPage({baseURL});await page.goto('/register');
  await expect(page.getByText('CAPTCHA completed.',{exact:true})).toBeVisible({timeout:60000});
  await page.close();
});

test.afterAll(async()=>{for(const ctx of [anonymous,admin,student])await ctx?.dispose();await stub?.close();await prisma.$disconnect();});
