'use client';

import React, { useState, useEffect } from 'react';
import {
  ReceiptText,
  Upload,
  CheckCircle2,
  XCircle,
  Eye,
  Download,
  Filter,
  Search,
  FileCheck,
  AlertCircle,
  FileText,
} from 'lucide-react';
import Badge from '@/components/common/Badge';
import Modal from '@/components/common/Modal';
import { formatCurrency, formatDate } from '@/lib/formatters';

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [students, setStudents] = useState<any[]>([]);

  // Modals
  const [uploadModal, setUploadModal] = useState(false);
  const [viewModal, setViewModal] = useState<{ isOpen: boolean; receipt: any | null }>({
    isOpen: false,
    receipt: null,
  });

  // Upload form
  const [form, setForm] = useState({
    studentId: '',
    month: 'October 2026',
    amount: '5000',
    paymentMethod: 'UPI',
    transactionId: '',
    paymentDate: new Date().toISOString().split('T')[0],
    fileUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=600',
    fileName: 'Payment_Receipt_UPI.pdf',
    fileType: 'application/pdf',
    fileSize: 1048576,
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchReceipts();
    fetchStudents();
  }, [statusFilter]);

  const fetchReceipts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/receipts?status=${statusFilter}`);
      const data = await res.json();
      if (data.success) {
        setReceipts(data.receipts);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/students');
      const data = await res.json();
      if (data.success) {
        setStudents(data.students);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setUploadModal(false);
        fetchReceipts();
      } else {
        setErrorMsg(data.error || 'Failed to upload receipt');
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('Error processing receipt upload');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (receiptId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      const res = await fetch('/api/receipts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptId, action }),
      });
      const data = await res.json();
      if (data.success) {
        if (viewModal.isOpen) {
          setViewModal({ isOpen: false, receipt: null });
        }
        fetchReceipts();
      } else {
        alert(data.error || 'Failed to update receipt status');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Payment Receipts</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review uploaded bank/UPI transfer receipts, verify transactions, and approve or reject submissions.
          </p>
        </div>

        <button
          onClick={() => {
            setErrorMsg(null);
            setUploadModal(true);
          }}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-600/20"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Receipt</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm overflow-x-auto">
        {[
          { id: 'ALL', label: 'All Receipts' },
          { id: 'PENDING', label: 'Pending Verification' },
          { id: 'APPROVED', label: 'Approved' },
          { id: 'REJECTED', label: 'Rejected' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              statusFilter === tab.id
                ? 'bg-navy-950 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Receipts Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">Loading receipts...</div>
      ) : receipts.length === 0 ? (
        <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center">
          <ReceiptText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700">No receipts found</p>
          <p className="text-xs text-slate-400 mt-1">Try switching tabs or upload a new payment slip.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {receipts.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col justify-between"
            >
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800">{r.studentName}</span>
                  <span className="text-[11px] text-slate-400 block">
                    Room {r.roomNumber} ({r.bedNumber})
                  </span>
                </div>
                <Badge status={r.status} />
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-3 flex-1">
                {/* Visual Thumbnail */}
                <div
                  onClick={() => setViewModal({ isOpen: true, receipt: r })}
                  className="h-36 bg-slate-100 rounded-2xl overflow-hidden relative cursor-pointer group border border-slate-200/70"
                >
                  <img
                    src={r.fileUrl}
                    alt="Receipt Thumbnail"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-navy-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold space-x-1.5 backdrop-blur-[2px]">
                    <Eye className="w-4 h-4" />
                    <span>View Full Receipt</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Month:</span>
                    <span className="font-bold text-slate-800">{r.month}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Amount Paid:</span>
                    <span className="font-bold text-emerald-600">{formatCurrency(r.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Payment Date:</span>
                    <span className="text-slate-700">{formatDate(r.paymentDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Method:</span>
                    <span className="text-slate-700 font-medium">{r.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Transaction ID:</span>
                    <span className="font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 truncate max-w-[130px]">
                      {r.transactionId}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setViewModal({ isOpen: true, receipt: r })}
                  className="flex-1 py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs border border-slate-200 transition text-center"
                >
                  Inspect
                </button>

                {r.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(r.id, 'APPROVE')}
                      className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition"
                      title="Approve Receipt"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleStatusChange(r.id, 'REJECT')}
                      className="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition"
                      title="Reject Receipt"
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal with File Validation */}
      <Modal
        isOpen={uploadModal}
        onClose={() => setUploadModal(false)}
        title="Upload Payment Receipt"
        subtitle="Secure upload supporting PNG, JPG, or PDF (Max 5MB)"
      >
        <form onSubmit={handleUpload} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Resident *
            </label>
            <select
              required
              value={form.studentId}
              onChange={(e) => setForm({ ...form, studentId: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">-- Choose Resident --</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.studentId}) - Room {s.roomNumber}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Month *</label>
              <select
                value={form.month}
                onChange={(e) => setForm({ ...form, month: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="October 2026">October 2026</option>
                <option value="September 2026">September 2026</option>
                <option value="August 2026">August 2026</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Amount (₹) *</label>
              <input
                type="number"
                required
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method</label>
              <select
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="UPI">UPI</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CASH">Cash Deposit</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Transaction / UTR Number *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 4829103948"
                value={form.transactionId}
                onChange={(e) => setForm({ ...form, transactionId: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Receipt File Upload (Image / PDF)
            </label>
            <div className="p-4 border-2 border-dashed border-slate-300 rounded-2xl text-center space-y-2 hover:border-blue-500 transition">
              <Upload className="w-8 h-8 text-blue-500 mx-auto" />
              <div className="text-xs font-semibold text-slate-700">
                Click or drag & drop payment screenshot/PDF
              </div>
              <p className="text-[10px] text-slate-400">Supported: JPG, PNG, WEBP, PDF up to 5MB</p>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-3">
            <button
              type="button"
              onClick={() => setUploadModal(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !form.studentId || !form.transactionId}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md disabled:opacity-50"
            >
              {submitting ? 'Uploading...' : 'Submit Receipt'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Inspect Receipt Modal */}
      <Modal
        isOpen={viewModal.isOpen}
        onClose={() => setViewModal({ isOpen: false, receipt: null })}
        title="Payment Receipt Verification"
        subtitle={viewModal.receipt?.fileName}
      >
        {viewModal.receipt && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Student:</span>
                <span className="font-bold text-slate-800">{viewModal.receipt.studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Room & Bed:</span>
                <span className="text-slate-700">
                  Room {viewModal.receipt.roomNumber} ({viewModal.receipt.bedNumber})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Paid:</span>
                <span className="font-bold text-emerald-600">
                  {formatCurrency(viewModal.receipt.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="font-mono text-slate-800">{viewModal.receipt.transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Verification Status:</span>
                <Badge status={viewModal.receipt.status} size="sm" />
              </div>
            </div>

            {/* Document display */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 flex flex-col items-center">
              <img
                src={viewModal.receipt.fileUrl}
                alt="Receipt Image"
                className="max-h-72 object-contain rounded-xl shadow-sm border border-slate-200"
              />
              <span className="text-[11px] text-slate-400 mt-2">
                File format: {viewModal.receipt.fileType} • Size: ~{(viewModal.receipt.fileSize / 1024).toFixed(0)} KB
              </span>
            </div>

            {/* Admin Decision Actions */}
            <div className="flex items-center justify-between pt-2">
              <a
                href={viewModal.receipt.fileUrl}
                target="_blank"
                rel="noreferrer"
                download
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </a>

              {viewModal.receipt.status === 'PENDING' ? (
                <div className="space-x-2">
                  <button
                    onClick={() => handleStatusChange(viewModal.receipt.id, 'REJECT')}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleStatusChange(viewModal.receipt.id, 'APPROVE')}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition"
                  >
                    Approve Receipt
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setViewModal({ isOpen: false, receipt: null })}
                  className="px-4 py-2 bg-slate-800 text-white font-bold rounded-xl text-xs"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
