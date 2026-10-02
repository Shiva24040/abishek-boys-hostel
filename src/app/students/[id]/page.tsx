'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Building,
  GraduationCap,
  CreditCard,
  Receipt,
  AlertCircle,
  FileText,
  ShieldAlert,
  CheckCircle2,
  Clock,
  LogOut,
  PlusCircle,
  Download,
  Eye,
  ExternalLink,
} from 'lucide-react';
import Badge from '@/components/common/Badge';
import Modal from '@/components/common/Modal';
import { formatCurrency, formatDate } from '@/lib/formatters';

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'PAYMENTS' | 'RECEIPTS' | 'COMPLAINTS' | 'DOCS'>('PAYMENTS');

  // Modals
  const [payModal, setPayModal] = useState(false);
  const [checkoutModal, setCheckoutModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  // Forms
  const [paymentForm, setPaymentForm] = useState({
    month: 'October 2026',
    amountPaid: '5000',
    paymentMethod: 'UPI',
    transactionId: '',
    remarks: 'Fee payment via UPI',
  });
  const [checkoutForm, setCheckoutForm] = useState({
    checkoutDate: new Date().toISOString().split('T')[0],
    remarks: 'Hostel checkout completed',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) fetchStudentDetail();
  }, [id]);

  const fetchStudentDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/students/${id}`);
      const data = await res.json();
      if (data.success) {
        setStudent(data.student);
        setPaymentForm((prev) => ({
          ...prev,
          amountPaid: String(data.student.monthlyFee || 5000),
          transactionId: `UPI${Date.now().toString().slice(-8)}`,
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: id,
          month: paymentForm.month,
          amountPaid: parseFloat(paymentForm.amountPaid),
          paymentMethod: paymentForm.paymentMethod,
          transactionId: paymentForm.transactionId,
          remarks: paymentForm.remarks,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPayModal(false);
        fetchStudentDetail();
      } else {
        alert(data.error || 'Failed to record payment');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/students/${id}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkoutForm),
      });
      const data = await res.json();
      if (data.success) {
        setCheckoutModal(false);
        fetchStudentDetail();
      } else {
        alert(data.error || 'Failed to checkout');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-semibold">Loading student profile...</p>
      </div>
    );
  }

  const latestPayment = student.payments?.[0];

  return (
    <div className="space-y-6">
      {/* Top back button */}
      <div>
        <Link
          href="/students"
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Residents</span>
        </Link>
      </div>

      {/* Main Student Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center space-x-5">
            <img
              src={student.profilePhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250'}
              alt={student.fullName}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-slate-100 shadow-md shrink-0"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black text-slate-800">{student.fullName}</h1>
                <Badge status={student.status} size="md" />
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-700">
                  {student.studentId}
                </span>
                <span className="flex items-center space-x-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{student.phone}</span>
                </span>
                {student.email && (
                  <span className="flex items-center space-x-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{student.email}</span>
                  </span>
                )}
              </div>

              {/* Room & Bed Pill */}
              <div className="mt-3 flex items-center space-x-2">
                {student.room ? (
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-blue-50 text-blue-800 rounded-xl text-xs font-bold border border-blue-100">
                    <Building className="w-3.5 h-3.5 text-blue-600" />
                    <span>
                      Room {student.room.roomNumber} • {student.bed?.bedNumber}
                    </span>
                  </div>
                ) : (
                  <div className="inline-flex items-center px-3 py-1 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold">
                    No bed currently assigned
                  </div>
                )}
                <span className="text-xs text-slate-400">
                  Joined: {formatDate(student.joiningDate)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setPayModal(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-600/20"
            >
              <CreditCard className="w-4 h-4" />
              <span>Record Fee Payment</span>
            </button>

            {student.status !== 'LEFT' && (
              <button
                onClick={() => setCheckoutModal(true)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Check-Out</span>
              </button>
            )}
          </div>
        </div>

        {/* Sub Info Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100 text-xs">
          <div className="p-3 bg-slate-50 rounded-2xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Academic Details
            </span>
            <span className="font-bold text-slate-800 mt-1 block">{student.collegeName}</span>
            <span className="text-slate-500">{student.course} ({student.year})</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Parent & Guardian
            </span>
            <span className="font-bold text-slate-800 mt-1 block">{student.parentName}</span>
            <span className="text-slate-500">{student.parentPhone}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Fee & Deposit
            </span>
            <span className="font-bold text-slate-800 mt-1 block">
              Monthly: {formatCurrency(student.monthlyFee)}
            </span>
            <span className="text-slate-500">
              Deposit: {formatCurrency(student.securityDeposit)} (Refundable)
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('PAYMENTS')}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center space-x-1.5 ${
            activeTab === 'PAYMENTS'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Payment History ({student.payments?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('RECEIPTS')}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center space-x-1.5 ${
            activeTab === 'RECEIPTS'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Receipts ({student.receipts?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('COMPLAINTS')}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center space-x-1.5 ${
            activeTab === 'COMPLAINTS'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          <span>Complaints ({student.complaints?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('DOCS')}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center space-x-1.5 ${
            activeTab === 'DOCS'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Documents & Info</span>
        </button>
      </div>

      {/* Tab Content: Payments */}
      {activeTab === 'PAYMENTS' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800">Monthly Fee Ledger</h3>
              <p className="text-xs text-slate-400">All historical billing and payment records</p>
            </div>
            <button
              onClick={() => setPayModal(true)}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Record Payment</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Month</th>
                  <th className="px-6 py-3.5">Fee Amount</th>
                  <th className="px-6 py-3.5">Paid Amount</th>
                  <th className="px-6 py-3.5">Due Date</th>
                  <th className="px-6 py-3.5">Payment Date</th>
                  <th className="px-6 py-3.5">Method & Txn</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {student.payments?.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 font-bold text-slate-800">{p.month}</td>
                    <td className="px-6 py-4 font-bold text-slate-700">{formatCurrency(p.amount)}</td>
                    <td className="px-6 py-4 font-bold text-emerald-600">
                      {formatCurrency(p.amountPaid)}
                    </td>
                    <td className="px-6 py-4 text-slate-500">{formatDate(p.dueDate)}</td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {formatDate(p.paymentDate)}
                    </td>
                    <td className="px-6 py-4">
                      {p.paymentMethod ? (
                        <div>
                          <span className="font-semibold text-slate-700">{p.paymentMethod}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {p.transactionId || '—'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge status={p.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      {p.receipt ? (
                        <button
                          onClick={() => setSelectedReceipt(p.receipt)}
                          className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-bold"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content: Receipts */}
      {activeTab === 'RECEIPTS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {student.receipts?.length === 0 ? (
            <div className="col-span-full p-12 bg-white rounded-3xl border border-slate-200 text-center text-slate-400 text-xs">
              No payment receipts uploaded yet.
            </div>
          ) : (
            student.receipts.map((r: any) => (
              <div
                key={r.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">{r.month}</span>
                  <Badge status={r.status} size="sm" />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Amount:</span>
                    <span className="font-bold text-emerald-600">{formatCurrency(r.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Method:</span>
                    <span className="font-medium text-slate-700">{r.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Txn ID:</span>
                    <span className="font-mono text-slate-700">{r.transactionId}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-400">{formatDate(r.paymentDate)}</span>
                  <button
                    onClick={() => setSelectedReceipt(r)}
                    className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Receipt</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab Content: Complaints */}
      {activeTab === 'COMPLAINTS' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-800">Complaints Logged by Resident</h3>

          {student.complaints?.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No complaints filed by this resident.
            </div>
          ) : (
            <div className="space-y-3">
              {student.complaints.map((c: any) => (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">{c.title}</span>
                    <Badge status={c.status} />
                  </div>
                  <p className="text-xs text-slate-600">{c.description}</p>
                  <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                    <span>Filed on {formatDate(c.createdAt)}</span>
                    {c.resolutionNotes && (
                      <span className="text-emerald-700 font-medium">
                        Notes: {c.resolutionNotes}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Documents & Info */}
      {activeTab === 'DOCS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-800">Identity & Residence Proof</h3>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  {student.idProofType || 'Aadhaar Card'}
                </span>
                <span className="text-[11px] text-slate-400">Verified document on file</span>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Verified
              </span>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <span className="font-bold block text-slate-700">Permanent Address:</span>
              <p className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-700">
                {student.address || 'Knowledge Park III, Greater Noida'}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-800">Hostel Rules Agreement</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Signed hostel undertaking agreeing to adhere to gate timings (10:00 PM), zero-tolerance anti-ragging policy, clean maintenance of hostel fixtures, and prompt monthly fee settlement.
            </p>
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Signed undertaking received at admission</span>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      <Modal
        isOpen={payModal}
        onClose={() => setPayModal(false)}
        title="Record Fee Payment"
        subtitle={`Collect monthly fee for ${student.fullName}`}
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Billing Month</label>
            <select
              value={paymentForm.month}
              onChange={(e) => setPaymentForm({ ...paymentForm, month: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white font-medium"
            >
              <option value="October 2026">October 2026</option>
              <option value="November 2026">November 2026</option>
              <option value="December 2026">December 2026</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Amount Collected (₹) *
            </label>
            <input
              type="number"
              required
              value={paymentForm.amountPaid}
              onChange={(e) => setPaymentForm({ ...paymentForm, amountPaid: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method</label>
            <select
              value={paymentForm.paymentMethod}
              onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="UPI">UPI (Google Pay, PhonePe, Paytm)</option>
              <option value="CASH">Cash</option>
              <option value="BANK_TRANSFER">Bank Transfer (NEFT/IMPS)</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Transaction / Reference Number
            </label>
            <input
              type="text"
              value={paymentForm.transactionId}
              onChange={(e) => setPaymentForm({ ...paymentForm, transactionId: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Remarks</label>
            <input
              type="text"
              value={paymentForm.remarks}
              onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3">
            <button
              type="button"
              onClick={() => setPayModal(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md disabled:opacity-50"
            >
              {submitting ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Receipt View Modal */}
      <Modal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        title="Payment Receipt Details"
        subtitle={selectedReceipt?.fileName}
      >
        {selectedReceipt && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Billing Month:</span>
                <span className="font-bold text-slate-800">{selectedReceipt.month}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Paid:</span>
                <span className="font-bold text-emerald-600">
                  {formatCurrency(selectedReceipt.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Date:</span>
                <span className="font-medium text-slate-700">
                  {formatDate(selectedReceipt.paymentDate)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="font-mono text-slate-800">{selectedReceipt.transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <Badge status={selectedReceipt.status} size="sm" />
              </div>
            </div>

            {/* Simulated Receipt Preview */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-inner p-4 bg-white flex flex-col items-center justify-center">
              <img
                src={selectedReceipt.fileUrl}
                alt="Receipt Proof"
                className="max-h-56 object-contain rounded-xl"
              />
              <span className="text-[11px] text-slate-400 mt-2">
                Official E-Receipt Verified by Abhishek Boys Hostel
              </span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Checkout Modal */}
      <Modal
        isOpen={checkoutModal}
        onClose={() => setCheckoutModal(false)}
        title="Check-Out Resident"
        subtitle={`Process check-out for ${student.fullName}`}
      >
        <form onSubmit={handleCheckout} className="space-y-4">
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
            Confirming this will vacate Bed {student.bed?.bedNumber} in Room {student.room?.roomNumber},
            making it available for other applicants.
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Departure Date</label>
            <input
              type="date"
              required
              value={checkoutForm.checkoutDate}
              onChange={(e) => setCheckoutForm({ ...checkoutForm, checkoutDate: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Remarks</label>
            <textarea
              rows={2}
              value={checkoutForm.remarks}
              onChange={(e) => setCheckoutForm({ ...checkoutForm, remarks: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setCheckoutModal(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md disabled:opacity-50"
            >
              {submitting ? 'Checking out...' : 'Confirm Check-Out'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
