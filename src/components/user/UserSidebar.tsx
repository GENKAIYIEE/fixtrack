'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function UserSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await fetch('/api/notifications?countOnly=true');
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unreadCount ?? 0);
        }
      } catch {
        // silently fail
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  const isActive = (href: string) => {
    if (href === '/requests') {
      return pathname === '/requests' || (pathname.startsWith('/requests/') && pathname !== '/requests/new');
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const getLinkClasses = (href: string) => {
    const active = isActive(href);
    return active
      ? 'bg-[#2563EB] text-white rounded-lg px-4 py-2.5 mx-2 flex items-center gap-3 transition-all duration-200'
      : 'text-slate-300 hover:bg-white/10 hover:text-white rounded-lg px-4 py-2.5 mx-2 flex items-center gap-3 transition-all duration-200';
  };

  const navLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
    { name: 'Submit Request', href: '/requests/new', icon: 'add_circle' },
    { name: 'My Requests', href: '/requests', icon: 'assignment' },
    { name: 'Request History', href: '/history', icon: 'history' },
    { name: 'Notifications', href: '/notifications', icon: 'notifications' },
  ];

  return (
    <aside className="w-[260px] fixed left-0 top-0 h-full bg-[#1E3A8A] shadow-2xl flex flex-col py-6 z-50 border-r border-white/10">
      {/* Header */}
      <div className="px-6 mb-8 flex items-center gap-3">
        <span
          className="material-symbols-outlined text-3xl text-white"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          home_repair_service
        </span>
        <div className="flex flex-col">
          <span className="text-xl font-black tracking-tighter text-white uppercase">
            FIXTRACK
          </span>
          <span className="font-sidebar-label text-sidebar-label text-blue-300 uppercase tracking-widest">
            USER PORTAL
          </span>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 flex flex-col gap-1 px-2">
        {navLinks.map((link) => {
          const active = isActive(link.href);
          return (
            <Link key={link.href} href={link.href} className={getLinkClasses(link.href)}>
              <span
                className="material-symbols-outlined"
                style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {link.icon}
              </span>
              <span className="font-label-md text-label-md flex-1">{link.name}</span>
              {link.icon === 'notifications' && unreadCount > 0 && (
                <span className="ml-auto bg-error text-on-error text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto border-t border-white/10 pt-4 flex flex-col gap-1 px-2">
        <Link href="/profile" className={getLinkClasses('/profile')}>
          <span
            className="material-symbols-outlined"
            style={isActive('/profile') ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            person
          </span>
          <span className="font-label-md text-label-md">My Profile</span>
        </Link>
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
