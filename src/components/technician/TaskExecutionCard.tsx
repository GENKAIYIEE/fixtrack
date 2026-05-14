import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface TaskDetailData {
  id: string;
  requestCode: string;
  status: string;
  urgencyLevel: string;
  repairNote: {
    notes: string;
    partsReplaced: string | null;
  } | null;
  completedAt: string | null;
}

interface TaskExecutionCardProps {
  request: TaskDetailData;
  onSaveUpdate: (data: { repairNotes: string; partsReplaced: string; status: string }) => Promise<void>;
  onMarkCompleted: () => Promise<void>;
  isSaving: boolean;
  isCompleting: boolean;
}

export const TaskExecutionCard: React.FC<TaskExecutionCardProps> = ({
  request,
  onSaveUpdate,
  onMarkCompleted,
  isSaving,
  isCompleting,
}) => {
  const router = useRouter();

  const [repairNotes, setRepairNotes] = useState(request.repairNote?.notes || '');
  const [partsReplaced, setPartsReplaced] = useState(request.repairNote?.partsReplaced || '');
  // FIXED: BUG #2/#9 — Pre-select based on actual DB status; 'Pending Review' phantom removed
  const [selectedStatus, setSelectedStatus] = useState(
    request.status === 'PENDING' ? 'On Hold' : 'Ongoing'
  );
  const [confirmComplete, setConfirmComplete] = useState(false);

  const handleSave = () => {
    onSaveUpdate({ repairNotes, partsReplaced, status: selectedStatus });
  };

  const isCompleted = request.status === 'COMPLETED';

  return (
    <div className="bg-white rounded-xl shadow-[0_4px_12px_rgba(30,58,138,0.08)] border border-slate-100 overflow-hidden flex flex-col h-full">
      <div className="bg-[#2563EB] px-6 py-4">
        <h2 className="text-white font-semibold">Task Execution</h2>
        <p className="text-white/70 text-xs">Update your progress and document repairs</p>
      </div>

      <div className="p-6 space-y-5 flex-1 flex flex-col">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Repair Notes
          </label>
          <textarea
            value={repairNotes}
            onChange={(e) => setRepairNotes(e.target.value)}
            disabled={isCompleted}
            className="w-full border border-slate-200 rounded-lg p-4 text-sm text-slate-700 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] min-h-[120px] resize-none bg-slate-50 placeholder:text-slate-400"
            placeholder="Document your repair process, findings, and actions taken..."
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Parts Replaced
          </label>
          <textarea
            value={partsReplaced}
            onChange={(e) => setPartsReplaced(e.target.value)}
            disabled={isCompleted}
            className="w-full border border-slate-200 rounded-lg p-4 text-sm text-slate-700 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] min-h-[80px] resize-none bg-slate-50 placeholder:text-slate-400"
            placeholder="List any parts replaced or materials used (optional)..."
          />
        </div>

        {!isCompleted && (
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Update Status
            </label>
            <div className="flex bg-slate-100 rounded-lg p-1 w-fit">
              {['On Hold', 'Ongoing'].map((option) => (
                <button
                  key={option}
                  onClick={() => setSelectedStatus(option)}
                  className={
                    selectedStatus === option
                      ? 'bg-white shadow-sm text-[#2563EB] font-semibold px-4 py-2 rounded-md text-sm transition-all'
                      : 'text-slate-500 px-4 py-2 rounded-md text-sm hover:text-slate-700 transition-all'
                  }
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {isCompleted ? (
          <div className="mt-auto pt-4 border-t border-slate-100">
            <div className="bg-slate-50 text-slate-700 rounded-lg p-4 flex items-center gap-3 border border-slate-200">
              <span className="material-symbols-outlined text-[24px] text-green-600">
                verified
              </span>
              <span className="text-sm font-medium">
                This task has been marked as completed on{' '}
                {request.completedAt ? new Date(request.completedAt).toLocaleDateString() : ''}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex justify-end items-center gap-3 mt-auto pt-4 border-t border-slate-100">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-[#2563EB] border border-[#2563EB] rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2"
            >
              {isSaving ? (
                <span className="material-symbols-outlined animate-spin text-[18px]">refresh</span>
              ) : null}
              Save Update
            </button>

            {confirmComplete ? (
              <div className="flex items-center gap-3 ml-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                <span className="text-slate-700 text-sm font-medium ml-2">Are you sure?</span>
                <button
                  onClick={onMarkCompleted}
                  disabled={isCompleting}
                  className="px-4 py-1.5 text-sm font-bold text-white bg-[#1E3A8A] hover:bg-[#1e40af] rounded-md flex items-center gap-2 shadow-sm transition-colors"
                >
                  {isCompleting ? (
                    <span className="material-symbols-outlined animate-spin text-[16px]">refresh</span>
                  ) : null}
                  Yes, Complete
                </button>
                <button
                  onClick={() => setConfirmComplete(false)}
                  className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmComplete(true)}
                className="px-5 py-2 text-sm font-bold text-white bg-[#1E3A8A] hover:bg-[#1e40af] rounded-lg flex items-center gap-2 shadow-sm transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                Mark as Completed
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
