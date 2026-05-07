'use client';

import React from 'react';

export interface UnassignedRequest {
  id: string;
  requestCode: string;
  issueType: string;
  urgencyLevel: string;
  description: string;
  createdAt: string;
  submittedBy?: {
    firstName: string;
    lastName: string;
  };
}

interface UnassignedRequestsPanelProps {
  requests: UnassignedRequest[];
  selectedRequestId: string | null;
  onSelect: (id: string) => void;
}

export default function UnassignedRequestsPanel({
  requests,
  selectedRequestId,
  onSelect,
}: UnassignedRequestsPanelProps) {
  const getUrgencyColors = (urgency: string) => {
    switch (urgency) {
      case 'URGENT':
        return { bar: 'bg-error', badge: 'bg-error text-white' };
      case 'HIGH':
        return { bar: 'bg-orange-500', badge: 'bg-orange-500 text-white' };
      case 'NORMAL':
        return { bar: 'bg-secondary', badge: 'bg-surface-variant text-on-surface-variant' };
      case 'LOW':
        return { bar: 'bg-outline', badge: 'bg-surface-variant text-on-surface-variant' };
      default:
        return { bar: 'bg-outline', badge: 'bg-surface-variant text-on-surface-variant' };
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="flex flex-col h-full bg-surface rounded-xl shadow-sm border border-outline-variant overflow-hidden">
      {/* Panel Header */}
      <div className="bg-surface-container-low p-4 flex items-center gap-3 border-b border-outline-variant">
        <span className="material-symbols-outlined text-on-surface-variant">assignment_late</span>
        <h2 className="text-base font-bold text-on-surface flex-1">Unassigned Approved Requests</h2>
        <span className="bg-primary text-on-primary text-xs font-bold px-2 py-0.5 rounded-full">
          {requests.length}
        </span>
      </div>

      {/* Requests List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {requests.length === 0 ? (
          <div className="text-center text-on-surface-variant text-sm py-8">
            No unassigned requests.
          </div>
        ) : (
          requests.map((request) => {
            const colors = getUrgencyColors(request.urgencyLevel);
            const isSelected = selectedRequestId === request.id;

            return (
              <div
                key={request.id}
                className={`relative bg-surface border rounded-lg p-4 transition-all hover:border-primary/30 flex flex-col ${
                  isSelected ? 'ring-2 ring-primary border-primary' : 'border-outline-variant'
                }`}
                onClick={() => onSelect(request.id)}
              >
                {/* Left Accent Bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${colors.bar}`} />

                <div className="flex justify-between items-start mb-1 pl-2">
                  <span className="text-xs font-bold text-outline uppercase tracking-wider">
                    {request.requestCode}
                  </span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${colors.badge}`}>
                    {request.urgencyLevel}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-on-surface mb-2 pl-2">
                  {request.issueType}
                </h3>

                <p className="text-xs text-on-surface-variant line-clamp-2 mb-3 pl-2">
                  {request.description}
                </p>

                <div className="flex items-center justify-between mt-auto pl-2">
                  <span className="text-[11px] text-on-surface-variant">
                    {getTimeAgo(request.createdAt)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(request.id);
                    }}
                    className={`text-xs font-bold px-3 py-1.5 rounded-md transition-colors ${
                      isSelected ? 'bg-primary text-on-primary' : 'bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary'
                    }`}
                  >
                    {isSelected ? 'Selected' : 'Assign'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
