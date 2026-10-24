import { getActiveSession } from '@/lib/auth/access';
import { boundedJson } from '@/lib/workers/validation';
import { ratingDetails, saveRatings } from '@/lib/ratings/service';
import { RatingError } from '@/lib/ratings/validation';
import { WorkflowError } from '@/lib/requests/assignment';
export const runtime = 'nodejs';
const headers = { 'Cache-Control': 'private, no-store' };
function failure(error: unknown) {
  if (error instanceof RatingError || error instanceof WorkflowError) return Response.json({ error: error.message }, { status: error.status, headers });
  console.error('[ratings] Operation failed; check database migration and service availability.');
  return Response.json({ error: 'Could not load or save ratings. Please retry.' }, { status: 503, headers });
}
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const session = await getActiveSession(['STUDENT', 'ADMIN', 'TECHNICIAN']);
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401, headers });
    return Response.json(await ratingDetails(session.user, (await params).id), { headers });
  } catch (error) { return failure(error); }
}
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const origin = request.headers.get('origin');
    const expected = new URL(process.env.NEXTAUTH_URL || request.url).origin;
    if (!origin || origin !== expected) throw new RatingError('Reload this page before submitting a rating.', 403);
    if (!request.headers.get('content-type')?.startsWith('application/json')) throw new RatingError('Submit a JSON rating form.', 415);
    const session = await getActiveSession(['STUDENT']);
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401, headers });
    return Response.json(await saveRatings(session.user.id, (await params).id, await boundedJson(request)), { headers });
  } catch (error) { return failure(error); }
}
