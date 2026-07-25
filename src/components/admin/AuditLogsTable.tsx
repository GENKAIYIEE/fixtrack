'use client';

import React from 'react';
import { format } from 'date-fns';

export interface AuditLogRow {
  id: string;
  userId: string | null;
  user: { firstName: string; lastName: string; role: string } | null;
  action: string;
  affectedRecordId: string | null;
  affectedRecordType: string | null;
  ipAddress: string | null;
  details: string | null;
  createdAt: string;
}

interface AuditLogsTableProps {
  logs: AuditLogRow[];
  isLoading: boolean;
}

function formatActionLabel(action: string): { label: string; className: string } {
  switch (action) {
    case 'LOGIN': return { label: 'Logged In', className: 'text-on-surface' };
    case 'LOGOUT': return { label: 'Logged Out', className: 'text-on-surface' };
    case 'REQUEST_SUBMITTED': return { label: 'Submitted Request', className: 'text-secondary-container' };
    case 'REQUEST_APPROVED': return { label: 'Approved Request', className: 'text-secondary-container' };
    case 'REQUEST_REJECTED': return { label: 'Rejected Request', className: 'text-error' };
    case 'REQUEST_CANCELLED': return { label: 'Cancelled Request', className: 'text-error' };
    case 'TASK_ASSIGNED': return { label: 'Task Assigned', className: 'text-on-surface' };
    case 'TASK_REASSIGNED': return { label: 'Reassigned', className: 'text-secondary-container' };
    case 'STATUS_UPDATED': return { label: 'Status Updated', className: 'text-on-surface' }; // dynamic logic applied later
    case 'TASK_COMPLETED': return { label: 'Task Completed', className: 'text-primary font-bold' };
    case 'USER_CREATED': return { label: 'User Created', className: 'text-on-surface' };
    case 'USER_UPDATED': return { label: 'User Updated', className: 'text-on-surface' };
    case 'USER_DEACTIVATED': return { label: 'User Deactivated', className: 'text-error' };
    case 'PASSWORD_RESET': return { label: 'Password Reset', className: 'text-on-surface' };
    default: return { label: action, className: 'text-on-surface' };
  }
}

function renderStatusBadges(details: string | null) {
  if (!details) return null;
  
  // Split on known status keywords to wrap them in badges
  const keywords = ['PENDING', 'ONGOING', 'COMPLETED', 'REJECTED', 'CANCELLED'];
  const regex = new RegExp(`(${keywords.join('|')})`, 'g');
  const parts = details.split(regex);
  
  return parts.map((part, index) => {
    switch (part) {
      case 'PENDING':
        return <span key={index} className="bg-surface-variant px-1 rounded text-xs inline-block mx-0.5">{part}</span>;
      case 'ONGOING':
        return <span key={index} className="bg-tertiary-container text-on-tertiary px-1 rounded text-xs inline-block mx-0.5">{part}</span>;
      case 'COMPLETED':
        return <span key={index} className="bg-primary-fixed text-on-primary-fixed px-1 rounded text-xs font-bold inline-block mx-0.5">{part}</span>;
      case 'REJECTED':
        return <span key={index} className="bg-error-container text-on-error-container px-1 rounded text-xs inline-block mx-0.5">{part}</span>;
      case 'CANCELLED':
        return <span key={index} className="bg-surface-variant text-on-surface-variant px-1 rounded text-xs inline-block mx-0.5">{part}</span>;
      default:
        return <span key={index}>{part}</span>;
    }
  });
}

export default function AuditLogsTable({ logs, isLoading }: AuditLogsTableProps) {
    if (isLoading) {
      return (
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-body text-on-surface table-fixed min-w-[800px]">
          <thead className="bg-primary text-on-primary border-b border-outline-variant font-label-md text-label-md">
            <tr>
              <th className="px-6 py-4 w-40">Timestamp</th>
              <th className="px-6 py-4 w-48">User</th>
              <th className="px-6 py-4 w-40">Action</th>
              <th className="px-6 py-4 w-32">Record</th>
              <th className="px-6 py-4">Details</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(15)].map((_, i) => (
              <tr key={i} className="border-b border-outline-variant/30">
                <td className="px-6 py-4"><div className="h-4 bg-outline-variant/30 rounded animate-pulse w-24"></div></td>
                <td className="px-6 py-4"><div className="h-6 bg-outline-variant/30 rounded-full animate-pulse w-32"></div></td>
                <td className="px-6 py-4"><div className="h-4 bg-outline-variant/30 rounded animate-pulse w-20"></div></td>
                <td className="px-6 py-4"><div className="h-5 bg-outline-variant/30 rounded animate-pulse w-16"></div></td>
                <td className="px-6 py-4"><div className="h-4 bg-outline-variant/30 rounded animate-pulse w-48"></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left text-body text-on-surface table-fixed min-w-[800px]">
          <thead className="bg-primary text-on-primary border-b border-outline-variant font-label-md text-label-md">
            <tr>
              <th className="px-6 py-4 w-40">Timestamp</th>
              <th className="px-6 py-4 w-48">User</th>
              <th className="px-6 py-4 w-40">Action</th>
              <th className="px-6 py-4 w-32">Record</th>
              <th className="px-6 py-4">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-on-surface-variant font-medium">
                  No audit logs found matching the current filters.
                </td>
              </tr>
            ) : (
              logs.map((log, index) => {
                const isEven = index % 2 === 0;
                const rowBg = isEven ? 'bg-surface-container-lowest' : 'bg-surface-container-low';
                
                const isCompletion = log.action === 'TASK_COMPLETED' || (log.action === 'STATUS_UPDATED' && log.details?.includes('COMPLETED'));
                const borderLeftClass = isCompletion ? 'border-l-4 border-l-primary' : '';
                
                let actionData = formatActionLabel(log.action);
                if (log.action === 'STATUS_UPDATED' && log.details?.includes('COMPLETED')) {
                  actionData = { label: 'Status Updated', className: 'font-bold text-primary' };
                }

                // Render User Pill
                let userPillClass = '';
                let userIcon = '';
                let userName = 'System';

                if (!log.user || !log.userId) {
                  userPillClass = 'bg-surface-container-high border-outline-variant/50';
                  userIcon = 'smart_toy';
                } else {
                  userName = `${log.user.firstName} ${log.user.lastName}`;
                  if (log.user.role === 'ADMIN') {
                    userPillClass = 'bg-tertiary-fixed text-on-tertiary-fixed border-tertiary-fixed-dim';
                    userIcon = 'admin_panel_settings';
                  } else if (log.user.role === 'TECHNICIAN') {
                    userPillClass = 'bg-primary-container text-on-primary-container border-primary-fixed';
                    userIcon = 'engineering';
                  } else {
                    userPillClass = 'bg-surface-container-high border-outline-variant/50';
                    userIcon = 'person';
                  }
                }

                return (
                  <tr key={log.id} className={`${rowBg} hover:bg-surface-variant/30 transition-colors ${borderLeftClass}`}>
                    <td className="px-6 py-4 text-on-surface-variant font-medium truncate text-sm" title={format(new Date(log.createdAt), 'MMM dd, hh:mm a')}>
                      {format(new Date(log.createdAt), 'MMM dd, hh:mm a')}
                    </td>
                    <td className="px-6 py-4 truncate">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-label-md text-label-md max-w-full ${userPillClass}`} title={userName}>
                        <span className={`material-symbols-outlined text-[16px] shrink-0 ${(!log.user || !log.userId || !['ADMIN', 'TECHNICIAN'].includes(log.user.role)) ? 'text-outline' : ''}`}>
                          {userIcon}
                        </span>
                        <span className="truncate">{userName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 truncate font-medium text-sm" title={actionData.label}>
                      <span className={actionData.className}>{actionData.label}</span>
                    </td>
                    <td className="px-6 py-4 truncate">
                      {log.affectedRecordId ? (
                        <span className="font-mono bg-surface-container px-2 py-0.5 rounded text-xs border border-surface-dim truncate inline-block max-w-full" title={log.affectedRecordId}>
                          {log.affectedRecordId}
                        </span>
                      ) : (
                        <span className="text-on-surface-variant">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant text-sm break-words whitespace-pre-wrap">
                      {renderStatusBadges(log.details)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
  );
}
