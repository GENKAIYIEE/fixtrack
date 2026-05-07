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
  // Step 4: Resolved -> active if COMPLETED

  const getStepState = (stepIndex: number) => {
    switch (stepIndex) {
      case 1:
        return 'completed'; // Step 1 always completed
      case 2:
        if (status === 'COMPLETED') return 'completed';
        if (status === 'ONGOING' && !hasRepairNote) return 'active';
        if (status === 'ONGOING' && hasRepairNote) return 'completed'; // completed if step 3 is active
        return 'pending';
      case 3:
        if (status === 'COMPLETED') return 'completed';
        if (status === 'ONGOING' && hasRepairNote) return 'active';
        return 'pending';
      case 4:
        if (status === 'COMPLETED') return 'active'; // Or completed? The prompt says "active if status is COMPLETED"
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
    <div className="relative flex items-center justify-between w-full mb-8">
      {/* Horizontal connector line */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-surface-container -z-10" />

      {steps.map((step) => (
        <div key={step.index} className="flex flex-col items-center bg-surface z-10 px-4">
          <div
            className={`w-12 h-12 flex items-center justify-center rounded-full mb-2 ${
              step.state === 'completed'
                ? 'bg-primary-container text-on-primary-container'
                : step.state === 'active'
                ? 'bg-secondary-container text-on-secondary-container ring-4 ring-secondary-container/20'
                : 'bg-surface-container text-outline'
            }`}
          >
            <span className="material-symbols-outlined">{step.icon}</span>
          </div>
          <span
            className={`text-sm ${
              step.state === 'active' ? 'font-bold text-on-surface' : 'text-on-surface-variant'
            }`}
          >
            {step.label}
          </span>
        </div>
      ))}
    </div>
  );
}
