'use client';

import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Plus,
  TrendingDown,
  Calendar,
  Zap,
  Droplet,
  Utensils,
  Wrench,
  Wifi,
  Sparkles,
  Users,
  Search,
} from 'lucide-react';
import Modal from '@/components/common/Modal';
import { formatCurrency, formatDate } from '@/lib/formatters';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [categorySummary, setCategorySummary] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form
  const [form, setForm] = useState({
    title: '',
    category: 'ELECTRICITY',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    recordedBy: 'Abhishek Sharma',
  });

  useEffect(() => {
    fetchExpenses();
  }, [categoryFilter]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      let url = `/api/expenses?category=${categoryFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setExpenses(data.expenses);
        setTotalAmount(data.totalAmount);
        setCategorySummary(data.categorySummary);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        setForm({
          title: '',
          category: 'ELECTRICITY',
          amount: '',
          date: new Date().toISOString().split('T')[0],
          description: '',
          recordedBy: 'Abhishek Sharma',
        });
        fetchExpenses();
      } else {
        alert(data.error || 'Failed to record expense');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'ELECTRICITY':
        return <Zap className="w-4 h-4 text-amber-500" />;
      case 'WATER':
        return <Droplet className="w-4 h-4 text-blue-500" />;
      case 'FOOD':
        return <Utensils className="w-4 h-4 text-orange-500" />;
      case 'MAINTENANCE':
        return <Wrench className="w-4 h-4 text-slate-500" />;
      case 'INTERNET':
        return <Wifi className="w-4 h-4 text-indigo-500" />;
      case 'CLEANING':
        return <Sparkles className="w-4 h-4 text-emerald-500" />;
      case 'SALARIES':
        return <Users className="w-4 h-4 text-rose-500" />;
      default:
        return <Receipt className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Hostel Operational Expenses</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log overhead expenditures: electricity, rations, housekeeping, high-speed fiber, and repairs.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Record Expense</span>
        </button>
      </div>

      {/* Total & Category Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm col-span-2 sm:col-span-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Total Expenses</div>
          <div className="text-2xl font-black text-rose-600 mt-1">
            {formatCurrency(totalAmount)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">{expenses.length} entries recorded</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-semibold">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Electricity</span>
          </div>
          <div className="text-xl font-bold text-slate-800 mt-1">
            {formatCurrency(categorySummary['ELECTRICITY'] || 0)}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-semibold">
            <Utensils className="w-4 h-4 text-orange-500" />
            <span>Mess Food Rations</span>
          </div>
          <div className="text-xl font-bold text-slate-800 mt-1">
            {formatCurrency(categorySummary['FOOD'] || 0)}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-semibold">
            <Wifi className="w-4 h-4 text-indigo-500" />
            <span>Commercial Fiber</span>
          </div>
          <div className="text-xl font-bold text-slate-800 mt-1">
            {formatCurrency(categorySummary['INTERNET'] || 0)}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm overflow-x-auto">
        {[
          { id: 'ALL', label: 'All Categories' },
          { id: 'ELECTRICITY', label: 'Electricity' },
          { id: 'FOOD', label: 'Food & Rations' },
          { id: 'INTERNET', label: 'Internet' },
          { id: 'WATER', label: 'Water' },
          { id: 'MAINTENANCE', label: 'Maintenance' },
          { id: 'CLEANING', label: 'Housekeeping' },
          { id: 'SALARIES', label: 'Salaries' },
        ].map((c) => (
          <button
            key={c.id}
            onClick={() => setCategoryFilter(c.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              categoryFilter === c.id
                ? 'bg-navy-950 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading expenses...</div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">No expenses in this category.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Expense Title</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Recorded By</th>
                  <th className="px-6 py-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2.5">
                        <div className="p-2 rounded-xl bg-slate-100">{getCategoryIcon(e.category)}</div>
                        <span className="font-bold text-slate-800">{e.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {e.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-black text-rose-600 text-sm">
                      {formatCurrency(e.amount)}
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{formatDate(e.date)}</td>
                    <td className="px-6 py-4 text-slate-700">{e.recordedBy}</td>
                    <td className="px-6 py-4 text-slate-400 max-w-[200px] truncate">
                      {e.description || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Expense Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Record Hostel Expense"
        subtitle="Log bill payments, groceries, and maintenance invoices"
      >
        <form onSubmit={handleRecordExpense} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Expense Item Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. October Commercial Electricity Bill"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="ELECTRICITY">Electricity Bill</option>
                <option value="WATER">Water / RO Maintenance</option>
                <option value="FOOD">Food Rations & Vegetables</option>
                <option value="INTERNET">Internet Broadband Leased Line</option>
                <option value="MAINTENANCE">Plumber / Electrician Repairs</option>
                <option value="CLEANING">Housekeeping Supplies</option>
                <option value="SALARIES">Staff Wages</option>
                <option value="OTHER">Other Expense</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Amount Paid (₹) *</label>
              <input
                type="number"
                required
                placeholder="25000"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Payment Date</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Authorized By</label>
              <input
                type="text"
                value={form.recordedBy}
                onChange={(e) => setForm({ ...form, recordedBy: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description / Invoice Reference
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Paid online via Net Banking, Transaction Ref: 8930491823"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
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
              disabled={submitting || !form.title || !form.amount}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md disabled:opacity-50"
            >
              {submitting ? 'Recording...' : 'Save Expense'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
