'use client';

import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Plus,
  Clock,
  LogOut,
  Calendar,
  Phone,
  ShieldCheck,
  Search,
} from 'lucide-react';
import Modal from '@/components/common/Modal';
import { formatDate } from '@/lib/formatters';

export default function VisitorsPage() {
  const [visitors, setVisitors] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form
  const [form, setForm] = useState({
    visitorName: '',
    phone: '',
    studentId: '',
    studentName: '',
    roomNumber: '',
    entryTime: '',
    purpose: 'Personal visit',
    idProofType: 'Aadhaar / Voter ID',
  });

  useEffect(() => {
    fetchVisitors();
    fetchStudents();
  }, []);

  const fetchVisitors = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/visitors');
      const data = await res.json();
      if (data.success) {
        setVisitors(data.visitors);
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

  const handleStudentSelect = (studentId: string) => {
    const selected = students.find((s) => s.id === studentId);
    if (selected) {
      setForm({
        ...form,
        studentId: selected.id,
        studentName: selected.fullName,
        roomNumber: selected.roomNumber || '—',
      });
    }
  };

  const handleLogVisitor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        setForm({
          visitorName: '',
          phone: '',
          studentId: '',
          studentName: '',
          roomNumber: '',
          entryTime: '',
          purpose: 'Personal visit',
          idProofType: 'Aadhaar / Voter ID',
        });
        fetchVisitors();
      } else {
        alert(data.error || 'Failed to log visitor');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordExit = async (id: string) => {
    try {
      const res = await fetch('/api/visitors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        fetchVisitors();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const currentlyInside = visitors.filter((v) => !v.exitTime);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Visitor Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log hostel guests, verify guardian identity, and track entry/exit timings strictly.
          </p>
        </div>

        <button
          onClick={() => {
            const nowTime = new Date().toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
            });
            setForm((prev) => ({ ...prev, entryTime: nowTime }));
            setModalOpen(true);
          }}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Log New Visitor</span>
        </button>
      </div>

      {/* Currently Inside Alert */}
      {currentlyInside.length > 0 && (
        <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-2.5 text-xs text-blue-900">
            <UserCheck className="w-5 h-5 text-blue-600 shrink-0" />
            <span>
              <strong>{currentlyInside.length} guest(s)</strong> currently in the visitor lounge.
              Hostel visiting hours end at 7:00 PM sharp.
            </span>
          </div>
        </div>
      )}

      {/* Visitors List Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading visitor logs...</div>
        ) : visitors.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">No visitor logs recorded.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Visitor Name</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Resident Visited</th>
                  <th className="px-6 py-4">Room</th>
                  <th className="px-6 py-4">Date & In Time</th>
                  <th className="px-6 py-4">Out Time</th>
                  <th className="px-6 py-4">Purpose</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visitors.map((v) => {
                  const isInside = !v.exitTime;
                  return (
                    <tr key={v.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4 font-bold text-slate-800">{v.visitorName}</td>
                      <td className="px-6 py-4 text-slate-600">{v.phone}</td>
                      <td className="px-6 py-4 font-medium text-slate-800">{v.studentName}</td>
                      <td className="px-6 py-4 font-semibold text-slate-700">Room {v.roomNumber}</td>
                      <td className="px-6 py-4">
                        <span className="text-slate-800 block">{formatDate(v.visitDate)}</span>
                        <span className="text-[11px] text-emerald-600 font-medium">{v.entryTime}</span>
                      </td>
                      <td className="px-6 py-4">
                        {v.exitTime ? (
                          <span className="text-slate-600 font-medium">{v.exitTime}</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                            Inside Lounge
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-500 max-w-[200px] truncate">{v.purpose}</td>
                      <td className="px-6 py-4 text-right">
                        {isInside ? (
                          <button
                            onClick={() => handleRecordExit(v.id)}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                          >
                            <LogOut className="w-3 h-3" />
                            <span>Log Exit</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-semibold">Exited</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Visitor Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Log Visitor Entry"
        subtitle="Record guest details in the hostel entry registry"
      >
        <form onSubmit={handleLogVisitor} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Visitor Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. S. K. Kumar"
                value={form.visitorName}
                onChange={(e) => setForm({ ...form, visitorName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                required
                placeholder="+91 94112 00000"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Resident Being Visited *
            </label>
            <select
              required
              value={form.studentId}
              onChange={(e) => handleStudentSelect(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">-- Choose Resident --</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.studentId}) - Room {s.roomNumber || 'N/A'}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Entry Time</label>
              <input
                type="text"
                value={form.entryTime}
                onChange={(e) => setForm({ ...form, entryTime: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ID Proof</label>
              <select
                value={form.idProofType}
                onChange={(e) => setForm({ ...form, idProofType: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="Aadhaar / Voter ID">Aadhaar / Voter ID</option>
                <option value="Driving License">Driving License</option>
                <option value="Government Employee ID">Government Employee ID</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Purpose of Visit *
            </label>
            <input
              type="text"
              required
              value={form.purpose}
              onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Delivering winter clothes and medicines"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !form.visitorName || !form.studentName}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md disabled:opacity-50"
            >
              {submitting ? 'Logging...' : 'Confirm Entry'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
