'use client';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  title?: string;
  description?: string;
  itemLabel?: string;
  confirmLabel?: string;
  variant?: 'delete' | 'cancel';
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  title,
  description,
  itemLabel,
  confirmLabel,
  variant = 'delete',
}: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  const isDelete = variant === 'delete';

  const defaults = isDelete
    ? {
        title: 'Delete Permanently?',
        description:
          'This action is irreversible. All associated data — status history, repair notes, assignments, and audit logs — will be permanently removed from the system.',
        confirmLabel: 'Delete Permanently',
        iconName: 'delete_forever',
        accentBg: 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-500',
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600',
        warnBg: 'bg-red-50 border-red-200',
        barColor: 'bg-red-500',
        borderColor: 'border-red-100',
      }
    : {
        title: 'Cancel Request?',
        description:
          'This will cancel your request. Once cancelled, you will need to submit a new one if the issue persists. Only pending requests can be cancelled.',
        confirmLabel: 'Yes, Cancel Request',
        iconName: 'cancel',
        accentBg: 'bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-500',
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-600',
        warnBg: 'bg-amber-50 border-amber-200',
        barColor: 'bg-amber-500',
        borderColor: 'border-amber-100',
      };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!isLoading ? onClose : undefined}
      />

      {/* Card */}
      <div
        className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-md border ${defaults.borderColor} overflow-hidden`}
        style={{ animation: 'modalIn 0.18s ease-out' }}
      >
        {/* Top accent bar */}
        <div className={`h-1 w-full ${defaults.barColor}`} />

        <div className="p-6 space-y-4">
          {/* Icon + Title */}
          <div className="flex items-start gap-4">
            <div
              className={`shrink-0 w-12 h-12 rounded-full ${defaults.iconBg} flex items-center justify-center`}
            >
              <span
                className={`material-symbols-outlined ${defaults.iconColor} text-[26px]`}
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {defaults.iconName}
              </span>
            </div>
            <div className="pt-0.5">
              <h2
                id="confirm-modal-title"
                className="text-base font-bold text-slate-900 leading-snug"
              >
                {title ?? defaults.title}
              </h2>
              {itemLabel && (
                <p className="text-xs font-mono text-slate-400 mt-1">{itemLabel}</p>
              )}
            </div>
          </div>

          {/* Warning body */}
          <div
            className={`${defaults.warnBg} border rounded-xl px-4 py-3`}
          >
            <div className="flex items-start gap-2">
              <span
                className={`material-symbols-outlined ${defaults.iconColor} text-[18px] mt-0.5 shrink-0`}
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                warning
              </span>
              <p className="text-sm text-slate-700 leading-relaxed">
                {description ?? defaults.description}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              Keep It
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-sm text-white transition-colors disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-offset-2 ${defaults.accentBg}`}
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">
                    progress_activity
                  </span>
                  Processing…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">
                    {defaults.iconName}
                  </span>
                  {confirmLabel ?? defaults.confirmLabel}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);   }
        }
      `}</style>
    </div>
  );
}
