'use client';

type Status = 'PENDING' | 'ONGOING' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';
type StepState = 'completed' | 'active' | 'pending' | 'terminal';

type RequestStatusTimelineProps = {
  status: Status;
};

const STATUS_ORDER: Status[] = ['PENDING', 'ONGOING', 'COMPLETED'];

const TERMINAL_STATUSES: Status[] = ['REJECTED', 'CANCELLED'];

// Maps a step's position relative to the current status
function getStepState(stepValue: Status, currentStatus: Status): StepState {
  if (TERMINAL_STATUSES.includes(currentStatus)) {
    // For terminal statuses, only PENDING is shown as completed (it was submitted)
    if (stepValue === 'PENDING') return 'completed';
    return 'terminal';
  }

  const currentIdx = STATUS_ORDER.indexOf(currentStatus);
  const stepIdx = STATUS_ORDER.indexOf(stepValue);

  if (stepIdx < currentIdx) return 'completed';
  if (stepIdx === currentIdx) return 'active';
  return 'pending';
}

// Is the connector AFTER this step colored (i.e., the next step is at least active)?
function isConnectorFilled(stepValue: Status, currentStatus: Status): boolean {
  if (TERMINAL_STATUSES.includes(currentStatus)) return false;
  const currentIdx = STATUS_ORDER.indexOf(currentStatus);
  const stepIdx = STATUS_ORDER.indexOf(stepValue);
  return stepIdx < currentIdx;
}

const STEP_ICONS: Record<string, string> = {
  PENDING: 'schedule',
  ONGOING: 'engineering',
  COMPLETED: 'done_all',
};

export default function RequestStatusTimeline({ status }: RequestStatusTimelineProps) {
  const isTerminal = TERMINAL_STATUSES.includes(status);

  const steps: { label: string; value: Status }[] = [
    { label: 'Submitted', value: 'PENDING' },
    { label: 'In Progress', value: 'ONGOING' },
    { label: 'Completed', value: 'COMPLETED' },
  ];

  return (
    <div className="w-full">
      {/* Terminal state banner */}
      {isTerminal && (
        <div className={`mb-4 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium ${
          status === 'REJECTED'
            ? 'bg-red-50 text-red-700 border border-red-200'
            : 'bg-slate-100 text-slate-600 border border-slate-200'
        }`}>
          <span className="material-symbols-outlined text-[18px]">
            {status === 'REJECTED' ? 'cancel' : 'block'}
          </span>
          {status === 'REJECTED' ? 'This request was rejected.' : 'This request was cancelled.'}
        </div>
      )}

      {/* Stepper row */}
      <div className="flex items-start justify-between w-full">
        {steps.map((step, idx) => {
          const state = getStepState(step.value, status);
          const filled = isConnectorFilled(step.value, status);

          return (
            <div key={step.value} className="flex items-start flex-1">
              {/* Step node */}
              <div className="flex flex-col items-center">
                {/* Circle */}
                <div className={`relative w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all ${
                  state === 'completed'
                    ? 'bg-[#10B981] text-white shadow-sm'
                    : state === 'active'
                    ? 'bg-[#2563EB] text-white ring-4 ring-blue-200 shadow-sm'
                    : state === 'terminal'
                    ? 'bg-slate-200 text-slate-400'
                    : 'bg-slate-100 text-slate-400 border-2 border-slate-200'
                }`}>
                  <span className="material-symbols-outlined text-[20px]">
                    {state === 'completed' ? 'check' : STEP_ICONS[step.value]}
                  </span>
                  {/* Pulse ring for active step */}
                  {state === 'active' && (
                    <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-30 animate-ping" />
                  )}
                </div>

                {/* Label */}
                <span className={`text-xs font-semibold text-center leading-tight whitespace-nowrap ${
                  state === 'completed'
                    ? 'text-[#10B981]'
                    : state === 'active'
                    ? 'text-[#2563EB]'
                    : 'text-slate-400'
                }`}>
                  {step.label}
                </span>
              </div>

              {/* Connector line (between steps) */}
              {idx < steps.length - 1 && (
                <div className="flex-1 mt-5 px-2">
                  <div className={`h-[3px] w-full rounded-full transition-colors ${
                    filled ? 'bg-[#10B981]' : 'bg-slate-200'
                  }`} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}