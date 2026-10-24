'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import OfficialRequestDetails, { OfficialRequestDetailsData } from '@/components/shared/OfficialRequestDetails';
import PhotoGallery from '@/components/shared/PhotoGallery';
import RecordedWorkers from '@/components/shared/RecordedWorkers';
import type { RecordedWorker } from '@/lib/workers/types';
type ApprovedTask = OfficialRequestDetailsData & { id: string; requestCode: string; status: string; photoUrl: string | null; assignee: { firstName: string; lastName: string; email: string } | null; assignedToDesignatedHead: boolean; workerAssignments: RecordedWorker[] };
export default function ApprovedTaskAssignments() {
  const [rows, setRows] = useState<ApprovedTask[]>([]), [page, setPage] = useState(1), [pages, setPages] = useState(1), [revision, setRevision] = useState(0), [loading, setLoading] = useState(true), [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`/api/admin/assignments?type=approved&page=${page}`, { signal: controller.signal, cache: 'no-store' });
        const body = await response.json(); if (!response.ok) throw new Error(body.error || 'Could not load approved tasks.');
        if (!controller.signal.aborted) { setRows(body.requests); setPages(body.totalPages); setError(''); }
      } catch (error) { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Could not load approved tasks.'); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load(); const timer = setInterval(load, 15000);
    return () => { controller.abort(); clearInterval(timer); };
  }, [page, revision]);
  return <section aria-label="Approved task assignments" className="space-y-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-2xl font-semibold text-slate-900">Approved requests and worker details</h2><p className="mt-2 text-sm text-slate-600">Approve in Maintenance Requests to forward automatically, then view workers recorded by the head here. The admin does not select individual workers.</p></div><button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={() => { setLoading(true); setRevision(value => value + 1); }}>Refresh approved tasks</button></div>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</p>}
    {loading ? <p role="status">Loading approved tasks…</p> : !rows.length ? <p className="py-5 text-slate-500">No approved requests yet.</p> : rows.map(task => <article key={task.id} aria-label={`Approved task ${task.requestCode}`} className="min-w-0 space-y-5 rounded-xl border border-slate-200 p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="break-all font-semibold text-blue-900">{task.requestCode}</h3><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold">{task.status.replaceAll('_', ' ')}</span></div><OfficialRequestDetails request={task} />{task.photoUrl ? <div className="max-w-md"><PhotoGallery photoUrl={task.photoUrl} /></div> : <p className="text-sm text-slate-500">Photo Evidence: No photos attached.</p>}
      <div className="rounded-lg bg-blue-50 p-4 text-sm"><p className="font-semibold">{task.assignee && !task.assignedToDesignatedHead ? 'Historical receiving account' : 'Receiving technician-head account'}</p>{task.assignee ? <p className="mt-1 break-words">{task.assignee.firstName} {task.assignee.lastName} · {task.assignee.email}</p> : <p className="mt-1">This older approved request has no receiving account. Open its request details to forward it; new approvals are forwarded automatically.</p>}</div><RecordedWorkers assignments={task.workerAssignments} /><Link className="inline-block rounded-lg border border-blue-200 px-4 py-2 text-sm font-medium text-blue-900" href={`/admin/requests/${task.id}`}>View request and history</Link>
    </article>)}
    <nav aria-label="Approved task pages" className="flex items-center justify-between gap-3 text-sm"><button type="button" className="rounded border px-3 py-2 disabled:opacity-40" disabled={loading || page === 1} onClick={() => { setPage(page - 1); setLoading(true); }}>Previous tasks</button><span>Page {page} of {pages}</span><button type="button" className="rounded border px-3 py-2 disabled:opacity-40" disabled={loading || page >= pages} onClick={() => { setPage(page + 1); setLoading(true); }}>Next tasks</button></nav>
  </section>;
}
