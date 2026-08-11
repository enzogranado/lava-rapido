'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileNav from './MobileNav';
import { ToastProvider } from '../ui/Toast';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const isStandalonePage = pathname === '/login' || pathname === '/cadastro' || pathname === '/landing';

  if (isStandalonePage) {
    return (
      <ToastProvider>
        {children}
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <div className="app-layout">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="main-content">
          <Header
            onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          />
          <main className="page-content">
            {children}
          </main>
        </div>
        <MobileNav onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      </div>
    </ToastProvider>
  );
}
