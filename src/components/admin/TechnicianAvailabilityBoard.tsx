'use client';

import React from 'react';
import TechnicianCard, { TechnicianData } from './TechnicianCard';

interface TechnicianAvailabilityBoardProps {
  technicians: TechnicianData[];
  selectedTechnicianId: string | null;
  onSelect: (id: string) => void;
}

export default function TechnicianAvailabilityBoard({
  technicians,
  selectedTechnicianId,
  onSelect,
}: TechnicianAvailabilityBoardProps) {
  return (
    <div className="flex flex-col h-full bg-surface rounded-xl shadow-sm border border-outline-variant overflow-hidden">
      {/* Panel Header */}
      <div className="bg-surface-container-low p-4 flex items-center gap-3 border-b border-outline-variant">
        <span className="material-symbols-outlined text-on-surface-variant">engineering</span>
        <h2 className="text-base font-bold text-on-surface flex-1">Technician Availability Board</h2>
        
        {/* Filter and view-toggle icon buttons (visual only as per prompt context) */}
        <div className="flex items-center gap-2 text-on-surface-variant">
          <button className="p-1.5 hover:bg-surface-container rounded-md transition-colors flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">filter_list</span>
          </button>
          <button className="p-1.5 hover:bg-surface-container rounded-md transition-colors flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">grid_view</span>
          </button>
        </div>
      </div>

      {/* Grid of Technicians */}
      <div className="flex-1 overflow-y-auto p-4">
        {technicians.length === 0 ? (
          <div className="text-center text-on-surface-variant text-sm py-8">
            No technicians available.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {technicians.map((tech) => (
              <TechnicianCard
                key={tech.id}
                technician={tech}
                isSelected={selectedTechnicianId === tech.id}
                onClick={onSelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
