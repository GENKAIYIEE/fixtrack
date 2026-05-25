'use client';

import React from 'react';
import TechnicianCard, { TechnicianData } from './TechnicianCard';

interface TechnicianAvailabilityBoardProps {
  technicians: TechnicianData[];
  selectedTechnicianId: string | null;
  onSelect: (id: string) => void;
  hasRequestSelected?: boolean;
}

export default function TechnicianAvailabilityBoard({
  technicians,
  selectedTechnicianId,
  onSelect,
  hasRequestSelected = false,
}: TechnicianAvailabilityBoardProps) {
  const activeTechs = technicians.filter((t) => (t.activeTaskCount ?? 0) < 4);
  const busyTechs = technicians.filter((t) => (t.activeTaskCount ?? 0) >= 4);

  return (
    <div className="flex flex-col h-full bg-surface rounded-xl shadow-sm border border-outline-variant overflow-hidden">
      {/* Panel Header */}
      <div className="bg-surface-container-low p-4 flex items-center gap-3 border-b border-outline-variant">
        <span className="material-symbols-outlined text-on-surface-variant">engineering</span>
        <h2 className="text-base font-bold text-on-surface flex-1">Technician Availability Board</h2>

        {/* Live count badges */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs font-bold text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] inline-block" />
            {activeTechs.length} Available
          </span>
          {busyTechs.length > 0 && (
            <span className="flex items-center gap-1 text-xs font-bold text-error bg-error/10 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-error inline-block" />
              {busyTechs.length} Busy
            </span>
          )}
        </div>
      </div>

      {/* Hint: select a request first */}
      {!hasRequestSelected && technicians.length > 0 && (
        <div className="mx-4 mt-4 p-3 bg-primary-container/40 border border-primary/20 rounded-lg flex items-center gap-2.5 text-xs text-on-surface-variant">
          <span className="material-symbols-outlined text-primary text-[18px]">info</span>
          <span>Select a request from the left panel first, then pick a technician to assign it to.</span>
        </div>
      )}

      {/* Technician grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {technicians.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12 gap-3">
            <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center">
              <span className="material-symbols-outlined text-on-surface-variant text-3xl">engineering</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-on-surface">No active technicians</p>
              <p className="text-xs text-on-surface-variant mt-1">
                No technician accounts are currently active. Go to{' '}
                <a href="/admin/users" className="text-primary underline underline-offset-2 hover:opacity-80">
                  User Management
                </a>{' '}
                to add or activate technicians.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Available technicians first */}
            {activeTechs.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2 px-1">
                  Available ({activeTechs.length})
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeTechs.map((tech) => (
                    <TechnicianCard
                      key={tech.id}
                      technician={tech}
                      isSelected={selectedTechnicianId === tech.id}
                      onClick={onSelect}
                      isSelectable={hasRequestSelected}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Busy technicians at the bottom */}
            {busyTechs.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2 px-1">
                  At Capacity ({busyTechs.length})
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 opacity-60">
                  {busyTechs.map((tech) => (
                    <TechnicianCard
                      key={tech.id}
                      technician={tech}
                      isSelected={selectedTechnicianId === tech.id}
                      onClick={onSelect}
                      isSelectable={hasRequestSelected}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
