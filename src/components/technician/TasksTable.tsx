'use client';
// FIXED: BUG #3 — Added 'use client' directive for consistency; used inside client component tree

import Link from 'next/link';


export interface TaskRow {
  id: string;
  requestCode: string;
  issueType: string;
  building: string;
  roomNumber: string;
  urgencyLevel: string;
  status: string;
  assignedAt: string;
  completedAt: string | null;
  submitter: {
    firstName: string;
    lastName: string;
  };
}

interface TasksTableProps {
  tasks: TaskRow[];
  isLoading: boolean;
}

const getIssueTypeLabel = (type: string) => {
  const map: Record<string, string> = {
    HVAC: 'HVAC Repair',
    ELECTRICAL: 'Electrical Work',
    PLUMBING: 'Plumbing Leak',
    CARPENTRY: 'Carpentry Work',
    STRUCTURAL: 'Structural Repair',
    OTHERS: 'General Repair'
  };
  return map[type] || type;
};

const getBuildingLabel = (building: string) => {
  const map: Record<string, string> = {
    IT_BUILDING: 'IT Building',
    ADMIN_BUILDING: 'Admin Building',
    LIBRARY: 'Library',
    GYMNASIUM: 'Gymnasium',
    CANTEEN: 'Canteen',
    DORMITORY: 'Dormitory',
    OTHERS: 'Others'
  };
  return map[building] || building;
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  });
};

export default function TasksTable({ tasks, isLoading }: TasksTableProps) {
  if (isLoading) {
    return (
      <div className="bg-surface-container-lowest rounded-xl shadow-[0_8px_24px_rgba(30,58,138,0.08)] border-b-2 border-primary-container overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-primary-container text-white font-table-header text-table-header">
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Reported By</th>
              <th className="px-6 py-4">Location</th>
              <th className="px-6 py-4">Priority</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Assigned Date</th>
              <th className="px-6 py-4">Completed Date</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(10)].map((_, i) => (
              <tr key={i} className="border-t border-surface-variant animate-pulse bg-surface-container-lowest">
                <td className="px-6 py-4"><div className="h-4 bg-surface-variant rounded w-20"></div></td>
                <td className="px-6 py-4"><div className="h-4 bg-surface-variant rounded w-24"></div></td>
                <td className="px-6 py-4"><div className="h-4 bg-surface-variant rounded w-32"></div></td>
                <td className="px-6 py-4"><div className="h-4 bg-surface-variant rounded w-28"></div></td>
                <td className="px-6 py-4"><div className="h-6 bg-surface-variant rounded-full w-16"></div></td>
                <td className="px-6 py-4"><div className="h-6 bg-surface-variant rounded-full w-20"></div></td>
                <td className="px-6 py-4"><div className="h-4 bg-surface-variant rounded w-24"></div></td>
                <td className="px-6 py-4"><div className="h-4 bg-surface-variant rounded w-24"></div></td>
                <td className="px-6 py-4 text-right"><div className="h-8 bg-surface-variant rounded w-24 ml-auto"></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-[0_8px_24px_rgba(30,58,138,0.08)] border-b-2 border-primary-container overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-primary-container text-white font-table-header text-table-header">
              <th className="px-6 py-4 whitespace-nowrap">ID</th>
              <th className="px-6 py-4 whitespace-nowrap">Type</th>
              <th className="px-6 py-4 whitespace-nowrap">Reported By</th>
              <th className="px-6 py-4 whitespace-nowrap">Location</th>
              <th className="px-6 py-4 whitespace-nowrap">Priority</th>
              <th className="px-6 py-4 whitespace-nowrap">Status</th>
              <th className="px-6 py-4 whitespace-nowrap">Assigned Date</th>
              <th className="px-6 py-4 whitespace-nowrap">Completed Date</th>
              <th className="px-6 py-4 text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-8 text-center text-on-surface-variant">
                  No tasks found.
                </td>
              </tr>
            ) : (
              tasks.map((task, index) => {
                const isEven = index % 2 === 0;
                return (
                  <tr 
                    key={task.id} 
                    className={`${isEven ? 'bg-surface-container-lowest' : 'bg-surface-container-low'} hover:bg-primary-fixed transition-colors border-t border-surface-variant`}
                  >
                    <td className="px-6 py-4 font-label-md text-label-md text-on-surface whitespace-nowrap">
                      {task.requestCode}
                    </td>
                    <td className="px-6 py-4 font-body-sm text-body-sm text-on-surface-variant whitespace-nowrap">
                      {getIssueTypeLabel(task.issueType)}
                    </td>
                    <td className="px-6 py-4 text-on-surface whitespace-nowrap">
                      {task.submitter.firstName} {task.submitter.lastName}
                    </td>
                    <td className="px-6 py-4 text-on-surface whitespace-nowrap">
                      {getBuildingLabel(task.building)} {task.roomNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {task.urgencyLevel === 'URGENT' && (
                        <span className="bg-error text-on-error rounded-full px-2.5 py-0.5 text-xs font-semibold">Urgent</span>
                      )}
                      {task.urgencyLevel === 'HIGH' && (
                        <span className="bg-tertiary-container text-white rounded-full px-2.5 py-0.5 text-xs font-semibold">High</span>
                      )}
                      {task.urgencyLevel === 'NORMAL' && (
                        <span className="bg-surface-container-high text-on-surface-variant border border-outline-variant rounded-full px-2.5 py-0.5 text-xs font-semibold">Normal</span>
                      )}
                      {task.urgencyLevel === 'LOW' && (
                        <span className="bg-surface-container-high text-on-surface-variant border border-outline-variant rounded-full px-2.5 py-0.5 text-xs font-semibold">Low</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {task.status === 'ONGOING' && (
                        <span className="bg-secondary-container text-white rounded-full px-2.5 py-0.5 text-xs font-semibold">Ongoing</span>
                      )}
                      {task.status === 'PENDING' && (
                        <span className="bg-surface-container-high text-on-surface-variant border border-outline-variant rounded-full px-2.5 py-0.5 text-xs font-semibold">Pending</span>
                      )}
                      {task.status === 'COMPLETED' && (
                        <span className="bg-[#E2E8F0] text-[#475569] rounded-full px-2.5 py-0.5 text-xs font-semibold">Completed</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-body-sm text-on-surface-variant whitespace-nowrap">
                      {formatDate(task.assignedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {task.status === 'COMPLETED' ? (
                        <span className="font-body-sm text-on-surface-variant">{formatDate(task.completedAt)}</span>
                      ) : (
                        <span className="text-outline">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      {task.status === 'ONGOING' || task.status === 'PENDING' ? (
                        <Link 
                          href={`/technician/tasks/${task.id}`}
                          className="inline-block bg-surface border border-secondary-container text-secondary-container hover:bg-secondary-container hover:text-white px-4 py-1.5 rounded text-sm font-medium transition-colors"
                        >
                          View & Update
                        </Link>
                      ) : (
                        <Link 
                          href={`/technician/tasks/${task.id}`}
                          className="inline-block bg-surface border border-outline-variant text-on-surface-variant hover:bg-surface-container hover:text-on-surface px-4 py-1.5 rounded text-sm font-medium transition-colors"
                        >
                          Review
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
