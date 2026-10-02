'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  BedDouble,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Upload,
  MessageSquare,
  UtensilsCrossed,
  FileText,
  User,
  LogOut,
  Phone,
  Mail,
  GraduationCap,
  Calendar,
  Sparkles,
  ChevronRight,
  Shield,
  Send,
  RefreshCw,
  PlusCircle,
  HelpCircle,
  QrCode,
  Copy,
  Check,
  Camera,
  Megaphone,
  AlertCircle,
  MapPin,
  ExternalLink,
  ShieldAlert,
  BookOpen,
  PhoneCall,
  Save,
} from 'lucide-react';
import Badge from '@/components/common/Badge';
import Modal from '@/components/common/Modal';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/formatters';

export default function StudentPortalPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [student, setStudent] = useState<any>(null);
  const [todayMenu, setTodayMenu] = useState<any>(null);
  const [notices, setNotices] = useState<any[]>([]);
  const [paymentSetting, setPaymentSetting] = useState<any>(null);

  // Navigation tab
  const [activeTab, setActiveTab] = useState<
    'overview' | 'profile' | 'room' | 'fees' | 'notices' | 'complaints' | 'mess' | 'rules' | 'contact'
  >('overview');

  // Copy feedback states
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Modals
  const [uploadReceiptModal, setUploadReceiptModal] = useState(false);
  const [newComplaintModal, setNewComplaintModal] = useState(false);
  const [qrCodeModal, setQrCodeModal] = useState(false);
  const [selectedNoticeModal, setSelectedNoticeModal] = useState<any | null>(null);

  // Photo Upload State
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState('');

  // Profile Edit Form State
  const [profileForm, setProfileForm] = useState({
    dob: '',
    gender: 'MALE',
    branch: '',
    phone: '',
    emergencyContact: '',
    parentName: '',
    parentPhone: '',
    address: '',
    city: '',
    district: '',
    state: '',
    pincode: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccessMessage, setProfileSuccessMessage] = useState('');

  // Upload receipt form
  const [receiptForm, setReceiptForm] = useState({
    amount: '5000',
    month: 'October 2026',
    paymentMethod: 'UPI',
    transactionId: '',
    paymentDate: new Date().toISOString().split('T')[0],
    file: null as File | null,
  });
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  // New complaint form
  const [complaintForm, setComplaintForm] = useState({
    title: '',
    description: '',
    category: 'FAN',
    priority: 'MEDIUM',
  });
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  useEffect(() => {
    loadStudentData();
  }, []);

  const loadStudentData = async () => {
    setLoading(true);
    try {
      // 1. Get current student user session and student profile
      const [authRes, messRes, noticesRes, paymentRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/mess').catch(() => null),
        fetch('/api/notices').catch(() => null),
        fetch('/api/payment-settings').catch(() => null),
      ]);

      const authData = await authRes.json();
      if (!authData.success || !authData.user) {
        router.push('/login?portal=student');
        return;
      }

      if (authData.user.role === 'ADMIN') {
        router.push('/admin');
        return;
      }

      setUser(authData.user);

      // Load deep student profile
      try {
        const profRes = await fetch('/api/student/profile');
        const profData = await profRes.json();
        if (profData.success && profData.student) {
          setStudent(profData.student);
          setProfileForm({
            dob: profData.student.dob ? new Date(profData.student.dob).toISOString().split('T')[0] : '',
            gender: profData.student.gender || 'MALE',
            branch: profData.student.branch || '',
            phone: profData.student.phone || '',
            emergencyContact: profData.student.emergencyContact || '',
            parentName: profData.student.parentName || '',
            parentPhone: profData.student.parentPhone || '',
            address: profData.student.address || '',
            city: profData.student.city || '',
            district: profData.student.district || '',
            state: profData.student.state || '',
            pincode: profData.student.pincode || '',
          });
        } else {
          setStudent(authData.studentProfile);
        }
      } catch (err) {
        setStudent(authData.studentProfile);
      }

      // 2. Mess Menu
      if (messRes) {
        const messData = await messRes.json();
        if (messData.success) {
          setTodayMenu(messData.todayMenu);
        }
      }

      // 3. Notices
      if (noticesRes) {
        const noticesData = await noticesRes.json();
        if (noticesData.success) {
          setNotices(noticesData.notices || []);
        }
      }

      // 4. Payment Settings
      if (paymentRes) {
        const payData = await paymentRes.json();
        if (payData.success && payData.paymentSetting) {
          setPaymentSetting(payData.paymentSetting);
        }
      }
    } catch (err) {
      console.error('Error loading student data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    window.location.href = '/login?portal=student';
  };

  const handleCopy = (text: string, type: 'upi' | 'phone') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (type === 'upi') {
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    } else {
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoError('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setPhotoError('Please select a JPG, PNG, or WEBP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Image must be 5MB or smaller.');
      return;
    }

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);

      const res = await fetch('/api/student/profile-photo', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.photoUrl) {
        setStudent((prev: any) => ({ ...prev, profilePhoto: data.photoUrl }));
        setUser((prev: any) => ({ ...prev, avatar: data.photoUrl }));
      } else {
        setPhotoError(data.error || 'Failed to upload photo.');
      }
    } catch (err) {
      setPhotoError('Network error uploading profile photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccessMessage('');
    try {
      const res = await fetch('/api/student/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      });
      const data = await res.json();
      if (data.success) {
        setProfileSuccessMessage('Profile details updated successfully!');
        setTimeout(() => setProfileSuccessMessage(''), 3000);
        if (data.student) {
          setStudent((prev: any) => ({ ...prev, ...data.student }));
        }
      } else {
        alert(data.error || 'Failed to update profile.');
      }
    } catch (err) {
      alert('Network error updating profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUploadReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;

    setUploadingReceipt(true);
    try {
      const formData = new FormData();
      formData.append('studentId', student.id);
      formData.append('amount', receiptForm.amount);
      formData.append('month', receiptForm.month);
      formData.append('paymentMethod', receiptForm.paymentMethod);
      formData.append('transactionId', receiptForm.transactionId);
      formData.append('paymentDate', receiptForm.paymentDate);
      if (receiptForm.file) {
        formData.append('file', receiptForm.file);
      }

      const res = await fetch('/api/receipts', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        alert('Payment receipt submitted successfully! The admin team will verify it shortly.');
        setUploadReceiptModal(false);
        setReceiptForm({
          amount: '5000',
          month: 'October 2026',
          paymentMethod: 'UPI',
          transactionId: '',
          paymentDate: new Date().toISOString().split('T')[0],
          file: null,
        });
        loadStudentData();
      } else {
        alert(data.error || 'Failed to submit receipt.');
      }
    } catch (e) {
      alert('Error uploading receipt.');
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;

    setSubmittingComplaint(true);
    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: complaintForm.title,
          description: complaintForm.description,
          category: complaintForm.category,
          priority: complaintForm.priority,
          studentId: student.id,
          roomNumber: student.room?.roomNumber || 'Awaiting Room',
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert('Complaint submitted successfully. Our maintenance team will attend to it.');
        setNewComplaintModal(false);
        setComplaintForm({ title: '', description: '', category: 'FAN', priority: 'MEDIUM' });
        loadStudentData();
      } else {
        alert(data.error || 'Failed to submit complaint.');
      }
    } catch (e) {
      alert('Error submitting complaint.');
    } finally {
      setSubmittingComplaint(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070F2B] text-slate-100 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-400">Loading Abhishek Boys Hostel Resident Portal...</p>
        </div>
      </div>
    );
  }

  const isAssigned = student && student.room && student.bed;
  const latestPayment = student?.payments?.[0];
  const activeNotices = notices.filter(
    (n) => n.isActive && (!n.expiresAt || new Date(n.expiresAt) >= new Date())
  );

  return (
    <div className="min-h-screen bg-[#070F2B] text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#0B192C]/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-black shadow-md shadow-blue-500/20">
            AB
          </div>
          <div>
            <div className="text-sm font-black tracking-wider uppercase text-white flex items-center space-x-2">
              <span>Abhishek Boys Hostel</span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Resident Portal
              </span>
            </div>
            <div className="text-[11px] text-slate-400">Greater Noida • Student Dashboard</div>
          </div>
        </div>

        {/* Profile preview & logout */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-white">{student?.fullName || user?.name || 'Resident'}</div>
            <div className="text-[11px] text-slate-400 font-mono">
              {student?.studentId || user?.email}
            </div>
          </div>

          {/* Avatar button linking to Profile tab */}
          <button
            onClick={() => setActiveTab('profile')}
            className="relative w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs overflow-hidden border border-blue-400/40 ring-2 ring-transparent hover:ring-blue-400 transition"
            title="My Profile"
          >
            {student?.profilePhoto ? (
              <img src={student.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              (student?.fullName || user?.name || 'S').charAt(0)
            )}
          </button>

          <button
            onClick={handleLogout}
            title="Logout"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-slate-700/60 text-xs font-bold transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Navigation Tabs Bar */}
      <div className="bg-[#0B192C]/60 border-b border-slate-800/80 px-4 sm:px-8 overflow-x-auto">
        <div className="flex space-x-1 sm:space-x-2 py-2 max-w-6xl mx-auto">
          {[
            { id: 'overview', label: 'My Dashboard', icon: Sparkles },
            { id: 'profile', label: 'My Profile', icon: User },
            { id: 'room', label: 'My Room & Bed', icon: BedDouble },
            { id: 'fees', label: 'Fees & Payments', icon: CreditCard },
            { id: 'notices', label: 'Hostel Notices', icon: Megaphone, count: activeNotices.length },
            { id: 'complaints', label: 'Complaints', icon: MessageSquare },
            { id: 'mess', label: 'Mess Menu', icon: UtensilsCrossed },
            { id: 'rules', label: 'Hostel Rules', icon: BookOpen },
            { id: 'contact', label: 'Contact Admin', icon: PhoneCall },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-blue-500 text-white rounded-full text-[10px] font-black">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* ROOM ASSIGNMENT BANNER */}
        {!isAssigned && (
          <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/30 rounded-3xl p-6 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Hostel room not allocated yet.</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Your student account is active. The hostel administrator will allocate your room and bed based on availability. Please contact the warden office for room key handover.
                </p>
              </div>
            </div>
            <div className="px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-[11px] text-slate-300 font-bold whitespace-nowrap">
              Status: Registration Confirmed
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 1: OVERVIEW / DASHBOARD
            ======================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Room Card */}
              <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
                  <span>Assigned Room</span>
                  <BedDouble className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-xl font-black text-white">
                  {isAssigned ? `Room ${student.room.roomNumber}` : 'Pending'}
                </div>
                <div className="text-[11px] text-slate-400">
                  {isAssigned ? `${student.bed.bedNumber} • Floor ${student.room.floor}` : 'Awaiting warden allocation'}
                </div>
              </div>

              {/* Monthly Fee */}
              <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
                  <span>Monthly Hostel Rent</span>
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-xl font-black text-white">
                  {formatCurrency(student?.monthlyFee || 5000)}
                </div>
                <div className="text-[11px] text-slate-400">Due by 5th of each month</div>
              </div>

              {/* Fee Status */}
              <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
                  <span>Current Fee Status</span>
                  <Clock className="w-4 h-4 text-orange-400" />
                </div>
                <div>
                  <Badge
                    variant={
                      latestPayment?.status === 'PAID'
                        ? 'green'
                        : latestPayment?.status === 'OVERDUE'
                        ? 'red'
                        : 'orange'
                    }
                    className="text-xs font-bold"
                  >
                    {latestPayment?.status || 'PENDING'}
                  </Badge>
                </div>
                <div className="text-[11px] text-slate-400">
                  {latestPayment?.month || 'October 2026'}
                </div>
              </div>

              {/* Complaints count */}
              <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
                  <span>My Active Tickets</span>
                  <MessageSquare className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-xl font-black text-white">
                  {student?.complaints?.filter((c: any) => c.status !== 'RESOLVED').length || 0}
                </div>
                <div className="text-[11px] text-slate-400">
                  {student?.complaints?.length || 0} total maintenance requests
                </div>
              </div>
            </div>

            {/* WIDGET: 📢 LATEST HOSTEL NOTICES (Required Widget) */}
            <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">📢 Latest Hostel Notices & Bulletins</h2>
                    <p className="text-[11px] text-slate-400">Official updates from hostel warden & management</p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('notices')}
                  className="flex items-center space-x-1 text-xs font-bold text-blue-400 hover:text-blue-300"
                >
                  <span>View All Notices</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {activeNotices.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  No active notices broadcast at this time.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {activeNotices.slice(0, 3).map((notice) => (
                    <div
                      key={notice.id}
                      onClick={() => setSelectedNoticeModal(notice)}
                      className={`p-4 rounded-2xl border cursor-pointer hover:border-blue-500/60 transition space-y-2 ${
                        notice.priority === 'URGENT'
                          ? 'bg-rose-950/20 border-rose-800/40'
                          : notice.priority === 'IMPORTANT'
                          ? 'bg-amber-950/20 border-amber-800/40'
                          : 'bg-slate-950/60 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                            notice.priority === 'URGENT'
                              ? 'bg-rose-600 text-white animate-pulse'
                              : notice.priority === 'IMPORTANT'
                              ? 'bg-amber-500 text-white'
                              : 'bg-blue-600/30 text-blue-300'
                          }`}
                        >
                          {notice.priority}
                        </span>
                        <span className="text-[10px] text-slate-400">{formatDate(notice.publishedAt || notice.createdAt)}</span>
                      </div>
                      <div className="font-bold text-white text-xs line-clamp-1">{notice.title}</div>
                      <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                        {notice.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Action & Today's Menu Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Payment & Receipts Card with Live Dynamic Payment Info */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-5 h-5 text-emerald-400" />
                    <h2 className="text-sm font-bold text-white">Monthly Fee Payment Channel</h2>
                  </div>
                  <button
                    onClick={() => setUploadReceiptModal(true)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Receipt</span>
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-white">
                        {latestPayment?.month || 'October 2026'} Hostel Fee
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Amount: <span className="text-white font-bold">{formatCurrency(student?.monthlyFee || 5000)}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={latestPayment?.status === 'PAID' ? 'green' : 'orange'}
                        className="font-bold text-xs"
                      >
                        {latestPayment?.status || 'PENDING'}
                      </Badge>
                      <button
                        onClick={() => setUploadReceiptModal(true)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors"
                      >
                        Submit Proof
                      </button>
                    </div>
                  </div>
                </div>

                {/* DYNAMIC FEE PAYMENT DETAILS (CRITICAL REQUIREMENT - NEVER HARDCODED) */}
                <div className="p-4 bg-gradient-to-r from-blue-950/40 to-slate-950/80 border border-blue-900/40 rounded-2xl text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-blue-300 font-bold uppercase tracking-wider">
                        Pay To: {paymentSetting?.paymentName || 'Abhishek Boys Hostel'}
                      </div>
                      <div className="text-xs text-slate-400">Official Hostel Collection UPI</div>
                    </div>

                    <button
                      onClick={() => setQrCodeModal(true)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/40 rounded-xl text-xs font-bold transition"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Show QR Code</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* UPI ID with copy */}
                    <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-slate-400 font-semibold">UPI ID</div>
                        <div className="font-mono text-emerald-400 font-bold text-sm">
                          {paymentSetting?.upiId || 'abhishekhostel@upi'}
                        </div>
                      </div>
                      <button
                        onClick={() => handleCopy(paymentSetting?.upiId || 'abhishekhostel@upi', 'upi')}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                        title="Copy UPI ID"
                      >
                        {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Phone with copy */}
                    <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-slate-400 font-semibold">Payment Phone</div>
                        <div className="font-mono text-blue-300 font-bold text-sm">
                          {paymentSetting?.phoneNumber || '9059860870'}
                        </div>
                      </div>
                      <button
                        onClick={() => handleCopy(paymentSetting?.phoneNumber || '9059860870', 'phone')}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                        title="Copy Phone Number"
                      >
                        {copiedPhone ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 pt-1">
                    {paymentSetting?.instructions ||
                      'Pay using the UPI ID or phone number, then upload the payment receipt screenshot.'}
                  </div>
                </div>
              </div>

              {/* Today's Mess Highlight */}
              <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 mb-3">
                    <UtensilsCrossed className="w-5 h-5 text-orange-400" />
                    <h2 className="text-sm font-bold text-white">Today's Dining Menu</h2>
                  </div>

                  {todayMenu ? (
                    <div className="space-y-2.5 text-xs">
                      <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                        <span className="font-bold text-orange-400 block text-[10px] uppercase">Breakfast</span>
                        <span className="text-slate-200">{todayMenu.breakfast}</span>
                      </div>
                      <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                        <span className="font-bold text-blue-400 block text-[10px] uppercase">Lunch</span>
                        <span className="text-slate-200">{todayMenu.lunch}</span>
                      </div>
                      <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                        <span className="font-bold text-emerald-400 block text-[10px] uppercase">Dinner</span>
                        <span className="text-slate-200">{todayMenu.dinner}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">Mess menu details loading...</p>
                  )}
                </div>

                <button
                  onClick={() => setActiveTab('mess')}
                  className="w-full mt-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors flex items-center justify-center space-x-1"
                >
                  <span>View Full Weekly Roster</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 2: MY PROFILE (Required Comprehensive Profile View & Photo Upload)
            ======================================================== */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Profile Header Card */}
            <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                {/* Circular Profile Photo with Upload Trigger */}
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-600 text-white font-black text-3xl flex items-center justify-center overflow-hidden border-4 border-slate-800 shadow-xl">
                    {student?.profilePhoto ? (
                      <img src={student.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      (student?.fullName || user?.name || 'S').charAt(0)
                    )}
                  </div>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="absolute bottom-0 right-0 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg border-2 border-slate-900 transition"
                    title="Upload Profile Photo"
                  >
                    <Camera className="w-4 h-4" />
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </div>

                <div className="text-center sm:text-left space-y-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h2 className="text-xl font-black text-white">{student?.fullName || user?.name}</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {student?.status || 'ACTIVE'} RESIDENT
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    ID: {student?.studentId || 'ABH-2026'} • Joining: {formatDate(student?.joiningDate || student?.createdAt)}
                  </div>
                  <div className="text-xs text-blue-400 font-medium">
                    {student?.collegeName || 'Engineering College'} • {student?.course || 'B.Tech'} {student?.year ? `(${student.year} Year)` : ''}
                  </div>
                  {uploadingPhoto && <p className="text-[11px] text-blue-300">Uploading new photo...</p>}
                  {photoError && <p className="text-[11px] text-rose-400">{photoError}</p>}
                </div>
              </div>

              {/* Quick hostel status badges */}
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 text-xs space-y-2">
                <div className="flex justify-between items-center text-slate-400">
                  <span>Room:</span>
                  <span className="font-bold text-white">
                    {student?.room ? `Room ${student.room.roomNumber} (Floor ${student.room.floor})` : 'Not Allocated'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Bed:</span>
                  <span className="font-bold text-blue-400">{student?.bed?.bedNumber || 'Pending'}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Monthly Fee:</span>
                  <span className="font-bold text-emerald-400">{formatCurrency(student?.monthlyFee || 5000)}</span>
                </div>
              </div>
            </div>

            {profileSuccessMessage && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs font-bold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{profileSuccessMessage}</span>
              </div>
            )}

            {/* Editable Profile Form */}
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal & Contact Details */}
                <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-bold text-white">Personal & Contact Information</h3>
                    <p className="text-[11px] text-slate-400">Resident basic profile details</p>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">Full Legal Name</label>
                      <input
                        type="text"
                        readOnly
                        value={student?.fullName || user?.name || ''}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 cursor-not-allowed"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 font-bold mb-1">Date of Birth</label>
                        <input
                          type="date"
                          value={profileForm.dob}
                          onChange={(e) => setProfileForm({ ...profileForm, dob: e.target.value })}
                          className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-bold mb-1">Gender</label>
                        <select
                          value={profileForm.gender}
                          onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                          className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500"
                        >
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Personal Phone Number</label>
                      <input
                        type="text"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-bold mb-1">Registered Email Address</label>
                      <input
                        type="email"
                        readOnly
                        value={student?.email || user?.email || ''}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 cursor-not-allowed font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Branch / Specialization</label>
                      <input
                        type="text"
                        placeholder="e.g. Computer Science & Engineering"
                        value={profileForm.branch}
                        onChange={(e) => setProfileForm({ ...profileForm, branch: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Guardian & Emergency Contact */}
                <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-bold text-white">Guardian & Emergency Information</h3>
                    <p className="text-[11px] text-slate-400">Parent contacts for urgent communications</p>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Parent / Guardian Name</label>
                      <input
                        type="text"
                        value={profileForm.parentName}
                        onChange={(e) => setProfileForm({ ...profileForm, parentName: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Parent / Guardian Phone</label>
                      <input
                        type="text"
                        value={profileForm.parentPhone}
                        onChange={(e) => setProfileForm({ ...profileForm, parentPhone: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Emergency Contact Number</label>
                      <input
                        type="text"
                        value={profileForm.emergencyContact}
                        onChange={(e) => setProfileForm({ ...profileForm, emergencyContact: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Permanent Residential Address</label>
                      <textarea
                        rows={2}
                        value={profileForm.address}
                        onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 font-bold mb-1">City / Town</label>
                        <input
                          type="text"
                          value={profileForm.city}
                          onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                          className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-bold mb-1">Pincode</label>
                        <input
                          type="text"
                          value={profileForm.pincode}
                          onChange={(e) => setProfileForm({ ...profileForm, pincode: e.target.value })}
                          className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="flex items-center space-x-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-600/30 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingProfile ? 'Saving Changes...' : 'Save Profile Details'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================
            TAB 3: MY ROOM & BED
            ======================================================== */}
        {activeTab === 'room' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                  <BedDouble className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Room & Bed Allocation Details</h2>
                  <p className="text-xs text-slate-400">
                    Hostel accommodation specifications and room facilities
                  </p>
                </div>
              </div>

              {isAssigned ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4 text-xs">
                    <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
                      <div className="text-slate-400 font-bold uppercase text-[10px]">Room Number</div>
                      <div className="text-2xl font-black text-white">Room {student.room.roomNumber}</div>
                      <div className="text-slate-400">
                        Floor {student.room.floor} • Type: <span className="text-white font-bold">{student.room.roomType}</span>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
                      <div className="text-slate-400 font-bold uppercase text-[10px]">Assigned Bed</div>
                      <div className="text-xl font-black text-blue-400">{student.bed.bedNumber}</div>
                      <div className="text-slate-400">
                        Room Capacity: {student.room.totalBeds} Beds
                      </div>
                    </div>
                  </div>

                  <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3 text-xs">
                    <div className="font-bold text-white text-sm">Room Amenities & Features</div>
                    <div className="text-slate-300 leading-relaxed">
                      {student.room.amenities || 'Ceiling Fan, Study Desks, Steel Lockers, Attached Washroom, High-speed Wi-Fi'}
                    </div>

                    <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                      <div>• High-speed Wi-Fi: Abhishek_Hostel_5G</div>
                      <div>• Cleanliness inspection: Every Wednesday 11:00 AM</div>
                      <div>• Gate entry curfew: 10:00 PM strictly</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-950/60 rounded-2xl border border-dashed border-slate-800 space-y-2">
                  <HelpCircle className="w-8 h-8 text-slate-500 mx-auto" />
                  <div className="text-sm font-bold text-white">Hostel room not assigned yet.</div>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Your registration has been submitted to the admin team. A bed will be assigned shortly based on vacancy.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 4: FEES & PAYMENTS (Required Dynamic Details)
            ======================================================== */}
        {activeTab === 'fees' && (
          <div className="space-y-6">
            {/* Payment Details Box with Dynamic Database Credentials */}
            <div className="bg-gradient-to-br from-slate-900 to-blue-950 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <div className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">
                    Official Fee Payment Gateway
                  </div>
                  <h2 className="text-xl font-black text-white mt-0.5">
                    Pay To: {paymentSetting?.paymentName || 'Abhishek Boys Hostel'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Use the details below to transfer monthly rent and submit your verification receipt.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setQrCodeModal(true)}
                    className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/40 rounded-xl text-xs font-bold transition"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Show QR Code</span>
                  </button>

                  <button
                    onClick={() => setUploadReceiptModal(true)}
                    className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-blue-600/30"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Payment Receipt</span>
                  </button>
                </div>
              </div>

              {/* UPI & Phone Credentials */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* UPI ID */}
                <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
                      UPI ID (VPA)
                    </span>
                    <span className="font-mono text-emerald-400 font-extrabold text-base mt-0.5 block">
                      {paymentSetting?.upiId || 'abhishekhostel@upi'}
                    </span>
                    <span className="text-[10px] text-slate-500">Google Pay, PhonePe, Paytm, BHIM</span>
                  </div>
                  <button
                    onClick={() => handleCopy(paymentSetting?.upiId || 'abhishekhostel@upi', 'upi')}
                    className="flex items-center space-x-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition"
                  >
                    {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUpi ? 'Copied' : 'Copy UPI'}</span>
                  </button>
                </div>

                {/* Phone Number */}
                <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
                      Payment Phone Number
                    </span>
                    <span className="font-mono text-blue-300 font-extrabold text-base mt-0.5 block">
                      {paymentSetting?.phoneNumber || '9059860870'}
                    </span>
                    <span className="text-[10px] text-slate-500">Linked to UPI apps for mobile transfers</span>
                  </div>
                  <button
                    onClick={() => handleCopy(paymentSetting?.phoneNumber || '9059860870', 'phone')}
                    className="flex items-center space-x-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition"
                  >
                    {copiedPhone ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPhone ? 'Copied' : 'Copy Phone'}</span>
                  </button>
                </div>
              </div>

              {/* Instructions */}
              <div className="p-3.5 bg-blue-950/30 rounded-2xl border border-blue-900/40 text-xs text-blue-200 leading-relaxed">
                <span className="font-bold block text-blue-300 mb-0.5">Payment Instructions:</span>
                {paymentSetting?.instructions ||
                  'Pay your monthly hostel fee using the UPI ID or Phone number above. Then upload your screenshot receipt for instant warden verification.'}
              </div>
            </div>

            {/* Payment Ledger Table */}
            <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-base font-bold text-white">Payment Ledger & Receipt History</h2>
                  <p className="text-xs text-slate-400">Track all past and pending monthly payments</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                    <tr>
                      <th className="py-3 px-4">Billing Month</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4">Paid Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Txn Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {student?.payments && student.payments.length > 0 ? (
                      student.payments.map((p: any) => (
                        <tr key={p.id} className="hover:bg-slate-800/40">
                          <td className="py-3.5 px-4 font-bold text-white">{p.month}</td>
                          <td className="py-3.5 px-4 font-bold">{formatCurrency(p.amount)}</td>
                          <td className="py-3.5 px-4 text-slate-400">{formatDate(p.dueDate)}</td>
                          <td className="py-3.5 px-4 text-slate-400">{p.paymentDate ? formatDate(p.paymentDate) : '—'}</td>
                          <td className="py-3.5 px-4">
                            <Badge
                              variant={p.status === 'PAID' ? 'green' : p.status === 'OVERDUE' ? 'red' : 'orange'}
                              className="text-[10px] font-bold"
                            >
                              {p.status}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                            {p.transactionId || '—'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500">
                          No payment records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 5: HOSTEL NOTICES (Required Full Notices Section)
            ======================================================== */}
        {activeTab === 'notices' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Hostel Bulletin & Notices</h2>
                    <p className="text-xs text-slate-400">Official rules, updates, mess timings, and hostel announcements</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-400">
                  {activeNotices.length} Active {activeNotices.length === 1 ? 'Notice' : 'Notices'}
                </span>
              </div>

              {activeNotices.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-xs">
                  <Megaphone className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  No announcements at this time.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeNotices.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => setSelectedNoticeModal(n)}
                      className={`p-5 rounded-3xl border cursor-pointer hover:border-blue-500/60 transition space-y-3 ${
                        n.priority === 'URGENT'
                          ? 'bg-rose-950/20 border-rose-800/40'
                          : n.priority === 'IMPORTANT'
                          ? 'bg-amber-950/20 border-amber-800/40'
                          : 'bg-slate-950/60 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              n.priority === 'URGENT'
                                ? 'bg-rose-600 text-white animate-pulse'
                                : n.priority === 'IMPORTANT'
                                ? 'bg-amber-500 text-white'
                                : 'bg-blue-600/30 text-blue-300'
                            }`}
                          >
                            {n.priority}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                            {n.category}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">{formatDate(n.publishedAt || n.createdAt)}</span>
                      </div>

                      <h3 className="font-extrabold text-white text-sm leading-snug">{n.title}</h3>
                      <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed whitespace-pre-line">
                        {n.description}
                      </p>

                      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-blue-400">
                        <span>Read full notice →</span>
                        {n.attachmentUrl && <span className="text-slate-400 flex items-center space-x-1">📎 Attachment</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 6: COMPLAINTS
            ======================================================== */}
        {activeTab === 'complaints' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Maintenance Tickets & Complaints</h2>
                  <p className="text-xs text-slate-400">Report plumbing, electrical, or furniture problems directly to wardens</p>
                </div>
                <button
                  onClick={() => setNewComplaintModal(true)}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Lodge Complaint</span>
                </button>
              </div>

              <div className="space-y-3">
                {student?.complaints && student.complaints.length > 0 ? (
                  student.complaints.map((c: any) => (
                    <div
                      key={c.id}
                      className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white text-sm">{c.title}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md">
                            {c.category}
                          </span>
                        </div>
                        <Badge
                          variant={c.status === 'RESOLVED' ? 'green' : c.status === 'IN_PROGRESS' ? 'blue' : 'orange'}
                          className="text-[10px] font-bold"
                        >
                          {c.status}
                        </Badge>
                      </div>

                      <p className="text-slate-300 text-xs leading-relaxed">{c.description}</p>

                      {c.resolutionNotes && (
                        <div className="p-2.5 bg-blue-950/30 border border-blue-900/40 rounded-xl text-[11px] text-blue-200">
                          <span className="font-bold">Warden Note: </span>
                          {c.resolutionNotes}
                        </div>
                      )}

                      <div className="text-[10px] text-slate-500 pt-1">
                        Reported on {formatDate(c.createdAt)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No active or past complaints lodged.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 7: MESS MENU
            ======================================================== */}
        {activeTab === 'mess' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h2 className="text-lg font-bold text-white">Weekly Mess & Dining Schedule</h2>
                <p className="text-xs text-slate-400">Nutritious meals prepared daily by Abhishek Boys Hostel Mess</p>
              </div>

              {todayMenu && (
                <div className="p-5 bg-gradient-to-r from-blue-950/30 to-indigo-950/30 border border-blue-800/40 rounded-2xl space-y-3">
                  <div className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                    Today's Roster ({todayMenu.dayOfWeek})
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                      <span className="font-bold text-orange-400 text-[10px] uppercase block mb-1">
                        Breakfast (7:30 - 9:30 AM)
                      </span>
                      <span className="text-white">{todayMenu.breakfast}</span>
                    </div>
                    <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                      <span className="font-bold text-blue-400 text-[10px] uppercase block mb-1">
                        Lunch (12:30 - 2:30 PM)
                      </span>
                      <span className="text-white">{todayMenu.lunch}</span>
                    </div>
                    <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                      <span className="font-bold text-emerald-400 text-[10px] uppercase block mb-1">
                        Dinner (8:00 - 10:00 PM)
                      </span>
                      <span className="text-white">{todayMenu.dinner}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 8: HOSTEL RULES
            ======================================================== */}
        {activeTab === 'rules' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Hostel Rules & Code of Conduct</h2>
                  <p className="text-xs text-slate-400">Strictly enforced for safety, discipline, and resident well-being</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
                  <div className="font-bold text-amber-400 flex items-center space-x-1.5">
                    <Clock className="w-4 h-4" />
                    <span>Gate Timings & Curfew</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Main gate closes at 10:00 PM strictly. Late entry requires prior warden approval via written permission or parent verification.
                  </p>
                </div>

                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
                  <div className="font-bold text-rose-400 flex items-center space-x-1.5">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Ragging & Substance Policy</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Zero tolerance for ragging, smoking, alcohol, or illicit substances. Violators are immediately reported and expelled without refund.
                  </p>
                </div>

                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
                  <div className="font-bold text-blue-400 flex items-center space-x-1.5">
                    <User className="w-4 h-4" />
                    <span>Visitors & Guests</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Parents and guardians may visit between 9:00 AM and 7:00 PM in the visitor lobby after signing the register. Overnight stay is prohibited.
                  </p>
                </div>

                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
                  <div className="font-bold text-emerald-400 flex items-center space-x-1.5">
                    <CreditCard className="w-4 h-4" />
                    <span>Fee Due Dates</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Monthly hostel fees must be cleared by the 5th of each calendar month. Upload transfer receipts in the portal for instant verification.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 9: CONTACT ADMIN
            ======================================================== */}
        {activeTab === 'contact' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Contact Hostel Administration</h2>
                  <p className="text-xs text-slate-400">Direct contact channels for urgent assistance and office enquiries</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
                  <div className="font-bold text-white text-sm">Hostel Administrator (Mahesh)</div>
                  <div className="space-y-2 text-slate-300">
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-blue-400" />
                      <span>+91 90598 60870</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-blue-400" />
                      <span>admin@abhishekhostel.com</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-blue-400" />
                      <span>Hostel Office, Ground Floor, Abhishek Boys Hostel</span>
                    </div>
                  </div>

                  <a
                    href="https://wa.me/919059860870"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-2 mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition"
                  >
                    <span>Message on WhatsApp</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
                  <div className="font-bold text-white text-sm">Hostel Office Timings</div>
                  <div className="space-y-2 text-slate-300">
                    <div>• Monday – Saturday: 9:00 AM to 8:00 PM</div>
                    <div>• Sunday: 10:00 AM to 5:00 PM</div>
                    <div>• Emergency Contact: 24/7 at Security Gate</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* QR CODE MODAL */}
      <Modal
        isOpen={qrCodeModal}
        onClose={() => setQrCodeModal(false)}
        title="Hostel UPI Fee Payment QR Code"
        subtitle="Scan directly from Google Pay, PhonePe, Paytm, or BHIM"
      >
        <div className="text-center space-y-4 text-xs">
          <div className="p-4 bg-white rounded-2xl inline-block shadow-lg mx-auto">
            <img
              src={
                paymentSetting?.qrCodeUrl ||
                `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=${encodeURIComponent(
                  paymentSetting?.upiId || 'abhishekhostel@upi'
                )}&pn=${encodeURIComponent(paymentSetting?.paymentName || 'Abhishek Boys Hostel')}&cu=INR`
              }
              alt="Hostel UPI QR"
              className="w-56 h-56 object-contain mx-auto"
            />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="font-bold text-slate-800">{paymentSetting?.paymentName || 'Abhishek Boys Hostel'}</div>
            <div className="font-mono font-bold text-blue-600 text-sm">
              {paymentSetting?.upiId || 'abhishekhostel@upi'}
            </div>
            <div className="text-[11px] text-slate-500">Phone: {paymentSetting?.phoneNumber || '9059860870'}</div>
          </div>

          <p className="text-[11px] text-slate-500">
            After completing payment, take a screenshot and click <strong>Upload Payment Receipt</strong> to submit your proof.
          </p>

          <div className="flex justify-center space-x-2 pt-2">
            <button
              onClick={() => {
                setQrCodeModal(false);
                setUploadReceiptModal(true);
              }}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition"
            >
              Upload Receipt Now
            </button>
          </div>
        </div>
      </Modal>

      {/* NOTICE FULL VIEWER MODAL */}
      <Modal
        isOpen={!!selectedNoticeModal}
        onClose={() => setSelectedNoticeModal(null)}
        title={selectedNoticeModal?.title || 'Hostel Notice'}
        subtitle={selectedNoticeModal ? `Published on ${formatDate(selectedNoticeModal.publishedAt || selectedNoticeModal.createdAt)}` : ''}
      >
        {selectedNoticeModal && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center space-x-2">
              <span
                className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                  selectedNoticeModal.priority === 'URGENT'
                    ? 'bg-rose-600 text-white'
                    : selectedNoticeModal.priority === 'IMPORTANT'
                    ? 'bg-amber-500 text-white'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {selectedNoticeModal.priority}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                Category: {selectedNoticeModal.category}
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-slate-800 leading-relaxed whitespace-pre-line text-sm">
              {selectedNoticeModal.description}
            </div>

            {selectedNoticeModal.attachmentUrl && (
              <a
                href={selectedNoticeModal.attachmentUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-2 p-3 bg-blue-50 text-blue-700 rounded-xl font-bold hover:bg-blue-100 transition"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Download Attached Document / Notice Attachment</span>
              </a>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedNoticeModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* UPLOAD RECEIPT MODAL */}
      <Modal
        isOpen={uploadReceiptModal}
        onClose={() => setUploadReceiptModal(false)}
        title="Upload Monthly Fee Payment Receipt"
      >
        <form onSubmit={handleUploadReceipt} className="space-y-4 text-xs">
          <p className="text-slate-500">
            Submit your online UPI transaction or bank transfer receipt for verification by hostel management.
          </p>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Fee Month</label>
            <input
              type="text"
              required
              value={receiptForm.month}
              onChange={(e) => setReceiptForm({ ...receiptForm, month: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Amount Paid (₹)</label>
            <input
              type="number"
              required
              value={receiptForm.amount}
              onChange={(e) => setReceiptForm({ ...receiptForm, amount: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
            <select
              value={receiptForm.paymentMethod}
              onChange={(e) => setReceiptForm({ ...receiptForm, paymentMethod: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            >
              <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
              <option value="BANK_TRANSFER">Bank Transfer (NEFT / IMPS)</option>
              <option value="CASH">Cash Deposit at Warden Office</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Transaction ID / UTR Number</label>
            <input
              type="text"
              required
              placeholder="e.g. 429182749102"
              value={receiptForm.transactionId}
              onChange={(e) => setReceiptForm({ ...receiptForm, transactionId: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Payment Date</label>
            <input
              type="date"
              required
              value={receiptForm.paymentDate}
              onChange={(e) => setReceiptForm({ ...receiptForm, paymentDate: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Receipt Screenshot or PDF</label>
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.pdf"
              onChange={(e) => setReceiptForm({ ...receiptForm, file: e.target.files?.[0] || null })}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setUploadReceiptModal(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploadingReceipt}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm disabled:opacity-50"
            >
              {uploadingReceipt ? 'Submitting...' : 'Submit Receipt'}
            </button>
          </div>
        </form>
      </Modal>

      {/* LODGE COMPLAINT MODAL */}
      <Modal
        isOpen={newComplaintModal}
        onClose={() => setNewComplaintModal(false)}
        title="Lodge Maintenance Complaint"
      >
        <form onSubmit={handleSubmitComplaint} className="space-y-4 text-xs">
          <p className="text-slate-500">
            Submit a maintenance issue. The warden and technician will be notified.
          </p>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Category</label>
            <select
              value={complaintForm.category}
              onChange={(e) => setComplaintForm({ ...complaintForm, category: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
            >
              <option value="FAN">Fan / Electrical Problem</option>
              <option value="LIGHT">Light / Tube Problem</option>
              <option value="WATER">Water / Tap / Geyser Problem</option>
              <option value="BED">Bed / Furniture Problem</option>
              <option value="BATHROOM">Bathroom / Hygiene Issue</option>
              <option value="WIFI">Wi-Fi / Internet Problem</option>
              <option value="OTHER">Other Problem</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Complaint Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Ceiling fan vibrating at speed 4"
              value={complaintForm.title}
              onChange={(e) => setComplaintForm({ ...complaintForm, title: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Issue Description</label>
            <textarea
              rows={3}
              required
              placeholder="Provide specific details about the issue..."
              value={complaintForm.description}
              onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setNewComplaintModal(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingComplaint}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm disabled:opacity-50"
            >
              {submittingComplaint ? 'Submitting...' : 'Submit Complaint'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

