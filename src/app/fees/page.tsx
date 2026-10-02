'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Search,
  Filter,
  Send,
  Check,
  PlusCircle,
  Clock,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  AlertTriangle,
  Receipt as ReceiptIcon,
} from 'lucide-react';
import Badge from '@/components/common/Badge';
import Modal from '@/components/common/Modal';
import { formatCurrency, formatDate } from '@/lib/formatters';

export default function FeesPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('October 2026');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Modals
  const [payModal, setPayModal] = useState<{ isOpen: boolean; payment: any | null }>({
    isOpen: false,
    payment: null,
  });
  const [reminderModal, setReminderModal] = useState<{ isOpen: boolean; data: any | null }>({
    isOpen: false,
    data: null,
  });
  const [copied, setCopied] = useState(false);

  // Pay Form
  const [form, setForm] = useState({
    amountPaid: '',
    paymentMethod: 'UPI',
    transactionId: '',
    remarks: 'Monthly hostel fee payment',
    receiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=400',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, [selectedMonth, statusFilter]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      let url = `/api/payments?month=${encodeURIComponent(selectedMonth)}&status=${statusFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setPayments(data.payments);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPay = (payment: any) => {
    const due = payment.amount - payment.amountPaid;
    setForm({
      amountPaid: String(due > 0 ? due : payment.amount),
      paymentMethod: 'UPI',
      transactionId: `UPI${Date.now().toString().slice(-8)}`,
      remarks: 'Payment settled on portal',
      receiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=400',
    });
    setPayModal({ isOpen: true, payment });
  };

  const submitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModal.payment) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: payModal.payment.id,
          amountPaid: parseFloat(form.amountPaid),
          paymentMethod: form.paymentMethod,
          transactionId: form.transactionId,
          remarks: form.remarks,
          receiptUrl: form.receiptUrl,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPayModal({ isOpen: false, payment: null });
        fetchPayments();
      } else {
        alert(data.error || 'Failed to record payment');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReminder = async (payment: any) => {
    try {
      const res = await fetch('/api/payments/remind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: payment.id, channel: 'WHATSAPP' }),
      });
      const data = await res.json();
      if (data.success) {
        setReminderModal({ isOpen: true, data: data.reminder });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Calculations for selected month
  const totalExpected = payments.reduce((acc, p) => acc + p.amount, 0);
  const totalCollected = payments.reduce((acc, p) => acc + p.amountPaid, 0);
  const totalPending = Math.max(0, totalExpected - totalCollected);
  const paidCount = payments.filter((p) => p.status === 'PAID').length;
  const overdueCount = payments.filter((p) => p.status === 'OVERDUE').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Monthly Fees & Payments</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Default hostel fee: ₹5,000/month. Track collections, send reminders, and record receipts.
          </p>
        </div>

        {/* Month Selector Dropdown */}
        <div className="flex items-center space-x-2">
          <label className="text-xs font-bold text-slate-500">Billing Cycle:</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3.5 py-2 text-xs font-bold bg-white border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="October 2026">October 2026 (Current)</option>
            <option value="September 2026">September 2026</option>
            <option value="August 2026">August 2026</option>
            <option value="ALL">All Recorded Months</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Expected Total</div>
          <div className="text-2xl font-black text-slate-800 mt-1">
            {formatCurrency(totalExpected)}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-[11px] font-bold text-emerald-600 uppercase">Collected Amount</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {formatCurrency(totalCollected)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">{paidCount} residents settled</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-[11px] font-bold text-amber-500 uppercase">Pending Amount</div>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {formatCurrency(totalPending)}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-[11px] font-bold text-rose-500 uppercase">Overdue Count</div>
          <div className="text-2xl font-black text-rose-600 mt-1">{overdueCount}</div>
          <div className="text-[10px] text-rose-500 mt-0.5">Past deadline</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm">
        {/* Status Filters */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'All Statuses' },
            { id: 'PAID', label: 'Paid' },
            { id: 'PENDING', label: 'Pending' },
            { id: 'PARTIALLY_PAID', label: 'Partially Paid' },
            { id: 'OVERDUE', label: 'Overdue' },
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
            placeholder="Search student or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchPayments()}
            className="w-full sm:w-60 pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading payment records...</div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-700 text-sm">No payment records found</p>
            <p className="text-xs text-slate-400 mt-1">Try changing your filters or month cycle.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Resident</th>
                  <th className="px-6 py-4">Room & Bed</th>
                  <th className="px-6 py-4">Cycle Month</th>
                  <th className="px-6 py-4">Monthly Fee</th>
                  <th className="px-6 py-4">Paid Amount</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4">Payment Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => {
                  const isPaid = p.status === 'PAID';
                  const balance = p.amount - p.amountPaid;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4">
                        <Link
                          href={`/students/${p.studentId}`}
                          className="font-bold text-slate-800 hover:text-blue-600 transition"
                        >
                          {p.studentName}
                        </Link>
                        <div className="text-[11px] text-slate-400">{p.studentCode}</div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-700">Room {p.roomNumber}</span>
                        <span className="text-[11px] text-slate-400 block">{p.bedNumber}</span>
                      </td>

                      <td className="px-6 py-4 font-medium text-slate-800">{p.month}</td>

                      <td className="px-6 py-4 font-bold text-slate-800">
                        {formatCurrency(p.amount)}
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-bold text-emerald-600">
                          {formatCurrency(p.amountPaid)}
                        </div>
                        {p.paymentMethod && (
                          <div className="text-[10px] text-slate-400">via {p.paymentMethod}</div>
                        )}
                      </td>

                      <td className="px-6 py-4 font-medium text-slate-600">
                        {formatDate(p.dueDate)}
                      </td>

                      <td className="px-6 py-4">
                        <Badge status={p.status} />
                      </td>

                      <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                        {!isPaid && (
                          <>
                            <button
                              onClick={() => handleSendReminder(p)}
                              className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition"
                              title="Send WhatsApp/SMS Reminder"
                            >
                              <Send className="w-3 h-3" />
                              <span>Remind</span>
                            </button>
                            <button
                              onClick={() => handleOpenPay(p)}
                              className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                              title="Record Payment"
                            >
                              <Check className="w-3 h-3" />
                              <span>Mark Paid</span>
                            </button>
                          </>
                        )}

                        <Link
                          href={`/students/${p.studentId}`}
                          className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
                          title="View Complete Payment History"
                        >
                          <span>History</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={payModal.isOpen}
        onClose={() => setPayModal({ isOpen: false, payment: null })}
        title="Record Fee Collection"
        subtitle={`Collect monthly hostel dues for ${payModal.payment?.studentName || ''}`}
      >
        {payModal.payment && (
          <form onSubmit={submitPayment} className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Student Name:</span>
                <span className="font-bold text-slate-800">{payModal.payment.studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Room / Bed:</span>
                <span className="text-slate-700">
                  Room {payModal.payment.roomNumber} ({payModal.payment.bedNumber})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Month:</span>
                <span className="font-bold text-slate-800">{payModal.payment.month}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Amount Received (₹) *
              </label>
              <input
                type="number"
                required
                value={form.amountPaid}
                onChange={(e) => setForm({ ...form, amountPaid: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method</label>
              <select
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="UPI">UPI (Google Pay, PhonePe, Paytm)</option>
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer (NEFT / IMPS)</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Transaction / Reference Number
              </label>
              <input
                type="text"
                required
                value={form.transactionId}
                onChange={(e) => setForm({ ...form, transactionId: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Remarks</label>
              <input
                type="text"
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-3">
              <button
                type="button"
                onClick={() => setPayModal({ isOpen: false, payment: null })}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md disabled:opacity-50"
              >
                {submitting ? 'Recording...' : 'Confirm Payment & Issue Receipt'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Reminder Prepared Modal */}
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

            {/* Clear integration notice as required */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Integration Status: </span>
                <span>{reminderModal.data.gatewayNotice}</span>
              </div>
            </div>

            {/* Message Text */}
            <div>
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

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(reminderModal.data.messageText);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                {copied ? '✓ Copied!' : 'Copy Text'}
              </button>
              <a
                href={reminderModal.data.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-600/20"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Send WhatsApp</span>
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
