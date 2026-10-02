'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Bell,
  Building2,
  Menu,
  Shield,
  UserCheck,
  GraduationCap,
  CheckCheck,
  ChevronDown,
  LogOut,
  Settings,
  User,
  Users,
  Megaphone,
  CreditCard,
} from 'lucide-react';
import { UserRole } from '@/lib/types';
import GlobalSearchModal from '../common/GlobalSearchModal';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export default function Navbar({ onToggleSidebar }: NavbarProps) {
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [role, setRole] = useState<UserRole>('ADMIN');
  const [userName, setUserName] = useState('Mahesh');
  const [userEmail, setUserEmail] = useState('admin@abhishekhostel.com');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isPortalMenuOpen, setIsPortalMenuOpen] = useState(false);

  useEffect(() => {
    fetchSession();
    fetchNotifications();

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success && data.user) {
        setRole(data.user.role);
        setUserName(data.user.name);
        setUserEmail(data.user.email);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout error:', e);
    }
    window.location.href = '/login';
  };

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications', { method: 'PUT' });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200/80 px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Mobile Menu + Branding */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary to-navy-950 flex items-center justify-center text-white shadow-md shadow-navy-900/10">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="hidden sm:block">
                <div className="text-base font-extrabold tracking-tight text-navy-950 uppercase">
                  Abhishek Boys Hostel
                </div>
                <div className="text-[11px] font-medium text-slate-500">
                  Smart Hostel Management System
                </div>
              </div>
            </div>
          </div>

          {/* Center: Global Search Bar trigger */}
          <div className="flex-1 max-w-md hidden md:block">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="w-full flex items-center justify-between px-3.5 py-2 text-sm text-slate-400 bg-slate-100/80 hover:bg-slate-100 border border-slate-200/80 rounded-xl transition shadow-inner"
            >
              <span className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-500">Search students, rooms, beds...</span>
              </span>
              <kbd className="text-[10px] uppercase font-semibold text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-sm">
                Ctrl K
              </kbd>
            </button>
          </div>

          {/* Right: Actions & User Profile */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Mobile search button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              title="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Portals Switcher / Login Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsPortalMenuOpen(!isPortalMenuOpen)}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition border border-slate-200"
                title="Switch Portal or Login"
              >
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Portals</span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {isPortalMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Select Hostel Portal
                    </span>
                    <span className="text-[10px] font-bold text-blue-600">ABHISHEK</span>
                  </div>

                  <div className="space-y-1 pt-1">
                    <Link
                      href="/login?portal=admin"
                      onClick={() => setIsPortalMenuOpen(false)}
                      className="flex items-start space-x-3 p-2.5 rounded-xl hover:bg-blue-50/70 transition group"
                    >
                      <div className="p-2 bg-blue-100 text-blue-700 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900 group-hover:text-blue-700 transition">
                          Admin Portal
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Authorized hostel administration & management
                        </div>
                      </div>
                    </Link>

                    <Link
                      href="/login?portal=student"
                      onClick={() => setIsPortalMenuOpen(false)}
                      className="flex items-start space-x-3 p-2.5 rounded-xl hover:bg-emerald-50/70 transition group"
                    >
                      <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900 group-hover:text-emerald-700 transition">
                          Student Portal
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Resident room, monthly fees, notices & receipts
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/80">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-800 text-sm">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-semibold">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center space-x-1 font-medium"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Mark read</span>
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs">
                        No notifications at this time
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3.5 hover:bg-slate-50 transition text-left ${
                            !n.isRead ? 'bg-blue-50/40' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-800">{n.title}</span>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap">
                              {new Date(n.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Menu & Logout */}
            <div className="relative pl-2 border-l border-slate-200">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-slate-100 transition"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-navy-800 to-navy-600 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                  {userName.charAt(0)}
                </div>
                <div className="hidden xl:block text-left text-xs">
                  <div className="font-bold text-slate-800 leading-tight">{userName.split(' ')[0]}</div>
                  <div className="text-[10px] text-slate-400 font-semibold">{role}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 opacity-70" />
              </button>

              {/* User Dropdown */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <div className="font-bold text-slate-900 text-xs truncate">{userName}</div>
                    <div className="text-[11px] text-slate-500 font-mono truncate">{userEmail}</div>
                    <div className="mt-1.5">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-700">
                        {role} Access
                      </span>
                    </div>
                  </div>

                  <div className="py-1">
                    {role === 'ADMIN' && (
                      <>
                        <Link
                          href="/notices"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center space-x-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition"
                        >
                          <Megaphone className="w-4 h-4 text-slate-400" />
                          <span>Hostel Notices</span>
                        </Link>
                        <Link
                          href="/settings?tab=payment"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center space-x-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition"
                        >
                          <CreditCard className="w-4 h-4 text-slate-400" />
                          <span>Fee Payment Settings</span>
                        </Link>
                        <Link
                          href="/settings?tab=users"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center space-x-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition"
                        >
                          <Users className="w-4 h-4 text-slate-400" />
                          <span>User Management</span>
                        </Link>
                      </>
                    )}

                    <Link
                      href="/settings"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center space-x-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span>Hostel Settings</span>
                    </Link>
                  </div>

                  <div className="pt-1 border-t border-slate-100">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2.5 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition text-left"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Global Search Dialog */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}

