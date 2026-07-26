'use client';

import { useState } from 'react';
import TechnicianSidebar from '@/components/technician/TechnicianSidebar';
import TechnicianTopBar from '@/components/technician/TechnicianTopBar';

type TechnicianLayoutClientProps = {
  firstName: string;
  lastName: string;
  children: React.ReactNode;
};

export default function TechnicianLayoutClient({
  firstName,
  lastName,
  children,
}: TechnicianLayoutClientProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="bg-surface-container-low text-on-surface font-body text-body min-h-screen flex antialiased">
      {/* Mobile Backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="print:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar with Drawer controls */}
      <TechnicianSidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-1 ml-0 lg:ml-[260px] print:ml-0 flex flex-col min-h-screen transition-all duration-300">
        {/* TopBar with Hamburger Toggle */}
        <TechnicianTopBar
          firstName={firstName}
          lastName={lastName}
          onOpenSidebar={() => setIsMobileSidebarOpen(true)}
        />

        <main className="flex-1 mt-16 print:mt-0 p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
