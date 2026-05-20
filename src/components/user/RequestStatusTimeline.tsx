'use client';

type Status = 'PENDING' | 'ONGOING' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';

type RequestStatusTimelineProps = {
  status: Status;
};

export default function RequestStatusTimeline({ status }: RequestStatusTimelineProps) {
  const steps: { label: string; value: Status }[] = [
    { label: 'Pending', value: 'PENDING' },
    { label: 'In Progress', value: 'ONGOING' },
    { label: 'Completed', value: 'COMPLETED' },
  ];

  function isActive(stepValue: Status): boolean {
    return stepValue === status;
  }

  function isCompleted(stepValue: Status): boolean {
    const statusOrder: Status[] = ['PENDING', 'ONGOING', 'COMPLETED'];
    const currentIndex = statusOrder.indexOf(status);
    const stepIndex = statusOrder.indexOf(stepValue);
    return stepIndex !== -1 && stepIndex < currentIndex;
  }

  return (
    <div className="flex items-center space-x-3">
      {steps.map((step, index) => (
        <div key={step.value} className="flex items-center space-x-2">
          {/* Step circle */}
          <div className="w-5 h-5 rounded-full flex items-center justify-center">
            {isActive(step.value) ? (
              <div className="w-3 h-3 rounded-full bg-primary"></div>
            ) : isCompleted(step.value) ? (
              <div className="w-3 h-3 rounded-full bg-secondary"></div>
            ) : (
              <div className="w-3 h-3 rounded-full bg-outline-variant/20"></div>
            )}
          </div>
          {/* Step label */}
          <span className={`text-xs font-semibold ${
            isActive(step.value)
              ? 'text-primary'
              : isCompleted(step.value)
              ? 'text-on-surface-variant'
              : 'text-outline'
          }`}>
            {step.label}
          </span>
          {/* Connector line (except for last step) */}
          {index < steps.length - 1 && (
            <div className="w-4 h-0.5 bg-outline-variant/20"></div>
          )}
        </div>
      ))}
    </div>
  );
}