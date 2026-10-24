'use client';
import { TechnicianData } from './TechnicianCard';
interface Props {
  technicians: TechnicianData[]; selectedTechnicianId: string | null;
  onSelect: (id: string) => void; hasRequestSelected?: boolean;
}
export default function TechnicianAvailabilityBoard({ technicians, selectedTechnicianId, onSelect, hasRequestSelected = false }: Props) {
  const head = technicians[0];
  return (
    <section className="h-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Designated Technician Head</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">The technician head handles the request in FixTrack and contacts the appropriate maintenance worker by phone or in person. Individual workers do not need FixTrack accounts.</p>
      {head ? <button type="button" disabled={!hasRequestSelected} onClick={() => onSelect(head.id)} aria-pressed={selectedTechnicianId === head.id}
        className={`mt-6 w-full rounded-lg border-2 p-5 text-left disabled:opacity-60 ${selectedTechnicianId === head.id ? 'border-blue-800 bg-blue-50' : 'border-slate-200'}`}>
        <span className="block font-semibold text-slate-900">{head.firstName} {head.lastName}</span>
        <span className="mt-1 block break-all text-sm text-slate-600">{head.email}</span>
        <span className="mt-1 block text-sm text-slate-600">Technician Head · {head.activeTaskCount} active tasks</span>
        <span className="mt-3 block text-xs text-blue-900">{hasRequestSelected ? 'Select to relay this request' : 'Select an approved request first'}</span>
      </button> : <p role="alert" className="mt-6 rounded-md bg-amber-50 p-4 text-sm text-amber-900">The designated head account is unavailable. Verify that the configured email belongs to an existing active technician. No worker account will be selected as a fallback.</p>}
    </section>
  );
}
