'use client';

import React from 'react';

export interface TechnicianData {
  id: string;
  firstName: string;
  lastName: string;
  specialization: string | null;
  activeTaskCount: number;
}

interface TechnicianCardProps {
  technician: TechnicianData;
  isSelected: boolean;
  onClick: (id: string) => void;
}

export default function TechnicianCard({ technician, isSelected, onClick }: TechnicianCardProps) {
  const { activeTaskCount } = technician;
  const isAvailable = activeTaskCount < 4;
  
  const initials = `${technician.firstName?.[0] || ''}${technician.lastName?.[0] || ''}`.toUpperCase();

  const getWorkloadColor = () => {
    if (activeTaskCount <= 1) return 'bg-primary';
    if (activeTaskCount <= 3) return 'bg-secondary';
    return 'bg-error';
  };

  const maxTasks = 4;
  const progressPercent = Math.min((activeTaskCount / maxTasks) * 100, 100);

  // Derive some skill tags based on specialization
  const tags = [technician.specialization || 'GENERAL', 'MAINTENANCE'];

  return (
    <div
      onClick={() => onClick(technician.id)}
      className={`relative p-4 rounded-xl border transition-all cursor-pointer hover:border-primary/30 flex flex-col ${
        isSelected ? 'ring-2 ring-primary bg-primary/5 border-primary' : 'bg-surface border-outline-variant'
      }`}
    >
      {/* Availability Badge */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5">
        <div className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-[#10B981]' : 'bg-error'}`} />
        <span className="text-[10px] font-bold text-on-surface-variant uppercase">
          {isAvailable ? 'Available' : 'Busy'}
        </span>
      </div>

      <div className="flex flex-col items-center text-center mt-2 mb-4">
        {/* Avatar */}
        <div className="w-14 h-14 bg-primary-container text-primary font-bold text-lg rounded-full flex items-center justify-center mb-3">
          {initials}
        </div>
        
        {/* Name & Specialization */}
        <h3 className="text-sm font-bold text-on-surface">
          {technician.firstName} {technician.lastName}
        </h3>
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">
          {technician.specialization || 'GENERAL'}
        </p>
      </div>

      {/* Workload Bar */}
      <div className="mt-auto mb-4 w-full">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[11px] text-on-surface-variant">Current Workload</span>
          <span className="text-[11px] font-bold text-on-surface">{activeTaskCount} / 4 Tasks</span>
        </div>
        <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all ${getWorkloadColor()}`} 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Skill Tags */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {tags.map((tag, idx) => (
          <span key={idx} className="bg-surface-variant text-on-surface-variant text-[10px] font-medium rounded px-1.5 py-0.5 uppercase tracking-wide">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
