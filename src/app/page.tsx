'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BedDouble,
  Users,
  CreditCard,
  Building,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  PlusCircle,
  ArrowRight,
  UtensilsCrossed,
  Megaphone,
  Check,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Phone,
  QrCode,
  Copy,
  Bell,
} from 'lucide-react';
import Badge from '@/components/common/Badge';
import Modal from '@/components/common/Modal';
import { formatCurrency, formatDate } from '@/lib/formatters';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('ADMIN');
  const [userName, setUserName] = useState('Admin');
  const [paymentSetting, setPaymentSetting] = useState<any>(null);
  const [hostelNotices, setHostelNotices] = useState<any[]>([]);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Modals
  const [reminderModal, setReminderModal] = useState<{ isOpen: boolean; data: any | null }>({
    isOpen: false,
    data: null,
  });
  const [quickPayModal, setQuickPayModal] = useState<{ isOpen: boolean; payment: any | null }>({
    isOpen: false,
    payment: null,
  });
  const [copiedReminder, setCopiedReminder] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amountPaid: '',
    paymentMethod: 'UPI',
    transactionId: '',
    remarks: 'Fee payment received',
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, userRes, paymentRes, noticesRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/auth/me'),
        fetch('/api/payment-settings').catch(() => null),
        fetch('/api/notices').catch(() => null),
      ]);
      const statsData = await statsRes.json();
      const userData = await userRes.json();

      if (statsData.success) {
        setStats(statsData.stats);
      }
      if (userData.success && userData.user) {
        setUserRole(userData.user.role);
        setUserName(userData.user.name);
      }
      if (paymentRes) {
        const pData = await paymentRes.json();
        if (pData.success && pData.paymentSetting) {
          setPaymentSetting(pData.paymentSetting);
        }
      }
      if (noticesRes) {
        const nData = await noticesRes.json();
        if (nData.success && nData.notices) {
          setHostelNotices(nData.notices);
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = async (student: any) => {
    try {
      const res = await fetch('/api/payments/remind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: student.id, channel: 'WHATSAPP' }),
      });
      const data = await res.json();
      if (data.success) {
        setReminderModal({ isOpen: true, data: data.reminder });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openQuickPay = (studentPayment: any) => {
    setPaymentForm({
      amountPaid: String(studentPayment.balance || studentPayment.amount),
      paymentMethod: 'UPI',
      transactionId: `UPI${Date.now().toString().slice(-8)}`,
      remarks: 'Fee received on time',
    });
    setQuickPayModal({ isOpen: true, payment: studentPayment });
  };

  const submitQuickPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPayModal.payment) return;
    setSubmittingPayment(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: quickPayModal.payment.id,
          amountPaid: parseFloat(paymentForm.amountPaid),
          paymentMethod: paymentForm.paymentMethod,
          transactionId: paymentForm.transactionId,
          remarks: paymentForm.remarks,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setQuickPayModal({ isOpen: false, payment: null });
        fetchDashboardData();
      } else {
        alert(data.error || 'Failed to record payment');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingPayment(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedReminder(true);
    setTimeout(() => setCopiedReminder(false), 2500);
  };

  if (loading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-500">Loading hostel dashboard...</p>
      </div>
    );
  }

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#0B192C] via-[#1E3E62] to-[#1E293B] text-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-navy-950/10">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-semibold mb-2 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            <span>Abhishek Boys Hostel • Greater Noida</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {getTimeGreeting()}, {userName.split(' ')[0]} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Here is the live operational overview of rooms, bed occupancy, student fee collections, and maintenance status.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/students"
            className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-blue-600/30"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Register Student</span>
          </Link>
          <Link
            href="/rooms"
            className="flex items-center space-x-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition backdrop-blur-sm"
          >
            <Building className="w-4 h-4" />
            <span>Manage Rooms</span>
          </Link>
        </div>
      </div>

      {/* Announcements Ticker / Alert if active */}
      {stats.recentAnnouncements && stats.recentAnnouncements.length > 0 && (
        <div className="bg-amber-50/90 border border-amber-200/80 rounded-2xl p-4 flex items-start sm:items-center justify-between gap-3 text-amber-900 shadow-sm">
          <div className="flex items-start sm:items-center space-x-3">
            <div className="p-2 bg-amber-100 rounded-xl text-amber-700 shrink-0">
              <Megaphone className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 mr-2">
                Announcement:
              </span>
              <span className="text-xs font-semibold text-amber-900">
                {stats.recentAnnouncements[0].title}
              </span>
              <p className="text-xs text-amber-800 line-clamp-1 mt-0.5 hidden sm:block">
                {stats.recentAnnouncements[0].content}
              </p>
            </div>
          </div>
          <Link
            href="/announcements"
            className="text-xs font-bold text-amber-800 hover:text-amber-950 underline shrink-0 whitespace-nowrap"
          >
            View All
          </Link>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Rooms */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Rooms
            </span>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Building className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-800">
              {stats.totalRooms}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center space-x-1">
              <span>Across 3 Floors</span>
            </div>
          </div>
        </div>

        {/* Total Beds & Occupancy */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Bed Capacity
            </span>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <BedDouble className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-800">
                {stats.totalBeds}
              </span>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                {stats.occupancyRate}% Occupied
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              <span className="font-semibold text-slate-700">{stats.occupiedBeds}</span> occupied •{' '}
              <span className="font-semibold text-emerald-600">{stats.availableBeds}</span> available
            </div>
          </div>
        </div>

        {/* Active Students */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Residents
            </span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-800">
              {stats.totalStudents}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {stats.activeStudents} active • {stats.noticeStudents} on notice
            </div>
          </div>
        </div>

        {/* Monthly Fees Collected */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Fee Collections
            </span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-emerald-600">
              {formatCurrency(stats.fees.collected)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Expected: {formatCurrency(stats.fees.expected)} ({stats.fees.paidCount} paid)
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Occupancy Overview & Fee Progress Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Occupancy Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-800">Occupancy Overview</h2>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                {stats.occupancyRate}% Full
              </span>
            </div>

            {/* Visual Big Bar & Stats */}
            <div className="space-y-3">
              <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, stats.occupancyRate)}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="text-xs text-slate-400 font-medium">Occupied Beds</div>
                  <div className="text-xl font-bold text-slate-800 mt-0.5">
                    {stats.occupiedBeds}{' '}
                    <span className="text-xs font-normal text-slate-500">/ {stats.totalBeds}</span>
                  </div>
                </div>
                <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100">
                  <div className="text-xs text-emerald-600 font-medium">Available Beds</div>
                  <div className="text-xl font-bold text-emerald-700 mt-0.5">
                    {stats.availableBeds}{' '}
                    <span className="text-xs font-normal text-emerald-600">vacant</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floor Breakdown */}
            <div className="mt-5 space-y-2.5">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Floor Breakdown
              </div>
              {stats.floorBreakdown.map((f: any) => {
                const floorRate = f.totalBeds > 0 ? Math.round((f.occupiedBeds / f.totalBeds) * 100) : 0;
                return (
                  <div key={f.floor} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-600">
                      <span>Floor {f.floor} ({f.roomsCount} Rooms)</span>
                      <span>
                        {f.occupiedBeds} / {f.totalBeds} Beds ({floorRate}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-700 rounded-full"
                        style={{ width: `${floorRate}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Link
            href="/rooms"
            className="mt-6 flex items-center justify-center space-x-1.5 py-2.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50/50 hover:bg-blue-50 rounded-xl transition"
          >
            <span>View Interactive Bed Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Fee Collection Summary */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-800">Fee Collection</h2>
                <p className="text-xs text-slate-400">{stats.currentMonth}</p>
              </div>
              <Badge status={stats.fees.pending === 0 ? 'PAID' : 'PENDING'} />
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-2xl border border-slate-100 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Expected Total:</span>
                  <span className="font-bold text-slate-800">
                    {formatCurrency(stats.fees.expected)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Collected So Far:</span>
                  <span className="font-bold text-emerald-600">
                    {formatCurrency(stats.fees.collected)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-slate-200 pt-2 font-bold">
                  <span className="text-rose-600">Pending Dues:</span>
                  <span className="text-rose-600">
                    {formatCurrency(stats.fees.pending)}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Collection Progress</span>
                  <span className="font-bold text-slate-700">
                    {stats.fees.expected > 0
                      ? Math.round((stats.fees.collected / stats.fees.expected) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                    style={{
                      width: `${
                        stats.fees.expected > 0
                          ? Math.min(100, Math.round((stats.fees.collected / stats.fees.expected) * 100))
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs pt-1">
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                  <div className="font-bold text-emerald-800 text-lg">{stats.fees.paidCount}</div>
                  <div className="text-[11px] text-emerald-600">Students Paid</div>
                </div>
                <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-100">
                  <div className="font-bold text-rose-800 text-lg">
                    {stats.fees.pendingCount + stats.fees.overdueCount}
                  </div>
                  <div className="text-[11px] text-rose-600">Pending / Overdue</div>
                </div>
              </div>
            </div>
          </div>

          <Link
            href="/fees"
            className="mt-6 flex items-center justify-center space-x-1.5 py-2.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/60 rounded-xl transition"
          >
            <span>Manage All Payments</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mess / Food Preview Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Today&apos;s Mess Menu</h2>
                  <p className="text-xs text-slate-400">{stats.todayMenu?.dayOfWeek || 'Today'}</p>
                </div>
              </div>
              {stats.todayMenu?.isSpecialDay && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                  Special Menu
                </span>
              )}
            </div>

            {stats.todayMenu ? (
              <div className="space-y-2.5 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-700 block text-[11px]">🥞 Breakfast:</span>
                  <span className="text-slate-600 line-clamp-1">{stats.todayMenu.breakfast}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-700 block text-[11px]">🍛 Lunch:</span>
                  <span className="text-slate-600 line-clamp-1">{stats.todayMenu.lunch}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-700 block text-[11px]">☕ Evening Snacks:</span>
                  <span className="text-slate-600 line-clamp-1">{stats.todayMenu.snacks}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-700 block text-[11px]">🍲 Dinner:</span>
                  <span className="text-slate-600 line-clamp-1">{stats.todayMenu.dinner}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">No menu published for today.</p>
            )}
          </div>

          <Link
            href="/mess"
            className="mt-6 flex items-center justify-center space-x-1.5 py-2.5 text-xs font-bold text-orange-700 hover:text-orange-800 bg-orange-50 hover:bg-orange-100/60 rounded-xl transition"
          >
            <span>View Full Weekly Menu</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Row: Quick Configuration & Bulletins (Fee Payment Settings & Notices) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fee Payment Settings Shortcut Card */}
        <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white p-6 rounded-3xl border border-slate-800 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Fee Payment Settings</h2>
                  <p className="text-xs text-slate-400">Live student collection channel credentials</p>
                </div>
              </div>
              <span
                className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                  paymentSetting?.isActive !== false
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {paymentSetting?.isActive !== false ? '● Active' : '○ Paused'}
              </span>
            </div>

            <div className="space-y-3 pt-1 text-xs">
              <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block">Payment Name</span>
                  <span className="font-bold text-white text-sm">
                    {paymentSetting?.paymentName || 'Abhishek Boys Hostel'}
                  </span>
                </div>
                <span className="text-[10px] text-blue-300 bg-blue-900/50 px-2 py-0.5 rounded-lg border border-blue-800/60 font-medium">
                  Default Beneficiary
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block">UPI ID (VPA)</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {paymentSetting?.upiId || 'abhishekhostel@upi'}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(paymentSetting?.upiId || 'abhishekhostel@upi');
                      setCopiedUpi(true);
                      setTimeout(() => setCopiedUpi(false), 2000);
                    }}
                    className="p-1.5 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition"
                    title="Copy UPI ID"
                  >
                    {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block">Phone Number</span>
                    <span className="font-mono font-bold text-blue-300">
                      {paymentSetting?.phoneNumber || '9059860870'}
                    </span>
                  </div>
                  <div className="p-1.5 text-slate-400">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Link
            href="/settings?tab=payment"
            className="mt-5 flex items-center justify-center space-x-1.5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition shadow-md shadow-blue-600/30"
          >
            <span>Manage Fee Payment Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Hostel Notices & Bulletins Widget */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Hostel Notices & Updates</h2>
                  <p className="text-xs text-slate-500">Official bulletins broadcast to student residents</p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                {hostelNotices.filter((n) => n.isActive).length} Active
              </span>
            </div>

            <div className="space-y-2.5">
              {hostelNotices.length === 0 ? (
                <div className="p-5 text-center text-slate-400 text-xs">
                  No notices posted yet. Click below to publish your first announcement.
                </div>
              ) : (
                hostelNotices.slice(0, 3).map((notice) => (
                  <div
                    key={notice.id}
                    className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-800">{notice.title}</span>
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                            notice.priority === 'URGENT'
                              ? 'bg-rose-100 text-rose-700 font-bold'
                              : notice.priority === 'IMPORTANT'
                              ? 'bg-amber-100 text-amber-700 font-bold'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {notice.priority}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{notice.description}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                      {formatDate(notice.publishedAt || notice.createdAt)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <Link
            href="/notices"
            className="mt-5 flex items-center justify-center space-x-1.5 py-2.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/60 rounded-xl transition"
          >
            <span>Open Hostel Notices Manager</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Row 3: Pending Fees Table with 1-Click Reminder Buttons */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-800">Pending Fees This Month</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold">
                {stats.pendingStudents.length} Due
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Residents with unpaid or overdue hostel fee for {stats.currentMonth}.
            </p>
          </div>
          <Link
            href="/fees"
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
          >
            <span>View All Records</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {stats.pendingStudents.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm flex flex-col items-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
            <p className="font-semibold text-slate-700">All fees are cleared for this month!</p>
            <p className="text-xs text-slate-400 mt-1">No pending or overdue payments.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Resident</th>
                  <th className="px-6 py-3.5">Room & Bed</th>
                  <th className="px-6 py-3.5">Monthly Fee</th>
                  <th className="px-6 py-3.5">Due Date</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.pendingStudents.map((s: any) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{s.studentName}</div>
                      <div className="text-[11px] text-slate-400">{s.studentId} • {s.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-700">Room {s.roomNumber}</span>
                      <span className="text-slate-400 text-[11px] block">{s.bedNumber}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{formatCurrency(s.balance)}</div>
                      {s.amountPaid > 0 && (
                        <div className="text-[10px] text-emerald-600">
                          Paid: {formatCurrency(s.amountPaid)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {formatDate(s.dueDate)}
                    </td>
                    <td className="px-6 py-4">
                      <Badge status={s.status} />
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => handleSendReminder(s)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold text-xs transition"
                        title="Send fee reminder"
                      >
                        <Send className="w-3 h-3" />
                        <span>Remind</span>
                      </button>
                      <button
                        onClick={() => openQuickPay(s)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition shadow-sm"
                        title="Mark payment as received"
                      >
                        <Check className="w-3 h-3" />
                        <span>Pay</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Row 4: Recent Activity Stream (Recent Registrations & Recent Complaints) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Registrations */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-800">Recent Registrations</h2>
            <Link href="/students" className="text-xs font-bold text-blue-600 hover:text-blue-800">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {stats.recentStudents.map((st: any) => (
              <div
                key={st.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 hover:bg-slate-100/50 transition"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
                    {st.fullName.charAt(0)}
                  </div>
                  <div>
                    <Link
                      href={`/students/${st.id}`}
                      className="text-xs font-bold text-slate-800 hover:text-blue-600 transition"
                    >
                      {st.fullName}
                    </Link>
                    <div className="text-[11px] text-slate-500">
                      Room {st.room?.roomNumber || '—'} ({st.bed?.bedNumber || '—'}) •{' '}
                      {st.collegeName}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-semibold text-slate-500 block">
                    {formatDate(st.joiningDate)}
                  </span>
                  <Badge status={st.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Complaints */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-800">Recent Complaints</h2>
            <Link href="/complaints" className="text-xs font-bold text-blue-600 hover:text-blue-800">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {stats.recentComplaints.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No complaints logged.</p>
            ) : (
              stats.recentComplaints.map((c: any) => (
                <div
                  key={c.id}
                  className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 hover:bg-slate-100/50 transition flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-800">{c.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">
                        Room {c.roomNumber}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{c.description}</p>
                    <div className="text-[10px] text-slate-400">
                      Reported by {c.studentName} on {formatDate(c.createdAt)}
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col items-end space-y-1">
                    <Badge status={c.status} />
                    <Badge status={c.priority} size="sm" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Reminder Preview Modal */}
      <Modal
        isOpen={reminderModal.isOpen}
        onClose={() => setReminderModal({ isOpen: false, data: null })}
        title="Fee Reminder Prepared"
        subtitle="Direct WhatsApp Web Link and pre-formatted reminder text ready"
      >
        {reminderModal.data && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-500">Student:</span>
                <span className="font-bold text-slate-800">{reminderModal.data.studentName}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-500">Phone:</span>
                <span className="font-bold text-slate-800">{reminderModal.data.studentPhone}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-500">Due Amount:</span>
                <span className="font-bold text-rose-600">
                  {formatCurrency(reminderModal.data.dueAmount)}
                </span>
              </div>
            </div>

            {/* Clear Integration Layer notice as required in prompt */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Integration Status: </span>
                <span>{reminderModal.data.gatewayNotice}</span>
              </div>
            </div>

            {/* Message Box */}
            <div className="relative">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Formatted Message Text:
              </label>
              <textarea
                rows={7}
                readOnly
                value={reminderModal.data.messageText}
                className="w-full text-xs font-mono bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-800"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={() => copyToClipboard(reminderModal.data.messageText)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                {copiedReminder ? '✓ Copied to Clipboard!' : 'Copy Text'}
              </button>
              <a
                href={reminderModal.data.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-600/20"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Open in WhatsApp</span>
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </div>
          </div>
        )}
      </Modal>

      {/* Quick Pay Modal */}
      <Modal
        isOpen={quickPayModal.isOpen}
        onClose={() => setQuickPayModal({ isOpen: false, payment: null })}
        title="Record Fee Payment"
        subtitle={`Record hostel fee collection for ${quickPayModal.payment?.studentName || ''}`}
      >
        {quickPayModal.payment && (
          <form onSubmit={submitQuickPay} className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Student:</span>
                <span className="font-bold text-slate-800">{quickPayModal.payment.studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Room / Bed:</span>
                <span className="font-medium text-slate-700">
                  Room {quickPayModal.payment.roomNumber} ({quickPayModal.payment.bedNumber})
                </span>
              </div>
              <div className="flex justify-between font-bold text-emerald-700 pt-1 border-t border-slate-200">
                <span>Total Due:</span>
                <span>{formatCurrency(quickPayModal.payment.balance || quickPayModal.payment.amount)}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Amount Received (₹)
              </label>
              <input
                type="number"
                required
                value={paymentForm.amountPaid}
                onChange={(e) => setPaymentForm({ ...paymentForm, amountPaid: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method</label>
              <select
                value={paymentForm.paymentMethod}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank NEFT / IMPS Transfer</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Transaction / Reference ID
              </label>
              <input
                type="text"
                value={paymentForm.transactionId}
                onChange={(e) => setPaymentForm({ ...paymentForm, transactionId: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. UPI489201940"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Remarks</label>
              <input
                type="text"
                value={paymentForm.remarks}
                onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-3">
              <button
                type="button"
                onClick={() => setQuickPayModal({ isOpen: false, payment: null })}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingPayment}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md disabled:opacity-50"
              >
                {submittingPayment ? 'Processing...' : 'Confirm Payment'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
