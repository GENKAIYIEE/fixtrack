'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type TechnicianTopBarProps = {
  firstName: string;
  lastName: string;
};

export default function TechnicianTopBar({ firstName, lastName }: TechnicianTopBarProps) {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await fetch('/api/notifications?countOnly=true');
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unreadCount);
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    // FIXED: MINOR #3 — Added polling to keep notification count fresh (every 30s)
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval); // cleanup on unmount
  }, []);


  return (
    <header className="fixed top-0 right-0 w-[calc(100%-260px)] z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm flex justify-between items-center px-8 h-16">
      {/* Left */}
      <div className="flex items-center gap-4">
        <span className="font-semibold text-slate-900 tracking-tight">FixTrack Monitoring</span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => router.push('/technician/notifications')}
            className="relative hover:bg-slate-50 rounded-full p-2 transition-all text-slate-500"
          >
            <span className="material-symbols-outlined">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-error text-on-error text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          <button className="hover:bg-slate-50 rounded-full p-2 transition-all text-slate-500">
            <span className="material-symbols-outlined">help_outline</span>
          </button>
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
