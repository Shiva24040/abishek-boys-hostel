'use client';

import React, { useState, useEffect } from 'react';
import {
  ScrollText,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  PhoneCall,
} from 'lucide-react';
import Modal from '@/components/common/Modal';

export default function RulesPage() {
  const [rulesText, setRulesText] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editText, setEditText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.success && data.settings) {
        setRulesText(data.settings.rulesText || '');
        setEditText(data.settings.rulesText || '');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rulesText: editText }),
      });
      const data = await res.json();
      if (data.success) {
        setRulesText(editText);
        setModalOpen(false);
      } else {
        alert(data.error || 'Failed to update rules');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const rulesList = rulesText.split('\n').filter((r) => r.trim().length > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Hostel Rules & Code of Conduct</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            General hostel code of conduct, gate timings, and resident discipline guidelines.
          </p>
        </div>

        <button
          onClick={() => {
            setEditText(rulesText);
            setModalOpen(true);
          }}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-600/20"
        >
          <Edit2 className="w-4 h-4" />
          <span>Edit Rules</span>
        </button>
      </div>

      {/* Highlights Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center space-x-3">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Main Gate Timings</span>
            <div className="text-sm font-bold text-slate-800">Closes at 10:00 PM Sharp</div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center space-x-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Substance Abuse</span>
            <div className="text-sm font-bold text-slate-800">Zero Tolerance Policy</div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center space-x-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Warden Helpline</span>
            <div className="text-sm font-bold text-slate-800">+91 98765 43211 (24x7)</div>
          </div>
        </div>
      </div>

      {/* Rules Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-4">
          <ScrollText className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-slate-800">Standard Hostel Regulations</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading regulations...</div>
        ) : (
          <div className="space-y-3.5">
            {rulesList.map((rule, idx) => (
              <div
                key={idx}
                className="flex items-start space-x-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100/80"
              >
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <p className="text-xs text-slate-700 leading-relaxed pt-0.5">{rule}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Rules Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Edit Hostel Rules"
        subtitle="One rule per line. These will immediately update on all resident devices."
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Hostel Rules Text
            </label>
            <textarea
              rows={12}
              required
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full text-xs font-mono p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 leading-relaxed"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save & Publish Rules'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
