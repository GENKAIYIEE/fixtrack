import { redirect } from 'next/navigation';
import { getActiveSession } from '@/lib/auth/access';
import { requireTechnicianHead, WorkflowError } from '@/lib/requests/assignment';
import WorkerDirectory from '@/components/technician/WorkerDirectory';
export const dynamic = 'force-dynamic';
export default async function WorkersPage() {
  const session = await getActiveSession(['TECHNICIAN']);
  if (!session) redirect('/login');
  try { await requireTechnicianHead(session.user.id); }
  catch (error) { if (error instanceof WorkflowError && error.status === 403) return <p role="alert" className="rounded-lg bg-red-50 p-6 text-red-800">Only the designated active technician head can manage worker records.</p>; throw error; }
  return <WorkerDirectory />;
}
