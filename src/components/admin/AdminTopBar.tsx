'use client';

type UserProps = {
  firstName: string;
  lastName: string;
  role: string;
};

import NotificationDropdown from '@/components/user/NotificationDropdown';

export default function AdminTopBar({
  user,
  onOpenSidebar,
}: {
  user: UserProps;
  onOpenSidebar?: () => void;
}) {
  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'AD';

  return (
    <header className="print:hidden fixed top-0 right-0 w-full lg:w-[calc(100%-260px)] z-40 border-b border-slate-200 shadow-sm bg-white/80 backdrop-blur-md flex justify-between lg:justify-end items-center px-4 sm:px-8 h-16 transition-all duration-300">
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
        <span className="font-bold text-slate-900 tracking-tight text-lg">Admin Portal</span>
      </div>

      {/* Right Side: Notifications & User Badge */}
      <div className="flex items-center gap-4 sm:gap-6">
        <div className="flex items-center gap-2">
          <NotificationDropdown viewAllPath="/admin/notifications" />
        </div>

        <div className="flex items-center gap-3 pl-3 sm:pl-4 border-l border-slate-200">
          <div className="hidden sm:flex flex-col items-end">
            <span className="font-label-md text-label-md text-slate-900">{user.firstName}</span>
            <span className="font-sidebar-label text-sidebar-label text-slate-500 capitalize">
              {user.role.toLowerCase()} Role
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary font-bold text-sm border-2 border-white shadow-sm flex-shrink-0">
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}
