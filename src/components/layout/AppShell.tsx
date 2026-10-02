'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BedDouble, Users, CreditCard, Menu } from 'lucide-react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { UserRole } from '@/lib/types';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('ADMIN');
  const pathname = usePathname();

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.user) {
          setUserRole(d.user.role);
        }
      })
      .catch(() => {});
  }, [pathname]);

  const authRoutes = ['/login', '/signup', '/forgot-password', '/reset-password', '/verify-phone'];
  const isAuthPage = authRoutes.some((route) => pathname.startsWith(route));
  const isStudentPortal = pathname === '/student' || pathname.startsWith('/student/');

  // If on an Auth page or dedicated Student portal, render clean layout without admin shell
  if (isAuthPage || isStudentPortal) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userRole={userRole}
      />

      <div className="lg:pl-64 flex flex-col flex-1">
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-12">
          {children}
        </main>

        {/* Mobile Quick Bottom Navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 px-3 py-2 flex items-center justify-around shadow-lg">
          <Link
            href="/admin"
            className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-semibold transition ${
              pathname === '/admin' || pathname === '/' ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/rooms"
            className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-semibold transition ${
              pathname === '/rooms' ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            <BedDouble className="w-5 h-5 mb-0.5" />
            <span>Rooms</span>
          </Link>
          <Link
            href="/students"
            className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-semibold transition ${
              pathname.startsWith('/students') ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            <Users className="w-5 h-5 mb-0.5" />
            <span>Residents</span>
          </Link>
          <Link
            href="/fees"
            className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-semibold transition ${
              pathname === '/fees' ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            <CreditCard className="w-5 h-5 mb-0.5" />
            <span>Fees</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-semibold text-slate-500 hover:text-slate-900 transition"
          >
            <Menu className="w-5 h-5 mb-0.5" />
            <span>More</span>
          </button>
        </div>
      </div>
    </div>
  );
}

