'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import RecordedWorkers from '@/components/shared/RecordedWorkers';
import type { RecordedWorker, WorkerRecord } from '@/lib/workers/types';
export default function TaskWorkerSelector({ taskId, status, updatedAt, assignments, onSaved }: { taskId: string; status: string; updatedAt: string; assignments: RecordedWorker[]; onSaved: () => Promise<void> }) {
  const [open, setOpen] = useState(false), [rows, setRows] = useState<WorkerRecord[]>([]), [ids, setIds] = useState<string[]>([]), [search, setSearch] = useState(''), [page, setPage] = useState(1), [pages, setPages] = useState(1), [revision, setRevision] = useState(0), [loading, setLoading] = useState(false), [saving, setSaving] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
  const [version, setVersion] = useState(updatedAt);
  const [openedAssignments, setOpenedAssignments] = useState<RecordedWorker[]>([]);
  const current = open ? openedAssignments : assignments.filter(row => !row.releasedAt);
  const editable = ['ONGOING', 'ON_HOLD'].includes(status);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    fetch(`/api/technician/workers?${new URLSearchParams({ search, page: String(page), limit: '20' })}`, { signal: controller.signal, cache: 'no-store' }).then(async response => { const body = await response.json(); if (!response.ok) throw new Error(body.error || 'Could not load available workers.'); setRows(body.workers); setPages(body.totalPages); }).catch(error => { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Could not load workers.'); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [open, page, search, revision]);
  async function beginSelection() {
    setError(''); setMessage(''); setLoading(true);
    try {
      const response = await fetch(`/api/technician/tasks/${taskId}`, { cache: 'no-store' });
      const fresh = await response.json(); if (!response.ok) throw new Error(fresh.error || 'Could not refresh this task.');
      if (!['ONGOING', 'ON_HOLD'].includes(fresh.status)) throw new Error('This task is no longer editable. Refresh its details.');
      const current: RecordedWorker[] = fresh.workerAssignments.filter((row: RecordedWorker) => !row.releasedAt);
      setOpenedAssignments(current); setIds(current.map(row => row.workerId)); setVersion(fresh.updatedAt); setSearch(''); setPage(1); setOpen(true);
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not refresh task workers.'); setLoading(false); }
  }
  async function save() {
    setSaving(true); setError(''); setMessage('');
    try {
      const response = await fetch(`/api/technician/tasks/${taskId}/workers`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workerIds: ids, updatedAt: version }) });
      const body = await response.json(); if (!response.ok) throw new Error(body.error || 'Could not record workers.');
      await onSaved(); setOpen(false); setMessage(body.message);
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not save workers.'); } finally { setSaving(false); }
  }
  return <div className="mb-6 space-y-4"><RecordedWorkers assignments={assignments} showHistory />
    {message && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{message}</p>}
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {editable && !open && <button type="button" className="rounded-lg bg-blue-900 px-5 py-3 font-semibold text-white" disabled={loading} onClick={beginSelection}>Choose workers</button>}
    {open && editable && <section aria-label="Choose task workers" className="space-y-4 rounded-xl border border-blue-200 bg-white p-5 shadow-sm"><h2 className="text-xl font-semibold">Choose available workers</h2><p className="text-sm text-slate-600">Select multiple directory records. Busy, unavailable and archived workers cannot be newly assigned. Selection records coordination only; contact workers outside FixTrack.</p><Link href="/technician/workers" className="inline-block text-sm font-medium text-blue-800 underline">Manage worker directory</Link>
      <label className="block text-sm font-medium">Search workers<input className="mt-2 w-full rounded-lg border px-3 py-2" maxLength={100} value={search} onChange={event => { setSearch(event.target.value); setPage(1); setLoading(true); }} /></label>
      {loading ? <p role="status">Loading workers…</p> : !rows.length ? <p>No matching workers. Add records in Workers.</p> : <div className="grid gap-3 sm:grid-cols-2">{rows.map(worker => { const already = current.some(row => row.workerId === worker.id); const disabled = !already && worker.availability !== 'AVAILABLE'; return <label key={worker.id} className={`flex min-w-0 items-start gap-3 rounded-lg border p-4 ${disabled ? 'bg-slate-50 text-slate-500' : 'border-blue-200'}`}><input type="checkbox" className="mt-1 h-4 w-4" disabled={disabled || saving} checked={ids.includes(worker.id)} onChange={event => setIds(event.target.checked ? [...ids, worker.id] : ids.filter(id => id !== worker.id))} /><span className="min-w-0 text-sm"><span className="block break-words font-semibold">{worker.name}</span><span className="block break-words">{worker.contactNumber} · {worker.specialization}</span><span className="mt-1 block">{already ? 'Already on this task' : worker.availability}</span></span></label>; })}</div>}
      <div className="flex items-center justify-between gap-2 text-sm"><button type="button" disabled={page === 1 || loading} onClick={() => { setPage(page - 1); setLoading(true); }} className="rounded border px-3 py-2 disabled:opacity-40">Previous workers</button><span>{page} / {pages}</span><button type="button" disabled={page >= pages || loading} onClick={() => { setPage(page + 1); setLoading(true); }} className="rounded border px-3 py-2 disabled:opacity-40">Next workers</button></div>
      {!!current.length && <fieldset className="rounded-lg bg-slate-50 p-3"><legend className="text-sm font-medium">Current workers (including hidden search results)</legend>{current.map(row => <label key={row.id} className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={ids.includes(row.workerId)} disabled={saving} onChange={event => setIds(event.target.checked ? [...ids, row.workerId] : ids.filter(id => id !== row.workerId))} />Keep {row.workerName}</label>)}</fieldset>}
      <p className="text-sm font-medium">{ids.length} selected</p><div className="flex flex-wrap gap-3"><button type="button" disabled={saving || loading} onClick={save} className="rounded-lg bg-blue-900 px-5 py-2.5 font-semibold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save selected workers'}</button><button type="button" disabled={saving} className="rounded-lg border px-4 py-2" onClick={() => { setOpen(false); setError(''); }}>Cancel selection</button><button type="button" disabled={saving} className="rounded-lg border px-4 py-2" onClick={() => { setLoading(true); setRevision(value => value + 1); }}>Refresh availability</button></div>
    </section>}
  </div>;
}
