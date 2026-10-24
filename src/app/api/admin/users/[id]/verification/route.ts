import { getActiveSession } from '@/lib/auth/access';
import { decideVerification, VerificationError } from '@/lib/verification/decisions';
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const headers = { 'Cache-Control': 'private, no-store' };
  try {
    const session = await getActiveSession(['ADMIN']);
    if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401, headers });
    let body: unknown; try { body = await request.json(); } catch { throw new VerificationError('Invalid JSON decision.'); }
    return Response.json(await decideVerification(session.user.id, (await params).id, body), { headers });
  } catch (error) {
    if (error instanceof VerificationError) return Response.json({ error: error.message }, { status: error.status, headers });
    // Never log the submitted reason, document location or account details.
    return Response.json({ error: 'Could not save the decision. Refresh and retry.' }, { status: 503, headers });
  }
}
