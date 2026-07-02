'use client';

import React from 'react';

export interface TechnicianData {
  id: string;
  firstName: string;
  lastName: string;
  specialization: string | null;
  activeTaskCount: number;
  avatarUrl?: string | null;
  department?: string | null;
}

interface TechnicianCardProps {
  technician: TechnicianData;
  isSelected: boolean;
  onClick: (id: string) => void;
  isSelectable?: boolean; // Whether a request has been selected — enables the click action visually
}

const MAX_TASKS = 4;

export default function TechnicianCard({
  technician,
  isSelected,
  onClick,
  isSelectable = true,
}: TechnicianCardProps) {
  const { activeTaskCount } = technician;
  const isBusy = activeTaskCount >= MAX_TASKS;
  const isAvailable = !isBusy;

  const initials = `${technician.firstName?.[0] ?? ''}${technician.lastName?.[0] ?? ''}`.toUpperCase();

  const getWorkloadColor = () => {
    if (activeTaskCount === 0) return 'bg-[#10B981]';
    if (activeTaskCount <= 2) return 'bg-secondary';
    if (activeTaskCount <= 3) return 'bg-orange-400';
    return 'bg-error';
  };

  const progressPercent = Math.min((activeTaskCount / MAX_TASKS) * 100, 100);

  // Skill tags derived from specialization
  const tags: string[] = [];
  if (technician.specialization) tags.push(technician.specialization);
  if (technician.department) tags.push(technician.department);
  if (tags.length === 0) tags.push('GENERAL');

  const handleClick = () => {
    if (!isBusy) onClick(technician.id);
  };

  return (
    <div
      onClick={handleClick}
      title={
        isBusy
          ? `${technician.firstName} ${technician.lastName || ''}`.trim() + ` is at full capacity (${activeTaskCount}/${MAX_TASKS} tasks)`
          : !isSelectable
          ? 'Select a request first'
          : `Assign selected request to ` + `${technician.firstName} ${technician.lastName || ''}`.trim()
      }
      className={`
        relative p-4 rounded-xl border transition-all flex flex-col gap-3
        ${isBusy
          ? 'cursor-not-allowed opacity-70 bg-surface border-outline-variant'
          : isSelectable
          ? 'cursor-pointer hover:border-primary/40 hover:shadow-md active:scale-[0.98]'
          : 'cursor-default'
        }
        ${isSelected
          ? 'ring-2 ring-primary bg-primary/5 border-primary shadow-md'
          : 'bg-surface border-outline-variant'
        }
      `}
    >
      {/* Availability Badge */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5">
        <div className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-[#10B981]' : 'bg-error'} ${isAvailable ? 'animate-pulse' : ''}`} />
        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wide">
          {isAvailable ? 'Available' : 'Busy'}
        </span>
      </div>

      {/* Avatar + Name */}
      <div className="flex flex-col items-center text-center mt-2">
        <div className="w-14 h-14 bg-primary-container text-primary font-bold text-xl rounded-full flex items-center justify-center mb-2 shadow-sm">
          {initials}
        </div>
        <h3 className="text-sm font-bold text-on-surface leading-tight">
          {`${technician.firstName} ${technician.lastName || ''}`.trim()}
        </h3>
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mt-0.5">
          {technician.specialization ?? 'GENERAL'}
        </p>
      </div>

      {/* Workload bar */}
      <div className="w-full">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[10px] text-on-surface-variant">Workload</span>
          <span className={`text-[10px] font-bold ${isBusy ? 'text-error' : 'text-on-surface'}`}>
            {activeTaskCount} / {MAX_TASKS} tasks
          </span>
        </div>
        <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${getWorkloadColor()}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Skill tags */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {tags.map((tag, idx) => (
          <span
            key={idx}
            className="bg-surface-variant text-on-surface-variant text-[9px] font-semibold rounded-full px-2 py-0.5 uppercase tracking-wide"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute bottom-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow">
          <span className="material-symbols-outlined text-on-primary text-[14px]">check</span>
        </div>
      )}
    </div>
  );
}
