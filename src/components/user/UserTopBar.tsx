'use client';

import NotificationDropdown from './NotificationDropdown';

type UserProps = {
  firstName: string;
  lastName: string;
  role: string;
  avatarUrl?: string | null;
};

export default function UserTopBar({ user, onMenuClick }: { user: UserProps, onMenuClick?: () => void }) {
  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || 'ST';

  return (
    <header className="fixed top-0 right-0 w-full lg:w-[calc(100%-260px)] z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm flex justify-between items-center px-4 md:px-8 h-16 transition-all duration-300">
      {/* Left */}
      <div className="flex items-center gap-3 md:gap-4">
        <button 
          className="lg:hidden text-slate-500 hover:text-slate-800 p-1 rounded transition-colors" 
          onClick={onMenuClick}
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <span className="font-semibold text-slate-900 tracking-tight hidden sm:block">FixTrack Monitoring</span>
        <span className="font-semibold text-slate-900 tracking-tight sm:hidden">FixTrack</span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        {/* Notifications dropdown */}
        <NotificationDropdown />

        {/* Help */}
        <button
          className="hover:bg-slate-100 rounded-full p-2 transition-all text-slate-500"
          aria-label="Help"
        >
          <span className="material-symbols-outlined">help_outline</span>
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200" />

        {/* User info */}
        <div className="flex items-center gap-3">
          <div className="flex-col items-end hidden sm:flex">
            <span className="font-label-md text-label-md text-on-surface">
              {user.firstName} {user.lastName}
            </span>
            <span className="text-xs text-outline">Student</span>
          </div>

          {/* Avatar */}
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={`${user.firstName} ${user.lastName}`}
              className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary-container font-bold text-sm flex items-center justify-center border-2 border-white shadow-sm">
              {initials}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
