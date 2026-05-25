'use client';

interface ToastNotificationProps {
  message: string;
  type: 'success' | 'error' | 'warning';
  visible: boolean;
}

const toastConfig = {
  success: {
    bg: 'bg-emerald-600',
    icon: 'check_circle',
  },
  error: {
    bg: 'bg-red-600',
    icon: 'error',
  },
  warning: {
    bg: 'bg-amber-500',
    icon: 'warning',
  },
};

export default function ToastNotification({
  message,
  type,
  visible,
}: ToastNotificationProps) {
  const { bg, icon } = toastConfig[type];

  return (
    <div
      aria-live="polite"
      className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 ${bg} text-white px-5 py-3.5 rounded-xl shadow-xl max-w-sm transition-all duration-300 ${
        visible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <span
        className="material-symbols-outlined text-[20px] shrink-0"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        {icon}
      </span>
      <p className="text-sm font-medium leading-snug">{message}</p>
    </div>
  );
}
