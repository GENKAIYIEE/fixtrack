/** Below Vercel's 4.5 MB function payload limit, including JSON/base64 overhead. */
export const MAX_REQUEST_BODY_BYTES = 4 * 1024 * 1024;
export class RequestBodyError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
export async function readRequestJson(request: Request): Promise<unknown> {
  if (Number(request.headers.get('content-length')) > MAX_REQUEST_BODY_BYTES) {
    throw new RequestBodyError('The request is too large. Remove or resize photos and try again.', 413);
  }
  const reader = request.body?.getReader();
  if (!reader) throw new RequestBodyError('Invalid JSON body', 400);
  const chunks: Uint8Array[] = []; let total = 0;
  try {
    while (true) {
      const {value, done} = await reader.read(); if (done) break;
      total += value.length;
      if (total > MAX_REQUEST_BODY_BYTES) {
        await reader.cancel(); throw new RequestBodyError('The request is too large. Remove or resize photos and try again.', 413);
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new RequestBodyError('Invalid JSON body', 400); }
}
