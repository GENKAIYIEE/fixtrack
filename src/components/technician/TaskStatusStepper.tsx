import React from 'react';
import { RequestStatus } from '@prisma/client';

interface TaskStatusStepperProps {
  status: RequestStatus;
}

export const TaskStatusStepper: React.FC<TaskStatusStepperProps> = ({ status }) => {
  const getActiveStep = () => {
    if (status === 'COMPLETED') return 4;
    if (status === 'ONGOING') return 3;
    return 2; // PENDING or anything else
  };

  const activeStep = getActiveStep();

  const steps = [
    { label: 'Submitted', num: 1 },
    { label: 'Assigned', num: 2 },
    { label: 'Ongoing', num: 3 },
    { label: 'Completed', num: 4 },
  ];

  return (
    <div className="flex items-center">
      {steps.map((step, index) => {
        const isCompleted = activeStep > step.num || (activeStep === 4 && step.num === 4);
        const isActive = activeStep === step.num && !isCompleted;
        const isPending = activeStep < step.num;

        return (
          <React.Fragment key={step.num}>
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  isCompleted
                    ? 'bg-[#1E3A8A] text-white'
                    : isActive
                    ? 'bg-[#2563EB] text-white'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {isCompleted ? (
                  <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                ) : (
                  <span className="text-sm font-semibold">{step.num}</span>
                )}
              </div>
              <span
                className={`text-sm ${
                  isActive ? 'font-bold text-slate-800' : 'font-medium text-slate-500'
                }`}
              >
                {step.label}
              </span>
            </div>

            {index < steps.length - 1 && (
              <div className="h-px w-10 mx-3 bg-slate-200" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
