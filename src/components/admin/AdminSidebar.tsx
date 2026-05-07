'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const navLinks = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: 'dashboard' },
    { name: 'Maintenance Requests', href: '/admin/requests', icon: 'build' },
    { name: 'Task Assignment', href: '/admin/assignments', icon: 'groups' },
    { name: 'Reports & Analytics', href: '/admin/analytics', icon: 'analytics' },
    { name: 'User Management', href: '/admin/users', icon: 'manage_accounts' },
    { name: 'Audit Logs', href: '/admin/audit-logs', icon: 'policy' },
  ];

  const getLinkClasses = (href: string) => {
    const isActive = pathname === href || pathname.startsWith(`${href}/`);
    return isActive
      ? 'bg-[#2563EB] text-white rounded-lg px-4 py-2.5 mx-2 flex items-center gap-3 transition-all duration-200'
      : 'text-slate-300 hover:bg-white/10 hover:text-white rounded-lg px-4 py-2.5 mx-2 flex items-center gap-3 transition-all duration-200';
  };

  return (
    <aside className="w-[260px] h-full fixed left-0 top-0 border-r border-white/10 shadow-2xl bg-[#1E3A8A] text-blue-600 font-['Inter'] antialiased tracking-tight z-50 flex flex-col py-6">
      <div className="px-6 mb-8 flex flex-col gap-1">
        <span className="text-xl font-black tracking-tighter text-white uppercase">FIXTRACK</span>
        <span className="font-sidebar-label text-sidebar-label text-blue-200 opacity-80 uppercase tracking-widest">
          ADMIN PORTAL
        </span>
      </div>
      
      <nav className="flex-1 flex flex-col gap-1 px-2">
        {navLinks.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link key={link.href} href={link.href} className={getLinkClasses(link.href)}>
              <span 
                className="material-symbols-outlined" 
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {link.icon}
              </span>
              <span className="font-label-md text-label-md">{link.name}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="mt-auto flex flex-col gap-1 px-2 pt-4 border-t border-white/10">
        <Link href="/admin/settings" className={getLinkClasses('/admin/settings')}>
          <span className="material-symbols-outlined">settings</span>
          <span className="font-label-md text-label-md">Settings</span>
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
