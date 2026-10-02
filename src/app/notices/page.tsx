'use client';

import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  PlusCircle,
  Search,
  Filter,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Trash2,
  Edit2,
  FileText,
  ExternalLink,
  Tag,
  ShieldAlert,
  Send,
  Sparkles,
} from 'lucide-react';
import Badge from '@/components/common/Badge';
import Modal from '@/components/common/Modal';
import { formatDate } from '@/lib/formatters';

interface HostelNoticeItem {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'NORMAL' | 'IMPORTANT' | 'URGENT';
  publishedAt: string;
  expiresAt: string | null;
  attachmentUrl: string | null;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<HostelNoticeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [activeNotice, setActiveNotice] = useState<HostelNoticeItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'GENERAL',
    priority: 'NORMAL' as 'NORMAL' | 'IMPORTANT' | 'URGENT',
    publishedAt: new Date().toISOString().split('T')[0],
    expiresAt: '',
    attachmentUrl: '',
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notices');
      const data = await res.json();
      if (data.success) {
        setNotices(data.notices || []);
      }
    } catch (e) {
      console.error('Failed to load notices:', e);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'GENERAL',
      priority: 'NORMAL',
      publishedAt: new Date().toISOString().split('T')[0],
      expiresAt: '',
      attachmentUrl: '',
      isActive: true,
    });
  };

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({
          type: 'success',
          text: formData.priority !== 'NORMAL'
            ? 'Notice posted successfully and resident notification alert broadcasted!'
            : 'Notice published successfully!',
        });
        setCreateModalOpen(false);
        resetForm();
        fetchNotices();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to create notice.' });
      }
    } catch (e) {
      setStatusMessage({ type: 'error', text: 'Network error creating notice.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNotice) return;
    setSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/notices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeNotice.id,
          ...formData,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: 'Notice updated successfully!' });
        setEditModalOpen(false);
        setActiveNotice(null);
        resetForm();
        fetchNotices();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to update notice.' });
      }
    } catch (e) {
      setStatusMessage({ type: 'error', text: 'Network error updating notice.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNotice = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notice? This action cannot be undone.')) return;
    try {
      const res = await fetch(`/api/notices?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        fetchNotices();
      } else {
        alert(data.error || 'Failed to delete notice');
      }
    } catch (e) {
      alert('Error deleting notice');
    }
  };

  const handleToggleActive = async (notice: HostelNoticeItem) => {
    try {
      const res = await fetch('/api/notices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: notice.id,
          isActive: !notice.isActive,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchNotices();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openEditModal = (notice: HostelNoticeItem) => {
    setActiveNotice(notice);
    setFormData({
      title: notice.title,
      description: notice.description,
      category: notice.category,
      priority: notice.priority,
      publishedAt: notice.publishedAt ? new Date(notice.publishedAt).toISOString().split('T')[0] : '',
      expiresAt: notice.expiresAt ? new Date(notice.expiresAt).toISOString().split('T')[0] : '',
      attachmentUrl: notice.attachmentUrl || '',
      isActive: notice.isActive,
    });
    setEditModalOpen(true);
  };

  const filteredNotices = notices.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || n.category === categoryFilter;
    const matchesPriority = priorityFilter === 'ALL' || n.priority === priorityFilter;
    return matchesSearch && matchesCategory && matchesPriority;
  });

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold mb-1">
            <Megaphone className="w-3.5 h-3.5" />
            <span>Hostel Bulletin & Notice Board</span>
          </div>
          <h1 className="text-2xl font-black text-slate-800">Hostel Notices & Announcements</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Broadcast official hostel rules, mess schedules, fee deadlines, and emergency alerts to residents.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setCreateModalOpen(true);
          }}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Post New Notice</span>
        </button>
      </div>

      {statusMessage && (
        <div
          className={`flex items-center space-x-2 px-4 py-3 rounded-2xl text-xs font-bold border animate-in fade-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search notices by keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-700"
          >
            <option value="ALL">All Categories</option>
            <option value="GENERAL">General</option>
            <option value="FEE">Fee Updates</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="MESS">Mess & Food</option>
            <option value="EMERGENCY">Emergency</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-700"
          >
            <option value="ALL">All Priorities</option>
            <option value="NORMAL">Normal</option>
            <option value="IMPORTANT">Important</option>
            <option value="URGENT">Urgent Alert</option>
          </select>

          <span className="text-slate-400 text-xs px-1">
            {filteredNotices.length} {filteredNotices.length === 1 ? 'Notice' : 'Notices'}
          </span>
        </div>
      </div>

      {/* Notices List */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 text-xs">Loading notices...</div>
      ) : filteredNotices.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-400">
          <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700 text-sm">No notices match your criteria</h3>
          <p className="text-xs text-slate-400 mt-1">Post a new bulletin or adjust search/filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNotices.map((n) => {
            const isUrgent = n.priority === 'URGENT';
            const isImportant = n.priority === 'IMPORTANT';
            const isExpired = n.expiresAt && new Date(n.expiresAt) < new Date();

            return (
              <div
                key={n.id}
                className={`bg-white rounded-3xl border p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4 ${
                  !n.isActive
                    ? 'border-slate-200 opacity-60 bg-slate-50/50'
                    : isUrgent
                    ? 'border-rose-300 bg-rose-50/20'
                    : isImportant
                    ? 'border-amber-300 bg-amber-50/20'
                    : 'border-slate-200/80'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Priority Badge */}
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          isUrgent
                            ? 'bg-rose-600 text-white animate-pulse'
                            : isImportant
                            ? 'bg-amber-500 text-white'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {n.priority}
                      </span>

                      {/* Category Badge */}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {n.category}
                      </span>

                      {isExpired && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
                          EXPIRED
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleToggleActive(n)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition ${
                        n.isActive
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                      title="Click to toggle publish status"
                    >
                      {n.isActive ? 'PUBLISHED' : 'DRAFT / HIDDEN'}
                    </button>
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-sm leading-snug">{n.title}</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed whitespace-pre-line line-clamp-3">
                    {n.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatDate(n.publishedAt || n.createdAt)}</span>
                    </span>
                    {n.expiresAt && (
                      <span className="flex items-center space-x-1 text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Exp: {formatDate(n.expiresAt)}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {n.attachmentUrl && (
                      <a
                        href={n.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="View Attachment"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => openEditModal(n)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Edit Notice"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteNotice(n.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete Notice"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE NOTICE MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Post Hostel Bulletin / Notice"
        subtitle="Broadcast announcements to student residents via their portal and notification bell."
      >
        <form onSubmit={handleCreateNotice} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Notice Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. October Hostel Fee Payment Reminder"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none font-semibold text-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-700"
              >
                <option value="GENERAL">General Notice</option>
                <option value="FEE">Fee & Billing</option>
                <option value="MAINTENANCE">Maintenance / Repairs</option>
                <option value="MESS">Mess / Food Service</option>
                <option value="EMERGENCY">Emergency / Alert</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800"
              >
                <option value="NORMAL">Normal</option>
                <option value="IMPORTANT">Important (Sends Alert)</option>
                <option value="URGENT">Urgent (High Priority)</option>
              </select>
            </div>
          </div>

          {formData.priority !== 'NORMAL' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start space-x-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Automated Notification: </span>
                Since priority is set to {formData.priority}, a notification will automatically be dispatched to all student residents.
              </div>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Notice Description / Content <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Write the full message details for the hostel residents..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Publish Date</label>
              <input
                type="date"
                value={formData.publishedAt}
                onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Expiry Date (Optional)</label>
              <input
                type="date"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Attachment Link (Optional)</label>
            <input
              type="url"
              value={formData.attachmentUrl}
              onChange={(e) => setFormData({ ...formData, attachmentUrl: e.target.value })}
              placeholder="https://example.com/hostel-menu.pdf"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
            />
          </div>

          <div>
            <label className="flex items-center space-x-2.5 cursor-pointer p-2 bg-slate-50 rounded-xl border border-slate-200">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="font-bold text-slate-700">Publish immediately to Student Portal</span>
            </label>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center space-x-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Publishing...' : 'Publish Notice'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT NOTICE MODAL */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setActiveNotice(null);
        }}
        title="Edit Notice"
        subtitle="Update existing hostel bulletin details."
      >
        <form onSubmit={handleEditNotice} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Notice Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none font-semibold text-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-700"
              >
                <option value="GENERAL">General Notice</option>
                <option value="FEE">Fee & Billing</option>
                <option value="MAINTENANCE">Maintenance / Repairs</option>
                <option value="MESS">Mess / Food Service</option>
                <option value="EMERGENCY">Emergency / Alert</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800"
              >
                <option value="NORMAL">Normal</option>
                <option value="IMPORTANT">Important</option>
                <option value="URGENT">Urgent Alert</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Notice Description / Content <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Publish Date</label>
              <input
                type="date"
                value={formData.publishedAt}
                onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Expiry Date (Optional)</label>
              <input
                type="date"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Attachment Link (Optional)</label>
            <input
              type="url"
              value={formData.attachmentUrl}
              onChange={(e) => setFormData({ ...formData, attachmentUrl: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
            />
          </div>

          <div>
            <label className="flex items-center space-x-2.5 cursor-pointer p-2 bg-slate-50 rounded-xl border border-slate-200">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="font-bold text-slate-700">Notice is Active / Visible to Students</span>
            </label>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setEditModalOpen(false);
                setActiveNotice(null);
              }}
              className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center space-x-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{submitting ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

