'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  Save,
  CheckCircle2,
  DollarSign,
  Calendar,
  Mail,
  Phone,
  MapPin,
  QrCode,
  Shield,
  Users,
  UserPlus,
  Key,
  Ban,
  CheckCircle,
  Clock,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
  CreditCard,
  Smartphone,
  Copy,
  ExternalLink,
} from 'lucide-react';
import Badge from '@/components/common/Badge';
import Modal from '@/components/common/Modal';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/formatters';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'payment' | 'users'>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Fee Payment Settings State
  const [paymentForm, setPaymentForm] = useState({
    upiId: '',
    phoneNumber: '',
    paymentName: '',
    qrCodeUrl: '',
    instructions: '',
    isActive: true,
  });
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentSavedSuccess, setPaymentSavedSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Settings Form State
  const [form, setForm] = useState({
    hostelName: '',
    tagline: '',
    address: '',
    phone: '',
    email: '',
    defaultMonthlyFee: 5000,
    feeDueDay: 5,
    currency: '₹',
    upiId: '',
    bankAccount: '',
  });

  // User Management State
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userRoleFilter, setUserRoleFilter] = useState<'ALL' | 'ADMIN' | 'STUDENT'>('ALL');
  const [createAdminModal, setCreateAdminModal] = useState(false);
  const [resetPasswordModal, setResetPasswordModal] = useState<{ isOpen: boolean; user: any | null }>({
    isOpen: false,
    user: null,
  });

  // Create Admin Form
  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'ADMIN',
  });
  const [newPasswordVal, setNewPasswordVal] = useState('');
  const [adminActionError, setAdminActionError] = useState('');
  const [adminActionSuccess, setAdminActionSuccess] = useState('');

  useEffect(() => {
    fetchSettings();
    fetchPaymentSettings();
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      if (tabParam === 'users') {
        setActiveTab('users');
      } else if (tabParam === 'payment') {
        setActiveTab('payment');
      }
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'payment') {
      fetchPaymentSettings();
    }
  }, [activeTab]);

  const fetchPaymentSettings = async () => {
    setLoadingPayment(true);
    try {
      const res = await fetch('/api/payment-settings');
      const data = await res.json();
      if (data.success && data.paymentSetting) {
        setPaymentForm({
          upiId: data.paymentSetting.upiId || '',
          phoneNumber: data.paymentSetting.phoneNumber || '',
          paymentName: data.paymentSetting.paymentName || '',
          qrCodeUrl: data.paymentSetting.qrCodeUrl || '',
          instructions: data.paymentSetting.instructions || '',
          isActive: data.paymentSetting.isActive ?? true,
        });
      }
    } catch (e) {
      console.error('Error fetching payment settings:', e);
    } finally {
      setLoadingPayment(false);
    }
  };

  const handleSavePaymentSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPayment(true);
    setPaymentSavedSuccess(false);
    setPaymentError('');
    try {
      const res = await fetch('/api/payment-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentForm),
      });
      const data = await res.json();
      if (data.success) {
        setPaymentSavedSuccess(true);
        setTimeout(() => setPaymentSavedSuccess(false), 3500);
        if (data.paymentSetting) {
          setPaymentForm({
            upiId: data.paymentSetting.upiId || '',
            phoneNumber: data.paymentSetting.phoneNumber || '',
            paymentName: data.paymentSetting.paymentName || '',
            qrCodeUrl: data.paymentSetting.qrCodeUrl || '',
            instructions: data.paymentSetting.instructions || '',
            isActive: data.paymentSetting.isActive ?? true,
          });
        }
      } else {
        setPaymentError(data.error || 'Failed to save payment settings.');
      }
    } catch (e) {
      setPaymentError('Network or server error while updating payment settings.');
    } finally {
      setSavingPayment(false);
    }
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.success && data.settings) {
        setForm({
          hostelName: data.settings.hostelName || 'Abhishek Boys Hostel',
          tagline: data.settings.tagline || 'Smart Hostel Management System',
          address: data.settings.address || '',
          phone: data.settings.phone || '',
          email: data.settings.email || '',
          defaultMonthlyFee: data.settings.defaultMonthlyFee || 5000,
          feeDueDay: data.settings.feeDueDay || 5,
          currency: data.settings.currency || '₹',
          upiId: data.settings.upiId || '',
          bankAccount: data.settings.bankAccount || '',
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (e) {
      console.error('Error fetching users:', e);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        alert(data.error || 'Failed to save settings');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminActionError('');
    setAdminActionSuccess('');

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAdmin),
      });
      const data = await res.json();
      if (data.success) {
        setAdminActionSuccess(data.message || 'Admin account created successfully.');
        setCreateAdminModal(false);
        setNewAdmin({ name: '', email: '', phone: '', password: '', role: 'ADMIN' });
        fetchUsers();
      } else {
        setAdminActionError(data.error || 'Failed to create admin.');
      }
    } catch (e) {
      setAdminActionError('Server error while creating admin.');
    }
  };

  const handleToggleStatus = async (userId: string) => {
    if (!confirm('Are you sure you want to change this user account status?')) return;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'toggle_status' }),
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
      } else {
        alert(data.error || 'Failed to update user status.');
      }
    } catch (e) {
      alert('Error updating status');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordModal.user) return;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: resetPasswordModal.user.id,
          action: 'reset_password',
          newPassword: newPasswordVal,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || 'Password reset successfully.');
        setResetPasswordModal({ isOpen: false, user: null });
        setNewPasswordVal('');
      } else {
        alert(data.error || 'Failed to reset password.');
      }
    } catch (e) {
      alert('Error resetting password');
    }
  };

  const filteredUsers = users.filter((u) => {
    if (userRoleFilter === 'ALL') return true;
    return u.role === userRoleFilter;
  });

  if (loading) {
    return <div className="p-12 text-center text-slate-400 text-xs">Loading settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Admin Settings & User Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure hostel operational rules, room rates, and securely manage administrator & student accounts.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Settings saved successfully!</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center space-x-2 py-3 px-5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'general'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>General & Hostel Profile</span>
        </button>
        <button
          onClick={() => setActiveTab('payment')}
          className={`flex items-center space-x-2 py-3 px-5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'payment'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Fee Payment Settings</span>
          {paymentForm.isActive ? (
            <span className="ml-1.5 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black">
              ACTIVE
            </span>
          ) : (
            <span className="ml-1.5 px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full text-[10px] font-black">
              DISABLED
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center space-x-2 py-3 px-5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'users'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Management</span>
          <span className="ml-1.5 px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px]">
            {users.length}
          </span>
        </button>
      </div>

      {/* TAB 1: GENERAL CONFIGURATION */}
      {activeTab === 'general' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Hostel Branding Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Building2 className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-800">Hostel Profile & Identity</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Hostel Name</label>
                <input
                  type="text"
                  value={form.hostelName}
                  onChange={(e) => setForm({ ...form, hostelName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tagline</label>
                <input
                  type="text"
                  value={form.tagline}
                  onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Hostel Full Address</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <textarea
                    rows={2}
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Fee & Billing Rules Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-800">Fee & Billing Defaults</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Default Monthly Fee ({form.currency})
                </label>
                <input
                  type="number"
                  value={form.defaultMonthlyFee}
                  onChange={(e) => setForm({ ...form, defaultMonthlyFee: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none font-bold text-slate-800"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Applied by default to new resident bed assignments.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Monthly Due Day</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="number"
                    min={1}
                    max={28}
                    value={form.feeDueDay}
                    onChange={(e) => setForm({ ...form, feeDueDay: Number(e.target.value) })}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none font-bold text-slate-800"
                    required
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  e.g., 5th of every month.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Currency Symbol</label>
                <input
                  type="text"
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none font-bold text-slate-800"
                  required
                />
              </div>
            </div>
          </div>

          {/* Payment Gateways / UPI Info */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <QrCode className="w-5 h-5 text-purple-600" />
              <h2 className="text-base font-bold text-slate-800">Payment Collection Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Hostel UPI VPA ID</label>
                <input
                  type="text"
                  value={form.upiId}
                  onChange={(e) => setForm({ ...form, upiId: e.target.value })}
                  placeholder="e.g. abhishekhostel@upi"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Displayed on student payment reminder notices and receipts.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Bank Account Instructions</label>
                <input
                  type="text"
                  value={form.bankAccount}
                  onChange={(e) => setForm({ ...form, bankAccount: e.target.value })}
                  placeholder="Bank name, A/C number, IFSC code"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-2xl shadow-sm transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB: FEE PAYMENT SETTINGS */}
      {activeTab === 'payment' && (
        <div className="space-y-6">
          {/* Header Info Banner */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-7 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-semibold mb-2">
                <CreditCard className="w-3.5 h-3.5 text-blue-300" />
                <span>Student Fee Collection Channel</span>
              </div>
              <h2 className="text-xl font-black text-white">Fee Payment Settings</h2>
              <p className="text-xs text-blue-200 mt-1 max-w-xl">
                Configure the payment channels (UPI VPA, Phone Number, QR Code, and instructions) displayed to residents in the Student Portal for paying monthly fees.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <span
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider ${
                  paymentForm.isActive
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                    : 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                }`}
              >
                {paymentForm.isActive ? '● Accepting Payments' : '○ Payments Paused'}
              </span>
            </div>
          </div>

          {paymentSavedSuccess && (
            <div className="flex items-center space-x-2 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Fee payment settings updated successfully! Students will now see these updated payment credentials.</span>
            </div>
          )}

          {paymentError && (
            <div className="flex items-center space-x-2 px-4 py-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-2xl animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{paymentError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form Settings Form (7 cols) */}
            <form onSubmit={handleSavePaymentSettings} className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-sm space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800">Payment Channel Configuration</h3>
                <p className="text-[11px] text-slate-500">Edit the official payment details stored in the database.</p>
              </div>

              <div className="space-y-4 text-xs">
                {/* Payment Name */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Account Holder / Payment Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={paymentForm.paymentName}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentName: e.target.value })}
                    placeholder="e.g. Abhishek Boys Hostel"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none font-semibold text-slate-800"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Official name displayed to students under 'Pay To'.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* UPI ID */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Hostel UPI ID (VPA) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={paymentForm.upiId}
                      onChange={(e) => setPaymentForm({ ...paymentForm, upiId: e.target.value })}
                      placeholder="e.g. abhishekhostel@upi"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none font-mono font-bold text-blue-700"
                      required
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Direct VPA for GPay, PhonePe, Paytm, BHIM.
                    </span>
                  </div>

                  {/* Payment Phone */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Payment Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={paymentForm.phoneNumber}
                      onChange={(e) => setPaymentForm({ ...paymentForm, phoneNumber: e.target.value })}
                      placeholder="e.g. 9059860870"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none font-mono font-bold text-slate-800"
                      required
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Number linked to UPI apps for mobile transfers.
                    </span>
                  </div>
                </div>

                {/* Optional QR Code URL */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">QR Code Image URL (Optional)</label>
                    <button
                      type="button"
                      onClick={() => {
                        if (paymentForm.upiId) {
                          setPaymentForm({
                            ...paymentForm,
                            qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=${encodeURIComponent(
                              paymentForm.upiId
                            )}&pn=${encodeURIComponent(paymentForm.paymentName || 'Abhishek Boys Hostel')}&cu=INR`,
                          });
                        }
                      }}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-800 underline"
                    >
                      Auto-generate UPI QR code
                    </button>
                  </div>
                  <input
                    type="url"
                    value={paymentForm.qrCodeUrl}
                    onChange={(e) => setPaymentForm({ ...paymentForm, qrCodeUrl: e.target.value })}
                    placeholder="https://example.com/hostel-qr.png"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none font-mono text-slate-700"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Direct image link to scan UPI QR or leave auto-generated.
                  </span>
                </div>

                {/* Instructions */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Instructions</label>
                  <textarea
                    rows={3}
                    value={paymentForm.instructions}
                    onChange={(e) => setPaymentForm({ ...paymentForm, instructions: e.target.value })}
                    placeholder="e.g. Pay your monthly hostel fee using the UPI ID or Phone number above. Then upload your screenshot receipt for instant warden verification."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none leading-relaxed"
                  />
                </div>

                {/* Active status toggle */}
                <div className="pt-2">
                  <label className="flex items-center space-x-3 cursor-pointer p-3 bg-slate-50 rounded-2xl border border-slate-200 hover:bg-slate-100/60 transition">
                    <input
                      type="checkbox"
                      checked={paymentForm.isActive}
                      onChange={(e) => setPaymentForm({ ...paymentForm, isActive: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-bold text-slate-800 text-xs">Enable Fee Payment Channel for Students</div>
                      <div className="text-[11px] text-slate-500">
                        When enabled, students can view these payment details and upload receipts in their portal.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="submit"
                  disabled={savingPayment}
                  className="flex items-center space-x-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingPayment ? 'Saving...' : 'Save Fee Payment Settings'}</span>
                </button>
              </div>
            </form>

            {/* Live Student Preview Card (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-600">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Live Student Portal View Preview</span>
              </div>

              <div className="bg-[#0B192C] text-slate-200 rounded-3xl p-6 shadow-xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">
                      Official Fee Payment Details
                    </div>
                    <div className="text-base font-extrabold text-white mt-0.5">
                      {paymentForm.paymentName || 'Abhishek Boys Hostel'}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      paymentForm.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {paymentForm.isActive ? 'ONLINE' : 'PAUSED'}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-2.5 text-xs">
                  <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold">UPI ID (VPA)</div>
                      <div className="text-sm font-mono font-bold text-emerald-400 mt-0.5">
                        {paymentForm.upiId || 'abhishekhostel@upi'}
                      </div>
                    </div>
                    <div className="p-2 bg-slate-800 rounded-xl text-slate-400">
                      <Copy className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold">Phone Number</div>
                      <div className="text-sm font-mono font-bold text-blue-400 mt-0.5">
                        {paymentForm.phoneNumber || '9059860870'}
                      </div>
                    </div>
                    <div className="p-2 bg-slate-800 rounded-xl text-slate-400">
                      <Phone className="w-4 h-4" />
                    </div>
                  </div>

                  {paymentForm.qrCodeUrl && (
                    <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 flex items-center space-x-3">
                      <div className="w-14 h-14 bg-white rounded-xl p-1 shrink-0 flex items-center justify-center">
                        <img
                          src={paymentForm.qrCodeUrl}
                          alt="QR Code"
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <div className="text-[11px] text-slate-300">
                        <span className="font-bold text-white block">UPI QR Ready</span>
                        Students can scan and pay instantly from any UPI app.
                      </div>
                    </div>
                  )}

                  {paymentForm.instructions && (
                    <div className="p-3 bg-blue-950/30 rounded-2xl border border-blue-900/40 text-[11px] text-blue-200 leading-relaxed">
                      <span className="font-bold block text-blue-300 mb-0.5">Instructions:</span>
                      {paymentForm.instructions}
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <div className="w-full py-2.5 bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs font-bold rounded-xl text-center">
                    Student CTA: Upload Payment Receipt
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-600">Filter Role:</span>
              <div className="flex space-x-1.5">
                {(['ALL', 'ADMIN', 'STUDENT'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setUserRoleFilter(r)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${
                      userRoleFilter === r
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                setAdminActionError('');
                setCreateAdminModal(true);
              }}
              className="flex items-center space-x-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              <UserPlus className="w-4 h-4 text-blue-400" />
              <span>Create Authorized Admin</span>
            </button>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-600 uppercase font-black tracking-wider text-[10px] border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-4">User</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Contact</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Last Login</th>
                    <th className="py-3.5 px-4">Created Date</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Loading users...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No users found matching filter.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200 font-black text-slate-600 flex items-center justify-center text-xs overflow-hidden">
                              {u.avatar ? (
                                <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                              ) : (
                                u.name.charAt(0)
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{u.name}</div>
                              <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                              {u.student && (
                                <div className="text-[10px] text-blue-600">
                                  ID: {u.student.studentId} • Room {u.student.room?.roomNumber || 'Unassigned'}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <Badge
                            variant={u.role === 'ADMIN' ? 'purple' : 'blue'}
                            className="font-bold text-[10px]"
                          >
                            {u.role}
                          </Badge>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600">
                          <div>{u.phone || 'No phone'}</div>
                          <div className="text-[10px] text-slate-400 flex items-center space-x-1 mt-0.5">
                            <span>Auth: {u.authProvider}</span>
                            {u.phoneVerified && <span className="text-emerald-600 font-bold">✓ Phone</span>}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <Badge
                            variant={u.isActive ? 'green' : 'red'}
                            className="text-[10px] font-bold"
                          >
                            {u.isActive ? 'Active' : 'Disabled'}
                          </Badge>
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                          {u.lastLogin ? formatDateTime(u.lastLogin) : 'Never logged in'}
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                          {formatDate(u.createdAt)}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => {
                                setNewPasswordVal('');
                                setResetPasswordModal({ isOpen: true, user: u });
                              }}
                              title="Reset Password"
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Key className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleToggleStatus(u.id)}
                              title={u.isActive ? 'Deactivate User' : 'Activate User'}
                              className={`p-1.5 rounded-lg transition-colors ${
                                u.isActive
                                  ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                  : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                              }`}
                            >
                              {u.isActive ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CREATE ADMIN MODAL */}
      <Modal
        isOpen={createAdminModal}
        onClose={() => setCreateAdminModal(false)}
        title="Create Authorized Administrator Account"
      >
        <form onSubmit={handleCreateAdmin} className="space-y-4 text-xs">
          <p className="text-slate-500">
            Create an authorized administrator or staff account with elevated management access.
          </p>

          {adminActionError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium">
              {adminActionError}
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={newAdmin.name}
              onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none"
              placeholder="e.g. Ramesh Verma"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={newAdmin.email}
              onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none"
              placeholder="admin@abhishekhostel.com"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Mobile Number (+91)</label>
            <input
              type="text"
              value={newAdmin.phone}
              onChange={(e) => setNewAdmin({ ...newAdmin, phone: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none"
              placeholder="+91 98765 43210"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Initial Password (Min 8 chars)</label>
            <input
              type="password"
              required
              minLength={8}
              value={newAdmin.password}
              onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none"
              placeholder="••••••••"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCreateAdminModal(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm"
            >
              Create Account
            </button>
          </div>
        </form>
      </Modal>

      {/* RESET PASSWORD MODAL */}
      <Modal
        isOpen={resetPasswordModal.isOpen}
        onClose={() => setResetPasswordModal({ isOpen: false, user: null })}
        title={`Reset Password for ${resetPasswordModal.user?.name}`}
      >
        <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
          <p className="text-slate-500">
            Set a new secure password for {resetPasswordModal.user?.email}. Plaintext passwords are never revealed.
          </p>

          <div>
            <label className="block font-bold text-slate-700 mb-1">New Password (Min 8 chars)</label>
            <input
              type="password"
              required
              minLength={8}
              value={newPasswordVal}
              onChange={(e) => setNewPasswordVal(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none"
              placeholder="••••••••"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setResetPasswordModal({ isOpen: false, user: null })}
              className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm"
            >
              Update Password
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

