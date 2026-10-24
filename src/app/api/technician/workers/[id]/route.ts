import { NextResponse } from 'next/server';
import { getActiveSession } from '@/lib/auth/access';
import { requireTechnicianHead } from '@/lib/requests/assignment';
import { saveWorker, workerErrorResponse } from '@/lib/workers/service';
import { boundedJson, recordBody } from '@/lib/workers/validation';
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getActiveSession(['TECHNICIAN']);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await requireTechnicianHead(session.user.id);
    const { id } = await params, body = recordBody(await boundedJson(request));
    return NextResponse.json(await saveWorker(session.user.id, body, id, body.updatedAt));
  } catch (error) { return workerErrorResponse(error); }
}
