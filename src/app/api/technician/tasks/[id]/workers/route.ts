import { NextResponse } from 'next/server';
import { getActiveSession } from '@/lib/auth/access';
import { requireTechnicianHead, WorkflowError } from '@/lib/requests/assignment';
import { setTaskWorkers, workerErrorResponse } from '@/lib/workers/service';
import { boundedJson, recordBody } from '@/lib/workers/validation';
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getActiveSession(['TECHNICIAN']);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await requireTechnicianHead(session.user.id);
    const { id } = await params, body = recordBody(await boundedJson(request));
    if (Object.keys(body).some(key => !['workerIds', 'updatedAt'].includes(key))) throw new WorkflowError('Only the technician head can record worker selections; no account assignment fields are accepted.');
    return NextResponse.json(await setTaskWorkers(session.user.id, id, body.workerIds, body.updatedAt));
  } catch (error) { return workerErrorResponse(error); }
}
