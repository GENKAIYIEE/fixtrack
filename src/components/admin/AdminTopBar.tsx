'use client';

type UserProps = {
  firstName: string;
  lastName: string;
  role: string;
};

export default function AdminTopBar({ user }: { user: UserProps }) {
  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'AD';

  return (
    <header className="fixed top-0 right-0 w-[calc(100%-260px)] z-40 border-b border-slate-200 shadow-sm bg-white/80 backdrop-blur-md flex justify-between items-center px-8 h-16">
      <div className="flex items-center gap-4">
        <h1 className="font-h2 text-h2 text-slate-900">FixTrack Monitoring</h1>
        {/* FIXED: BUG-11 — Removed empty badge span that rendered as a visual artifact */}
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <button className="hover:bg-slate-50 rounded-full p-2 transition-all text-slate-500">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="hover:bg-slate-50 rounded-full p-2 transition-all text-slate-500">
            <span className="material-symbols-outlined">help_outline</span>
          </button>
        </div>

        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="flex flex-col items-end">
            <span className="font-label-md text-label-md text-slate-900">{user.firstName}</span>
            <span className="font-sidebar-label text-sidebar-label text-slate-500 capitalize">
              {user.role.toLowerCase()} Role
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary font-bold text-sm border-2 border-white shadow-sm">
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}
