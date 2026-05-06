'use client';

import React from 'react';
import Link from 'next/link';
import type { MaintenanceRequest } from '@/generated/prisma/client';

type PriorityQueueProps = {
  urgentRequests: Partial<MaintenanceRequest>[];
};

export default function PriorityQueue({ urgentRequests }: PriorityQueueProps) {
  const formatBuilding = (building?: string) => {
    if (!building) return '';
    return building.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getRelativeTime = (date?: Date) => {
    if (!date) return '';
    const diff = new Date().getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes} mins ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hrs ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };

  return (
    <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
      <div className="bg-white rounded-xl shadow-[0_4px_12px_rgba(30,58,138,0.08)] border border-slate-100 p-6 flex-1">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-h2 text-h2 text-slate-900">Priority Queue</h3>
          <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {urgentRequests.length} Urgent
          </span>
        </div>
        
        <div className="flex flex-col gap-4">
          {urgentRequests.map((req, i) => (
            <div key={req.id || i} className="bg-[#F1F5F9] rounded-lg p-4 border border-red-200 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
              
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-label-md text-label-md text-slate-900 font-bold">{req.requestCode}</h4>
                <span className="material-symbols-outlined text-red-500 text-[18px]">warning</span>
              </div>
              
              <p className="font-body-sm text-body-sm text-slate-700 mb-3 line-clamp-2">
                {req.description}
              </p>
              
              <div className="flex justify-between items-center text-xs text-slate-500 font-medium mb-3">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">location_on</span> 
                  {formatBuilding(req.building)}
                </span>
                <span>{getRelativeTime(req.createdAt)}</span>
              </div>
              
              <Link 
                href="/admin/assignments" 
                className="block text-center w-full bg-[#2563EB] text-white font-label-md text-label-md px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Assign Now
              </Link>
            </div>
          ))}
          
          {urgentRequests.length === 0 && (
            <div className="text-center py-8 text-slate-500 text-sm">
              No urgent requests in queue.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
