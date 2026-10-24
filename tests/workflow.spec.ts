import { test, expect, request as playwrightRequest, APIRequestContext, BrowserContext } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { readFileSync } from 'node:fs';
import { startEvidenceStorageStub } from './evidence-storage-stub';
import prisma from '../src/lib/prisma';
import { requestDateToday, formatRequestDate } from '../src/lib/requests/form';
import { assertLocalTestEnvironment } from './local-safety';

assertLocalTestEnvironment();
test.describe.configure({ mode: 'serial' });
const password = `Local-fixture-${randomUUID()}`;
const marker = randomUUID();
const baseURL = process.env.NEXTAUTH_URL || 'http://localhost:3100';
let student: APIRequestContext, admin: APIRequestContext, head: APIRequestContext, other: APIRequestContext;
let studentId: string, adminId: string, headId: string, otherId: string, requestId: string, legacyId: string;
let studentBrowser: BrowserContext;
let storage: Awaited<ReturnType<typeof startEvidenceStorageStub>>;
const official = { workLocation: `Courtyard ${marker}`, description: 'Repair the leaking outdoor faucet.', requestedPriority: 'HIGH' };
const createdIds: string[] = [];
async function login(email: string) {
  const context = await playwrightRequest.newContext({ baseURL });
  const csrf = await (await context.get('/api/auth/csrf')).json();
  await context.post('/api/auth/callback/credentials', { form: { csrfToken: csrf.csrfToken, email, password, json: 'true', callbackUrl: baseURL } });
  const session = await (await context.get('/api/auth/session')).json();
  expect(session.user?.email).toBe(email);
  return context;
}
async function submit(priority = 'MEDIUM') {
  const response = await student.post('/api/user/requests', { data: { ...official, requestedPriority: priority } });
  expect(response.status()).toBe(201);
  const data = await response.json(); createdIds.push(data.requestId); return data.requestId as string;
}
async function approve(id: string) {
  expect((await admin.patch(`/api/admin/requests/${id}`, { data: { action: 'approve' } })).status()).toBe(200);
}

test.beforeAll(async ({ browser }) => {
  storage = await startEvidenceStorageStub();
  const hash = await bcrypt.hash(password, 4);
  const createUser = (email: string, role: 'STUDENT' | 'ADMIN' | 'TECHNICIAN', firstName: string) => prisma.user.create({ data: {
    email, role, firstName, lastName: 'Local Fixture', idNumber: `${marker}-${role}-${firstName}`, passwordHash: hash, accountStatus: 'ACTIVE',
  } });
  studentId = (await createUser(`requester-${marker}@example.test`, 'STUDENT', 'Requester')).id;
  adminId = (await createUser(`admin-${marker}@example.test`, 'ADMIN', 'Admin')).id;
  // Dedicated test DB only: never change an existing account with this email.
  const headEmail = process.env.TECHNICIAN_HEAD_EMAIL || 'tech@gmail.com';
  const existingHead = await prisma.user.findUnique({ where: { email: headEmail } });
  if (existingHead) throw new Error('Use a fresh local fixtrack_test database; the designated head fixture already exists. No account was overwritten.');
  headId = (await createUser(headEmail, 'TECHNICIAN', 'Head')).id;
  otherId = (await createUser(`legacy-tech-${marker}@example.test`, 'TECHNICIAN', 'Legacy')).id;
  student = await login(`requester-${marker}@example.test`); admin = await login(`admin-${marker}@example.test`);
  head = await login(headEmail); other = await login(`legacy-tech-${marker}@example.test`);
  studentBrowser = await browser.newContext({ baseURL, storageState: await student.storageState() });
  // Legacy record keeps its original fields/history and original technician assignment.
  const legacy = await prisma.maintenanceRequest.create({ data: {
    requestCode: `LEGACY-${marker}`, submittedById: studentId, issueType: 'PLUMBING', building: 'COLLEGE_BUILDING',
    roomNumber: 'Library', locationNotes: 'Second floor', description: 'Legacy repair record ' + 'x'.repeat(600), urgencyLevel: 'URGENT',
    priorityLevel: 'HIGH', status: 'COMPLETED', assignedToId: otherId,
    statusHistory: { create: { changedById: adminId, newStatus: 'COMPLETED', remarks: 'Original legacy history' } },
    repairNote: { create: { technicianId: otherId, notes: 'Original legacy repair note' } },
    assignments: { create: { assignedById: adminId, assignedToId: otherId } },
  } }); legacyId = legacy.id;
});

test('official form matches fields/order; locked identity/date; exactly one square priority; QR prefill', async () => {
  const page = await studentBrowser.newPage();
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/requests/new?building=COLLEGE_BUILDING&room=Library');
  await expect(page.getByRole('heading', { name: 'Maintenance / Custodial Work Request Form' })).toBeVisible();
  await expect(page.locator('form input, form textarea')).toHaveCount(8);
  const labels = await page.locator('form label, form legend').allTextContents();
  expect(labels.map(s => s.trim())).toEqual(['Date of Request:', 'Requesting Party:', 'Work Location:', 'Description of work/repair:', 'Requested Priority:',
    'High - Must be done within 24 hours.', 'Medium - Within the week.', 'Low – When you get a chance.']);
  await expect(page.getByLabel('Date of Request:')).toHaveValue(formatRequestDate(requestDateToday()));
  await expect(page.getByLabel('Date of Request:')).toHaveAttribute('readonly', '');
  await expect(page.getByLabel('Requesting Party:')).toHaveValue('Requester Local Fixture');
  await expect(page.getByLabel('Requesting Party:')).toHaveAttribute('readonly', '');
  await expect(page.getByLabel('Work Location:')).toHaveValue('College Building — Library');
  for (const id of ['requestDate', 'requestingParty', 'workLocation', 'description']) {
    const style = await page.locator(`#${id}`).evaluate(el => {
      const computed = getComputedStyle(el);
      return { backgroundImage: computed.backgroundImage, borders: [computed.borderTopWidth, computed.borderRightWidth, computed.borderBottomWidth, computed.borderLeftWidth] };
    });
    expect(style.backgroundImage).toBe('none');
    expect(style.borders.every(width => parseFloat(width) > 0)).toBe(true);
  }
  await page.getByRole('button', { name: 'Submit Request' }).click();
  await expect(page.getByText('Select exactly one requested priority.')).toBeVisible();
  await page.getByLabel('High - Must be done within 24 hours.').check();
  await page.getByLabel('Medium - Within the week.').check();
  await expect(page.locator('input[name="requestedPriority"]:checked')).toHaveCount(1);
  await expect(page.getByLabel('High - Must be done within 24 hours.')).not.toBeChecked();
  await expect(page.getByText('Select exactly one requested priority.')).toHaveCount(0);
  await page.getByLabel('Description of work/repair:').fill('Inspect and repair the leaking faucet near the library entrance.');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.locator('aside').evaluate(el => Math.round(el.getBoundingClientRect().right))).toBe(0);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/official-form-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1100 });
  await expect.poll(() => page.locator('aside').evaluate(el => Math.round(el.getBoundingClientRect().left))).toBe(0);
  await expect.poll(() => page.locator('main').evaluate(el => Math.round(el.getBoundingClientRect().left))).toBe(260);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: 'test-results/official-form-desktop.png', fullPage: true });
  expect(errors).toEqual([]);
  await page.close();
});

test('description has a live 0/500 counter and a 500-character input/server limit', async () => {
  const page = await studentBrowser.newPage(); await page.goto('/requests/new');
  const description = page.getByLabel('Description of work/repair:');
  const counter = page.locator('#description-counter');
  await expect(counter).toHaveText('0/500'); await expect(description).toHaveAttribute('maxlength', '500');
  await description.fill('Repair'); await expect(counter).toHaveText('6/500');
  await description.fill('x'.repeat(500)); await expect(counter).toHaveText('500/500');
  await description.press('End'); await page.keyboard.insertText('extra');
  await expect(description).toHaveValue('x'.repeat(500)); await expect(counter).toHaveText('500/500');
  await description.fill(''); await expect(counter).toHaveText('0/500');
  for (const text of ['x'.repeat(501), 'x'.repeat(500) + ' ']) {
    const response = await student.post('/api/user/requests', { data: { ...official, description: text } });
    expect(response.status()).toBe(400); expect((await response.json()).errors.description).toContain('500');
  }
  const response = await student.post('/api/user/requests', { data: { ...official, description: 'x'.repeat(500) } });
  expect(response.status()).toBe(201);
  const record = await prisma.maintenanceRequest.findUniqueOrThrow({ where: { id: (await response.json()).requestId } });
  expect(record.description).toHaveLength(500);
  await page.close();
});

test('authentication/authorization and server validation reject invalid submissions', async () => {
  const anonymous = await playwrightRequest.newContext({ baseURL });
  expect((await anonymous.post('/api/user/requests', { data: official })).status()).toBe(401);
  expect((await head.post('/api/user/requests', { data: official })).status()).toBe(403);
  for (const body of [null, [], {}, { ...official, requestedPriority: ['HIGH', 'LOW'] }, { ...official, requestedPriority: 'URGENT' }, { ...official, description: 25 }]) {
    expect((await student.post('/api/user/requests', { data: body })).status()).toBe(400);
  }
  expect((await student.post('/api/user/requests', { data: '{', headers: { 'content-type': 'application/json' } })).status()).toBe(400);
  await anonymous.dispose();
});

test('submission uses server identity/date and creates admin notifications/history without an assignee', async () => {
  const response = await student.post('/api/user/requests', { data: { ...official, requestDate: '1999-01-01', requestingParty: 'Spoofed', submittedById: adminId,
    status: 'COMPLETED', assignedToId: otherId, priorityLevel: 'URGENT' } });
  expect(response.status()).toBe(201);
  requestId = (await response.json()).requestId; createdIds.push(requestId);
  const record = await prisma.maintenanceRequest.findUniqueOrThrow({ where: { id: requestId }, include: { notifications: true, statusHistory: true } });
  expect(record.status).toBe('PENDING'); expect(record.assignedToId).toBeNull();
  expect(record.requestingParty).toBe('Requester Local Fixture'); expect(record.submittedById).toBe(studentId);
  expect(record.requestDate?.toISOString().slice(0, 10)).toBe(requestDateToday());
  expect(record.requestedPriority).toBe('HIGH'); expect(record.priorityLevel).toBe('HIGH');
  expect(record.issueType).toBeNull(); expect(record.building).toBeNull(); expect(record.roomNumber).toBeNull();
  expect(record.notifications.some(n => n.userId === adminId && n.type === 'REQUEST_SUBMITTED')).toBe(true);
  expect(record.statusHistory.map(s => s.newStatus)).toEqual(['PENDING']);
});

test('all relay paths reject non-admin, unapproved requests, and non-head accounts', async () => {
  expect((await student.post('/api/admin/assignments', { data: { requestId, technicianId: headId } })).status()).toBe(403);
  expect((await admin.post('/api/admin/assignments', { data: { requestId, technicianId: headId } })).status()).toBe(409);
  await approve(requestId);
  const list = await (await admin.get('/api/admin/assignments?type=technicians')).json();
  expect(list.technicians.map((t: { id: string }) => t.id)).toEqual([headId]);
  expect((await admin.post('/api/admin/assignments', { data: { requestId, technicianId: otherId } })).status()).toBe(400);
  expect((await admin.patch(`/api/admin/requests/${requestId}`, { data: { action: 'assign', technicianId: otherId } })).status()).toBe(400);
  expect((await admin.patch('/api/admin/requests', { data: { action: 'bulkAssign', requestIds: [requestId], technicianId: otherId } })).status()).toBe(400);
  expect(await prisma.requestAssignment.count({ where: { requestId } })).toBe(1);
});

test('missing, inactive, or wrong-role head blocks approval atomically with no decision, assignment or notification', async () => {
  const id=await submit();const snapshot=await prisma.maintenanceRequest.findUniqueOrThrow({where:{id}});
  try {
    for(const data of [{accountStatus:'INACTIVE' as const},{accountStatus:'ACTIVE' as const,role:'STUDENT' as const},{role:'TECHNICIAN' as const,email:`missing-${marker}@example.test`}]) {
      await prisma.user.update({where:{id:headId},data});
      expect((await admin.patch(`/api/admin/requests/${id}`,{data:{action:'approve'}})).status()).toBe(409);
      expect(await prisma.maintenanceRequest.findUniqueOrThrow({where:{id}})).toEqual(snapshot);
      expect(await prisma.requestAssignment.count({where:{requestId:id}})).toBe(0);
      expect(await prisma.requestStatusHistory.count({where:{requestId:id,newStatus:'APPROVED'}})).toBe(0);
      expect(await prisma.auditLog.count({where:{affectedRecordId:id,action:'REQUEST_APPROVED'}})).toBe(0);
      expect(await prisma.notification.count({where:{requestId:id,userId:headId}})).toBe(0);
    }
  } finally {await prisma.user.update({where:{id:headId},data:{accountStatus:'ACTIVE',role:'TECHNICIAN',email:process.env.TECHNICIAN_HEAD_EMAIL||'tech@gmail.com'}});}
});

test('admin relay creates one assignment and notification; only head sees and updates the task', async () => {
  expect((await admin.post('/api/admin/assignments', { data: { requestId, technicianId: headId } })).status()).toBe(409);
  expect((await admin.post('/api/admin/assignments', { data: { requestId, technicianId: headId } })).status()).toBe(409);
  expect(await prisma.requestAssignment.count({ where: { requestId, isActive: true } })).toBe(1);
  expect(await prisma.notification.count({ where: { requestId, userId: headId, type: 'TASK_ASSIGNED' } })).toBe(1);
  expect((await other.get(`/api/technician/tasks/${requestId}`)).status()).toBe(403);
  expect((await other.patch(`/api/technician/tasks/${requestId}`, { data: { action: 'complete' } })).status()).toBe(403);
  const tasks = await (await head.get(`/api/technician/tasks?search=${marker}`)).json();
  expect(tasks.tasks.some((t: { id: string }) => t.id === requestId)).toBe(true);
  const record = await prisma.maintenanceRequest.findUniqueOrThrow({ where: { id: requestId } });
  expect(record.assignedToId).toBe(headId); expect(record.reviewedById).toBe(adminId);
});

test('only the live active designated head can access every task endpoint; historical records stay unchanged', async ({ browser }) => {
  const readPaths = ['/api/technician/dashboard', '/api/technician/tasks', '/api/technician/history', '/api/technician/badges', `/api/technician/tasks/${legacyId}`];
  const before = await prisma.maintenanceRequest.findUniqueOrThrow({ where: { id: legacyId }, include: { assignments: true, repairNote: true, statusHistory: true } });
  for (const path of readPaths) expect((await other.get(path)).status()).toBe(403);
  expect((await other.patch(`/api/technician/tasks/${legacyId}`, { data: { action: 'update', repairNotes: 'Unauthorized', status: 'ONGOING' } })).status()).toBe(403);
  expect((await head.get(`/api/technician/tasks/${legacyId}`)).status()).toBe(404);
  const page = await browser.newPage({ baseURL, storageState: await other.storageState() });
  for (const path of ['/technician/dashboard', '/technician/tasks', '/technician/history', `/technician/tasks/${legacyId}`]) {
    await page.goto(path); await expect(page.getByRole('heading', { name: 'Technician-head access required' })).toBeVisible();
  }
  await page.goto('/technician/profile'); await expect(page.getByRole('heading', { name: 'Technician-head access required' })).toHaveCount(0);
  await prisma.user.update({ where: { id: headId }, data: { accountStatus: 'INACTIVE' } });
  try {
    for (const path of readPaths) expect((await head.get(path)).status()).toBe(403);
    expect((await head.patch(`/api/technician/tasks/${requestId}`, { data: { action: 'complete' } })).status()).toBe(403);
  } finally { await prisma.user.update({ where: { id: headId }, data: { accountStatus: 'ACTIVE' } }); }
  await prisma.user.update({ where: { id: headId }, data: { email: `no-longer-head-${marker}@example.test` } });
  try {
    expect((await head.get('/api/technician/tasks')).status()).toBe(403);
    expect((await head.patch(`/api/technician/tasks/${requestId}`, { data: { action: 'complete' } })).status()).toBe(403);
  } finally { await prisma.user.update({ where: { id: headId }, data: { email: process.env.TECHNICIAN_HEAD_EMAIL || 'tech@gmail.com' } }); }
  expect(await prisma.maintenanceRequest.findUniqueOrThrow({ where: { id: legacyId }, include: { assignments: true, repairNote: true, statusHistory: true } })).toEqual(before);
  await page.close();
});

test('anonymous, ordinary user, non-head and stale admin sessions cannot review or relay', async () => {
  const anonymous = await playwrightRequest.newContext({ baseURL });
  for (const [context, expected] of [[anonymous, 401], [student, 403], [head, 403], [other, 403]] as const) {
    expect((await context.post('/api/admin/assignments', { data: { requestId } })).status()).toBe(expected);
    expect((await context.patch(`/api/admin/requests/${requestId}`, { data: { action: 'assign' } })).status()).toBe(expected);
    expect((await context.patch('/api/admin/requests', { data: { action: 'bulkAssign', requestIds: [requestId] } })).status()).toBe(expected);
  }
  await prisma.user.update({ where: { id: adminId }, data: { accountStatus: 'INACTIVE' } });
  try {
    for (const path of ['/api/admin/requests', `/api/admin/requests/${requestId}`, '/api/admin/assignments?type=technicians']) expect((await admin.get(path)).status()).toBe(403);
    expect((await admin.patch(`/api/admin/requests/${requestId}`, { data: { action: 'approve' } })).status()).toBe(403);
    expect((await admin.post('/api/admin/assignments', { data: { requestId } })).status()).toBe(403);
    expect((await admin.patch(`/api/admin/requests/${requestId}`, { data: { action: 'assign' } })).status()).toBe(403);
    expect((await admin.patch('/api/admin/requests', { data: { action: 'bulkAssign', requestIds: [requestId] } })).status()).toBe(403);
  } finally { await prisma.user.update({ where: { id: adminId }, data: { accountStatus: 'ACTIVE' } }); }
  await anonymous.dispose();
});

test('one approval click forwards automatically, removes triage UI, and immediately appears on technician dashboard', async ({browser}) => {
 const id=await submit('MEDIUM');const page=await browser.newPage({baseURL,storageState:await admin.storageState()});
 await page.goto(`/admin/requests/${id}`);
 await expect(page.getByText('Admin-assessed Priority',{exact:true})).toHaveCount(0);await expect(page.getByText('Triage Options',{exact:true})).toHaveCount(0);await expect(page.getByRole('button',{name:'Update Priority',exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'Approve & forward to technician head',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Receiving Technician Head'})).toBeVisible();
 await expect(page.getByLabel('Request receiving account')).toContainText(process.env.TECHNICIAN_HEAD_EMAIL||'tech@gmail.com');
 await expect(page.getByRole('link',{name:'Relay to Technician Head',exact:true})).toHaveCount(0);
 const record=await prisma.maintenanceRequest.findUniqueOrThrow({where:{id}});expect(record.status).toBe('ONGOING');expect(record.assignedToId).toBe(headId);expect(record.requestedPriority).toBe('MEDIUM');expect(record.priorityLevel).toBe('NORMAL');
 const dashboard=await (await head.get('/api/technician/dashboard')).json();expect(dashboard.activeTasks.some((task:{id:string})=>task.id===id)).toBe(true);
 const hp=await browser.newPage({baseURL,storageState:await head.storageState()});await hp.goto('/technician/dashboard');await expect(hp.getByText(record.requestCode,{exact:true})).toBeVisible();await hp.screenshot({path:'test-results/automatic-approval-head-dashboard.png',fullPage:true});await hp.close();
 const up=await studentBrowser.newPage();await up.goto(`/requests/${id}`);await expect(up.getByText('Admin-assessed Priority',{exact:true})).toHaveCount(0);await expect(up.getByText('Medium - Within the week.',{exact:true})).toBeVisible();await up.close();
 await page.screenshot({path:'test-results/automatic-approval-admin.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.close();
});

test('head records off-system coordination, holds/resumes, completes, and cannot reopen a terminal task', async () => {
  const badgeBefore = (await (await head.get('/api/technician/badges')).json()).tasks;
  expect((await head.patch(`/api/technician/tasks/${requestId}`, { data: { action: 'update', repairNotes: 'Contacted maintenance worker by phone.', partsReplaced: '', status: 'ON_HOLD' } })).status()).toBe(200);
  expect((await (await head.get('/api/technician/badges')).json()).tasks).toBe(badgeBefore);
  expect((await head.patch(`/api/technician/tasks/${requestId}`, { data: { action: 'update', repairNotes: 'Worker attended in person.', status: 'ONGOING' } })).status()).toBe(200);
  expect((await head.patch(`/api/technician/tasks/${requestId}`, { data: { action: 'update', repairNotes: 'Invalid transition', status: 'APPROVED' } })).status()).toBe(400);
  expect((await head.patch(`/api/technician/tasks/${requestId}`, { data: { action: 'complete' } })).status()).toBe(200);
  expect((await head.patch(`/api/technician/tasks/${requestId}`, { data: { action: 'complete' } })).status()).toBe(409);
  const record = await prisma.maintenanceRequest.findUniqueOrThrow({ where: { id: requestId }, include: { repairNote: true, statusHistory: true } });
  expect(record.completedAt).not.toBeNull(); expect(record.requestedPriority).toBe('HIGH'); expect(record.repairNote?.technicianId).toBe(headId);
  expect(record.statusHistory).toHaveLength(6);
  expect(await prisma.notification.count({ where: { requestId, type: 'TASK_COMPLETED' } })).toBe(1);
});

test('head receives requester priority and browser progress controls save reported updates', async ({ browser }) => {
  const id = await submit('LOW');
  await approve(id);
  expect((await prisma.maintenanceRequest.findUniqueOrThrow({where:{id}})).priorityLevel).toBe('LOW');
  const dashboard = await (await head.get('/api/technician/dashboard')).json();
  expect(dashboard.activeTasks.some((task:{id:string})=>task.id===id)).toBe(true);
  const page = await browser.newPage({ baseURL, storageState: await head.storageState() });
  await page.goto('/technician/dashboard');
  await expect(page.getByText('External contact and worker activity are not automatically tracked.', { exact: false })).toBeVisible();
  await page.goto(`/technician/tasks/${id}`);
  await page.getByLabel('Repair Notes', { exact: true }).fill('Head recorded a phone call to coordinate maintenance.');
  await page.getByRole('button', { name: 'On Hold', exact: true }).click();
  await page.getByRole('button', { name: 'Save Update', exact: true }).click();
  await expect.poll(async () => (await prisma.maintenanceRequest.findUniqueOrThrow({ where: { id } })).status).toBe('ON_HOLD');
  await expect(page.getByRole('button', { name: 'Save Update', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Ongoing', exact: true }).click();
  await page.getByRole('button', { name: 'Save Update', exact: true }).click();
  await expect.poll(async () => (await prisma.maintenanceRequest.findUniqueOrThrow({ where: { id } })).status).toBe('ONGOING');
  await expect(page.getByRole('button', { name: 'Mark as Completed' })).toBeVisible();
  await page.getByRole('button', { name: 'Mark as Completed' }).click();
  await page.getByRole('button', { name: 'Yes, Complete' }).click();
  await expect(page.getByText('This task has been marked as completed on', { exact: false })).toBeVisible();
  const saved = await prisma.maintenanceRequest.findUniqueOrThrow({ where: { id }, include: { repairNote: true } });
  expect(saved.status).toBe('COMPLETED'); expect(saved.repairNote?.notes).toContain('Head recorded a phone call');
  await page.screenshot({ path: 'test-results/task2-head-completed.png', fullPage: true });
  await page.close();
});

test('legacy approved requests retain manual/bulk relay; concurrent new approval creates exactly one assignment', async () => {
 const legacyApprove=async(id:string)=>prisma.maintenanceRequest.update({where:{id},data:{status:'APPROVED',reviewedById:adminId,reviewedAt:new Date()}});
 const first=await submit('LOW'),second=await submit('MEDIUM');await legacyApprove(first);
 expect((await admin.patch('/api/admin/requests',{data:{action:'bulkAssign',requestIds:[first,second]}})).status()).toBe(409);
 expect((await prisma.maintenanceRequest.findUniqueOrThrow({where:{id:first}})).assignedToId).toBeNull();
 await legacyApprove(second);expect((await admin.patch('/api/admin/requests',{data:{action:'bulkAssign',requestIds:[first,second]}})).status()).toBe(200);
 expect(await prisma.requestAssignment.count({where:{requestId:{in:[first,second]}}})).toBe(2);
 const third=await submit();await legacyApprove(third);expect((await admin.patch(`/api/admin/requests/${third}`,{data:{action:'assign'}})).status()).toBe(200);
 const fourth=await submit();const results=await Promise.all([admin.patch(`/api/admin/requests/${fourth}`,{data:{action:'approve'}}),admin.patch(`/api/admin/requests/${fourth}`,{data:{action:'approve'}})]);
 expect(results.map(r=>r.status()).sort()).toEqual([200,409]);
 expect(await prisma.requestAssignment.count({where:{requestId:fourth}})).toBe(1);expect(await prisma.notification.count({where:{requestId:fourth,userId:headId,type:'TASK_ASSIGNED'}})).toBe(1);
 expect(await prisma.requestStatusHistory.count({where:{requestId:fourth,newStatus:'APPROVED'}})).toBe(1);expect(await prisma.requestStatusHistory.count({where:{requestId:fourth,newStatus:'ONGOING'}})).toBe(1);
});

test('direct API cannot restore triage or choose a different head and competing approval/rejection makes one decision', async () => {
 const id=await submit('LOW');const before=await prisma.maintenanceRequest.findUniqueOrThrow({where:{id}});
 for(const data of [{action:'updatePriority',priorityLevel:'URGENT'},{action:'approve',priorityLevel:'HIGH'},{action:'approve',adminNotes:'forged triage'},{action:'approve',technicianId:otherId}])expect((await admin.patch(`/api/admin/requests/${id}`,{data})).status()).toBe(400);
 expect(await prisma.maintenanceRequest.findUniqueOrThrow({where:{id}})).toEqual(before);
 expect((await student.patch(`/api/admin/requests/${id}`,{data:{action:'approve'}})).status()).toBe(403);
 expect((await other.patch(`/api/admin/requests/${id}`,{data:{action:'approve'}})).status()).toBe(403);
 const results=await Promise.all([admin.patch(`/api/admin/requests/${id}`,{data:{action:'approve'}}),admin.patch(`/api/admin/requests/${id}`,{data:{action:'reject',rejectionReason:'Synthetic review'}})]);
 expect(results.map(r=>r.status()).sort()).toEqual([200,409]);
 const record=await prisma.maintenanceRequest.findUniqueOrThrow({where:{id}});expect(['ONGOING','REJECTED']).toContain(record.status);
 expect(await prisma.requestStatusHistory.count({where:{requestId:id,newStatus:{in:['APPROVED','REJECTED']}}})).toBe(1);
 expect(await prisma.requestAssignment.count({where:{requestId:id}})).toBe(record.status==='ONGOING'?1:0);
});

test('new/legacy details, lists, analytics and technician dashboard render without losing history', async ({ browser }) => {
  const page = await studentBrowser.newPage();
  for (const id of [requestId, legacyId]) {
    await page.goto(`/requests/${id}`);
    await expect(page.getByText('Work Location:', { exact: true })).toBeVisible();
  }
  await expect(page.getByText('College Building — Library — Second floor', { exact: true })).toBeVisible();
  await expect(page.getByText('Not recorded (legacy request)', { exact: true }).first()).toBeVisible();
  for (const url of ['/requests', '/history', '/dashboard']) { await page.goto(url); await expect(page.getByText('Application error')).toHaveCount(0); }
  const adminPage = await browser.newPage({ baseURL, storageState: await admin.storageState() });
  await adminPage.goto(`/admin/requests/${requestId}`); await expect(adminPage.getByText(official.workLocation, { exact: true }).first()).toBeVisible();
  await adminPage.goto('/admin/assignments'); await expect(adminPage.getByRole('heading', { name: 'Task Assignment', exact: true })).toBeVisible(); await expect(adminPage.getByRole('heading', { name: 'Unassigned Approved Requests' })).toHaveCount(0); await expect(adminPage.getByRole('heading', { name: 'Designated Technician Head' })).toHaveCount(0);
  expect((await admin.get('/api/admin/analytics')).status()).toBe(200);
  const headPage = await browser.newPage({ baseURL, storageState: await head.storageState() });
  await headPage.goto(`/technician/tasks/${requestId}`); await expect(headPage.getByText('contact the appropriate maintenance worker', { exact: false })).toBeVisible();
  expect((await head.get('/api/technician/dashboard')).status()).toBe(200);
  expect((await student.get('/api/user/history')).status()).toBe(200);
  const legacy = await prisma.maintenanceRequest.findUniqueOrThrow({ where: { id: legacyId }, include: { statusHistory: true, repairNote: true, assignments: true } });
  expect(legacy.requestedPriority).toBeNull(); expect(legacy.workLocation).toBeNull(); expect(legacy.issueType).toBe('PLUMBING');
  expect(legacy.description).toBe('Legacy repair record ' + 'x'.repeat(600));
  expect(legacy.assignedToId).toBe(otherId); expect(legacy.statusHistory[0].remarks).toBe('Original legacy history');
  expect(legacy.repairNote?.notes).toBe('Original legacy repair note'); expect(legacy.assignments).toHaveLength(1);
  await page.close(); await adminPage.close(); await headPage.close();
});

test('browser submits official form and redirects to saved request', async () => {
  const page = await studentBrowser.newPage();
  await page.goto('/requests/new');
  await page.getByLabel('Work Location:').fill('Local test lobby');
  await page.getByLabel('Description of work/repair:').fill('Repair the loose door handle.');
  await page.getByLabel('Low – When you get a chance.').check();
  const submission = page.waitForResponse(response => response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/user/requests');
  await page.getByRole('button', { name: 'Submit Request' }).click();
  const submitted = await submission;
  expect(submitted.status(), await submitted.text()).toBe(201);
  await expect(page).not.toHaveURL(/\/requests\/new(?:\?|$)/);
  await expect(page).toHaveURL(/\/requests\/[a-z0-9]+$/);
  await expect(page.getByText('Local test lobby', { exact: true })).toBeVisible();
  await expect(page.getByText('Low – When you get a chance.', { exact: true })).toBeVisible();
  await page.close();
});

test('photo picker retains 3-photo/5MB/type limits, previews, removal and drag/drop', async () => {
  const page = await studentBrowser.newPage(); await page.goto('/requests/new');
  const input = page.getByLabel('Photo evidence files');
  await expect(page.getByRole('heading', { name: 'Photo Evidence' })).toBeVisible();
  await input.setInputFiles(['tests/fixtures/evidence.png','tests/fixtures/evidence.jpeg','tests/fixtures/evidence.webp']);
  await expect(page.getByAltText(/Evidence preview/)).toHaveCount(3);
  await input.setInputFiles('tests/fixtures/evidence.png');
  await expect(page.getByText('Maximum 3 photos allowed.')).toBeVisible();
  await page.getByRole('button', { name: 'Remove photo 2' }).click();
  await expect(page.getByAltText(/Evidence preview/)).toHaveCount(2);
  await input.setInputFiles({ name: 'bad.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg/>') });
  await expect(page.getByText('Only JPG, PNG, and WEBP photos are supported.')).toBeVisible();
  await input.setInputFiles({ name: 'large.png', mimeType: 'image/png', buffer: Buffer.alloc(5 * 1024 * 1024 + 1) });
  await expect(page.getByText('large.png exceeds the 5MB limit.')).toBeVisible();
  const drop = await page.evaluateHandle(bytes => {
    const data = new DataTransfer(); data.items.add(new File([new Uint8Array(bytes)], 'dropped.png', { type: 'image/png' })); return data;
  }, Array.from(readFileSync('tests/fixtures/evidence.png')));
  await page.getByRole('button', { name: 'Add photos or drag and drop' }).dispatchEvent('drop', { dataTransfer: drop });
  await drop.dispose(); await expect(page.getByAltText(/Evidence preview/)).toHaveCount(3);
  await page.screenshot({ path: 'test-results/restored-photo-evidence.png', fullPage: true });
  await page.close();
});

test('browser evidence submission saves URLs and requester, admin and head can view the photos', async ({ browser }) => {
  const page = await studentBrowser.newPage(); await page.goto('/requests/new');
  await page.getByLabel('Work Location:').fill('Local evidence location');
  await page.getByLabel('Description of work/repair:').fill('Photo-supported test request.');
  await page.getByLabel('Medium - Within the week.').check();
  await page.getByLabel('Photo evidence files').setInputFiles('tests/fixtures/evidence.png');
  const submission = page.waitForResponse(response => response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/user/requests');
  await page.getByRole('button', { name: 'Submit Request' }).click();
  const submitted = await submission;
  expect(submitted.status(), await submitted.text()).toBe(201);
  await expect(page).not.toHaveURL(/\/requests\/new(?:\?|$)/);
  await expect(page).toHaveURL(/\/requests\/[a-z0-9]+$/);
  const id = new URL(page.url()).pathname.split('/').pop()!;
  const record = await prisma.maintenanceRequest.findUniqueOrThrow({ where: { id } });
  const urls = JSON.parse(record.photoUrl!); expect(urls).toHaveLength(1); expect(storage.objects.size).toBe(1);
  const image = page.getByAltText('Evidence photo 1'); await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate(el => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await image.locator('..').click(); await expect(page.getByAltText('Full size evidence')).toBeVisible();
  const adminPage = await browser.newPage({ baseURL, storageState: await admin.storageState() });
  await adminPage.goto(`/admin/requests/${id}`); await expect(adminPage.getByAltText('Evidence photo 1')).toBeVisible();
  await approve(id);
  const headPage = await browser.newPage({ baseURL, storageState: await head.storageState() });
  await headPage.goto(`/technician/tasks/${id}`); await expect(headPage.getByAltText('Evidence photo 1')).toBeVisible();
  expect((await (await head.get(`/api/technician/tasks/${id}`)).json()).photoUrl).toBe(record.photoUrl);
  await page.close(); await adminPage.close(); await headPage.close();
});

test('server rejects malformed/extra evidence and storage failures leave no partial request or files', async () => {
  const png = `data:image/png;base64,${readFileSync('tests/fixtures/evidence.png').toString('base64')}`;
  const before = await prisma.maintenanceRequest.count(); const originalFiles = storage.objects.size;
  for (const photos of [null, [123], ['data:image/png;base64,AAAA'], Array(4).fill(png)]) {
    expect((await student.post('/api/user/requests', { data: { ...official, photos } })).status()).toBe(400);
  }
  expect(storage.objects.size).toBe(originalFiles); expect(await prisma.maintenanceRequest.count()).toBe(before);
  storage.state.failFromUpload = storage.state.uploads + 2;
  const response = await student.post('/api/user/requests', { data: { ...official, photos: [png, png] } });
  storage.state.failFromUpload = Number.POSITIVE_INFINITY;
  expect(response.status()).toBe(503); expect((await response.json()).code).toBe('REQUEST_PHOTO_UPLOAD_FAILED'); expect(storage.objects.size).toBe(originalFiles);
  expect(await prisma.maintenanceRequest.count()).toBe(before);
  const data = ['png','jpeg','webp'].map(ext => `data:image/${ext};base64,${readFileSync(`tests/fixtures/evidence.${ext}`).toString('base64')}`);
  const success = await student.post('/api/user/requests', { data: { ...official, photos: data } });
  expect(success.status()).toBe(201);
  const record = await prisma.maintenanceRequest.findUniqueOrThrow({ where: { id: (await success.json()).requestId } });
  expect(JSON.parse(record.photoUrl!)).toHaveLength(3);
});

test('request-photo bucket failures are explicit; requests without photos still submit and no partial records are created', async () => {
  const png = `data:image/png;base64,${readFileSync('tests/fixtures/evidence.png').toString('base64')}`;
  for (const flag of ['missingBucket','deniedBucket','publicBucket'] as const) {
    const old=storage.state[flag];storage.state[flag]=flag==='publicBucket'?false:true;
    const before=await prisma.maintenanceRequest.count(),objects=storage.objects.size,uploads=storage.state.uploads;
    try {
      const response=await student.post('/api/user/requests',{data:{...official,photos:[png]}});
      expect(response.status()).toBe(503);expect((await response.json()).code).toBe('REQUEST_PHOTO_BUCKET_UNAVAILABLE');
      expect(await prisma.maintenanceRequest.count()).toBe(before);expect(storage.objects.size).toBe(objects);expect(storage.state.uploads).toBe(uploads);
      const noPhoto=await student.post('/api/user/requests',{data:official});expect(noPhoto.status()).toBe(201);
    } finally {storage.state[flag]=old;}
  }
});

test('outdated request schema reports a database migration error and rolls back newly uploaded evidence', async () => {
  assertLocalTestEnvironment();
  const png = `data:image/png;base64,${readFileSync('tests/fixtures/evidence.png').toString('base64')}`;
  const objects=storage.objects.size,before=await prisma.maintenanceRequest.count();
  // Non-destructive column rename on this explicitly isolated synthetic local test DB only.
  await prisma.$executeRawUnsafe('ALTER TABLE "MaintenanceRequest" RENAME COLUMN "requestDate" TO "requestDate_local_test_missing"');
  try {
    for (const photos of [[],[png]]) {
      const response=await student.post('/api/user/requests',{data:{...official,photos}});
      expect(response.status()).toBe(503);const body=await response.json();expect(body.code).toBe('REQUEST_SCHEMA_OUTDATED');expect(body.error).not.toContain('If photos were attached');
      expect(storage.objects.size).toBe(objects);expect(await prisma.maintenanceRequest.count()).toBe(before);
    }
  } finally {await prisma.$executeRawUnsafe('ALTER TABLE "MaintenanceRequest" RENAME COLUMN "requestDate_local_test_missing" TO "requestDate"');}
});

test('a forwarding notification database failure rolls back approval, assignment, review metadata and history together', async () => {
 assertLocalTestEnvironment();const id=await submit('HIGH');const before=await prisma.maintenanceRequest.findUniqueOrThrow({where:{id}});
 await prisma.$executeRawUnsafe(`CREATE FUNCTION fixtrack_test_deny_task_notification() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW."type"::text = 'TASK_ASSIGNED' THEN RAISE EXCEPTION 'Synthetic local forwarding failure'; END IF; RETURN NEW; END $$`);
 try {
  await prisma.$executeRawUnsafe('CREATE TRIGGER fixtrack_test_deny_task_notification BEFORE INSERT ON "Notification" FOR EACH ROW EXECUTE FUNCTION fixtrack_test_deny_task_notification()');
  const response=await admin.patch(`/api/admin/requests/${id}`,{data:{action:'approve'}});expect(response.status()).toBe(500);
  expect(await prisma.maintenanceRequest.findUniqueOrThrow({where:{id}})).toEqual(before);
  expect(await prisma.requestAssignment.count({where:{requestId:id}})).toBe(0);
  expect(await prisma.requestStatusHistory.count({where:{requestId:id,newStatus:{in:['APPROVED','ONGOING']}}})).toBe(0);
  expect(await prisma.auditLog.count({where:{affectedRecordId:id,action:{in:['REQUEST_APPROVED','TASK_ASSIGNED']}}})).toBe(0);
  expect(await prisma.notification.count({where:{requestId:id,type:{in:['REQUEST_APPROVED','TASK_ASSIGNED']}}})).toBe(0);
 } finally {
  await prisma.$executeRawUnsafe('DROP TRIGGER IF EXISTS fixtrack_test_deny_task_notification ON "Notification"');
  await prisma.$executeRawUnsafe('DROP FUNCTION IF EXISTS fixtrack_test_deny_task_notification()');
 }
 await approve(id);expect((await prisma.maintenanceRequest.findUniqueOrThrow({where:{id}})).assignedToId).toBe(headId);
});

test('Task Assignment is read-only and never loads or displays a separate unassigned relay queue', async ({browser}) => {
 const id=await submit();await approve(id);const record=await prisma.maintenanceRequest.findUniqueOrThrow({where:{id}});
 const page=await browser.newPage({baseURL,storageState:await admin.storageState(),viewport:{width:1440,height:1000}});
 const unwanted:string[]=[];
 await page.route('**/api/admin/assignments?type=unassigned*',route=>{unwanted.push('unassigned');return route.abort();});
 await page.route('**/api/admin/assignments?type=technicians*',route=>{unwanted.push('technicians');return route.abort();});
 page.on('request',request=>{if(new URL(request.url()).pathname==='/api/admin/assignments'&&request.method()!=='GET')unwanted.push(request.method());});
 await page.goto('/admin/assignments');
 await expect(page.getByRole('heading',{name:'Task Assignment',exact:true})).toBeVisible();
 await expect(page.getByRole('heading',{name:'Unassigned Approved Requests',exact:true})).toHaveCount(0);
 await expect(page.getByRole('heading',{name:'Designated Technician Head',exact:true})).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Relay selected request',exact:true})).toHaveCount(0);
 const card=page.getByRole('article',{name:`Approved task ${record.requestCode}`});await expect(card).toContainText(process.env.TECHNICIAN_HEAD_EMAIL||'tech@gmail.com');
 const refresh=page.waitForResponse(response=>response.url().includes('/api/admin/assignments?type=approved')&&response.request().method()==='GET');
 await page.getByRole('button',{name:'Refresh approved tasks'}).click();await refresh;await expect(card).toBeVisible();expect(unwanted).toEqual([]);
 await page.screenshot({path:'test-results/task-assignment-readonly-desktop.png'});
 await page.setViewportSize({width:390,height:844});
 await page.evaluate(()=>document.fonts.ready);
 // Wait for the desktop-to-mobile sidebar/margin transitions before capturing.
 await expect.poll(()=>page.evaluate(()=>{
  const sidebar=document.querySelector('aside')?.getBoundingClientRect();
  const main=document.querySelector('main')?.getBoundingClientRect();
  return Boolean(sidebar&&main&&sidebar.right<=1&&main.left<=20&&main.width>=350&&document.documentElement.scrollWidth<=innerWidth);
 })).toBe(true);
 await page.screenshot({path:'test-results/task-assignment-readonly-mobile.png'});await page.close();
 const denied=await studentBrowser.newPage();await denied.goto('/admin/assignments');await expect(denied).toHaveURL(/\/dashboard$/);await denied.close();
});

test('older approved unassigned request can be forwarded from its details without a separate assignment box or new approval', async ({browser}) => {
 const id=await submit('LOW');const reviewedAt=new Date();await prisma.maintenanceRequest.update({where:{id},data:{status:'APPROVED',reviewedById:adminId,reviewedAt}});
 const before=await prisma.maintenanceRequest.findUniqueOrThrow({where:{id}});
 const page=await browser.newPage({baseURL,storageState:await admin.storageState()});await page.goto('/admin/assignments');
 const card=page.getByRole('article',{name:`Approved task ${before.requestCode}`});await expect(card).toContainText('This older approved request has no receiving account.');
 await card.getByRole('link',{name:'View request and history'}).click();await expect(page).toHaveURL(new RegExp(`/admin/requests/${id}$`));
 await expect(page.getByRole('button',{name:'Approve & forward to technician head',exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'Forward previously approved request',exact:true}).click();await expect(page.getByRole('heading',{name:'Receiving Technician Head'})).toBeVisible();
 const saved=await prisma.maintenanceRequest.findUniqueOrThrow({where:{id}});expect(saved.assignedToId).toBe(headId);expect(saved.status).toBe('ONGOING');expect(saved.reviewedById).toBe(before.reviewedById);expect(saved.reviewedAt).toEqual(before.reviewedAt);expect(saved.description).toBe(before.description);
 expect(await prisma.requestAssignment.count({where:{requestId:id}})).toBe(1);expect(await prisma.requestStatusHistory.count({where:{requestId:id,newStatus:'APPROVED'}})).toBe(0);
 await expect(page.getByRole('button',{name:'Forward previously approved request',exact:true})).toHaveCount(0);await page.close();
});

test('three large evidence images are compressed below the hosted payload budget and saved; oversized direct calls fail', async () => {
 const sharp=(await import('sharp')).default;
 // Deterministic noisy image exercises compression rather than a tiny solid-color fixture.
 const pixels=Buffer.alloc(1200*1200*3);let seed=123456789;
 for(let i=0;i<pixels.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;pixels[i]=seed>>>24;}
 const image=await sharp(pixels,{raw:{width:1200,height:1200,channels:3}}).png().toBuffer();
 expect(image.length).toBeGreaterThan(3*1024*1024);expect(image.length).toBeLessThan(5*1024*1024);
 const page=await studentBrowser.newPage();await page.goto('/requests/new');
 await page.getByLabel('Work Location:').fill('Hosted upload regression '+marker);
 await page.getByLabel('Description of work/repair:').fill('Three compressed evidence photos.');
 await page.getByLabel('High - Must be done within 24 hours.').check();
 await page.getByLabel('Photo evidence files').setInputFiles([1,2,3].map(i=>({name:`noise-${i}.png`,mimeType:'image/png',buffer:image})));
 const sent=page.waitForRequest(r=>r.url().endsWith('/api/user/requests')&&r.method()==='POST');
 const saved=page.waitForResponse(r=>r.url().endsWith('/api/user/requests')&&r.request().method()==='POST');
 await page.getByRole('button',{name:'Submit Request',exact:true}).click();
 const request=await sent;expect(request.postDataBuffer()!.length).toBeLessThan(4*1024*1024);
 expect((await saved).status()).toBe(201);await expect(page).toHaveURL(/\/requests\/[^/]+$/);
 await page.close();
 const count=await prisma.maintenanceRequest.count();
 const rejected=await student.post('/api/user/requests',{data:JSON.stringify({...official,photos:['x'.repeat(4*1024*1024)]}),headers:{'Content-Type':'application/json'}});
 expect(rejected.status()).toBe(413);expect(await prisma.maintenanceRequest.count()).toBe(count);
});

test.afterAll(async () => {
  await studentBrowser?.close();
  for (const ctx of [student, admin, head, other]) await ctx?.dispose();
  // Synthetic records are retained for inspection; never run cleanup against an existing database.
  await prisma.$disconnect();
  await storage?.close();
});

let directoryTask: string, workerA: string, workerB: string, workerC: string;
const workerName = (suffix: string) => `Worker ${suffix} ${marker}`;
const workerData = (suffix: string, available = true) => ({ name: workerName(suffix), contactNumber: '09123456789', specialization: 'GENERAL', isAvailable: available });
async function addWorker(suffix: string, available = true) {
  const response = await head.post('/api/technician/workers', { data: workerData(suffix, available) });
  expect(response.status()).toBe(201); return (await response.json()).id as string;
}
async function taskVersion(id: string) { const response = await head.get(`/api/technician/tasks/${id}`); expect(response.status()).toBe(200); return (await response.json()).updatedAt as string; }
async function choose(id: string, ids: string[], version?: string) { return head.put(`/api/technician/tasks/${id}/workers`, { data: { workerIds: ids, updatedAt: version || await taskVersion(id) } }); }
async function workerRow(id: string) { const response = await head.get('/api/technician/workers?limit=100&archived=true'); expect(response.status()).toBe(200); return (await response.json()).workers.find((row: { id: string }) => row.id === id); }
async function relayNewTask() { const id = await submit(); await approve(id); return id; }

test('worker directory is head-only, validates records, and never creates worker login accounts', async () => {
  const users = await prisma.user.count(); workerA = await addWorker('A'); workerB = await addWorker('B'); workerC = await addWorker('Unavailable', false);
  const anonymous = await playwrightRequest.newContext({ baseURL });
  for (const context of [student, admin, other, anonymous]) {
    const denied = context === anonymous ? 401 : 403;
    expect((await context.get('/api/technician/workers')).status()).toBe(denied);
    expect((await context.post('/api/technician/workers', { data: workerData('Forbidden') })).status()).toBe(denied);
    expect((await context.patch(`/api/technician/workers/${workerA}`, { data: { ...workerData('Forbidden'), updatedAt: (await workerRow(workerA)).updatedAt } })).status()).toBe(denied);
  }
  await anonymous.dispose();
  for (const data of [{ ...workerData('Invalid'), name: '' }, { ...workerData('Invalid'), specialization: 'UNKNOWN' }, { ...workerData('Invalid'), role: 'ADMIN' }, { ...workerData('Invalid'), password: 'no-login' }]) expect((await head.post('/api/technician/workers', { data })).status()).toBe(400);
  expect((await head.get('/api/technician/workers?page=NaN')).status()).toBe(400);
  await prisma.user.update({ where: { id: headId }, data: { accountStatus: 'INACTIVE' } });
  try { expect((await head.get('/api/technician/workers')).status()).toBe(403); } finally { await prisma.user.update({ where: { id: headId }, data: { accountStatus: 'ACTIVE' } }); }
  expect(await prisma.user.count()).toBe(users);
});

test('only the head records multiple available workers after relay and admins see the complete details', async () => {
  directoryTask = await submit();
  expect((await choose(directoryTask, [workerA], (await prisma.maintenanceRequest.findUniqueOrThrow({ where: { id: directoryTask } })).updatedAt.toISOString())).status()).toBe(404);
  await approve(directoryTask);
  const version = await taskVersion(directoryTask);
  expect((await admin.put(`/api/technician/tasks/${directoryTask}/workers`, { data: { workerIds: [workerA], updatedAt: version } })).status()).toBe(403);
  expect((await other.put(`/api/technician/tasks/${directoryTask}/workers`, { data: { workerIds: [workerA], updatedAt: version } })).status()).toBe(403);
  expect((await choose(legacyId, [workerA], version)).status()).toBe(404);
  expect((await choose(directoryTask, [workerA, workerA], version)).status()).toBe(400);
  expect((await choose(directoryTask, ['missing-worker'], version)).status()).toBe(404);
  expect((await choose(directoryTask, [workerA, workerC], version)).status()).toBe(409);
  expect(await prisma.taskWorkerAssignment.count({ where: { requestId: directoryTask } })).toBe(0);
  expect((await choose(directoryTask, [workerA, workerB], version)).status()).toBe(200);
  const data = await (await head.get(`/api/technician/tasks/${directoryTask}`)).json(); expect(data.assignedToId).toBe(headId); expect(data.workerAssignments).toHaveLength(2);
  expect((await workerRow(workerA)).availability).toBe('BUSY'); expect((await workerRow(workerB)).availability).toBe('BUSY');
  const pending = await submit(); const list = await (await admin.get('/api/admin/assignments?type=approved&limit=50')).json();
  expect(list.requests.some((row: { id: string }) => row.id === pending)).toBe(false);
  const listed = list.requests.find((row: { id: string }) => row.id === directoryTask); expect(listed.workerAssignments).toHaveLength(2); expect(listed.workerAssignments[0].contactNumber).toBe('09123456789');
  const detail = await (await admin.get(`/api/admin/requests/${directoryTask}`)).json(); expect(detail.workerAssignments).toHaveLength(2);
});

test('busy workers cannot be double booked, including concurrent selections on different tasks', async () => {
  const first = await relayNewTask(), second = await relayNewTask();
  expect((await choose(first, [workerA])).status()).toBe(409);
  const free = await addWorker('Concurrent'); const versions = await Promise.all([taskVersion(first), taskVersion(second)]);
  const results = await Promise.all([choose(first, [free], versions[0]), choose(second, [free], versions[1])]);
  expect(results.map(result => result.status()).sort()).toEqual([200, 409]);
  expect(await prisma.taskWorkerAssignment.count({ where: { workerId: free, releasedAt: null, request: { status: { in: ['ONGOING', 'ON_HOLD'] } } } })).toBe(1);
});

test('worker removal releases availability, stale edits fail, and old details/history survive directory edits', async () => {
  const before = await prisma.taskWorkerAssignment.findFirstOrThrow({ where: { workerId: workerA, requestId: directoryTask } });
  const oldVersion = await taskVersion(directoryTask);
  expect((await choose(directoryTask, [workerB], oldVersion)).status()).toBe(200);
  expect((await choose(directoryTask, [workerA], oldVersion)).status()).toBe(409);
  expect((await workerRow(workerA)).availability).toBe('AVAILABLE');
  const row = await workerRow(workerA);
  const changed = { ...workerData('A edited'), contactNumber: '09999999999', updatedAt: row.updatedAt };
  expect((await head.patch(`/api/technician/workers/${workerA}`, { data: changed })).status()).toBe(200);
  expect((await head.patch(`/api/technician/workers/${workerA}`, { data: changed })).status()).toBe(409);
  const historical = await prisma.taskWorkerAssignment.findUniqueOrThrow({ where: { id: before.id } }); expect(historical.workerName).toBe(before.workerName); expect(historical.contactNumber).toBe(before.contactNumber); expect(historical.releasedAt).not.toBeNull();
  const busy = await workerRow(workerB);
  expect((await head.patch(`/api/technician/workers/${workerB}`, { data: { ...workerData('B'), isArchived: true, updatedAt: busy.updatedAt } })).status()).toBe(409);
  expect((await head.patch(`/api/technician/tasks/${directoryTask}`, { data: { action: 'update', status: 'ON_HOLD', repairNotes: 'Head coordinating workers externally.' } })).status()).toBe(200);
  expect((await workerRow(workerB)).availability).toBe('BUSY');
});

test('worker directory and multi-worker picker work on mobile; admin dashboard/table and task summaries match the revised flow', async ({ browser }) => {
  const page = await browser.newPage({ baseURL, storageState: await head.storageState(), viewport: { width: 1440, height: 1000 } });
  await page.goto('/technician/dashboard'); await page.getByRole('link', { name: 'Workers', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Workers', exact: true })).toBeVisible();
  const browserName = workerName('Browser'); await page.getByLabel('Worker name', { exact: true }).fill(browserName); await page.getByLabel('Contact number', { exact: true }).fill('09111111111');
  await page.getByLabel('Specialization', { exact: true }).selectOption('PLUMBING'); await page.getByRole('button', { name: 'Add worker record', exact: true }).click();
  await expect(page.getByText('Worker record added. No login account was created.', { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 }); await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/workers-directory-mobile.png', fullPage: true });
  await page.goto(`/technician/tasks/${directoryTask}`); await page.getByRole('button', { name: 'Choose workers', exact: true }).click();
  await page.getByRole('checkbox', { name: new RegExp(browserName) }).check();
  await expect(page.getByRole('checkbox', { name: new RegExp(workerName('Unavailable')) })).toBeDisabled();
  await page.getByRole('button', { name: 'Save selected workers', exact: true }).click(); await expect(page.getByRole('status')).toContainText('Worker selection recorded');
  const task = await (await head.get(`/api/technician/tasks/${directoryTask}`)).json(); expect(task.workerAssignments.filter((row: { releasedAt: string | null }) => !row.releasedAt)).toHaveLength(2);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); await page.screenshot({ path: 'test-results/task-workers-mobile.png', fullPage: true });
  const adminPage = await browser.newPage({ baseURL, storageState: await admin.storageState(), viewport: { width: 1440, height: 1000 } });
  await adminPage.goto('/admin/dashboard'); await expect(adminPage.getByText('Priority Queue', { exact: true })).toHaveCount(0); await expect(adminPage.getByText('Maintenance Requests — Last 7 Days', { exact: true })).toBeVisible(); await adminPage.screenshot({ path: 'test-results/admin-dashboard-workers.png', fullPage: true });
  await adminPage.goto('/admin/requests'); await expect(adminPage.getByRole('columnheader', { name: 'Date of Request', exact: true })).toBeVisible();
  const headers = await adminPage.getByRole('columnheader').allTextContents(); expect(headers.slice(2, 8).map(text => text.trim())).toEqual(['Date of Request', 'Requesting Party', 'Work Location', 'Description of work/repair', 'Requested Priority', 'Photo Evidence']);
  await adminPage.goto('/admin/assignments');
  const code = (await prisma.maintenanceRequest.findUniqueOrThrow({ where: { id: directoryTask } })).requestCode;
  const card = adminPage.getByRole('article', { name: `Approved task ${code}` }); await expect(card).toContainText(browserName); await expect(card).toContainText('09111111111'); await expect(card).toContainText('PLUMBING');
  await adminPage.setViewportSize({ width: 390, height: 844 }); await expect.poll(() => adminPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); await adminPage.screenshot({ path: 'test-results/admin-assignments-workers-mobile.png', fullPage: true });
  await page.close(); await adminPage.close();
});

test('completion frees workers automatically without erasing recorded selections and archiving retains history', async () => {
  expect((await head.patch(`/api/technician/tasks/${directoryTask}`, { data: { action: 'complete' } })).status()).toBe(200);
  expect((await workerRow(workerB)).availability).toBe('AVAILABLE');
  const records = await prisma.taskWorkerAssignment.findMany({ where: { requestId: directoryTask } }); expect(records.length).toBeGreaterThanOrEqual(3);
  expect((await choose(directoryTask, [])).status()).toBe(409);
  const worker = await workerRow(workerB);
  expect((await head.patch(`/api/technician/workers/${workerB}`, { data: { ...workerData('B'), isArchived: true, updatedAt: worker.updatedAt } })).status()).toBe(200);
  expect((await workerRow(workerB)).availability).toBe('ARCHIVED');
  expect(await prisma.taskWorkerAssignment.findMany({ where: { requestId: directoryTask } })).toEqual(records);
});
