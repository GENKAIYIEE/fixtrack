import { formatRequestDate } from '@/lib/requests/form';
import { getWorkLocation, RequestDisplayFields } from '@/lib/requests/display';

export interface OfficialRequestDetailsData extends RequestDisplayFields {
  requestDate?: string | Date | null;
  requestingParty?: string | null;
  requestedPriority?: string | null;
  createdAt?: string | Date;
  submitter?: { firstName: string; lastName: string } | null;
}
export default function OfficialRequestDetails({ request, showDescription = true }: {
  request: OfficialRequestDetailsData; showDescription?: boolean;
}) {
  const priorityLabels: Record<string, string> = {
    HIGH: 'High - Must be done within 24 hours.', MEDIUM: 'Medium - Within the week.', LOW: 'Low – When you get a chance.',
  };
  return (
    <dl className="grid gap-6 text-sm sm:grid-cols-2">
      <div><dt className="mb-1 font-medium text-slate-500">Date of Request:</dt><dd className="text-slate-900">{request.requestDate ? formatRequestDate(request.requestDate) : 'Not recorded (legacy request)'}</dd></div>
      <div><dt className="mb-1 font-medium text-slate-500">Requesting Party:</dt><dd className="text-slate-900">{request.requestingParty || (request.submitter ? `${request.submitter.firstName} ${request.submitter.lastName} (current account name; legacy request)` : 'Not recorded (legacy request)')}</dd></div>
      <div className="sm:col-span-2"><dt className="mb-1 font-medium text-slate-500">Work Location:</dt><dd className="break-words text-slate-900">{getWorkLocation(request)}</dd></div>
      {showDescription && <div className="sm:col-span-2"><dt className="mb-2 font-medium text-slate-500">Description of work/repair:</dt><dd className="whitespace-pre-wrap break-words rounded-md border border-slate-200 bg-slate-50 p-4 leading-relaxed text-slate-900">{request.description}</dd></div>}
      <div className="sm:col-span-2"><dt className="mb-1 font-medium text-slate-500">Requested Priority:</dt><dd className="text-slate-900">{request.requestedPriority ? priorityLabels[request.requestedPriority] || request.requestedPriority : 'Not recorded on the official form (legacy request)'}</dd></div>
      {request.issueType && <div><dt className="mb-1 font-medium text-slate-500">Legacy Issue Type</dt><dd>{request.issueType.replaceAll('_', ' ')}</dd></div>}
    </dl>
  );
}
