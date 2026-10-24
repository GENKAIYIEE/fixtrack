/** Local mock of ONLY the original Supabase request-photos bucket; no real service calls. */
import { createServer } from 'node:http';
import { assertLocalTestEnvironment } from './local-safety';
export async function startEvidenceStorageStub() {
  assertLocalTestEnvironment();
  const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!);
  if (url.hostname !== '127.0.0.1' || url.port !== '55433') throw new Error('Photo workflow tests require NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:55433 for the isolated storage stub.');
  const objects = new Map<string, { data: Buffer; type: string }>();
  const state = { uploads: 0, failFromUpload: Number.POSITIVE_INFINITY, missingBucket: false, deniedBucket: false, publicBucket: true };
  const server = createServer(async (request, response) => {
    const path = decodeURIComponent(new URL(request.url!, url).pathname);
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(Buffer.from(chunk));
    const data = Buffer.concat(chunks);
    const prefix = '/storage/v1/object/request-photos/';
    response.setHeader('Access-Control-Allow-Origin', '*');
    if (request.method === 'GET' && path === '/storage/v1/bucket/request-photos') {
      const status=state.missingBucket?404:state.deniedBucket?403:200;
      response.writeHead(status,{'Content-Type':'application/json'});
      response.end(JSON.stringify(status===200?{id:'request-photos',name:'request-photos',public:state.publicBucket}:{statusCode:String(status),error:'Storage unavailable',message:'Synthetic storage failure'}));return;
    }
    if (request.method === 'POST' && path.startsWith(prefix)) {
      state.uploads++;
      if (state.uploads >= state.failFromUpload) { response.writeHead(503, { 'Content-Type': 'application/json' }); response.end(JSON.stringify({ statusCode: '503', error: 'Storage unavailable', message: 'Simulated local storage failure' })); return; }
      objects.set(path.slice(prefix.length), { data, type: String(request.headers['content-type'] || 'application/octet-stream') });
      response.writeHead(200, { 'Content-Type': 'application/json' }); response.end(JSON.stringify({ Key: path.slice(prefix.length) })); return;
    }
    if (request.method === 'DELETE' && path === '/storage/v1/object/request-photos') {
      const body = JSON.parse(data.toString());
      for (const key of body.prefixes || []) objects.delete(key);
      response.writeHead(200, { 'Content-Type': 'application/json' }); response.end('[]'); return;
    }
    const publicPrefix = '/storage/v1/object/public/request-photos/';
    if (request.method === 'GET' && path.startsWith(publicPrefix)) {
      const object = objects.get(path.slice(publicPrefix.length));
      if (object) { response.writeHead(200, { 'Content-Type': object.type }); response.end(object.data); return; }
    }
    response.writeHead(404); response.end();
  });
  await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(55433, '127.0.0.1', resolve); });
  return { objects, state, close: () => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())) };
}
