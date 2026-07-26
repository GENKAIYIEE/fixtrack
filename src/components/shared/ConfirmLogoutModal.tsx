'use client';

interface ConfirmLogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export default function ConfirmLogoutModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: ConfirmLogoutModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200"
        onClick={!isLoading ? onClose : undefined}
      />

      {/* Card */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-100 overflow-hidden transform transition-all"
        style={{ animation: 'modalIn 0.18s ease-out' }}
      >
        {/* Top accent bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-red-500" />

        <div className="p-6 sm:p-7 space-y-5">
          {/* Icon + Title */}
          <div className="flex items-start gap-4">
            <div className="shrink-0 w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shadow-sm">
              <span
                className="material-symbols-outlined text-[26px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                logout
              </span>
            </div>
            <div className="pt-0.5">
              <h2
                id="logout-modal-title"
                className="text-lg font-bold text-slate-900 leading-snug tracking-tight"
              >
                Sign Out of FixTrack?
              </h2>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                End Current Session
              </p>
            </div>
          </div>

          {/* Warning body */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span
                className="material-symbols-outlined text-blue-600 text-[20px] mt-0.5 shrink-0"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                info
              </span>
              <p className="text-sm font-medium text-slate-700 leading-relaxed">
                Are you sure you want to log out?
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              Stay Logged In
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-sm text-white bg-red-600 hover:bg-red-700 active:scale-[0.98] shadow-md hover:shadow-lg transition-all disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">
                    progress_activity
                  </span>
                  Signing Out…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">
                    logout
                  </span>
                  Yes, Log Out
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);   }
        }
      `}</style>
    </div>
  );
}
