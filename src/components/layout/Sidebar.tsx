'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BedDouble,
  Users,
  CreditCard,
  ReceiptText,
  AlertCircle,
  UserCheck,
  Megaphone,
  UtensilsCrossed,
  Receipt,
  FileSpreadsheet,
  ScrollText,
  Settings,
  X,
  Phone,
  MapPin,
} from 'lucide-react';
import { UserRole } from '@/lib/types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: UserRole;
}

export default function Sidebar({ isOpen, onClose, userRole = 'ADMIN' }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, roles: ['ADMIN', 'WARDEN'] },
    { label: 'Rooms & Beds', href: '/rooms', icon: BedDouble, roles: ['ADMIN', 'WARDEN'] },
    { label: 'Students / Residents', href: '/students', icon: Users, roles: ['ADMIN', 'WARDEN'] },
    { label: 'Fees & Payments', href: '/fees', icon: CreditCard, roles: ['ADMIN', 'WARDEN'] },
    { label: 'Receipts', href: '/receipts', icon: ReceiptText, roles: ['ADMIN', 'WARDEN'] },
    { label: 'Hostel Notices', href: '/notices', icon: Megaphone, roles: ['ADMIN', 'WARDEN'] },
    { label: 'Complaints', href: '/complaints', icon: AlertCircle, roles: ['ADMIN', 'WARDEN'] },
    { label: 'Visitor Logs', href: '/visitors', icon: UserCheck, roles: ['ADMIN', 'WARDEN'] },
    { label: 'Announcements', href: '/announcements', icon: Megaphone, roles: ['ADMIN', 'WARDEN'] },
    { label: 'Mess / Food Menu', href: '/mess', icon: UtensilsCrossed, roles: ['ADMIN', 'WARDEN'] },
    { label: 'Hostel Expenses', href: '/expenses', icon: Receipt, roles: ['ADMIN', 'WARDEN'] },
    { label: 'Reports & Export', href: '/reports', icon: FileSpreadsheet, roles: ['ADMIN', 'WARDEN'] },
    { label: 'Hostel Rules', href: '/rules', icon: ScrollText, roles: ['ADMIN', 'WARDEN'] },
    { label: 'Fee Payment Settings', href: '/settings?tab=payment', icon: CreditCard, roles: ['ADMIN'] },
    { label: 'User Management', href: '/settings?tab=users', icon: Users, roles: ['ADMIN'] },
    { label: 'Settings', href: '/settings', icon: Settings, roles: ['ADMIN'] },
  ];

  const filteredNav = navItems.filter((item) => item.roles.includes(userRole));

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0B192C] text-slate-300 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } border-r border-slate-800 shadow-2xl lg:shadow-none`}
      >
        {/* Brand header */}
        <div className="p-5 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-500/20">
              AB
            </div>
            <div>
              <div className="text-sm font-black text-white tracking-wider uppercase">
                Abhishek Hostel
              </div>
              <div className="text-[11px] text-blue-400 font-medium">Smart Portal 2026</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Main Menu
          </div>
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onClose()}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Hostel Quick Info Card */}
        <div className="p-4 m-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
          <div className="flex items-center space-x-2 text-slate-200 font-semibold">
            <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="truncate">Knowledge Park III, Gr. Noida</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-400">
            <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>+91 98765 43210</span>
          </div>
        </div>
      </aside>
    </>
  );
}
