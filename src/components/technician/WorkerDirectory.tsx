'use client';
import { useEffect, useState } from 'react';
import type { WorkerRecord } from '@/lib/workers/types';
import { WORKER_SPECIALIZATIONS } from '@/lib/workers/validation-client';
const empty = { name: '', contactNumber: '', specialization: 'GENERAL', isAvailable: true, isArchived: false };
const inputClass = 'min-w-0 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600';
export default function WorkerDirectory() {
  const [workers, setWorkers] = useState<WorkerRecord[]>([]), [editing, setEditing] = useState<WorkerRecord | null>(null);
  const [form, setForm] = useState(empty), [search, setSearch] = useState(''), [showArchived, setShowArchived] = useState(false), [page, setPage] = useState(1), [pages, setPages] = useState(1), [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true), [saving, setSaving] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ page: String(page), search, archived: String(showArchived) });
    fetch(`/api/technician/workers?${params}`, { signal: controller.signal, cache: 'no-store' }).then(async response => {
      const body = await response.json(); if (!response.ok) throw new Error(body.error || 'Could not load workers.');
      setWorkers(body.workers); setPages(body.totalPages); setError('');
    }).catch(error => { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Could not load workers.'); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, search, showArchived, revision]);
  function edit(worker: WorkerRecord) { setEditing(worker); setForm({ name: worker.name, contactNumber: worker.contactNumber, specialization: worker.specialization, isAvailable: worker.isAvailable, isArchived: worker.isArchived }); setMessage(''); setError(''); }
  async function save(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setError(''); setMessage('');
    try {
      const response = await fetch(editing ? `/api/technician/workers/${editing.id}` : '/api/technician/workers', { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, ...(editing && { updatedAt: editing.updatedAt }) }) });
      const body = await response.json(); if (!response.ok) throw new Error(body.error || 'Could not save worker.');
      setMessage(editing ? 'Worker record updated.' : 'Worker record added. No login account was created.'); setEditing(null); setForm(empty); setLoading(true); setRevision(value => value + 1);
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not save worker.'); } finally { setSaving(false); }
  }
  return <div className="mx-auto min-w-0 max-w-6xl space-y-6">
    <div><h1 className="text-3xl font-bold text-slate-900">Workers</h1><p className="mt-2 text-sm leading-relaxed text-slate-600">Create a directory for off-system maintenance coordination. Workers have no accounts. A worker is Busy while recorded on an ongoing or on-hold task, then becomes available again unless manually marked unavailable or archived.</p></div>
    {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">{error}<button type="button" className="ml-3 underline" onClick={() => { setLoading(true); setRevision(value => value + 1); }}>Refresh workers</button></div>}
    {message && <p role="status" className="rounded-lg bg-green-50 p-4 text-green-800">{message}</p>}
    <form onSubmit={save} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold">{editing ? 'Edit worker record' : 'Add worker'}</h2>
      <div className="grid gap-4 sm:grid-cols-2"><label className="min-w-0 space-y-2 text-sm font-medium"><span>Worker name</span><input className={inputClass} required maxLength={100} value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} disabled={saving} /></label>
      <label className="min-w-0 space-y-2 text-sm font-medium"><span>Contact number</span><input className={inputClass} type="tel" required maxLength={40} value={form.contactNumber} onChange={event => setForm({ ...form, contactNumber: event.target.value })} disabled={saving} /></label>
      <label className="min-w-0 space-y-2 text-sm font-medium"><span>Specialization</span><select aria-label="Specialization" className={inputClass} value={form.specialization} onChange={event => setForm({ ...form, specialization: event.target.value })} disabled={saving}>{WORKER_SPECIALIZATIONS.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      <label className="min-w-0 space-y-2 text-sm font-medium"><span>Manual availability</span><select aria-label="Manual availability" className={inputClass} value={form.isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'} onChange={event => setForm({ ...form, isAvailable: event.target.value === 'AVAILABLE' })} disabled={saving}><option value="AVAILABLE">Available when not busy</option><option value="UNAVAILABLE">Unavailable</option></select></label></div>
      {editing && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isArchived} disabled={saving} onChange={event => setForm({ ...form, isArchived: event.target.checked })} />Archive worker (retains history; active assignments must be removed first)</label>}
      <div className="flex flex-wrap gap-3"><button type="submit" disabled={saving} className="rounded-lg bg-blue-900 px-5 py-2.5 font-semibold text-white disabled:opacity-60">{saving ? 'Saving…' : editing ? 'Save worker changes' : 'Add worker record'}</button>{editing && <button type="button" disabled={saving} className="rounded-lg border px-4 py-2" onClick={() => { setEditing(null); setForm(empty); }}>Cancel edit</button>}</div>
    </form>
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center gap-4"><h2 className="mr-auto text-xl font-semibold">Worker directory</h2><label className="text-sm">Search workers<input className={inputClass} maxLength={100} value={search} onChange={event => { setSearch(event.target.value); setPage(1); setLoading(true); }} /></label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showArchived} onChange={event => { setShowArchived(event.target.checked); setPage(1); setLoading(true); }} />Include archived</label><button type="button" className="rounded border px-3 py-2 text-sm" onClick={() => { setLoading(true); setRevision(value => value + 1); }}>Refresh</button></div>
    {loading ? <p role="status">Loading workers…</p> : !workers.length ? <p className="py-6 text-slate-500">No workers found. Add a worker record above.</p> : <div className="grid gap-4 md:grid-cols-2">{workers.map(worker => <article aria-label={`Worker ${worker.name}`} key={worker.id} className="min-w-0 rounded-lg border border-slate-200 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="min-w-0 max-w-full break-words font-semibold">{worker.name}</h3><span className={`rounded-full px-3 py-1 text-xs font-semibold ${worker.availability === 'AVAILABLE' ? 'bg-green-100 text-green-800' : worker.availability === 'BUSY' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>{worker.availability}</span></div><p className="mt-2 break-words text-sm">Contact: {worker.contactNumber}</p><p className="mt-1 text-sm">Specialization: {worker.specialization}</p><p className="mt-1 text-sm text-slate-500">{worker.activeTaskCount} active tasks · No login account</p><p className="mt-2 text-sm text-amber-700">★ {worker.ratingCount ? `${worker.ratingAverage?.toFixed(1)} / 5 · ${worker.ratingCount} worker ${worker.ratingCount === 1 ? 'rating' : 'ratings'}` : 'Not rated yet'}</p><button type="button" className="mt-3 rounded border border-blue-200 px-4 py-2 text-sm font-medium text-blue-900" onClick={() => edit(worker)}>Edit worker</button></article>)}</div>}
    <nav aria-label="Worker pages" className="flex items-center justify-between gap-3 text-sm"><button type="button" className="rounded border px-3 py-2 disabled:opacity-40" disabled={page === 1 || loading} onClick={() => { setPage(page - 1); setLoading(true); }}>Previous</button><span>Page {page} of {pages}</span><button type="button" className="rounded border px-3 py-2 disabled:opacity-40" disabled={page >= pages || loading} onClick={() => { setPage(page + 1); setLoading(true); }}>Next</button></nav></section>
  </div>;
}
