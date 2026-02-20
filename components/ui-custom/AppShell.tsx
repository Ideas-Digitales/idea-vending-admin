'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { AppShellContext } from '@/lib/contexts/AppShellContext';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AppShellContext.Provider value={{ openSidebar: () => setSidebarOpen(true) }}>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Backdrop (mobile only) */}
        <div
          className={`fixed inset-0 z-40 bg-black/50 md:hidden transition-opacity duration-300 ${
            sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* Sidebar wrapper */}
        <div
          className={`fixed inset-y-0 left-0 z-50 transition-transform duration-300 md:static md:z-auto md:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-h-screen overflow-auto min-w-0">
          {children}
        </div>
      </div>
    </AppShellContext.Provider>
  );
}
