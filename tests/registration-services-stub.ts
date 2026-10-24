/** Local Supabase-compatible Auth/private storage stub. No real identity documents/accounts. */
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { assertLocalTestEnvironment } from './local-safety';
export async function startRegistrationServicesStub() {
  assertLocalTestEnvironment();
  if (process.env.NEXT_PUBLIC_SUPABASE_URL !== 'http://127.0.0.1:55433') throw new Error('Registration tests require the isolated localhost service stub.');
  const objects = new Map<string, { data: Buffer; type: string }>();
  const authUsers = new Map<string, { id: string; email: string }>();
  const state = { bucketCreates: 0, failBucketCreate: false, uploads: 0, authCreates: 0, failUpload: false, failAuth: false, publicBucket: false, missingBucket: false, deniedBucket: false, nextAuthId: '', failAuthDelete: false };
  const server = createServer(async (request,response) => {
    const path = decodeURIComponent(new URL(request.url!, 'http://127.0.0.1:55433').pathname);
    const chunks: Buffer[] = []; for await (const chunk of request) chunks.push(Buffer.from(chunk));
    const body = Buffer.concat(chunks);
    const json = (data: unknown, status = 200) => { response.writeHead(status, { 'Content-Type':'application/json' }); response.end(JSON.stringify(data)); };
    if (request.method === 'GET' && path === '/storage/v1/bucket/registration-ids') { if (state.missingBucket) { json({ statusCode:'404', message:'Not found', error:'not_found' },404); return; } if (state.deniedBucket) { json({ statusCode:'403', message:'Forbidden', error:'forbidden' },403); return; } json({ id:'registration-ids', name:'registration-ids', public:state.publicBucket }); return; }
    if (request.method === 'POST' && path === '/storage/v1/bucket') { state.bucketCreates++; if(state.failBucketCreate){json({statusCode:'503',message:'Unavailable'},503);return;} const settings=JSON.parse(body.toString()); if(settings.id!=='registration-ids' || settings.public!==false){json({statusCode:'400',message:'Invalid'},400);return;} state.missingBucket=false;state.publicBucket=false;json({name:'registration-ids'});return; }
    const prefix = '/storage/v1/object/registration-ids/';
    if (request.method === 'POST' && path.startsWith(prefix)) {
      state.uploads++;
      if (state.failUpload) { json({ message:'Synthetic upload failure', statusCode:'503', error:'Storage unavailable' },503);return; }
      objects.set(path.slice(prefix.length),{data:body,type:String(request.headers['content-type'])});json({Key:path.slice(prefix.length)});return;
    }
    if (request.method === 'DELETE' && path === '/storage/v1/object/registration-ids') {
      for (const key of JSON.parse(body.toString()).prefixes || []) objects.delete(key);json([]);return;
    }
    if (request.method === 'POST' && path === '/auth/v1/admin/users') {
      state.authCreates++;
      if (state.failAuth) { json({msg:'Synthetic auth creation failure',code:'unexpected_failure'},400);return; }
      const id = state.nextAuthId || randomUUID(), email = JSON.parse(body.toString()).email;authUsers.set(id,{id,email});state.nextAuthId='';
      json({id,email,aud:'authenticated',role:'authenticated',created_at:new Date().toISOString(),app_metadata:{},user_metadata:{},identities:[]});return;
    }
    if (request.method === 'DELETE' && path.startsWith('/auth/v1/admin/users/')) {const id=path.split('/').pop()!;if(state.failAuthDelete){json({message:'Synthetic cleanup unavailable'},503);return;}authUsers.delete(id);json({id});return;}
    const signPrefix='/storage/v1/object/sign/registration-ids/';
    if (request.method === 'POST' && path.startsWith(signPrefix)) {json({signedURL:`/object/sign/registration-ids/${path.slice(signPrefix.length)}?token=synthetic-admin-only`});return;}
    if (request.method === 'GET' && path.startsWith(signPrefix)) {
      const object=objects.get(path.slice(signPrefix.length));
      if(object && request.url?.includes('token=synthetic-admin-only')) {response.writeHead(200,{'Content-Type':object.type,'Cache-Control':'private, no-store'});response.end(object.data);return;}
    }
    response.writeHead(404);response.end();
  });
  await new Promise<void>((resolve,reject)=>{server.once('error',reject);server.listen(55433,'127.0.0.1',resolve);});
  return {objects,authUsers,state,close:()=>new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()))};
}
