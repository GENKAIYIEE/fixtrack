import { getActiveSession } from '@/lib/auth/access';
import { redirect } from 'next/navigation';
import { requireTechnicianHead, WorkflowError } from '@/lib/requests/assignment';

export default async function TechnicianWorkflowGate({ children }: { children: React.ReactNode }) {
  const session = await getActiveSession();
  if (!session?.user) redirect('/login');
  try { await requireTechnicianHead(session.user.id); }
  catch (error) {
    if (!(error instanceof WorkflowError)) throw error;
    return <section className="mx-auto max-w-2xl rounded-xl border border-amber-200 bg-white p-6 shadow-sm" role="alert">
      <h1 className="text-xl font-semibold text-slate-900">Technician-head access required</h1>
      <p className="mt-3 text-slate-700">Only the designated active technician head can receive and manage maintenance tasks. Your account and historical assignments have not been deleted or reassigned.</p>
      <p className="mt-3 text-slate-700">Contact an administrator to review outstanding historical assignments. Worker coordination takes place outside FixTrack.</p>
    </section>;
  }
  return <>{children}</>;
}
