'use client';

import Link from 'next/link';
import RequestStatusTimeline from './RequestStatusTimeline';

type Request = {
  id: string;
  requestCode: string;
  title: string;
  issueType: string;
  building: string;
  roomNumber: string;
  status: string;
  priorityLevel: string;
  urgencyLevel: string;
  photoUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

const issueTypeLabels: Record<string, string> = {
  HVAC: 'HVAC',
  ELECTRICAL: 'Electrical',
  PLUMBING: 'Plumbing',
  CARPENTRY: 'Carpentry',
  STRUCTURAL: 'Structural',
  OTHERS: 'Others',
};

const buildingLabels: Record<string, string> = {
  IT_BUILDING: 'IT Building',
  ADMIN_BUILDING: 'Admin Building',
  LIBRARY: 'Library',
  GYMNASIUM: 'Gymnasium',
  CANTEEN: 'Canteen',
  DORMITORY: 'Dormitory',
  OTHERS: 'Others',
};

const statusBadge: Record<string, string> = {
  PENDING:
    'bg-tertiary-container text-on-tertiary-container rounded-full px-2.5 py-0.5 text-xs font-semibold',
  ONGOING:
    'bg-secondary-container text-on-secondary rounded-full px-2.5 py-0.5 text-xs font-semibold',
  COMPLETED:
    'bg-secondary-fixed text-on-secondary-fixed rounded-full px-2.5 py-0.5 text-xs font-semibold',
  REJECTED:
    'bg-error-container text-on-error-container rounded-full px-2.5 py-0.5 text-xs font-semibold',
  CANCELLED:
    'bg-surface-variant text-on-surface-variant rounded-full px-2.5 py-0.5 text-xs font-semibold',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
}

export default function RequestItem({ request }: { request: Request }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant overflow-hidden">
      <Link
        href={`/user/requests/${request.id}`}
        className="block p-6 hover:bg-primary-fixed/20 transition-colors"
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="font-h2 text-h2 text-on-surface text-[20px] font-semibold">
                {request.requestCode}
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                {request.title}
              </p>
            </div>
            <div className="text-right">
              <RequestStatusTimeline status={request.status as any} />
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-label-md text-label-md text-on-surface mb-1">
                Issue Type
              </p>
              <p className="font-body-md text-body-md text-on-surface-variant">
                {issueTypeLabels[request.issueType] ?? request.issueType}
              </p>
            </div>
            <div>
              <p className="font-label-md text-label-md text-on-surface mb-1">
                Location
              </p>
              <p className="font-body-md text-body-md text-on-surface-variant">
                {buildingLabels[request.building] ?? request.building}{request.roomNumber ? ` — ${request.roomNumber}` : ''}
              </p>
            </div>
            <div>
              <p className="font-label-md text-label-md text-on-surface mb-1">
                Priority
              </p>
              <p className="font-body-md text-body-md text-on-surface-variant">
                {request.priorityLevel.charAt(0) + request.priorityLevel.slice(1).toLowerCase()}
              </p>
            </div>
            <div>
              <p className="font-label-md text-label-md text-on-surface mb-1">
                Urgency
              </p>
              <p className="font-body-md text-body-md text-on-surface-variant">
                {request.urgencyLevel.charAt(0) + request.urgencyLevel.slice(1).toLowerCase()}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-outline-variant/50">
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Logged: {formatDate(request.createdAt)}
            </p>
            {request.photoUrl && (
              <img
                src={request.photoUrl}
                alt="Request photo"
                className="h-10 w-10 object-cover rounded-lg border border-outline-variant"
              />
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}