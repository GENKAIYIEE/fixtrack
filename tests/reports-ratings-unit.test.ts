import test from 'node:test';
import assert from 'node:assert/strict';
import { ratingInput } from '../src/lib/ratings/validation';
import { privateIdBucket } from '../src/lib/registration/private-storage';
type Client = Parameters<typeof privateIdBucket>[0];
function storage(states: { data: {public:boolean} | null; error: {status?:number;message?:string} | null }[], createError = false) {
  let calls=0,creates=0; const bucket={marker:'private'};
  const client={storage:{getBucket:async()=>states[Math.min(calls++,states.length-1)], createBucket:async(_n:string,opts:unknown)=>{creates++;assert.deepEqual(opts,{public:false,fileSizeLimit:3145728,allowedMimeTypes:['image/jpeg','image/png','image/webp']});return{error:createError?{message:'already exists'}:null};},from:()=>bucket}} as unknown as Client;
  return {client,bucket,get creates(){return creates;}};
}
test('request and worker scores are independent whole stars',()=>assert.deepEqual(ratingInput({requestScore:5,workers:[{workerId:'worker_A',score:2}]}),{requestScore:5,workers:[{workerId:'worker_A',score:2}]}));
test('request can be rated without workers',()=>assert.deepEqual(ratingInput({requestScore:1,workers:[]}).workers,[]));
test('invalid scores are rejected in both categories',()=>{for(const v of [0,6,-1,2.5,'5',null,NaN,Infinity,true]){assert.throws(()=>ratingInput({requestScore:v,workers:[]}));assert.throws(()=>ratingInput({requestScore:3,workers:[{workerId:'w',score:v}]}));}});
test('duplicate workers and unknown fields cannot forge identity',()=>{for(const b of [{requestScore:3,workers:[{workerId:'w',score:3},{workerId:'w',score:4}]},{requestScore:3,workers:[],ratedById:'admin'},{requestScore:3,workers:[{workerId:'w',score:3,requestId:'other'}]},null,[],{requestScore:3,workers:[{workerId:'../w',score:3}]}])assert.throws(()=>ratingInput(b));});
test('worker rating form is bounded',()=>assert.throws(()=>ratingInput({requestScore:3,workers:Array.from({length:101},(_,i)=>({workerId:`w${i}`,score:3}))})));
test('existing private bucket is never changed',async()=>{const s=storage([{data:{public:false},error:null}]);assert.equal(await privateIdBucket(s.client,true),s.bucket);assert.equal(s.creates,0);});
test('missing bucket is created private then verified',async()=>{const s=storage([{data:null,error:{status:404}},{data:{public:false},error:null}]);assert.equal(await privateIdBucket(s.client,true),s.bucket);assert.equal(s.creates,1);});
test('Supabase 400 Bucket not found is handled',async()=>{const s=storage([{data:null,error:{status:400,message:'Bucket not found'}},{data:{public:false},error:null}]);await privateIdBucket(s.client,true);assert.equal(s.creates,1);});
test('concurrent bucket creation is safe only after reread',async()=>{const s=storage([{data:null,error:{status:404}},{data:{public:false},error:null}],true);await privateIdBucket(s.client,true);assert.equal(s.creates,1);});
test('public bucket is never silently converted',async()=>{const s=storage([{data:{public:true},error:null}]);await assert.rejects(()=>privateIdBucket(s.client,true),/not private/);assert.equal(s.creates,0);});
test('denied credentials and generic provider failures never create a bucket',async()=>{for(const status of [400,401,403,500]){const s=storage([{data:null,error:{status,message:'denied'}}]);await assert.rejects(()=>privateIdBucket(s.client,true),/project URL and server service-role key/);assert.equal(s.creates,0);}});
test('read-only bucket verification does not create storage',async()=>{const s=storage([{data:null,error:{status:404}}]);await assert.rejects(()=>privateIdBucket(s.client));assert.equal(s.creates,0);});

import { requiredRouteRole, isProtectedApi } from '../src/lib/auth/account-policy';
test('only exact ratings route is shared and remains a protected API',()=>{assert.equal(requiredRouteRole('/api/requests/abc/ratings'),null);assert.equal(isProtectedApi('/api/requests/abc/ratings'),true);assert.equal(requiredRouteRole('/api/requests/abc'), 'STUDENT');assert.equal(requiredRouteRole('/api/requests/abc/ratings/other'),'STUDENT');});

import { checkProductionConfig } from '../scripts/check-production-config';
test('production configuration refuses unfilled Turnstile placeholders and storage setup flag',()=>{assert.ok(checkProductionConfig({NEXT_PUBLIC_TURNSTILE_SITE_KEY:'PASTE_YOUR_SITE_KEY',TURNSTILE_SECRET_KEY:'PASTE_YOUR_SECRET_KEY',FIXTRACK_CONFIRM_PRIVATE_STORAGE_SETUP:'1'}).errors.some(e=>e.includes('placeholder')));assert.ok(checkProductionConfig({FIXTRACK_CONFIRM_PRIVATE_STORAGE_SETUP:'1'}).errors.some(e=>e.includes('FIXTRACK_CONFIRM_PRIVATE_STORAGE_SETUP')));});
