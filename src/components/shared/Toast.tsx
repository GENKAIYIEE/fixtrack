'use client';

import React, { useEffect } from 'react';

export interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onDismiss: () => void;
}

export default function Toast({ message, type, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const bgColor = type === 'success' ? 'bg-[#10B981]' : 'bg-error';
  const icon = type === 'success' ? 'check_circle' : 'error';

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white animate-in slide-in-from-bottom-5 fade-in duration-300 ${bgColor}`}>
      <span className="material-symbols-outlined">{icon}</span>
      <p className="text-sm font-medium">{message}</p>
      <button onClick={onDismiss} className="ml-4 hover:opacity-80 transition-opacity">
        <span className="material-symbols-outlined text-sm">close</span>
      </button>
    </div>
  );
}
