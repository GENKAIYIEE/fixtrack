'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Request = {
  id: string;
  requestCode: string;
  issueType: string;
  building: string;
  roomNumber: string;
  status: string;
  createdAt: string;
};

type Props = {
  requests: Request[] | null;
  isLoading: boolean;
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

function SkeletonRow() {
  return (
    <tr>
      {[...Array(6)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-outline-variant/20 rounded animate-pulse w-full" />
        </td>
      ))}
    </tr>
  );
}

export default function StudentRecentRequests({ requests, isLoading }: Props) {
  const router = useRouter();

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant overflow-hidden">
      {/* Card Header */}
      <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
        <span className="font-h2 text-h2 text-on-surface text-[20px] font-semibold">
          Recent Requests
        </span>
        <Link
          href="/user/requests"
          className="font-label-md text-label-md text-secondary hover:underline underline-offset-4"
        >
          View All →
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-primary-container text-on-primary font-table-header text-table-header text-xs uppercase tracking-wider">
              <th className="px-4 py-3 font-semibold">ID</th>
              <th className="px-4 py-3 font-semibold">Issue Type</th>
              <th className="px-4 py-3 font-semibold">Location</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Date Logged</th>
              <th className="px-4 py-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
            ) : !requests || requests.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <span
                      className="material-symbols-outlined text-outline"
                      style={{ fontSize: '48px' }}
                    >
                      assignment
                    </span>
                    <span className="font-h2 text-on-surface-variant text-lg font-semibold">
                      No requests yet
                    </span>
                    <span className="font-body-sm text-body-sm text-outline text-sm">
                      Submit your first maintenance request to get started.
                    </span>
                    <button
                      onClick={() => router.push('/user/requests/new')}
                      className="mt-2 bg-secondary text-on-secondary px-4 py-2 rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity"
                    >
                      Submit Request
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              requests.map((req, idx) => (
                <tr
                  key={req.id}
                  className={`${
                    idx % 2 === 0
                      ? 'bg-surface-container-lowest'
                      : 'bg-surface-container-low'
                  } hover:bg-primary-fixed/20 transition-colors`}
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/user/requests/${req.id}`}
                      className="font-label-md text-label-md text-secondary hover:underline underline-offset-2"
                    >
                      {req.requestCode}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-body-sm text-body-sm text-on-surface-variant text-sm">
                    {issueTypeLabels[req.issueType] ?? req.issueType}
                  </td>
                  <td className="px-4 py-3 font-body-sm text-body-sm text-on-surface-variant text-sm">
                    {buildingLabels[req.building] ?? req.building}
                    {req.roomNumber ? ` — ${req.roomNumber}` : ''}
                  </td>
                  <td className="px-4 py-3">
                    <span className={statusBadge[req.status] ?? statusBadge['CANCELLED']}>
                      {req.status.charAt(0) + req.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-body-sm text-body-sm text-on-surface-variant text-sm">
                    {formatDate(req.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => router.push(`/user/requests/${req.id}`)}
                      className="p-1.5 text-secondary hover:bg-primary-fixed rounded transition-colors"
                      aria-label={`View request ${req.requestCode}`}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: '20px' }}
                      >
                        visibility
                      </span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
