'use client';

import { useState } from 'react';
import UserSidebar from './UserSidebar';
import UserTopBar from './UserTopBar';

type UserProps = {
  firstName: string;
  lastName: string;
  role: string;
  avatarUrl?: string | null;
};

export default function UserLayoutClient({ 
  children, 
  user 
}: { 
  children: React.ReactNode; 
  user: UserProps;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="bg-surface-container-low text-on-surface font-body text-body min-h-screen antialiased">
      <UserSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <UserTopBar user={user} onMenuClick={() => setIsSidebarOpen(true)} />
      
      <main className="lg:ml-[260px] pt-16 min-h-screen bg-surface-container-low px-4 md:px-8 py-8 transition-all">
        {children}
      </main>
      
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
