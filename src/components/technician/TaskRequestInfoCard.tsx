import React from 'react';
import { IssueType, UrgencyLevel } from '@prisma/client';

interface TaskRequestInfoCardProps {
  request: {
    requestCode: string;
    issueType: IssueType;
    building: string;
    roomNumber: string;
    description: string;
    urgencyLevel: UrgencyLevel;
    photoUrl: string | null;
    submitter: {
      firstName: string;
      lastName: string;
    };
  };
}

export const TaskRequestInfoCard: React.FC<TaskRequestInfoCardProps> = ({ request }) => {
  const getIssueTypeInfo = (type: IssueType) => {
    switch (type) {
      case 'HVAC':
        return { icon: 'hvac', label: 'HVAC System Issue' };
      case 'ELECTRICAL':
        return { icon: 'bolt', label: 'Electrical Issue' };
      case 'PLUMBING':
        return { icon: 'water_drop', label: 'Plumbing Issue' };
      case 'CARPENTRY':
        return { icon: 'handyman', label: 'Carpentry Issue' };
      case 'STRUCTURAL':
        return { icon: 'foundation', label: 'Structural Issue' };
      default:
        return { icon: 'build', label: 'General Issue' };
    }
  };

  const formatBuilding = (building: string) => {
    return building
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getUrgencyBadge = (urgency: UrgencyLevel) => {
    switch (urgency) {
      case 'URGENT':
        return 'bg-error text-on-error';
      case 'HIGH':
        return 'bg-tertiary-container text-on-tertiary-container';
      case 'NORMAL':
      case 'LOW':
        return 'bg-surface-container-high text-on-surface-variant border border-outline-variant';
      default:
        return 'bg-surface-container-high text-on-surface-variant border border-outline-variant';
    }
  };

  const issueInfo = getIssueTypeInfo(request.issueType);
  const urgencyBadge = getUrgencyBadge(request.urgencyLevel);

  return (
    <div className="bg-white rounded-xl shadow-[0_4px_12px_rgba(30,58,138,0.08)] border border-slate-100 overflow-hidden flex flex-col h-full">
      <div className="bg-[#1E3A8A] px-6 py-4">
        <h2 className="font-semibold text-white">Request Information</h2>
      </div>

      <div className="p-6 space-y-5 flex-1">
        <div className="flex flex-col gap-1 border-b border-slate-100 pb-4">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            REQUESTER
          </span>
          <span className="text-sm font-medium text-slate-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-slate-400">person</span>
            {request.submitter.firstName} {request.submitter.lastName}
          </span>
        </div>

        <div className="flex flex-col gap-1 border-b border-slate-100 pb-4">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            LOCATION
          </span>
          <span className="text-sm font-medium text-slate-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-slate-400">location_on</span>
            {formatBuilding(request.building)}, {request.roomNumber}
          </span>
        </div>

        <div className="flex flex-col gap-1 border-b border-slate-100 pb-4">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            REPORTED ISSUE
          </span>
          <span className="text-sm font-medium text-slate-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-slate-400">{issueInfo.icon}</span>
            {issueInfo.label}
          </span>
        </div>

        <div className="flex flex-col gap-1 border-b border-slate-100 pb-4">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            DATE SUBMITTED
          </span>
          <span className="text-sm font-medium text-slate-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-slate-400">calendar_today</span>
            {/* The task doesn't have a specific createdAt in the request type provided, we will just show a static placeholder or use what's available. Assuming request has a date? Let's check the props: requestCode, issueType, building, roomNumber, description, urgencyLevel, photoUrl, submitter. No date in props interface. I will omit Date Submitted or put "N/A" since it wasn't in the original. Oh, wait, "Fields: Requester, Location, Issue Type, Urgency (as colored badge), Date Submitted". Urgency is not in left panel anymore as it moved to header? The prompt says "Fields: Requester, Location, Issue Type, Urgency (as colored badge), Date Submitted". Wait. "Remove the urgency badge from this card — it moved to the page header". So no urgency badge here. Let's just put the description now. */}
            Not available
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            ORIGINAL DESCRIPTION
          </span>
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <p className="text-sm text-slate-700 leading-relaxed italic">
              "{request.description}"
            </p>
          </div>
        </div>

        {request.photoUrl && (
          <div className="flex flex-col gap-2 pt-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              ATTACHED PHOTO
            </span>
            <img
              src={request.photoUrl}
              alt="Request Attachment"
              className="w-full rounded-lg object-cover max-h-48 border border-slate-200 cursor-pointer"
              onClick={() => window.open(request.photoUrl || '', '_blank')}
            />
          </div>
        )}
      </div>
    </div>
  );
};
