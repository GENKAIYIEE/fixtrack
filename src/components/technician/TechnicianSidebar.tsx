'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';

export default function TechnicianSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [badges, setBadges] = useState({ notifications: 0, tasks: 0 });

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const res = await fetch('/api/technician/badges');
        if (res.ok) {
          const data = await res.json();
          setBadges({ notifications: data.notifications || 0, tasks: data.tasks || 0 });
        }
      } catch (err) {
        console.error('Failed to fetch badges', err);
      }
    };
    
    fetchBadges();
    const interval = setInterval(fetchBadges, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  const navLinks = [
    { name: 'Dashboard',    href: '/technician/dashboard', icon: 'dashboard' },
    { name: 'Inbox',        href: '/technician/notifications', icon: 'inbox' },
    { name: 'My Tasks',     href: '/technician/tasks',     icon: 'build' },
    { name: 'Task History', href: '/technician/history',   icon: 'history' },
    { name: 'My Profile',   href: '/technician/profile',   icon: 'person' },
  ];

  const getLinkClasses = (href: string) => {
    const isActive = pathname === href || pathname.startsWith(`${href}/`);
    return isActive
      ? 'bg-[#2563EB] text-white rounded-lg px-4 py-2.5 mx-2 flex items-center gap-3 transition-all duration-200'
      : 'text-slate-300 hover:bg-white/10 hover:text-white rounded-lg px-4 py-2.5 mx-2 flex items-center gap-3 transition-all duration-200';
  };

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside className="w-[260px] h-full fixed left-0 top-0 border-r border-white/10 shadow-2xl bg-[#1E3A8A] text-blue-600 font-['Inter'] antialiased tracking-tight z-50 flex flex-col py-6">
      {/* Header */}
      <div className="px-6 mb-8 flex items-center gap-3">
        <span
          className="material-symbols-outlined text-3xl text-white"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          home_repair_service
        </span>
        <div className="flex flex-col gap-0.5">
          <span className="text-xl font-black tracking-tighter text-white uppercase">FIXTRACK</span>
          <span className="font-sidebar-label text-sidebar-label text-blue-300 uppercase tracking-widest">
            TECHNICIAN PORTAL
          </span>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 flex flex-col gap-1 px-2">
        {navLinks.map((link) => (
          <Link key={link.href} href={link.href} className={getLinkClasses(link.href)}>
            <span
              className="material-symbols-outlined"
              style={isActive(link.href) ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {link.icon}
            </span>
            <span className="font-label-md text-label-md flex-1">{link.name}</span>
            {link.href === '/technician/notifications' && badges.notifications > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {badges.notifications > 99 ? '99+' : badges.notifications}
              </span>
            )}
            {link.href === '/technician/tasks' && badges.tasks > 0 && (
              <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {badges.tasks > 99 ? '99+' : badges.tasks}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* Footer Nav */}
      <div className="mt-auto flex flex-col gap-1 px-2 pt-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="text-slate-300 hover:bg-white/10 hover:text-white rounded-lg px-4 py-2.5 mx-2 flex items-center gap-3 transition-all duration-200 text-left w-[calc(100%-16px)]"
        >
          <span className="material-symbols-outlined">logout</span>
          <span className="font-label-md text-label-md">Logout</span>
        </button>
      </div>
    </aside>
  );
}
