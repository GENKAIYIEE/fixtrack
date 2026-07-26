'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NotificationDropdown from '@/components/user/NotificationDropdown';

type TechnicianTopBarProps = {
  firstName: string;
  lastName: string;
  onOpenSidebar?: () => void;
};

export default function TechnicianTopBar({
  firstName,
  lastName,
  onOpenSidebar,
}: TechnicianTopBarProps) {
  const router = useRouter();

  return (
    <header className="print:hidden fixed top-0 right-0 w-full lg:w-[calc(100%-260px)] z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm flex justify-between lg:justify-end items-center px-4 sm:px-8 h-16 transition-all duration-300">
      {/* Mobile Hamburger & Title */}
      <div className="flex items-center gap-3 lg:hidden">
        {onOpenSidebar && (
          <button
            onClick={onOpenSidebar}
            className="p-2 -ml-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            aria-label="Open sidebar"
          >
            <span className="material-symbols-outlined text-[24px]">menu</span>
          </button>
        )}
        <span className="font-bold text-slate-900 tracking-tight text-lg">Technician Portal</span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4 sm:gap-6">
        <div className="flex items-center gap-2">
          <NotificationDropdown viewAllPath="/technician/notifications" />
        </div>

        <div className="flex items-center gap-3 pl-3 sm:pl-4 border-l border-slate-200">
          <span className="hidden sm:inline font-label-md text-label-md text-on-surface">
            {firstName} {lastName}
          </span>
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container border-2 border-white shadow-sm flex-shrink-0">
            <span
              className="material-symbols-outlined text-base"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              person
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
