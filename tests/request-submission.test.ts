import test from 'node:test';
import assert from 'node:assert/strict';
import { requestSubmissionFailure, RequestPhotoStorageError } from '../src/lib/requests/submission-errors';
import { uploadEvidencePhotos, validateEvidencePhotos } from '../src/lib/requests/photo-storage';
import { setupLocalRequestStorage } from '../scripts/setup-local-request-storage';

test('submission error classification distinguishes schema, database, storage and unknown errors without exposing provider details', () => {
  for (const code of ['P2021','P2022']) assert.equal(requestSubmissionFailure({ code, message: 'sensitive SQL' }).code, 'REQUEST_SCHEMA_OUTDATED');
  for (const code of ['P1001','P1010','P2024']) assert.equal(requestSubmissionFailure({ code }).code, 'REQUEST_DATABASE_UNAVAILABLE');
  assert.equal(requestSubmissionFailure(new RequestPhotoStorageError('Safe storage message', 'REQUEST_PHOTO_UPLOAD_FAILED')).status, 503);
  assert.deepEqual(requestSubmissionFailure(new Error('sensitive credentials')), {status:500,code:'REQUEST_SAVE_FAILED',error:'The request could not be saved. Please retry. If this continues, contact the administrator.'});
});
test('requests without photos do not read storage credentials or call storage', async () => {
  const result=await uploadEvidencePhotos([], 'synthetic-user', 'REQ-TEST');
  assert.equal(result.photoUrl,null);await result.rollback();
});
test('partial evidence upload failure stays an availability error and removes only new photos', async () => {
  const photo=validateEvidencePhotos([`data:image/png;base64,${Buffer.from([137,80,78,71,13,10,26,10,1]).toString('base64')}`])[0];
  const objects=new Set(['previous-photo']);let count=0;
  await assert.rejects(uploadEvidencePhotos([photo,photo], 'synthetic-user', 'REQ-TEST', {
    upload:async path=>{if(++count===2)return {error:{message:'sensitive provider detail'}};objects.add(path);return {error:null};},
    remove:async paths=>{for(const path of paths)objects.delete(path);return {error:null};},
    getPublicUrl:path=>({data:{publicUrl:`http://127.0.0.1/${path}`}}),
  }),error=>error instanceof RequestPhotoStorageError && error.code==='REQUEST_PHOTO_UPLOAD_FAILED' && !error.message.includes('sensitive'));
  assert.deepEqual([...objects],['previous-photo']);
});
const env:NodeJS.ProcessEnv={NODE_ENV:'test',FIXTRACK_ALLOW_LOCAL_REQUEST_STORAGE_SETUP:'1',FIXTRACK_ACK_PUBLIC_REQUEST_PHOTOS:'1',NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:54321',SUPABASE_SERVICE_ROLE_KEY:'synthetic-local-test-only'};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
test('request-photo setup refuses remote, production, missing opt-in/acknowledgment, and missing key before network', async()=>{
 let calls=0;const network:typeof fetch=async()=>{calls++;return json({});};
 const overrides:Partial<NodeJS.ProcessEnv>[]=[{NEXT_PUBLIC_SUPABASE_URL:'https://example.invalid'},{NODE_ENV:'production'},{FIXTRACK_ALLOW_LOCAL_REQUEST_STORAGE_SETUP:''},{FIXTRACK_ACK_PUBLIC_REQUEST_PHOTOS:''},{SUPABASE_SERVICE_ROLE_KEY:''}];
 for(const override of overrides)await assert.rejects(setupLocalRequestStorage({...env,...override},network));
 assert.equal(calls,0);
});
test('request-photo setup creates only the missing evidence bucket with existing public-read behavior and 5MiB image limits', async()=>{
 let exists=false;const methods:string[]=[];
 const network:typeof fetch=async(input,options)=>{
  assert.match(String(input),/\/storage\/v1\/bucket(?:\/request-photos)?$/);assert.ok(!String(input).includes('registration-ids'));
  const method=options?.method||'GET';methods.push(method);
  if(method==='POST'){const body=JSON.parse(String(options?.body));assert.equal(body.id,'request-photos');assert.equal(body.public,true);assert.equal(body.file_size_limit,5242880);assert.deepEqual(body.allowed_mime_types,['image/jpeg','image/png','image/webp']);exists=true;return json({name:'request-photos'});}
  return exists?json({id:'request-photos',public:true}):json({statusCode:'404',message:'Not found',error:'not_found'},404);
 };
 assert.match(await setupLocalRequestStorage(env,network),/private registration-ids bucket/);assert.deepEqual(methods,['GET','POST','GET']);
});
test('request-photo setup never flips existing private evidence buckets or modifies public ones, and refuses denied access', async()=>{
 for(const state of ['public','private','denied']){
  const methods:string[]=[];const network:typeof fetch=async(_url,options)=>{methods.push(options?.method||'GET');return state==='denied'?json({statusCode:'403',message:'secret-detail',error:'Forbidden'},403):json({id:'request-photos',public:state==='public'});};
  if(state==='public')await setupLocalRequestStorage(env,network);else await assert.rejects(setupLocalRequestStorage(env,network));
  assert.deepEqual(methods,['GET']);
 }
});
