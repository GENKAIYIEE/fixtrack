import type { RecordedWorker } from '@/lib/workers/types';
export default function RecordedWorkers({ assignments, showHistory = false }: { assignments: RecordedWorker[]; showHistory?: boolean }) {
  const rows = showHistory ? assignments : assignments.filter(row => !row.releasedAt);
  return <section aria-label="Recorded maintenance workers" className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <h2 className="text-lg font-semibold text-slate-900">Maintenance workers</h2>
    <p className="mt-1 text-sm text-slate-600">Worker details as recorded by the technician head. Directory entries only, not login accounts. Contact and actual work happen outside FixTrack.</p>
    {!rows.length ? <p className="mt-4 text-sm text-slate-500">No workers recorded yet. Selection is handled by the technician head.</p> : <ul className="mt-4 grid gap-3 sm:grid-cols-2">{rows.map(row => <li key={row.id} className="min-w-0 rounded-lg border border-slate-200 p-4 text-sm">
      <p className="break-words font-semibold">{row.workerName}</p><dl className="mt-2 space-y-1 break-words"><div><dt className="inline font-medium">Contact: </dt><dd className="inline">{row.contactNumber}</dd></div><div><dt className="inline font-medium">Specialization: </dt><dd className="inline">{row.specialization}</dd></div><div><dt className="inline font-medium">Recorded: </dt><dd className="inline">{new Date(row.assignedAt).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}</dd></div></dl>
      {row.worker && <p className="mt-2 text-xs text-slate-600">Current directory availability: {row.worker.isArchived ? 'ARCHIVED' : row.worker.assignments.length ? 'BUSY' : row.worker.isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}</p>}
      {row.releasedAt && <p className="mt-2 text-slate-500">Removed from task: {new Date(row.releasedAt).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}</p>}
    </li>)}</ul>}
  </section>;
}
