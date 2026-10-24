'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TaskStatusStepper } from '@/components/technician/TaskStatusStepper';
import { TaskRequestInfoCard } from '@/components/technician/TaskRequestInfoCard';
import { TaskExecutionCard } from '@/components/technician/TaskExecutionCard';
import { TaskActivityTimeline } from '@/components/technician/TaskActivityTimeline';
import TaskWorkerSelector from '@/components/technician/TaskWorkerSelector';
import ToastNotification from '@/components/shared/ToastNotification';

export default function TechnicianTaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [task, setTask] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // FIXED: BUG #7 — Wrapped fetchTask in useCallback to satisfy exhaustive-deps
  const fetchTask = useCallback(async (isSilentPoll = false) => {
    if (!id) return;
    if (!isSilentPoll) setIsLoading(true);
    try {
      const res = await fetch(`/api/technician/tasks/${id}`);
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch task');
      const data = await res.json();
      setTask(data);
      router.refresh();
    } catch (error) {
      console.error(error);
      if (!isSilentPoll) showToast(error instanceof Error ? error.message : 'Could not fetch the task.', 'error');
    } finally {
      if (!isSilentPoll) setIsLoading(false);
    }
  }, [id, router]);

  // FIXED: BUG #7 — fetchTask is now stable and safe in deps
  useEffect(() => {
    fetchTask();
    const interval = setInterval(() => {
      fetchTask(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchTask]);

  const handleSaveUpdate = async (data: { repairNotes: string; partsReplaced: string; status: string }) => {
    setIsSaving(true);
    // FIXED: BUG #2/#9 — Removed phantom 'Pending Review' entry from statusMap
    const statusMap: Record<string, string> = {
      'On Hold': 'ON_HOLD',
      'Ongoing': 'ONGOING',
    };

    try {
      const response = await fetch(`/api/technician/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          repairNotes: data.repairNotes,
          partsReplaced: data.partsReplaced,
          status: statusMap[data.status],
        }),
      });
      
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update task');
      }

      showToast('Task updated successfully', 'success');
      await fetchTask();
    } catch (error) {
      console.error(error);
      showToast(error instanceof Error ? error.message : 'Failed to update task', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkCompleted = async () => {
    setIsCompleting(true);
    try {
      const response = await fetch(`/api/technician/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete' }),
      });
      if (!response.ok) throw new Error((await response.json()).error || 'Completion failed.');
      showToast('Task marked as completed', 'success');
      await fetchTask();
    } catch (error) {
      console.error(error);
      showToast(error instanceof Error ? error.message : 'Failed to complete task', 'error');
    } finally {
      setIsCompleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="pb-24">
        <div className="animate-pulse space-y-8">
          <div className="h-12 bg-surface-variant rounded w-1/3"></div>
          <div className="grid grid-cols-12 gap-lg">
            <div className="col-span-12 lg:col-span-4 h-96 bg-surface-variant rounded-xl"></div>
            <div className="col-span-12 lg:col-span-8 h-96 bg-surface-variant rounded-xl"></div>
            <div className="col-span-12 h-64 bg-surface-variant rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="pb-24 flex justify-center items-center h-full text-on-surface-variant">
        Task not found.
      </div>
    );
  }

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'URGENT':
        return 'bg-red-500 text-white';
      case 'HIGH':
        return 'bg-orange-500 text-white';
      case 'NORMAL':
        return 'bg-blue-500 text-white';
      case 'LOW':
        return 'bg-slate-400 text-white';
      default:
        return 'bg-slate-400 text-white';
    }
  };

  return (
    <div className="pb-24 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col flex-wrap xl:flex-row justify-between items-start lg:items-center mb-6 gap-6">
        <div>
          <div className="flex items-center gap-4 mb-1">
            <button
              onClick={() => router.push('/technician/tasks')}
              className="flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h1 className="font-h2 text-h2 text-on-surface font-bold flex min-w-0 flex-wrap items-center gap-3">
              Task Detail — {task.requestCode}
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getUrgencyBadge(task.priorityLevel || 'NORMAL')}`}>
                {task.priorityLevel || 'NORMAL'}
              </span>
            </h1>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 ml-10">
            Review and update maintenance execution.
          </p>
        </div>
        <div className="w-full max-w-full overflow-x-auto rounded-xl bg-white p-4 shadow-[0_4px_12px_rgba(30,58,138,0.08)] sm:w-fit">
          <TaskStatusStepper status={task.status} />
        </div>
      </div>

      <p className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">Technician head: contact the appropriate maintenance worker by phone or in person. Record progress and completion in FixTrack; individual workers do not need accounts.</p>
      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="h-full">
          <TaskRequestInfoCard request={task} />
        </div>
        <div className="h-full">
          <TaskExecutionCard
            request={task}
            onSaveUpdate={handleSaveUpdate}
            onMarkCompleted={handleMarkCompleted}
            isSaving={isSaving}
            isCompleting={isCompleting}
          />
        </div>
      </div>
      
      <TaskWorkerSelector taskId={id} status={task.status} updatedAt={task.updatedAt} assignments={task.workerAssignments || []} onSaved={() => fetchTask(true)} />
      {/* Activity Timeline Card */}
      <div className="w-full">
        <TaskActivityTimeline task={task} />
      </div>

      <ToastNotification
        message={toast?.message ?? ''}
        type={toast?.type ?? 'success'}
        visible={!!toast}
      />
    </div>
  );
}
