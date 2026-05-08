'use client';

import React from 'react';
import type { MaintenanceRequest } from '@prisma/client';

type LiveRequestsTableProps = {
  requests: Partial<MaintenanceRequest>[];
};

export default function LiveRequestsTable({ requests }: LiveRequestsTableProps) {
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

  const handleAction = (action: string, id?: string) => {
    console.log(`${action} request ${id}`);
    alert(`${action} request ${id} - This feature will be implemented in Screen 11.`);
  };

  // Status column logic based on HTML reference, some are Urgency, some are Status.
  // We'll prefer status, but if it's PENDING and Urgency is URGENT, maybe show URGENT.
  // We'll just show Status unless specified otherwise. Let's show Status or Urgency based on design.
  const getDisplayLabel = (req: Partial<MaintenanceRequest>) => {
    if (req.urgencyLevel === 'URGENT') return 'Urgent';
    if (req.status === 'PENDING') return 'Pending';
    return req.urgencyLevel === 'NORMAL' ? 'Normal' : req.status || 'Unknown';
  };

  return (
    <div className="bg-white rounded-xl shadow-[0_4px_12px_rgba(30,58,138,0.08)] overflow-hidden border border-slate-100">
      <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
        <h3 className="font-h2 text-h2 text-slate-900">Live Requests</h3>
        <button className="text-[#2563EB] font-label-md text-label-md hover:underline flex items-center gap-1">
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
            {requests.map((req, index) => {
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
                        onClick={() => handleAction('Approve', req.id)}
                        className="bg-emerald-500 text-white p-1.5 rounded-md hover:bg-emerald-600 shadow-sm" 
                        title="Approve"
                      >
                        <span className="material-symbols-outlined text-[18px]">check</span>
                      </button>
                      <button 
                        onClick={() => handleAction('Assign', req.id)}
                        className="bg-[#2563EB] text-white p-1.5 rounded-md hover:bg-blue-700 shadow-sm" 
                        title="Assign"
                      >
                        <span className="material-symbols-outlined text-[18px]">person_add</span>
                      </button>
                      <button 
                        onClick={() => handleAction('Reject', req.id)}
                        className="bg-red-500 text-white p-1.5 rounded-md hover:bg-red-600 shadow-sm" 
                        title="Reject"
                      >
                        <span className="material-symbols-outlined text-[18px]">close</span>
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
