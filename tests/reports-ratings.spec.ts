import { test, expect, request as requests, APIRequestContext } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import bcrypt from 'bcryptjs';
import prisma from '../src/lib/prisma';
import { assertLocalTestEnvironment } from './local-safety';
import { startRegistrationServicesStub } from './registration-services-stub';
assertLocalTestEnvironment();test.describe.configure({mode:'serial'});
const marker=randomUUID(),password=`Synthetic-${randomUUID()}!`,baseURL=process.env.NEXTAUTH_URL || 'http://localhost:3100';
let owner:APIRequestContext,admin:APIRequestContext,other:APIRequestContext,head:APIRequestContext,anon:APIRequestContext;
let ownerId:string,adminId:string,headId:string,done:string,pending:string,workerA:string,workerB:string,workerC:string;
const location=`Room 101 ${marker}`,headers={Origin:baseURL};
async function login(email:string){const c=await requests.newContext({baseURL});const csrf=await(await c.get('/api/auth/csrf')).json();await c.post('/api/auth/callback/credentials',{form:{csrfToken:csrf.csrfToken,email,password,json:'true',callbackUrl:baseURL}});expect((await(await c.get('/api/auth/session')).json()).user?.email).toBe(email);return c;}
async function rate(c:APIRequestContext,id:string,data:unknown,origin=baseURL){return c.post(`/api/requests/${id}/ratings`,{data,headers:{Origin:origin}});}
const payload={requestScore:4,workers:[] as {workerId:string;score:number}[]};
test.beforeAll(async()=>{
 const passwordHash=await bcrypt.hash(password,4);
 const user=async(role:'ADMIN'|'TECHNICIAN'|'STUDENT',tag:string)=>prisma.user.create({data:{email:`ratings-${tag}-${marker}@example.test`,firstName:tag,lastName:'Synthetic',role,accountStatus:'ACTIVE',passwordHash}});
 const a=await user('ADMIN','Admin'),s=await user('STUDENT','Requester'),h=await user('TECHNICIAN','Head'),o=await user('STUDENT','Other');ownerId=s.id;adminId=a.id;headId=h.id;
 [owner,admin,head,other,anon]=await Promise.all([login(s.email),login(a.email),login(h.email),login(o.email),requests.newContext({baseURL})]);
 const now=new Date(),createdAt=new Date(now.getTime()-48*3600000),completedAt=new Date(now.getTime()-3600000);
 const create=async(status:'PENDING'|'COMPLETED',loc:string,old=false)=>prisma.maintenanceRequest.create({data:{requestCode:`RATE-${randomUUID()}`,submittedById:s.id,description:'Synthetic repair only',urgencyLevel:'NORMAL',status,workLocation:loc,assignedToId:h.id,createdAt:old?new Date(now.getTime()-100*86400000):createdAt,...(status==='COMPLETED'?{completedAt}:{})}});
 done=(await create('COMPLETED',location)).id;await create('COMPLETED',`  ROOM   101 ${marker}  `);pending=(await create('PENDING',location)).id;
 await create('PENDING',`Room 202 ${marker}`);await create('PENDING',`Room 202 ${marker}`);await create('COMPLETED',`Old Room ${marker}`,true);await create('COMPLETED','');
 const worker=async(name:string)=>prisma.maintenanceWorker.create({data:{name,contactNumber:'09000000000',createdById:h.id}});
 const aWorker=await worker(`Worker A ${marker}`),bWorker=await worker(`Worker B ${marker}`),cWorker=await worker(`Worker C ${marker}`);workerA=aWorker.id;workerB=bWorker.id;workerC=cWorker.id;
 for(const w of [aWorker,bWorker,cWorker])await prisma.taskWorkerAssignment.create({data:{requestId:done,workerId:w.id,recordedById:h.id,workerName:w.name,contactNumber:w.contactNumber,specialization:'GENERAL',...(w.id===workerB?{releasedAt:completedAt}:{})}});
});
test('only an active owner can rate their completed request',async()=>{
 expect((await rate(anon,done,payload)).status()).toBe(401);
 for(const c of [admin,head])expect([401,403]).toContain((await rate(c,done,payload)).status());
 expect((await rate(other,done,payload)).status()).toBe(404);
 expect((await rate(owner,pending,payload)).status()).toBe(409);
 await prisma.user.update({where:{id:ownerId},data:{accountStatus:'INACTIVE'}});try{expect([401,403]).toContain((await rate(owner,done,payload)).status());}finally{await prisma.user.update({where:{id:ownerId},data:{accountStatus:'ACTIVE'}});}
 expect(await prisma.requestRating.count({where:{requestId:done}})).toBe(0);
});
test('rating writes reject cross-origin, malformed scores, duplicate and removed workers',async()=>{
 expect((await rate(owner,done,payload,'https://untrusted.example')).status()).toBe(403);
 for(const score of [0,6,1.5,'5'])expect((await rate(owner,done,{requestScore:score,workers:[]})).status()).toBe(400);
 for(const workers of [[{workerId:workerB,score:3}],[{workerId:'unrelated',score:3}],[{workerId:workerA,score:3},{workerId:workerA,score:5}]])expect((await rate(owner,done,{requestScore:3,workers})).status()).toBe(400);
 expect((await rate(owner,done,{...payload,ratedById:adminId})).status()).toBe(400);
 expect(await prisma.requestRating.count({where:{requestId:done}})).toBe(0);
});
test('request and multiple worker stars save separately and updates do not create duplicate votes',async()=>{
 expect((await rate(owner,done,{requestScore:4,workers:[{workerId:workerA,score:2},{workerId:workerC,score:5}]})).status()).toBe(200);
 expect((await prisma.requestRating.findUniqueOrThrow({where:{requestId:done}})).score).toBe(4);
 expect((await prisma.workerRating.findUniqueOrThrow({where:{requestId_workerId:{requestId:done,workerId:workerA}}})).score).toBe(2);
 await Promise.all([rate(owner,done,{requestScore:3,workers:[{workerId:workerA,score:1}]}),rate(owner,done,{requestScore:5,workers:[{workerId:workerA,score:4}]})].map(async p=>expect((await p).status()).toBe(200)));
 expect(await prisma.requestRating.count({where:{requestId:done}})).toBe(1);expect(await prisma.workerRating.count({where:{requestId:done}})).toBe(2);
 await rate(owner,done,{requestScore:4,workers:[{workerId:workerA,score:2},{workerId:workerC,score:5}]});
});
test('database constraints also reject out-of-range stars',async()=>{
 await expect(prisma.$executeRaw`UPDATE "RequestRating" SET score=6 WHERE "requestId"=${done}`).rejects.toThrow();
 await expect(prisma.$executeRaw`UPDATE "WorkerRating" SET score=0 WHERE "requestId"=${done}`).rejects.toThrow();
});
test('ratings are private to the owner, administrator and receiving technician',async()=>{
 for(const c of [owner,admin,head]){const r=await c.get(`/api/requests/${done}/ratings`);expect(r.status()).toBe(200);const b=await r.json();expect(b.workers).toHaveLength(2);expect(b.workers.some((w:{workerId:string})=>w.workerId===workerB)).toBe(false);expect(r.headers()['cache-control']).toContain('no-store');}
 expect((await other.get(`/api/requests/${done}/ratings`)).status()).toBe(404);expect((await anon.get(`/api/requests/${done}/ratings`)).status()).toBe(401);
});
test('room categories group locations, use correct dates and calculate separate rating averages',async()=>{
 const r=await admin.get(`/api/admin/analytics?range=month&roomSearch=${marker}`);expect(r.status()).toBe(200);const data=await r.json();expect(data.roomReports).toHaveLength(4);
 const report=(key:string)=>data.roomReports.find((v:{key:string})=>v.key===key);
 expect(report('repaired').rows.find((v:{room:string})=>v.room.toLowerCase().includes('101')).value).toBe(2);
 expect(report('reported').rows.find((v:{room:string})=>v.room.toLowerCase().includes('101')).value).toBe(3);
 expect(report('pending').rows[0].room).toContain('202');expect(report('pending').rows[0].value).toBe(2);
 expect(report('slowest').rows[0].room).toContain('Old Room');expect(report('reported').rows.some((v:{room:string})=>v.room.includes('Old Room'))).toBe(false);
 expect(data.ratings.requestAverage).toBe(4);expect(data.ratings.requestCount).toBe(1);
 expect(data.ratings.workers.find((w:{workerId:string})=>w.workerId===workerA).average).toBe(2);expect(data.ratings.workers.find((w:{workerId:string})=>w.workerId===workerC).average).toBe(5);
 expect((await admin.get('/api/admin/analytics?range=invalid')).status()).toBe(400);expect((await owner.get('/api/admin/analytics')).status()).toBe(403);
 const empty=await(await admin.get('/api/admin/analytics?roomSearch=unlikely-no-match-zzzzzz')).json();expect(empty.roomReports.every((r:{rows:unknown[]})=>r.rows.length===0)).toBe(true);
});
test('owner can use accessible five-star controls on mobile and reload saved scores',async({browser})=>{
 const page=await browser.newPage({baseURL,storageState:await owner.storageState(),viewport:{width:390,height:844}});await page.goto(`/requests/${done}`);
 const panel=page.getByRole('region',{name:'Completion ratings'});await expect(panel.getByText('4 / 5',{exact:true})).toBeVisible();
 await panel.getByRole('radio',{name:'Completed request: 5 stars',exact:true}).locator('..').click();
 await panel.getByRole('button',{name:'Save ratings'}).click();await expect(panel.getByRole('status')).toContainText('ratings were saved');
 await page.reload();await expect(panel.getByRole('radio',{name:'Completed request: 5 stars',exact:true})).toBeChecked();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'test-results/ratings-mobile.png',fullPage:true});await page.close();
});
test('admin filters room rankings and exports selected report plus independent ratings',async({browser})=>{
 const page=await browser.newPage({baseURL,storageState:await admin.storageState()});await page.goto('/admin/analytics');
 await page.getByLabel('Room / work location',{exact:true}).fill(marker);await page.getByRole('button',{name:'Apply room filter'}).click();
 await page.getByLabel('Report category',{exact:true}).selectOption('pending');await expect(page.getByRole('heading',{name:'Rooms with the Most Pending Requests',exact:true})).toBeVisible();
 await expect(page.getByRole('region',{name:'Room reports and separate ratings'})).toContainText(`Room 202 ${marker}`);
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Export Excel',exact:true}).click();const file=await download;const stream=await file.createReadStream();let csv='';for await(const chunk of stream!)csv+=chunk.toString();expect(csv).toContain('Rooms with the Most Pending Requests');expect(csv).toContain('SEPARATE COMPLETION RATINGS');
 await page.screenshot({path:'test-results/room-reports-desktop.png',fullPage:true});await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'test-results/room-reports-mobile.png',fullPage:true});await page.close();
});
test('missing private bucket is provisioned and registration remains pending with no public ID access',async()=>{
 const stub=await startRegistrationServicesStub();stub.state.missingBucket=true;
 try{const email=`storage-recovery-${marker}@example.test`;const r=await anon.post('/api/auth/register',{multipart:{firstName:'Synthetic',lastName:'Recovery',email,department:'BSIT',password,turnstileToken:'XXXX.DUMMY.TOKEN.XXXX',idPhoto:{name:'fixture.png',mimeType:'image/png',buffer:readFileSync('tests/fixtures/evidence.png')}}});expect(r.status()).toBe(201);expect(stub.state.bucketCreates).toBe(1);expect(stub.state.publicBucket).toBe(false);const user=await prisma.user.findUniqueOrThrow({where:{email}});expect(user.accountStatus).toBe('PENDING');expect(user.role).toBe('STUDENT');expect(stub.objects.has(user.registrationIdPath!)).toBe(true);expect((await anon.get(`http://127.0.0.1:55433/storage/v1/object/public/registration-ids/${user.registrationIdPath}`)).status()).toBe(404);}finally{await stub.close();}
});
test.afterAll(async()=>{for(const c of [owner,admin,head,other,anon])await c?.dispose();await prisma.$disconnect();});
