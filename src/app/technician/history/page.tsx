'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import Link from 'next/link';
import TasksPagination from '@/components/technician/TasksPagination';
import Toast from '@/components/shared/Toast';
import { getBuildingLabel } from '@/lib/constants/buildings';

interface HistoryTask {
  id: string;
  requestCode: string;
  issueType: string;
  description: string;
  building: string;
  roomNumber: string;
  completedAt: string | null;
  submitter: {
    firstName: string;
    lastName: string;
  };
  repairNote: {
    notes: string;
    partsReplaced: boolean;
  } | null;
}

export default function TaskHistoryPage() {
  const [historyTasks, setHistoryTasks] = useState<HistoryTask[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const LIMIT = 10;

  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
  };

  const fetchHistory = useCallback(async (isSilentPoll = false) => {
    if (!isSilentPoll) setIsLoading(true);
    try {
      const res = await fetch(`/api/technician/history?page=${page}&limit=${LIMIT}`);
      if (!res.ok) throw new Error('Failed to fetch history');
      const data = await res.json();

      setHistoryTasks(data.history);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error(error);
      if (!isSilentPoll) showToast('A network error occurred.', 'error');
    } finally {
      if (!isSilentPoll) setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(() => {
      fetchHistory(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchHistory]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <div className="max-w-[1400px] mx-auto w-full">
      <div className="flex items-center gap-4 mb-8">
        <h1 className="font-h1 text-h1 text-on-surface">Task History</h1>
        <div className="px-3 py-1 bg-surface-container-high text-on-surface-variant rounded-full font-label-md text-label-md">
          {total} Completed
        </div>
      </div>

      <div className="bg-surface rounded-3xl border border-outline-variant overflow-hidden shadow-sm">
        {isLoading && historyTasks.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined animate-spin text-4xl text-primary mb-4">progress_activity</span>
            <p className="text-on-surface-variant">Loading history...</p>
          </div>
        ) : historyTasks.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <span
              className="material-symbols-outlined text-6xl text-outline-variant mb-4"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 200" }}
            >
              history
            </span>
            <h3 className="text-xl font-semibold text-on-surface mb-2">No Task History</h3>
            <p className="text-on-surface-variant">You haven't completed any tasks yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[750px]">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-lowest">
                  <th className="py-4 px-6 font-label-lg text-on-surface-variant w-[15%]">Request Code</th>
                  <th className="py-4 px-6 font-label-lg text-on-surface-variant w-[25%]">Details</th>
                  <th className="py-4 px-6 font-label-lg text-on-surface-variant w-[20%]">Location</th>
                  <th className="py-4 px-6 font-label-lg text-on-surface-variant w-[20%]">Time & Date</th>
                  <th className="py-4 px-6 font-label-lg text-on-surface-variant w-[20%]">Repair Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {historyTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-surface-container-lowest transition-colors group">
                    <td className="py-4 px-6">
                      <Link href={`/technician/tasks/${task.id}`} className="inline-flex items-center gap-2 text-primary hover:underline font-medium">
                        {task.requestCode}
                        <span className="material-symbols-outlined text-[16px] opacity-0 group-hover:opacity-100 transition-opacity">
                          open_in_new
                        </span>
                      </Link>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-on-surface line-clamp-1">{task.issueType}</span>
                        <span className="text-sm text-on-surface-variant line-clamp-1">{task.description}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1">
                        {/* FIXED: BUG #4 — Use getBuildingLabel utility */}
                        <span className="text-on-surface">{getBuildingLabel(task.building)}</span>
                        <span className="text-sm text-on-surface-variant">Room {task.roomNumber}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1 text-on-surface">
                          <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                          <span>{task.completedAt ? format(new Date(task.completedAt), 'MMM dd, yyyy') : 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-on-surface-variant">
                          <span className="material-symbols-outlined text-[16px]">schedule</span>
                          <span>{task.completedAt ? format(new Date(task.completedAt), 'hh:mm a') : 'N/A'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {task.repairNote ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-sm text-on-surface line-clamp-1" title={task.repairNote.notes}>
                            {task.repairNote.notes}
                          </span>
                          {task.repairNote.partsReplaced && (
                            <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded w-fit">
                              Parts replaced
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-outline">No notes</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!isLoading && historyTasks.length > 0 && (
        <div className="mt-6">
          <TasksPagination
            total={total}
            page={page}
            limit={LIMIT}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  );
}
