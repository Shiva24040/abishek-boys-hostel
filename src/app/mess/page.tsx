'use client';

import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
  Edit2,
  Calendar,
  Sparkles,
  Coffee,
  CheckCircle2,
  Sun,
  Moon,
  Clock,
} from 'lucide-react';
import Modal from '@/components/common/Modal';

export default function MessPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState<{ isOpen: boolean; menu: any | null }>({
    isOpen: false,
    menu: null,
  });

  const [form, setForm] = useState({
    breakfast: '',
    lunch: '',
    snacks: '',
    dinner: '',
    isSpecialDay: false,
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMess();
  }, []);

  const fetchMess = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/mess');
      const d = await res.json();
      if (d.success) {
        setData(d);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (menu: any) => {
    setForm({
      breakfast: menu.breakfast,
      lunch: menu.lunch,
      snacks: menu.snacks,
      dinner: menu.dinner,
      isSpecialDay: menu.isSpecialDay,
      notes: menu.notes || '',
    });
    setEditModal({ isOpen: true, menu });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal.menu) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/mess', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editModal.menu.id,
          ...form,
        }),
      });
      const resData = await res.json();
      if (resData.success) {
        setEditModal({ isOpen: false, menu: null });
        fetchMess();
      } else {
        alert(resData.error || 'Failed to update menu');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !data) {
    return <div className="p-12 text-center text-slate-400 text-xs">Loading mess schedule...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Hostel Mess & Dining</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            4 daily nutritious meals (Breakfast, Lunch, Evening Snacks, and Dinner) prepared fresh in-house.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-500 bg-white px-3.5 py-2 rounded-xl border border-slate-200">
          <Clock className="w-4 h-4 text-blue-600" />
          <span>Breakfast: 7:30 AM | Lunch: 12:30 PM | Snacks: 5:00 PM | Dinner: 8:00 PM</span>
        </div>
      </div>

      {/* Today & Tomorrow Highlight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Today's Menu */}
        <div className="bg-gradient-to-br from-[#0B192C] to-[#1E3E62] text-white p-6 rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center space-x-2">
              <Sun className="w-5 h-5 text-amber-300" />
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
                  Today&apos;s Menu
                </span>
                <h3 className="text-lg font-black">{data.todayDayName}</h3>
              </div>
            </div>
            {data.todayMenu?.isSpecialDay && (
              <span className="px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-300/30">
                Special Feast
              </span>
            )}
          </div>

          {data.todayMenu && (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 space-y-1">
                <span className="text-[10px] font-bold text-blue-300 uppercase">🥞 Breakfast</span>
                <p className="text-slate-100">{data.todayMenu.breakfast}</p>
              </div>
              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 space-y-1">
                <span className="text-[10px] font-bold text-amber-300 uppercase">🍛 Lunch</span>
                <p className="text-slate-100">{data.todayMenu.lunch}</p>
              </div>
              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 space-y-1">
                <span className="text-[10px] font-bold text-orange-300 uppercase">☕ Snacks</span>
                <p className="text-slate-100">{data.todayMenu.snacks}</p>
              </div>
              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 space-y-1">
                <span className="text-[10px] font-bold text-indigo-300 uppercase">🍲 Dinner</span>
                <p className="text-slate-100">{data.todayMenu.dinner}</p>
              </div>
            </div>
          )}
        </div>

        {/* Tomorrow's Menu */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Moon className="w-5 h-5 text-indigo-500" />
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Tomorrow&apos;s Menu
                </span>
                <h3 className="text-lg font-black text-slate-800">{data.tomorrowDayName}</h3>
              </div>
            </div>
            {data.tomorrowMenu?.isSpecialDay && (
              <span className="px-2.5 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold">
                Special Day
              </span>
            )}
          </div>

          {data.tomorrowMenu && (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">🥞 Breakfast</span>
                <p className="text-slate-700">{data.tomorrowMenu.breakfast}</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">🍛 Lunch</span>
                <p className="text-slate-700">{data.tomorrowMenu.lunch}</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">☕ Snacks</span>
                <p className="text-slate-700">{data.tomorrowMenu.snacks}</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">🍲 Dinner</span>
                <p className="text-slate-700">{data.tomorrowMenu.dinner}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full Weekly Schedule Grid */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800">Weekly Meal Roster (Mon - Sun)</h2>
          <span className="text-xs text-slate-400">Click &quot;Edit&quot; on any day to modify dishes</span>
        </div>

        <div className="divide-y divide-slate-100">
          {data.weeklyMenu?.map((m: any) => {
            const isToday = m.dayOfWeek === data.todayDayName;

            return (
              <div
                key={m.id}
                className={`p-5 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                  isToday ? 'bg-blue-50/40' : 'hover:bg-slate-50/50'
                }`}
              >
                <div className="w-40 shrink-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-black text-slate-800 text-sm">{m.dayOfWeek}</span>
                    {isToday && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                        Today
                      </span>
                    )}
                  </div>
                  {m.isSpecialDay && (
                    <span className="text-[11px] text-amber-600 font-bold block mt-0.5">
                      ★ Special Day
                    </span>
                  )}
                </div>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">
                      Breakfast
                    </span>
                    <span className="text-slate-700 mt-0.5 block">{m.breakfast}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">
                      Lunch
                    </span>
                    <span className="text-slate-700 mt-0.5 block">{m.lunch}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">
                      Snacks
                    </span>
                    <span className="text-slate-700 mt-0.5 block">{m.snacks}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">
                      Dinner
                    </span>
                    <span className="text-slate-700 mt-0.5 block">{m.dinner}</span>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <button
                    onClick={() => openEdit(m)}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Menu</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, menu: null })}
        title={`Edit ${editModal.menu?.dayOfWeek} Meal Schedule`}
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              🥞 Breakfast Dishes
            </label>
            <input
              type="text"
              required
              value={form.breakfast}
              onChange={(e) => setForm({ ...form, breakfast: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">🍛 Lunch Dishes</label>
            <input
              type="text"
              required
              value={form.lunch}
              onChange={(e) => setForm({ ...form, lunch: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">☕ Evening Snacks</label>
            <input
              type="text"
              required
              value={form.snacks}
              onChange={(e) => setForm({ ...form, snacks: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">🍲 Dinner Dishes</label>
            <input
              type="text"
              required
              value={form.dinner}
              onChange={(e) => setForm({ ...form, dinner: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="isSpecial"
              checked={form.isSpecialDay}
              onChange={(e) => setForm({ ...form, isSpecialDay: e.target.checked })}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isSpecial" className="text-xs font-bold text-slate-700 cursor-pointer">
              Mark as Special Feast Day
            </label>
          </div>

          <div className="flex justify-end space-x-2 pt-3">
            <button
              type="button"
              onClick={() => setEditModal({ isOpen: false, menu: null })}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Update Menu'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
