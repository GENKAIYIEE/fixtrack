'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NotificationDropdown from '@/components/user/NotificationDropdown';

type TechnicianTopBarProps = {
  firstName: string;
  lastName: string;
};

export default function TechnicianTopBar({ firstName, lastName }: TechnicianTopBarProps) {
  const router = useRouter();


  return (
    <header className="fixed top-0 right-0 w-[calc(100%-260px)] z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm flex justify-end items-center px-8 h-16">
      {/* Right */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <NotificationDropdown viewAllPath="/technician/notifications" />

        </div>

        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <span className="font-label-md text-label-md text-on-surface">
            {firstName} {lastName}
          </span>
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container border-2 border-white shadow-sm">
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
