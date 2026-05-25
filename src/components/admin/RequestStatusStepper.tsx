import React from 'react';
import { RequestStatus } from '@prisma/client';

interface RequestStatusStepperProps {
  status: RequestStatus;
  hasRepairNote: boolean;
}

export default function RequestStatusStepper({ status, hasRepairNote }: RequestStatusStepperProps) {
  // Step 1: Submitted -> always completed
  // Step 2: Ongoing -> active if ONGOING, completed if COMPLETED
  // Step 3: Action Taken -> active if ONGOING && hasRepairNote, completed if COMPLETED
  // Step 4: Resolved -> completed if COMPLETED

  const getStepState = (stepIndex: number) => {
    switch (stepIndex) {
      case 1:
        return 'completed'; // Step 1 always completed
      case 2:
        if (status === 'COMPLETED') return 'completed';
        if (status === 'ONGOING' && !hasRepairNote) return 'active';
        if (status === 'ONGOING' && hasRepairNote) return 'completed'; 
        return 'pending';
      case 3:
        if (status === 'COMPLETED') return 'completed';
        if (status === 'ONGOING' && hasRepairNote) return 'active';
        return 'pending';
      case 4:
        if (status === 'COMPLETED') return 'completed';
        return 'pending';
      default:
        return 'pending';
    }
  };

  const steps = [
    { index: 1, label: 'Submitted', icon: 'check', state: getStepState(1) },
    { index: 2, label: 'Ongoing', icon: 'schedule', state: getStepState(2) },
    { index: 3, label: 'Action Taken', icon: 'engineering', state: getStepState(3) },
    { index: 4, label: 'Resolved', icon: 'done_all', state: getStepState(4) },
  ];

  return (
    <div className="flex items-start justify-between w-full mb-8 pt-4 overflow-hidden">
      {steps.map((step, idx) => (
        <React.Fragment key={step.index}>
          {/* Step Container */}
          <div className="flex flex-col items-center relative shrink-0" style={{ width: '88px' }}>
            <div
              className={`w-12 h-12 flex items-center justify-center rounded-full mb-3 transition-colors ${
                step.state === 'completed'
                  ? 'bg-[#10B981] text-white shadow-sm'
                  : step.state === 'active'
                  ? 'bg-primary text-white ring-4 ring-primary/20 shadow-sm'
                  : 'bg-surface-variant text-on-surface-variant opacity-60'
              }`}
            >
              <span className="material-symbols-outlined text-[24px]">
                {step.icon}
              </span>
            </div>
            <span
              className={`text-xs text-center font-medium leading-tight ${
                step.state === 'completed'
                  ? 'text-[#10B981]'
                  : step.state === 'active'
                  ? 'text-primary font-bold'
                  : 'text-on-surface-variant opacity-60'
              }`}
            >
              {step.label}
            </span>
          </div>

          {/* Connector Line */}
          {idx < steps.length - 1 && (
            <div className="flex-1 mt-6 px-1 md:px-2 min-w-[20px]">
              <div
                className={`h-[3px] w-full rounded-full transition-colors ${
                  step.state === 'completed' ? 'bg-[#10B981]' : 'bg-surface-variant opacity-30'
                }`}
              />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
