'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  Plus,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  Wrench,
  Wifi,
  Droplet,
  Lightbulb,
  Fan,
  Bed,
  Bath,
  HelpCircle,
  MessageSquare,
} from 'lucide-react';
import Badge from '@/components/common/Badge';
import Modal from '@/components/common/Modal';
import { formatDate } from '@/lib/formatters';

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modals
  const [newModal, setNewModal] = useState(false);
  const [updateModal, setUpdateModal] = useState<{ isOpen: boolean; complaint: any | null }>({
    isOpen: false,
    complaint: null,
  });

  // Forms
  const [form, setForm] = useState({
    title: '',
    description: '',
    studentName: 'Ravi Kumar',
    roomNumber: '101',
    category: 'FAN',
    priority: 'MEDIUM',
  });

  const [updateStatus, setUpdateStatus] = useState('IN_PROGRESS');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter, categoryFilter]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      let url = `/api/complaints?status=${statusFilter}&category=${categoryFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setComplaints(data.complaints);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setNewModal(false);
        setForm({
          title: '',
          description: '',
          studentName: 'Ravi Kumar',
          roomNumber: '101',
          category: 'FAN',
          priority: 'MEDIUM',
        });
        fetchComplaints();
      } else {
        alert(data.error || 'Failed to lodge complaint');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateModal.complaint) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/complaints', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: updateModal.complaint.id,
          status: updateStatus,
          resolutionNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setUpdateModal({ isOpen: false, complaint: null });
        fetchComplaints();
      } else {
        alert(data.error || 'Failed to update complaint');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const openUpdate = (complaint: any) => {
    setUpdateStatus(complaint.status);
    setResolutionNotes(complaint.resolutionNotes || '');
    setUpdateModal({ isOpen: true, complaint });
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'FAN':
        return <Fan className="w-4 h-4 text-blue-500" />;
      case 'LIGHT':
        return <Lightbulb className="w-4 h-4 text-amber-500" />;
      case 'WATER':
        return <Droplet className="w-4 h-4 text-sky-500" />;
      case 'WIFI':
        return <Wifi className="w-4 h-4 text-indigo-500" />;
      case 'BATHROOM':
        return <Bath className="w-4 h-4 text-teal-500" />;
      case 'BED':
        return <Bed className="w-4 h-4 text-purple-500" />;
      default:
        return <Wrench className="w-4 h-4 text-slate-500" />;
    }
  };

  const openCount = complaints.filter((c) => c.status === 'OPEN').length;
  const inProgressCount = complaints.filter((c) => c.status === 'IN_PROGRESS').length;
  const resolvedCount = complaints.filter((c) => c.status === 'RESOLVED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Complaints & Maintenance</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log electrical, plumbing, Wi-Fi, and room maintenance requests with real-time status updates.
          </p>
        </div>

        <button
          onClick={() => setNewModal(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Complaint</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-[11px] font-bold text-amber-500 uppercase">Open Issues</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{openCount}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-[11px] font-bold text-indigo-500 uppercase">In Progress</div>
          <div className="text-2xl font-black text-indigo-600 mt-1">{inProgressCount}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-[11px] font-bold text-emerald-500 uppercase">Resolved</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{resolvedCount}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm">
        {/* Status Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'All Complaints' },
            { id: 'OPEN', label: 'Open' },
            { id: 'IN_PROGRESS', label: 'In Progress' },
            { id: 'RESOLVED', label: 'Resolved' },
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

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
        >
          <option value="ALL">All Categories</option>
          <option value="FAN">Fan / Air Circulation</option>
          <option value="LIGHT">Electrical / Light</option>
          <option value="WATER">Water / Plumbing</option>
          <option value="WIFI">Wi-Fi & Internet</option>
          <option value="BATHROOM">Bathroom & Toilet</option>
          <option value="BED">Bed & Furniture</option>
          <option value="OTHER">Other Issues</option>
        </select>
      </div>

      {/* Complaints List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">Loading complaints...</div>
      ) : complaints.length === 0 ? (
        <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700">No active complaints</p>
          <p className="text-xs text-slate-400 mt-1">All maintenance issues are resolved!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {complaints.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 rounded-xl bg-slate-100">{getCategoryIcon(c.category)}</div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">{c.title}</h3>
                      <span className="text-[11px] font-semibold text-slate-400">
                        Room {c.roomNumber} • By {c.studentName}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <Badge status={c.status} />
                    <Badge status={c.priority} size="sm" />
                  </div>
                </div>

                <p className="text-xs text-slate-600 mt-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 leading-relaxed">
                  {c.description}
                </p>

                {c.resolutionNotes && (
                  <div className="mt-2 p-2.5 bg-emerald-50/70 border border-emerald-100 rounded-xl text-xs text-emerald-800">
                    <span className="font-bold">Warden Notes: </span>
                    <span>{c.resolutionNotes}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-400">
                <span>Filed {formatDate(c.createdAt)}</span>
                <button
                  onClick={() => openUpdate(c)}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition"
                >
                  Update Status
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Complaint Modal */}
      <Modal
        isOpen={newModal}
        onClose={() => setNewModal(false)}
        title="File Maintenance Complaint"
        subtitle="Report broken appliances, plumbing, lighting, or Wi-Fi faults"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Room Number *</label>
              <input
                type="text"
                required
                value={form.roomNumber}
                onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Resident Name *</label>
              <input
                type="text"
                required
                value={form.studentName}
                onChange={(e) => setForm({ ...form, studentName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="FAN">Fan Problem</option>
                <option value="LIGHT">Light / Tube Problem</option>
                <option value="WATER">Water / Tap Problem</option>
                <option value="WIFI">Wi-Fi Connection</option>
                <option value="BATHROOM">Bathroom Problem</option>
                <option value="BED">Bed / Wardrobe Problem</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="LOW">Low Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="HIGH">High Priority</option>
                <option value="EMERGENCY">Emergency</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Complaint Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Geyser tripping switchboard"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Detailed Description *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Explain the issue in detail..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3">
            <button
              type="button"
              onClick={() => setNewModal(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Complaint'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Update Status Modal */}
      <Modal
        isOpen={updateModal.isOpen}
        onClose={() => setUpdateModal({ isOpen: false, complaint: null })}
        title="Update Complaint Status"
        subtitle={`Room ${updateModal.complaint?.roomNumber} • ${updateModal.complaint?.title}`}
      >
        <form onSubmit={handleUpdateStatus} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
            <select
              value={updateStatus}
              onChange={(e) => setUpdateStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="OPEN">Open (Pending Inspection)</option>
              <option value="IN_PROGRESS">In Progress (Electrician / Plumber Assigned)</option>
              <option value="RESOLVED">Resolved (Work Completed)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Resolution Notes / Action Taken
            </label>
            <textarea
              rows={3}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Electrician replaced capacitor. Working smoothly."
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setUpdateModal({ isOpen: false, complaint: null })}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md disabled:opacity-50"
            >
              {submitting ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
