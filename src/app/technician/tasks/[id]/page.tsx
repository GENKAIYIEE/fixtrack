'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TaskStatusStepper } from '@/components/technician/TaskStatusStepper';
import { TaskRequestInfoCard } from '@/components/technician/TaskRequestInfoCard';
import { TaskExecutionCard } from '@/components/technician/TaskExecutionCard';
import { TaskActivityTimeline } from '@/components/technician/TaskActivityTimeline';

export default function TechnicianTaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [task, setTask] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  // FIXED: BUG #7 — Wrapped fetchTask in useCallback to satisfy exhaustive-deps
  const fetchTask = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/technician/tasks/${id}`);
      if (!res.ok) throw new Error('Failed to fetch task');
      const data = await res.json();
      setTask(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  // FIXED: BUG #7 — fetchTask is now stable and safe in deps
  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  const handleSaveUpdate = async (data: { repairNotes: string; partsReplaced: string; status: string }) => {
    setIsSaving(true);
    // FIXED: BUG #2/#9 — Removed phantom 'Pending Review' entry from statusMap
    const statusMap: Record<string, string> = {
      'On Hold': 'PENDING',
      'Ongoing': 'ONGOING',
    };

    try {
      await fetch(`/api/technician/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          repairNotes: data.repairNotes,
          partsReplaced: data.partsReplaced,
          status: statusMap[data.status],
        }),
      });
      // Show toast ideally here
      await fetchTask();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkCompleted = async () => {
    setIsCompleting(true);
    try {
      await fetch(`/api/technician/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete' }),
      });
      // Show toast ideally here
      await fetchTask();
    } catch (error) {
      console.error(error);
    } finally {
      setIsCompleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 pb-24">
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
      <div className="p-8 pb-24 flex justify-center items-center h-full text-on-surface-variant">
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
    <div className="p-8 pb-24 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-6">
        <div>
          <div className="flex items-center gap-4 mb-1">
            <button
              onClick={() => router.push('/technician/tasks')}
              className="flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h1 className="font-h2 text-h2 text-on-surface font-bold flex items-center gap-3">
              Task Detail — {task.requestCode}
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getUrgencyBadge(task.urgencyLevel)}`}>
                {task.urgencyLevel}
              </span>
            </h1>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 ml-10">
            Review and update maintenance execution.
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-[0_4px_12px_rgba(30,58,138,0.08)] p-4">
          <TaskStatusStepper status={task.status} />
        </div>
      </div>

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
      
      {/* Activity Timeline Card */}
      <div className="w-full">
        <TaskActivityTimeline task={task} />
      </div>
    </div>
  );
}
