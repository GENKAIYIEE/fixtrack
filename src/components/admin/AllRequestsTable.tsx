'use client';

import React from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

export type RequestRow = {
  id: string;
  requestCode: string;
  issueType: string;
  building: string;
  roomNumber: string;
  urgencyLevel: string;
  status: string;
  description: string;
  createdAt: string;
  submittedById: string;
  assignedToId: string | null;
  submitter: { firstName: string; lastName: string } | null;
  assignee: { firstName: string; lastName: string } | null;
};

type AllRequestsTableProps = {
  requests: RequestRow[];
  selectedIds: string[];
  isLoading: boolean;
  onSelectAll: (checked: boolean) => void;
  onSelectOne: (id: string, checked: boolean) => void;
  onView: (id: string) => void;
  onAssign: (id: string) => void;
  onReject: (id: string) => void;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const AVATAR_CYCLES = [
  'bg-[#dce1ff] text-[#00236f]',
  'bg-[#dce1ff] text-[#4b1c00]',
  'bg-[#e3e1e9] text-[#444651]',
];

function getInitials(first?: string, last?: string): string {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || '?';
}

function formatBuilding(raw: string): string {
  return raw
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

function formatIssueType(raw: string): string {
  if (raw === 'HVAC') return 'HVAC';
  return raw.charAt(0) + raw.slice(1).toLowerCase();
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) +
    ', ' +
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function UrgencyBadge({ level }: { level: string }) {
  switch (level) {
    case 'URGENT':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#EF4444] text-white">
          <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
          Urgent
        </span>
      );
    case 'HIGH':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F97316] text-white">
          <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>priority_high</span>
          High
        </span>
      );
    case 'NORMAL':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#e3e1e9] text-[#444651]">
          Normal
        </span>
      );
    case 'LOW':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#e3e1e9] text-[#444651]">
          Low
        </span>
      );
  }
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'PENDING':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FEF08A] text-[#854D0E]">
          Pending
        </span>
      );
    case 'ONGOING':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#DBEAFE] text-[#1E3A8A]">
          Ongoing
        </span>
      );
    case 'COMPLETED':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#DCFCE7] text-[#166534]">
          Completed
        </span>
      );
    case 'REJECTED':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#e3e1e9] text-[#444651]">
          Rejected
        </span>
      );
    case 'CANCELLED':
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#e3e1e9] text-[#444651]">
          Cancelled
        </span>
      );
  }
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonRow({ index }: { index: number }) {
  return (
    <tr className={index % 2 === 0 ? 'bg-[#F1F5F9]' : 'bg-white'}>
      {Array.from({ length: 9 }).map((_, i) => (
        <td key={i} className="px-4 py-4">
          <div className="h-4 bg-slate-200 rounded animate-pulse" />
        </td>
      ))}
    </tr>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function AllRequestsTable({
  requests,
  selectedIds,
  isLoading,
  onSelectAll,
  onSelectOne,
  onView,
  onAssign,
  onReject,
}: AllRequestsTableProps) {
  const allSelected = requests.length > 0 && requests.every((r) => selectedIds.includes(r.id));
  const someSelected = selectedIds.length > 0 && !allSelected;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          {/* ── Header ── */}
          <thead>
            <tr className="bg-[#1E3A8A] text-white">
              {/* Checkbox */}
              <th className="px-4 py-4 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected; }}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 accent-[#2563EB] cursor-pointer"
                  aria-label="Select all requests"
                />
              </th>
              <th className="px-4 py-4 font-table-header text-table-header uppercase tracking-wider">ID</th>
              <th className="px-4 py-4 font-table-header text-table-header uppercase tracking-wider">Submitter</th>
              <th className="px-4 py-4 font-table-header text-table-header uppercase tracking-wider">Type &amp; Location</th>
              <th className="px-4 py-4 font-table-header text-table-header uppercase tracking-wider">Urgency</th>
              <th className="px-4 py-4 font-table-header text-table-header uppercase tracking-wider">Status</th>
              <th className="px-4 py-4 font-table-header text-table-header uppercase tracking-wider">Assigned To</th>
              <th className="px-4 py-4 font-table-header text-table-header uppercase tracking-wider">Date Logged</th>
              <th className="px-4 py-4 font-table-header text-table-header uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>

          {/* ── Body ── */}
          <tbody className="divide-y divide-slate-100">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} index={i} />)
              : requests.length === 0
              ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <span className="material-symbols-outlined text-[48px]">inbox</span>
                      <p className="text-sm font-medium">No requests found</p>
                      <p className="text-xs">Try adjusting your filters</p>
                    </div>
                  </td>
                </tr>
              )
              : requests.map((req, index) => {
                  const isSelected = selectedIds.includes(req.id);
                  const avatarClass = AVATAR_CYCLES[index % AVATAR_CYCLES.length];
                  const initials = getInitials(req.submitter?.firstName, req.submitter?.lastName);
                  const submitterName = req.submitter
                    ? `${req.submitter.firstName} ${req.submitter.lastName}`
                    : 'Unknown';
                  const assigneeName = req.assignee
                    ? `${req.assignee.firstName} ${req.assignee.lastName}`
                    : null;

                  return (
                    <tr
                      key={req.id}
                      className={`${index % 2 === 0 ? 'bg-[#F1F5F9]' : 'bg-white'} hover:bg-[#DBEAFE] transition-colors duration-150 ${isSelected ? 'ring-1 ring-inset ring-[#2563EB]/30' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => onSelectOne(req.id, e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 accent-[#2563EB] cursor-pointer"
                          aria-label={`Select request ${req.requestCode}`}
                        />
                      </td>

                      {/* ID */}
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-[#00236f] text-sm">{req.requestCode}</span>
                      </td>

                      {/* Submitter */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${avatarClass}`}>
                            {initials}
                          </div>
                          <span className="text-sm text-slate-700 font-medium whitespace-nowrap">{submitterName}</span>
                        </div>
                      </td>

                      {/* Type & Location */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-800">{formatIssueType(req.issueType)}</span>
                          <span className="text-xs text-slate-500 mt-0.5">
                            {formatBuilding(req.building)} · Rm {req.roomNumber}
                          </span>
                        </div>
                      </td>

                      {/* Urgency */}
                      <td className="px-4 py-3.5">
                        <UrgencyBadge level={req.urgencyLevel} />
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <StatusBadge status={req.status} />
                      </td>

                      {/* Assigned To */}
                      <td className="px-4 py-3.5">
                        {assigneeName ? (
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px] text-[#2563EB]">engineering</span>
                            <span className="text-sm text-slate-700">{assigneeName}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-[#757682] italic">Unassigned</span>
                        )}
                      </td>

                      {/* Date Logged */}
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-slate-600 whitespace-nowrap">{formatDate(req.createdAt)}</span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          {/* View — always visible */}
                          <button
                            onClick={() => onView(req.id)}
                            title="View Request"
                            className="p-1.5 rounded-lg text-[#00236f] hover:bg-[#dce1ff] transition-colors"
                            aria-label={`View request ${req.requestCode}`}
                          >
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </button>

                          {/* Assign — only if PENDING and unassigned */}
                          {req.status === 'PENDING' && !req.assignedToId && (
                            <button
                              onClick={() => onAssign(req.id)}
                              title="Assign Technician"
                              className="p-1.5 rounded-lg text-[#2563EB] hover:bg-[#dbe1ff] transition-colors"
                              aria-label={`Assign technician to ${req.requestCode}`}
                            >
                              <span className="material-symbols-outlined text-[18px]">person_add</span>
                            </button>
                          )}

                          {/* Reject — only if PENDING */}
                          {req.status === 'PENDING' && (
                            <button
                              onClick={() => onReject(req.id)}
                              title="Reject Request"
                              className="p-1.5 rounded-lg text-[#ba1a1a] hover:bg-[#ffdad6] transition-colors"
                              aria-label={`Reject request ${req.requestCode}`}
                            >
                              <span className="material-symbols-outlined text-[18px]">cancel</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
