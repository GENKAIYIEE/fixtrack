import { test, expect, request as requests, APIRequestContext } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import bcrypt from 'bcryptjs';
import prisma from '../src/lib/prisma';
import { startRegistrationServicesStub } from './registration-services-stub';
import { assertLocalTestEnvironment } from './local-safety';
assertLocalTestEnvironment();test.describe.configure({mode:'serial'});
const baseURL=process.env.NEXTAUTH_URL || 'http://localhost:3100',password=`Synthetic-${randomUUID()}!`;
let stub:Awaited<ReturnType<typeof startRegistrationServicesStub>>,admin:APIRequestContext,admin2:APIRequestContext,student:APIRequestContext,anonymous:APIRequestContext;
let adminId:string,passwordHash:string;
async function login(email:string,pass=password){const context=await requests.newContext({baseURL});const csrf=await(await context.get('/api/auth/csrf')).json();await context.post('/api/auth/callback/credentials',{form:{csrfToken:csrf.csrfToken,email,password:pass,json:'true',callbackUrl:baseURL}});return context;}
async function create(role:'ADMIN'|'STUDENT'|'TECHNICIAN',accountStatus:'PENDING'|'ACTIVE'='PENDING',withId=true){
 const id=randomUUID(),path=withId?`${randomUUID()}/id.jpg`:null;
 if(path)stub.objects.set(path,{data:readFileSync('tests/fixtures/evidence.jpeg'),type:'image/jpeg'});
 return prisma.user.create({data:{id,email:`verification-${id}@example.test`,firstName:'Verify',lastName:id.slice(0,8),idNumber:`verify-${id}`,department:'BSIT',role,specialization:role==='TECHNICIAN'?'PLUMBING':null,accountStatus,passwordHash,registrationIdPath:path}});
}
const endpoint=(id:string)=>`/api/admin/users/${id}/verification`;
const decide=(context:APIRequestContext,id:string,action:string,reason='')=>context.post(endpoint(id),{data:{action,reason}});
const audits=(id:string)=>prisma.auditLog.findMany({where:{affectedRecordId:id,details:{startsWith:'Account verification '}}});
test.beforeAll(async()=>{
 stub=await startRegistrationServicesStub();passwordHash=await bcrypt.hash(password,4);
 const a=await create('ADMIN','ACTIVE',false),b=await create('ADMIN','ACTIVE',false),s=await create('STUDENT','ACTIVE',false);adminId=a.id;
 admin=await login(a.email);admin2=await login(b.email);student=await login(s.email);anonymous=await requests.newContext({baseURL});
});

test('user table omits ID Number and centers department beneath the role without changing stored identifiers', async ({browser}) => {
 const user=await create('STUDENT','ACTIVE',false);
 const page=await browser.newPage({baseURL,storageState:await admin.storageState(),viewport:{width:1440,height:1000}});
 await page.goto('/admin/users');await page.getByPlaceholder('Search users by name, email, or ID...').fill(user.email);
 const table=page.getByRole('table');await expect(table.getByRole('columnheader',{name:'ID Number',exact:true})).toHaveCount(0);
 await expect(table.getByRole('columnheader')).toHaveCount(6);
 const row=table.getByRole('row').filter({hasText:user.email});await expect(row).toBeVisible();await expect(row).not.toContainText(user.idNumber!);
 const dept=row.getByText('BSIT',{exact:true});
 await expect(dept).toBeVisible();
 for(const width of [1440,390]) {
  await page.setViewportSize({width,height:1000});
  await page.evaluate(()=>document.fonts.ready.then(()=>undefined));
  await expect.poll(()=>row.evaluate(element=>{
    const wrapper=element.children[2].firstElementChild!;
    const r=wrapper.children[0].getBoundingClientRect(),d=wrapper.children[1].getBoundingClientRect();
    return Math.abs((r.x+r.width/2)-(d.x+d.width/2));
  })).toBeLessThanOrEqual(1);
  expect(await row.evaluate(element=>{
    const wrapper=element.children[2].firstElementChild!;
    return wrapper.children[1].getBoundingClientRect().y>wrapper.children[0].getBoundingClientRect().y;
  })).toBe(true);await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:'test-results/user-table-centered-no-id.png'});await page.close();
 expect((await prisma.user.findUniqueOrThrow({where:{id:user.id}})).idNumber).toBe(user.idNumber);
});

test('pending queue and private ID review are administrator-only and usable on mobile',async({browser})=>{
 const user=await create('STUDENT');const response=await admin.get('/api/admin/users?status=PENDING&limit=100');expect(response.status()).toBe(200);
 const listed=(await response.json()).users.find((row:{id:string})=>row.id===user.id);expect(listed.hasRegistrationId).toBe(true);expect(listed.registrationIdPath).toBeUndefined();expect(listed.passwordHash).toBeUndefined();expect(listed.idNumber).toBe(user.idNumber);
 expect((await student.get('/api/admin/users?status=PENDING')).status()).toBe(403);expect((await anonymous.get(endpoint(user.id))).status()).toBe(401);
 for(const context of [student,anonymous])expect((await context.get(`/api/admin/users/${user.id}/id-photo`)).status()).toBe(context===student?403:401);
 const page=await browser.newPage({baseURL,storageState:await admin.storageState(),viewport:{width:390,height:844}});await page.goto('/admin/users#account-verification');
 const card=page.getByRole('article',{name:`Verification for ${user.email}`});await expect(card).toBeVisible();await expect(card).toContainText(user.idNumber!);await card.getByRole('button',{name:'Review registration'}).click();
 const dialog=page.getByRole('dialog');await dialog.getByRole('button',{name:'Review ID photo',exact:true}).click();await expect(dialog.getByAltText('Submitted valid ID for administrator review')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);await page.close();
 const denied=await browser.newPage({baseURL,storageState:await student.storageState()});await denied.goto('/admin/users');await expect(denied).toHaveURL(/\/dashboard$/);await denied.close();
});

test('administrator approves with one audit/notification, retained ID and unchanged role; owner can sign in',async({browser})=>{
 const user=await create('STUDENT');const page=await browser.newPage({baseURL,storageState:await admin.storageState()});await page.goto('/admin/users');
 await page.getByRole('article',{name:`Verification for ${user.email}`}).getByRole('button',{name:'Review registration'}).click();
 await page.getByRole('dialog').getByRole('button',{name:'Approve account',exact:true}).click();await page.getByRole('button',{name:'Confirm approval',exact:true}).click();
 await expect(page.getByText('Account approved. Existing role and permissions were preserved.',{exact:true})).toBeVisible();await page.close();
 const saved=await prisma.user.findUniqueOrThrow({where:{id:user.id}});expect(saved.accountStatus).toBe('ACTIVE');expect(saved.role).toBe('STUDENT');expect(saved.registrationIdPath).toBe(user.registrationIdPath);expect(stub.objects.has(user.registrationIdPath!)).toBe(true);
 const history=await audits(user.id);expect(history).toHaveLength(1);expect(history[0].userId).toBe(adminId);expect(history[0].details).toBe('Account verification APPROVED');expect(history[0].createdAt).toBeInstanceOf(Date);
 expect(await prisma.notification.count({where:{userId:user.id,title:'Account approved'}})).toBe(1);
 expect((await decide(admin,user.id,'APPROVE')).status()).toBe(409);expect((await decide(admin,user.id,'REJECT')).status()).toBe(409);expect(await audits(user.id)).toHaveLength(1);
 const owner=await login(user.email);expect((await(await owner.get('/api/auth/session')).json()).user.role).toBe('STUDENT');expect((await owner.get('/api/user/dashboard')).status()).toBe(200);expect((await owner.get('/api/admin/users')).status()).toBe(403);const csrf=await(await owner.get('/api/auth/csrf')).json();await owner.post('/api/auth/signout',{form:{csrfToken:csrf.csrfToken,json:'true',callbackUrl:baseURL}});expect((await(await owner.get('/api/auth/session')).json()).user).toBeUndefined();await owner.dispose();
 const again=await login(user.email);expect((await(await again.get('/api/auth/session')).json()).user.role).toBe('STUDENT');await again.dispose();
});

test('administrator rejects with a user-facing reason; stale sessions and later sign-ins remain blocked',async({browser})=>{
 const user=await create('STUDENT','ACTIVE');const stale=await login(user.email);await prisma.user.update({where:{id:user.id},data:{accountStatus:'PENDING'}});
 const reason='ID number does not match. Please contact the administrator.';
 const page=await browser.newPage({baseURL,storageState:await admin.storageState()});await page.goto('/admin/users');await page.getByRole('article',{name:`Verification for ${user.email}`}).getByRole('button',{name:'Review registration'}).click();
 await page.getByRole('dialog').getByRole('button',{name:'Reject account',exact:true}).click();await page.getByLabel('Reason shown to the user (optional)').fill(reason);await page.getByRole('button',{name:'Confirm rejection',exact:true}).click();
 await expect(page.getByText('Account rejected. Its submitted ID remains private and retained.',{exact:true})).toBeVisible();await page.getByLabel('Verification status',{exact:true}).selectOption('REJECTED');await expect(page.getByRole('article',{name:`Verification for ${user.email}`})).toContainText(reason);await page.close();
 const saved=await prisma.user.findUniqueOrThrow({where:{id:user.id}});expect(saved.accountStatus).toBe('REJECTED');expect(saved.verificationRejectionReason).toBe(reason);expect(saved.role).toBe('STUDENT');expect(stub.objects.has(user.registrationIdPath!)).toBe(true);expect(await audits(user.id)).toHaveLength(1);
 const denied=await stale.get('/api/user/dashboard');expect(denied.status()).toBe(403);expect((await denied.json()).error).toContain(reason);
 const blocked=await browser.newPage({baseURL,storageState:await stale.storageState()});await blocked.goto('/dashboard');await expect(blocked).toHaveURL(/\/account-status$/);await expect(blocked.getByText(`Your registration was rejected by an administrator. Protected FixTrack features are unavailable. Reason: ${reason}`,{exact:true})).toBeVisible();await blocked.getByRole('button',{name:'Sign out and return to login'}).click();await expect(blocked).toHaveURL(/\/login$/);
 await blocked.getByLabel('Email Address',{exact:true}).fill(user.email);await blocked.getByLabel('Password',{exact:true}).fill(password);await blocked.getByRole('button',{name:/^Login\b/i}).click();await expect(blocked.getByText(`Your registration was rejected by an administrator. Reason: ${reason}`,{exact:true})).toBeVisible();await blocked.close();await stale.dispose();
 const deniedAgain=await login(user.email);expect((await(await deniedAgain.get('/api/auth/session')).json()).user).toBeUndefined();await deniedAgain.dispose();
 const wrong=await login(user.email,'Wrong-password');const error=await(await wrong.get('/api/auth/session')).json();expect(error.user).toBeUndefined();await wrong.dispose();
 expect((await decide(admin,user.id,'APPROVE')).status()).toBe(409);expect((await admin.patch(`/api/admin/users/${user.id}`,{data:{accountStatus:'ACTIVE'}})).status()).toBe(409);
});

test('validation, self-review, direct API and legacy edit paths cannot bypass a verification decision',async()=>{
 const user=await create('STUDENT'),legacy=await create('STUDENT','PENDING',false);
 for(const context of [anonymous,student])expect((await decide(context,user.id,'APPROVE')).status()).toBe(context===student?403:401);
 expect((await decide(admin,adminId,'APPROVE')).status()).toBe(403);
 expect((await admin.post(endpoint(user.id),{data:{action:'APPROVE',role:'ADMIN'}})).status()).toBe(400);
 for(const data of [{action:'ACTIVE'},{action:['APPROVE']},{action:'REJECT',reason:'x'.repeat(301)},{action:'REJECT',reason:3}])expect((await admin.post(endpoint(user.id),{data})).status()).toBe(400);
 expect((await admin.post(endpoint(user.id),{data:'invalid-json',headers:{'Content-Type':'application/json'}})).status()).toBe(400);
 expect((await decide(admin,'unknown-id','APPROVE')).status()).toBe(404);expect((await decide(admin,'invalid%20identifier','APPROVE')).status()).toBe(400);
 expect((await decide(admin,legacy.id,'APPROVE')).status()).toBe(409);
 expect((await admin.put(`/api/admin/users/${user.id}`,{data:{firstName:user.firstName,lastName:user.lastName,email:user.email,idNumber:user.idNumber,role:user.role,accountStatus:'ACTIVE'}})).status()).toBe(409);
 // The previous PATCH compatibility path must delegate to the same one-decision transaction.
 expect((await admin.patch(`/api/admin/users/${user.id}`,{data:{accountStatus:'ACTIVE'}})).status()).toBe(200);expect(await audits(user.id)).toHaveLength(1);
 expect((await admin.patch(`/api/admin/users/${user.id}`,{data:{accountStatus:'PENDING'}})).status()).toBe(409);
 const reject=await create('STUDENT');expect((await admin.patch(`/api/admin/users/${reject.id}`,{data:{accountStatus:'INACTIVE'}})).status()).toBe(200);expect((await prisma.user.findUniqueOrThrow({where:{id:reject.id}})).accountStatus).toBe('REJECTED');
 expect((await prisma.user.findUniqueOrThrow({where:{id:legacy.id}})).accountStatus).toBe('PENDING');
});

test('conflicting concurrent administrators commit exactly one decision and preserve identity/role',async()=>{
 const user=await create('STUDENT');const responses=await Promise.all([decide(admin,user.id,'APPROVE'),decide(admin2,user.id,'REJECT','ID is not clear.')]);expect(responses.map(r=>r.status()).sort()).toEqual([200,409]);
 const saved=await prisma.user.findUniqueOrThrow({where:{id:user.id}});expect(['ACTIVE','REJECTED']).toContain(saved.accountStatus);expect(saved.role).toBe(user.role);expect(saved.registrationIdPath).toBe(user.registrationIdPath);expect(await audits(user.id)).toHaveLength(1);expect(await prisma.notification.count({where:{userId:user.id}})).toBe(1);
});

test('stale administrator privileges cannot review or decide; pending state survives denial',async()=>{
 const user=await create('STUDENT');await prisma.user.update({where:{id:adminId},data:{accountStatus:'INACTIVE'}});
 try{expect((await decide(admin,user.id,'APPROVE')).status()).toBe(403);expect((await admin.get(`/api/admin/users/${user.id}/id-photo`)).status()).toBe(403);}finally{await prisma.user.update({where:{id:adminId},data:{accountStatus:'ACTIVE'}});}
 await prisma.user.update({where:{id:adminId},data:{role:'STUDENT'}});try{expect((await decide(admin,user.id,'REJECT')).status()).toBe(403);}finally{await prisma.user.update({where:{id:adminId},data:{role:'ADMIN'}});}
 expect((await prisma.user.findUniqueOrThrow({where:{id:user.id}})).accountStatus).toBe('PENDING');expect(await audits(user.id)).toHaveLength(0);
});


test('technician edit and diagnostic activation paths cannot bypass or reopen verification',async()=>{
 const tech=await create('TECHNICIAN');
 const body={firstName:tech.firstName,lastName:tech.lastName,email:tech.email,idNumber:tech.idNumber,specialization:'PLUMBING',accountStatus:'ACTIVE'};
 expect((await admin.put(`/api/admin/technicians/${tech.id}`,{data:body})).status()).toBe(409);
 expect((await admin.patch('/api/admin/diagnostics/auth',{data:{action:'activate',ids:[tech.id]}})).status()).toBe(409);
 expect((await prisma.user.findUniqueOrThrow({where:{id:tech.id}})).accountStatus).toBe('PENDING');
 expect((await admin.patch(`/api/admin/technicians/${tech.id}`,{data:{accountStatus:'ACTIVE'}})).status()).toBe(200);expect(await audits(tech.id)).toHaveLength(1);
 const approved=await prisma.user.findUniqueOrThrow({where:{id:tech.id}});expect(approved.role).toBe('TECHNICIAN');
 const context=await login(tech.email);expect((await context.get('/api/technician/tasks')).status()).toBe(403);await context.dispose();
 const rejected=await create('TECHNICIAN');expect((await decide(admin,rejected.id,'REJECT')).status()).toBe(200);
 expect((await admin.patch(`/api/admin/technicians/${rejected.id}`,{data:{accountStatus:'ACTIVE'}})).status()).toBe(409);
 expect((await admin.put(`/api/admin/technicians/${rejected.id}`,{data:{...body,email:rejected.email,idNumber:rejected.idNumber}})).status()).toBe(409);
 expect((await prisma.user.findUniqueOrThrow({where:{id:rejected.id}})).verificationRejectionReason).toBeNull();
});

test('verification interface has recoverable loading/error and empty states',async({browser})=>{
 const page=await browser.newPage({baseURL,storageState:await admin.storageState()});let fail=true;
 await page.route('**/api/admin/users?status=PENDING&page=1&limit=10',route=>route.fulfill({status:fail?503:200,contentType:'application/json',body:JSON.stringify(fail?{error:'Synthetic temporary verification failure'}:{users:[],pagination:{totalPages:0}})}));
 await page.goto('/admin/users');await expect(page.getByRole('region',{name:'Account verification'}).getByRole('alert')).toContainText('Synthetic temporary verification failure');fail=false;await page.getByRole('button',{name:'Refresh verification'}).click();await expect(page.getByText('No pending accounts to display.',{exact:true})).toBeVisible();await page.close();
});

test.afterAll(async()=>{for(const context of [admin,admin2,student,anonymous])await context?.dispose();await stub?.close();await prisma.$disconnect();});
