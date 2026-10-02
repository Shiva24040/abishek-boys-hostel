'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Eye,
  LogOut,
  Phone,
  Building,
  GraduationCap,
  Calendar,
  AlertCircle,
  CreditCard,
  CheckCircle2,
} from 'lucide-react';
import Badge from '@/components/common/Badge';
import Modal from '@/components/common/Modal';
import { formatCurrency, formatDate } from '@/lib/formatters';

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [availableBeds, setAvailableBeds] = useState<any[]>([]);

  // Modals
  const [registerModal, setRegisterModal] = useState(false);
  const [checkoutModal, setCheckoutModal] = useState<{ isOpen: boolean; student: any | null }>({
    isOpen: false,
    student: null,
  });

  // Registration Form
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    parentName: '',
    parentPhone: '',
    collegeName: '',
    course: '',
    year: '1st Year',
    bedId: '',
    joiningDate: new Date().toISOString().split('T')[0],
    address: '',
    emergencyContact: '',
    profilePhoto: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250',
    idProofType: 'Aadhaar Card',
    monthlyFee: '5000',
    securityDeposit: '5000',
  });

  const [checkoutData, setCheckoutData] = useState({
    checkoutDate: new Date().toISOString().split('T')[0],
    remarks: 'Routine course completion checkout',
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchStudents();
    fetchAvailableBeds();
  }, [statusFilter]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      let url = `/api/students?status=${statusFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setStudents(data.students);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableBeds = async () => {
    try {
      const res = await fetch('/api/rooms');
      const data = await res.json();
      if (data.success) {
        const available: any[] = [];
        data.rooms.forEach((r: any) => {
          r.beds.forEach((b: any) => {
            if (!b.isOccupied) {
              available.push({
                bedId: b.id,
                bedNumber: b.bedNumber,
                roomId: r.id,
                roomNumber: r.roomNumber,
                floor: r.floor,
                roomType: r.roomType,
              });
            }
          });
        });
        setAvailableBeds(available);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setRegisterModal(false);
        // Reset form
        setForm({
          fullName: '',
          phone: '',
          email: '',
          parentName: '',
          parentPhone: '',
          collegeName: '',
          course: '',
          year: '1st Year',
          bedId: '',
          joiningDate: new Date().toISOString().split('T')[0],
          address: '',
          emergencyContact: '',
          profilePhoto: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250',
          idProofType: 'Aadhaar Card',
          monthlyFee: '5000',
          securityDeposit: '5000',
        });
        fetchStudents();
        fetchAvailableBeds();
      } else {
        setErrorMsg(data.error || 'Failed to register student');
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('Error submitting student registration');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutModal.student) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/students/${checkoutModal.student.id}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkoutData),
      });
      const data = await res.json();
      if (data.success) {
        setCheckoutModal({ isOpen: false, student: null });
        fetchStudents();
        fetchAvailableBeds();
      } else {
        alert(data.error || 'Failed to checkout student');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const activeCount = students.filter((s) => s.status === 'ACTIVE').length;
  const noticeCount = students.filter((s) => s.status === 'NOTICE_PERIOD').length;
  const leftCount = students.filter((s) => s.status === 'LEFT').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Students / Residents</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Register new residents, manage room and bed assignments, and view profiles.
          </p>
        </div>

        <button
          onClick={() => {
            setErrorMsg(null);
            fetchAvailableBeds();
            setRegisterModal(true);
          }}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-600/20"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New Resident</span>
        </button>
      </div>

      {/* KPI stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Total Residents</div>
          <div className="text-2xl font-black text-slate-800 mt-1">{students.length}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-[11px] font-bold text-emerald-500 uppercase">Active Staying</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{activeCount}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-[11px] font-bold text-amber-500 uppercase">Notice Period</div>
          <div className="text-2xl font-black text-amber-700 mt-1">{noticeCount}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Vacated / Left</div>
          <div className="text-2xl font-black text-slate-600 mt-1">{leftCount}</div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm">
        {/* Status Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'All Residents' },
            { id: 'ACTIVE', label: 'Active' },
            { id: 'NOTICE_PERIOD', label: 'Notice Period' },
            { id: 'LEFT', label: 'Left Hostel' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                statusFilter === st.id
                  ? 'bg-navy-950 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search name, ID, phone, college..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchStudents()}
            className="w-full sm:w-64 pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading residents...</div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-700 text-sm">No residents found</p>
            <p className="text-xs text-slate-400 mt-1">Adjust filters or register a new resident.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Student Name & ID</th>
                  <th className="px-6 py-4">Room & Bed</th>
                  <th className="px-6 py-4">College & Course</th>
                  <th className="px-6 py-4">Phone & Parent</th>
                  <th className="px-6 py-4">Joined Date</th>
                  <th className="px-6 py-4">Fee Status</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={st.profilePhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250'}
                          alt={st.fullName}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-sm"
                        />
                        <div>
                          <Link
                            href={`/students/${st.id}`}
                            className="font-bold text-slate-800 hover:text-blue-600 transition"
                          >
                            {st.fullName}
                          </Link>
                          <div className="text-[11px] text-slate-400">{st.studentId}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {st.roomNumber && st.roomNumber !== '—' ? (
                        <div>
                          <span className="font-bold text-slate-800">Room {st.roomNumber}</span>
                          <span className="text-[11px] text-slate-500 block">{st.bedNumber}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-700 truncate max-w-[160px]">
                        {st.collegeName}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {st.course} ({st.year})
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-slate-800 font-medium">{st.phone}</div>
                      <div className="text-[11px] text-slate-400">
                        P: {st.parentName} ({st.parentPhone})
                      </div>
                    </td>

                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {formatDate(st.joiningDate)}
                    </td>

                    <td className="px-6 py-4">
                      {st.latestPayment ? (
                        <Badge status={st.latestPayment.status} />
                      ) : (
                        <Badge status="PENDING" />
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <Badge status={st.status} />
                    </td>

                    <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                      <Link
                        href={`/students/${st.id}`}
                        className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
                        title="View Full Profile"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Profile</span>
                      </Link>

                      {st.status !== 'LEFT' && (
                        <button
                          onClick={() => setCheckoutModal({ isOpen: true, student: st })}
                          className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition"
                          title="Check-Out Resident"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Exit</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Registration Modal */}
      <Modal
        isOpen={registerModal}
        onClose={() => setRegisterModal(false)}
        title="Register New Resident"
        subtitle="Fill in student details and allocate an available bed."
        maxWidth="2xl"
      >
        <form onSubmit={handleRegister} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Section 1: Personal Details */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              1. Personal & Contact Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sameer Dixit"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98110 00000"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="sameer@gmail.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Parent / Guardian Info */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              2. Parent & Emergency Contact
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Parent / Guardian Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Dixit"
                  value={form.parentName}
                  onChange={(e) => setForm({ ...form, parentName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Parent Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 94110 00000"
                  value={form.parentPhone}
                  onChange={(e) => setForm({ ...form, parentPhone: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Emergency Contact
                </label>
                <input
                  type="text"
                  placeholder="+91 94110 00000 (Father)"
                  value={form.emergencyContact}
                  onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Academic Information */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              3. College & Course
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">College Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bennett University"
                  value={form.collegeName}
                  onChange={(e) => setForm({ ...form, collegeName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Course *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. B.Tech Computer Science"
                  value={form.course}
                  onChange={(e) => setForm({ ...form, course: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Year of Study</label>
                <select
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Room & Bed Allocation (CRITICAL BUSINESS RULE) */}
          <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-3">
            <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
              4. Bed & Room Allocation (Enforcing Strict Single Occupancy)
            </h4>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Select Available Bed *
              </label>
              <select
                required
                value={form.bedId}
                onChange={(e) => setForm({ ...form, bedId: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white font-medium"
              >
                <option value="">-- Choose a vacant bed ({availableBeds.length} vacant) --</option>
                {availableBeds.map((b) => (
                  <option key={b.bedId} value={b.bedId}>
                    Room {b.roomNumber} (Floor {b.floor} - {b.roomType}) • {b.bedNumber}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Only currently unoccupied beds are displayed to prevent duplicate bed allocation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Joining Date</label>
                <input
                  type="date"
                  value={form.joiningDate}
                  onChange={(e) => setForm({ ...form, joiningDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Monthly Fee (₹) *
                </label>
                <input
                  type="number"
                  value={form.monthlyFee}
                  onChange={(e) => setForm({ ...form, monthlyFee: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Security Deposit (₹)
                </label>
                <input
                  type="number"
                  value={form.securityDeposit}
                  onChange={(e) => setForm({ ...form, securityDeposit: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Address */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Permanent Address</label>
            <input
              type="text"
              placeholder="House, Street, City, State, Pin Code"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setRegisterModal(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !form.bedId}
              className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md disabled:opacity-50"
            >
              {submitting ? 'Registering...' : 'Register & Assign Bed'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Checkout Modal */}
      <Modal
        isOpen={checkoutModal.isOpen}
        onClose={() => setCheckoutModal({ isOpen: false, student: null })}
        title="Check-Out Resident"
        subtitle={`Process leaving formalities for ${checkoutModal.student?.fullName || ''}`}
      >
        <form onSubmit={handleCheckout} className="space-y-4">
          <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl text-xs text-rose-900 space-y-1">
            <div className="font-bold text-sm text-rose-800">Resident Check-Out Confirmation</div>
            <p>
              Resident: <strong>{checkoutModal.student?.fullName}</strong> ({checkoutModal.student?.studentId})
            </p>
            <p>
              Assigned: Room {checkoutModal.student?.roomNumber} - {checkoutModal.student?.bedNumber}
            </p>
            <p className="pt-1 text-slate-600">
              Upon check-out, this bed will be released immediately and made available for new admissions.
              All payment histories, receipts, and documents will remain preserved.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Leaving Date</label>
            <input
              type="date"
              required
              value={checkoutData.checkoutDate}
              onChange={(e) => setCheckoutData({ ...checkoutData, checkoutDate: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Check-Out Remarks</label>
            <textarea
              rows={2}
              value={checkoutData.remarks}
              onChange={(e) => setCheckoutData({ ...checkoutData, remarks: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500"
              placeholder="e.g. Keys returned, security deposit refunded, no damages"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setCheckoutModal({ isOpen: false, student: null })}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md disabled:opacity-50"
            >
              {submitting ? 'Processing...' : 'Confirm Checkout & Release Bed'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
