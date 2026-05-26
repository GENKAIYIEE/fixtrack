'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import type { MaintenanceRequest } from '@prisma/client';

// FIXED: BUG-08 — Added onView prop to replace inline actions
type LiveRequestsTableProps = {
  requests: Partial<MaintenanceRequest>[];
  onView?: (id: string) => void;
};

export default function LiveRequestsTable({ requests, onView }: LiveRequestsTableProps) {
  // FIXED: BUG-09 — useRouter for View All navigation
  const router = useRouter();

  const getBadgeClasses = (statusOrUrgency: string) => {
    const val = statusOrUrgency.toUpperCase();
    switch (val) {
      case 'URGENT':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'PENDING':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'ONGOING':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'COMPLETED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'REJECTED':
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'NORMAL':
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const formatBuilding = (building?: string) => {
    if (!building) return '';
    return building.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getDisplayLabel = (req: Partial<MaintenanceRequest>) => {
    if (req.priorityLevel === 'URGENT') return 'Urgent';
    if (req.status === 'PENDING') return 'Pending';
    return req.priorityLevel === 'NORMAL' ? 'Normal' : req.status || 'Unknown';
  };

  return (
    <div className="bg-white rounded-xl shadow-[0_4px_12px_rgba(30,58,138,0.08)] overflow-hidden border border-slate-100">
      <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
        <h3 className="font-h2 text-h2 text-slate-900">Live Requests</h3>
        {/* FIXED: BUG-09 — Added onClick navigation to View All button */}
        <button
          onClick={() => router.push('/admin/requests')}
          className="text-[#2563EB] font-label-md text-label-md hover:underline flex items-center gap-1"
        >
          View All <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#1E3A8A] text-white">
              <th className="px-6 py-4 font-table-header text-table-header uppercase tracking-wider">ID</th>
              <th className="px-6 py-4 font-table-header text-table-header uppercase tracking-wider">Description</th>
              <th className="px-6 py-4 font-table-header text-table-header uppercase tracking-wider">Location</th>
              <th className="px-6 py-4 font-table-header text-table-header uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 font-table-header text-table-header uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="font-body-sm text-body-sm text-slate-700 divide-y divide-slate-100">
            {requests.slice(0, 3).map((req, index) => {
              const label = getDisplayLabel(req);
              const labelClasses = getBadgeClasses(label);

              return (
                <tr key={req.id || index} className={`${index % 2 === 0 ? 'bg-white' : 'bg-[#F1F5F9]'} hover:bg-[#DBEAFE] transition-colors group`}>
                  <td className="px-6 py-4 font-semibold text-slate-900">{req.requestCode}</td>
                  <td className="px-6 py-4">{req.description?.substring(0, 50)}{req.description && req.description.length > 50 ? '...' : ''}</td>
                  <td className="px-6 py-4">{formatBuilding(req.building)} - Rm {req.roomNumber}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${labelClasses}`}>
                      {label.charAt(0).toUpperCase() + label.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => req.id && onView?.(req.id)}
                        className="bg-emerald-500 text-white p-1.5 rounded-md hover:bg-emerald-600 shadow-sm"
                        title="View Request Details"
                      >
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                      </button>
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
