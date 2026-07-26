'use client';

import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminTopBar from './AdminTopBar';

type UserProps = {
  firstName: string;
  lastName: string;
  role: string;
};

export default function AdminLayoutClient({
  user,
  children,
}: {
  user: UserProps;
  children: React.ReactNode;
}) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="bg-[#F1F5F9] text-slate-900 font-body text-body min-h-screen flex antialiased">
      {/* Sidebar with mobile open state */}
      <AdminSidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Backdrop for mobile drawer */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 ml-0 lg:ml-[260px] print:ml-0 flex flex-col min-h-screen transition-all duration-300 w-full overflow-x-hidden">
        <AdminTopBar
          user={user}
          onOpenSidebar={() => setIsMobileSidebarOpen(true)}
        />
        <main className="flex-1 mt-16 print:mt-0 p-4 sm:p-6 lg:p-8 print:p-0 max-w-[1440px] mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
