'use client';
import { getWorkLocation } from '@/lib/requests/display';
import { formatRequestDate, REQUEST_PRIORITIES } from '@/lib/requests/form';
import PhotoGallery from '@/components/shared/PhotoGallery';
export type RequestRow = {
  id: string; requestCode: string; issueType: string | null; workLocation?: string | null;
  requestDate?: string | null; requestingParty?: string | null; requestedPriority?: string | null;
  building: string | null; roomNumber: string | null; urgencyLevel: string; priorityLevel: string;
  status: string; description: string; createdAt: string; submittedById: string; assignedToId: string | null;
  photoUrl?: string | null; assignedToDesignatedHead?: boolean;
  submitter: { firstName: string; lastName: string } | null;
  assignee: { firstName: string; lastName: string } | null;
};
type Props = { requests: RequestRow[]; selectedIds: string[]; isLoading: boolean; onSelectAll: (checked: boolean) => void; onSelectOne: (id: string, checked: boolean) => void; onView: (id: string) => void; onAssign: (id: string) => void; onReject: (id: string) => void; onDelete: (id: string) => void };
export default function AllRequestsTable({ requests, selectedIds, isLoading, onSelectAll, onSelectOne, onView, onAssign, onReject, onDelete }: Props) {
  const all = requests.length > 0 && requests.every(row => selectedIds.includes(row.id));
  const headers = ['ID', 'Date of Request', 'Requesting Party', 'Work Location', 'Description of work/repair', 'Requested Priority', 'Photo Evidence', 'Status', 'Technician Head', 'Actions'];
  return <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[1600px] border-collapse text-left text-sm"><thead><tr className="bg-blue-900 text-white"><th className="p-4"><input type="checkbox" checked={all} ref={element => { if (element) element.indeterminate = selectedIds.length > 0 && !all; }} onChange={event => onSelectAll(event.target.checked)} aria-label="Select all requests" /></th>{headers.map(header => <th key={header} className="px-4 py-4 text-xs font-semibold uppercase tracking-wide">{header}</th>)}</tr></thead><tbody>
    {isLoading ? <tr><td colSpan={11} className="p-8 text-center text-slate-500">Loading maintenance requests…</td></tr> : !requests.length ? <tr><td colSpan={11} className="p-8 text-center text-slate-500">No maintenance requests found.</td></tr> : requests.map(row => <tr key={row.id} className={`border-b border-slate-100 align-top hover:bg-blue-50 ${selectedIds.includes(row.id) ? 'bg-blue-50' : ''}`}>
      <td className="p-4"><input type="checkbox" aria-label={`Select request ${row.requestCode}`} checked={selectedIds.includes(row.id)} onChange={event => onSelectOne(row.id, event.target.checked)} /></td>
      <td className="px-4 py-4 font-semibold text-blue-900">{row.requestCode}</td>
      <td className="px-4 py-4">{row.requestDate ? formatRequestDate(row.requestDate) : 'Not recorded (legacy)'}</td>
      <td className="px-4 py-4"><p className="min-w-32 break-words">{row.requestingParty || (row.submitter ? `${row.submitter.firstName} ${row.submitter.lastName}` : 'Not recorded')}</p>{!row.requestingParty && <span className="text-xs text-slate-500">Current account name (legacy)</span>}</td>
      <td className="px-4 py-4"><p className="min-w-36 max-w-60 break-words">{getWorkLocation(row)}</p></td>
      <td className="px-4 py-4"><p className="min-w-52 max-w-80 whitespace-pre-wrap break-words">{row.description}</p></td>
      <td className="px-4 py-4"><p className="min-w-40">{REQUEST_PRIORITIES.find(priority => priority.value === row.requestedPriority)?.label || 'Not recorded on official form (legacy)'}</p></td>
      <td className="px-4 py-4"><div className="w-40">{row.photoUrl ? <PhotoGallery photoUrl={row.photoUrl} label="Photo Evidence" /> : <span className="text-slate-500">No photos attached</span>}</div></td>
      <td className="px-4 py-4"><span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{row.status.replaceAll('_', ' ')}</span></td>
      <td className="px-4 py-4">{row.assignee ? <><p className="min-w-28 break-words">{row.assignee.firstName} {row.assignee.lastName}</p>{row.assignedToDesignatedHead === false && <p className="text-xs text-slate-500">Historical technician assignment</p>}</> : <span className="text-slate-500">Not relayed</span>}</td>
      <td className="px-4 py-4"><div className="flex flex-col gap-2"><button type="button" onClick={() => onView(row.id)} title="View Request" aria-label={`View request ${row.requestCode}`} className="rounded border px-3 py-2 text-blue-900">View / review</button>{row.status === 'APPROVED' && !row.assignedToId && <button type="button" onClick={() => onAssign(row.id)} title="Relay to Technician Head" aria-label={`Relay ${row.requestCode} to technician head`} className="rounded bg-blue-900 px-3 py-2 text-white">Relay to head</button>}{row.status === 'PENDING' && <button type="button" onClick={() => onReject(row.id)} title="Reject Request" aria-label={`Reject request ${row.requestCode}`} className="rounded border px-3 py-2 text-red-700">Reject</button>}<button type="button" onClick={() => onDelete(row.id)} title="Delete Request Permanently" aria-label={`Delete request ${row.requestCode}`} className="rounded border px-3 py-2 text-red-700">Delete</button></div></td>
    </tr>)}
  </tbody></table></div><p className="border-t bg-slate-50 px-4 py-3 text-xs text-slate-600">Fields follow the submitted form. Scroll horizontally on smaller screens. Approval automatically forwards to the designated technician head; worker selection stays in the technician portal.</p></div>;
}
