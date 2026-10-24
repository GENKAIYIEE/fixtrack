import { test, expect, request as requests, APIRequestContext } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import prisma from '../src/lib/prisma';
import { assertLocalTestEnvironment } from './local-safety';
assertLocalTestEnvironment();test.describe.configure({mode:'serial'});
const baseURL=process.env.NEXTAUTH_URL || 'http://localhost:3100',marker=randomUUID(),password=`Synthetic-${randomUUID()}!`;
type Role='ADMIN'|'STUDENT'|'TECHNICIAN';
const identities={} as Record<Role,{id:string;email:string;context:APIRequestContext}>;
async function login(email:string,pass=password) {
 const context=await requests.newContext({baseURL});const csrf=await(await context.get('/api/auth/csrf')).json();
 await context.post('/api/auth/callback/credentials',{form:{csrfToken:csrf.csrfToken,email,password:pass,json:'true',callbackUrl:baseURL}});return context;
}
test.beforeAll(async()=>{
 const passwordHash=await bcrypt.hash(password,4);
 for(const role of ['ADMIN','STUDENT','TECHNICIAN'] as const){
  const email=`access-${role}-${marker}@example.test`;
  const user=await prisma.user.create({data:{email,passwordHash,firstName:'Synthetic',lastName:role,idNumber:`access-${role}-${marker}`,role,accountStatus:'ACTIVE'}});
  const context=await login(email);expect((await(await context.get('/api/auth/session')).json()).user?.role).toBe(role);
  identities[role]={id:user.id,email,context};
 }
});
const reads=['/api/user/dashboard','/api/user/history','/api/user/profile','/api/user/requests','/api/user/requests/unknown','/api/user/requests/unknown.png',
 '/api/notifications','/api/users','/api/admin/analytics','/api/admin/assignments?type=unassigned','/api/admin/audit-logs','/api/admin/diagnostics/auth',
 '/api/admin/requests','/api/admin/requests/unknown','/api/admin/settings','/api/admin/technicians','/api/admin/technicians/unknown','/api/admin/users',
 '/api/admin/users/unknown','/api/admin/users/unknown/id-photo','/api/technician/dashboard','/api/technician/history','/api/technician/tasks',
 '/api/technician/tasks/unknown','/api/technician/profile','/api/technician/badges','/api/tasks','/api/requests'];
const writes:[string,string][]=[['PATCH','/api/admin/diagnostics/auth'],['POST','/api/admin/users/unknown/verification'],['POST','/api/user/requests'],['PATCH','/api/user/profile'],['POST','/api/user/profile/password'],['DELETE','/api/user/requests/unknown'],
 ['POST','/api/notifications/mark-read'],['POST','/api/notifications/mark-all-read'],['DELETE','/api/notifications/unknown'],['DELETE','/api/notifications/delete-read'],
 ['POST','/api/admin/assignments'],['PATCH','/api/admin/requests'],['PATCH','/api/admin/requests/unknown'],['DELETE','/api/admin/requests/unknown'],
 ['POST','/api/admin/settings'],['POST','/api/admin/users'],['PUT','/api/admin/users/unknown'],['PATCH','/api/admin/users/unknown'],['POST','/api/admin/technicians'],
 ['PATCH','/api/technician/tasks/unknown'],['PATCH','/api/technician/profile'],['POST','/api/technician/profile/change-password'],['POST','/api/tasks'],['POST','/api/requests']];

test('pending and declined/inactive sessions of every role cannot read or mutate protected APIs',async()=>{
 for(const status of ['PENDING','INACTIVE','REJECTED'] as const)for(const role of ['ADMIN','STUDENT','TECHNICIAN'] as const){
  const identity=identities[role];await prisma.user.update({where:{id:identity.id},data:{accountStatus:status}});
  const snapshot={users:await prisma.user.count(),requests:await prisma.maintenanceRequest.count(),notifications:await prisma.notification.count(),audit:await prisma.auditLog.count()};
  try{
   for(const path of reads){const response=await identity.context.get(path);expect(response.status(),`${status} ${role} GET ${path}`).toBe(403);expect((await response.json()).error).toContain(status==='PENDING'?'pending':status==='REJECTED'?'rejected':'not been approved');}
   for(const [method,path]of writes)expect((await identity.context.fetch(path,{method,data:{}})).status(),`${status} ${role} ${method} ${path}`).toBe(403);
   expect({users:await prisma.user.count(),requests:await prisma.maintenanceRequest.count(),notifications:await prisma.notification.count(),audit:await prisma.auditLog.count()}).toEqual(snapshot);
  }finally{await prisma.user.update({where:{id:identity.id},data:{accountStatus:'ACTIVE'}});}
 }
});

test('blocked page navigation shows current account status and sign-out still works',async({browser})=>{
 const identity=identities.STUDENT;await prisma.user.update({where:{id:identity.id},data:{accountStatus:'PENDING'}});
 const page=await browser.newPage({baseURL,storageState:await identity.context.storageState()});
 try{
  for(const path of ['/dashboard','/history','/notifications','/profile','/requests/new']){
   await page.goto(path);await expect(page).toHaveURL(/\/account-status$/);await expect(page.getByRole('heading',{name:'Account awaiting administrator review'})).toBeVisible();
  }
  await prisma.user.update({where:{id:identity.id},data:{accountStatus:'INACTIVE'}});await page.reload();
  await expect(page.getByRole('heading',{name:'Account not approved or inactive'})).toBeVisible();
  await page.getByRole('button',{name:'Sign out and return to login'}).click();await expect(page).toHaveURL(/\/login$/);
 }finally{await prisma.user.update({where:{id:identity.id},data:{accountStatus:'ACTIVE'}});await page.close();}
});

test('status is explained only after valid credentials and no blocked login session is issued',async({browser})=>{
 const identity=identities.STUDENT;const page=await browser.newPage({baseURL});
 try{
  for(const status of ['PENDING','INACTIVE'] as const){
   await prisma.user.update({where:{id:identity.id},data:{accountStatus:status}});await page.goto('/login');
   await page.getByLabel('Email Address',{exact:true}).fill(identity.email);await page.getByLabel('Password',{exact:true}).fill(password);
   await page.getByRole('button',{name:/^Login\b/i}).click();
   await expect(page.getByText(status==='PENDING'?'Your account is pending administrator review. You cannot sign in until it is approved.':'Your account has not been approved or has been deactivated. Please contact the administrator.',{exact:true})).toBeVisible();
   const denied=await login(identity.email);expect((await(await denied.get('/api/auth/session')).json()).user).toBeUndefined();await denied.dispose();
  }
  const denied=await login(identity.email,'Incorrect-synthetic-password');expect((await(await denied.get('/api/auth/session')).json()).user).toBeUndefined();await denied.dispose();
 }finally{await prisma.user.update({where:{id:identity.id},data:{accountStatus:'ACTIVE'}});await page.close();}
});

test('approved roles still work; changing a role revokes old-token privileges; private IDs remain admin-only',async()=>{
 expect((await identities.STUDENT.context.get('/api/user/dashboard')).status()).toBe(200);
 expect((await identities.ADMIN.context.get('/api/admin/users')).status()).toBe(200);
 expect((await identities.TECHNICIAN.context.get('/api/technician/profile')).status()).toBe(200);
 expect((await identities.STUDENT.context.get('/api/users')).status()).toBe(403);
 expect((await identities.STUDENT.context.get(`/api/admin/users/${identities.STUDENT.id}/id-photo`)).status()).toBe(403);
 expect((await identities.STUDENT.context.get(`/api/admin/users/${identities.TECHNICIAN.id}/id-photo`)).status()).toBe(403);
 await prisma.user.update({where:{id:identities.ADMIN.id},data:{role:'STUDENT'}});
 try{expect((await identities.ADMIN.context.get('/api/admin/users')).status()).toBe(403);expect((await identities.ADMIN.context.get('/api/users')).status()).toBe(403);expect((await identities.ADMIN.context.get('/api/user/profile')).status()).toBe(200);}
 finally{await prisma.user.update({where:{id:identities.ADMIN.id},data:{role:'ADMIN'}});}
 const response=await identities.STUDENT.context.post('/api/auth/login',{data:{userId:identities.ADMIN.id}});expect(response.status()).toBe(200);expect((await response.json()).role).toBe('STUDENT');
});

test.afterAll(async()=>{for(const identity of Object.values(identities))await identity.context.dispose();await prisma.$disconnect();});
