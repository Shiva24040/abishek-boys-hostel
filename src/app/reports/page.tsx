'use client';

import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Building,
  CreditCard,
  Users,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import Badge from '@/components/common/Badge';
import { formatCurrency, formatDate } from '@/lib/formatters';

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('October 2026');
  const [reportType, setReportType] = useState<'OCCUPANCY' | 'FEES' | 'STUDENTS'>('OCCUPANCY');

  useEffect(() => {
    fetchReport();
  }, [selectedMonth]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?month=${encodeURIComponent(selectedMonth)}`);
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

  const handlePrint = () => {
    window.print();
  };

  const exportCSV = () => {
    if (!data) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    let filename = `Report_${reportType}_${selectedMonth.replace(' ', '_')}.csv`;

    if (reportType === 'OCCUPANCY') {
      csvContent += 'Room Number,Floor,Total Beds,Occupied Beds,Available Beds,Current Occupants\n';
      data.occupancy.roomDetails.forEach((r: any) => {
        csvContent += `"${r.roomNumber}",${r.floor},${r.totalBeds},${r.occupiedBeds},${r.availableBeds},"${r.occupants || 'None'}"\n`;
      });
    } else if (reportType === 'FEES') {
      csvContent += 'Resident Name,Student ID,Room,Bed,Fee Expected,Fee Paid,Payment Status,Payment Date,Method\n';
      data.fees.paymentRecords.forEach((p: any) => {
        csvContent += `"${p.studentName}","${p.studentId}","${p.room}","${p.bed}",${p.amount},${p.amountPaid},"${p.status}","${p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : 'Pending'}","${p.method}"\n`;
      });
    } else {
      csvContent += 'College Name,Resident Count\n';
      data.students.collegeBreakdown.forEach((c: any) => {
        csvContent += `"${c.name}",${c.count}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading || !data) {
    return <div className="p-12 text-center text-slate-400 text-xs">Generating report data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with Print & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Management Reports</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit hostel occupancy, revenue collections, and student admissions with 1-click export.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Month selector */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3.5 py-2 text-xs font-bold bg-white border border-slate-300 rounded-xl shadow-sm"
          >
            <option value="October 2026">October 2026</option>
            <option value="September 2026">September 2026</option>
            <option value="August 2026">August 2026</option>
          </select>

          <button
            onClick={handlePrint}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print PDF</span>
          </button>

          <button
            onClick={exportCSV}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-emerald-600/20"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV / Excel</span>
          </button>
        </div>
      </div>

      {/* Report Switcher Tabs */}
      <div className="flex items-center space-x-2 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-sm no-print">
        {[
          { id: 'OCCUPANCY', label: 'Occupancy Report', icon: Building },
          { id: 'FEES', label: 'Fee Collection Report', icon: CreditCard },
          { id: 'STUDENTS', label: 'Resident Admissions Report', icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = reportType === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Printable Report Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
        <div className="border-b border-slate-200 pb-5 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
              Abhishek Boys Hostel — Official Audit Report
            </h2>
            <div className="text-xs text-slate-500 mt-1">
              Plot 42, Knowledge Park III, Greater Noida, UP • Phone: +91 98765 43210
            </div>
            <div className="text-xs font-semibold text-blue-600 mt-1">
              Audit Period: {selectedMonth} • Generated on: {new Date().toLocaleDateString('en-IN')}
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold bg-slate-100 px-3 py-1 rounded-lg text-slate-700">
              AUDIT-{selectedMonth.replace(' ', '-').toUpperCase()}
            </span>
          </div>
        </div>

        {/* 1. OCCUPANCY REPORT */}
        {reportType === 'OCCUPANCY' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Total Rooms</span>
                <div className="text-2xl font-black text-slate-800 mt-1">
                  {data.occupancy.totalRooms}
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Bed Capacity</span>
                <div className="text-2xl font-black text-slate-800 mt-1">
                  {data.occupancy.totalBeds}
                </div>
              </div>
              <div className="p-4 bg-indigo-50 rounded-2xl">
                <span className="text-[11px] font-bold text-indigo-500 uppercase">Occupied Beds</span>
                <div className="text-2xl font-black text-indigo-700 mt-1">
                  {data.occupancy.occupiedBeds} ({data.occupancy.rate}%)
                </div>
              </div>
              <div className="p-4 bg-emerald-50 rounded-2xl">
                <span className="text-[11px] font-bold text-emerald-500 uppercase">Available Beds</span>
                <div className="text-2xl font-black text-emerald-700 mt-1">
                  {data.occupancy.availableBeds}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Room No</th>
                    <th className="py-3 px-4">Floor</th>
                    <th className="py-3 px-4">Total Beds</th>
                    <th className="py-3 px-4">Occupied</th>
                    <th className="py-3 px-4">Available</th>
                    <th className="py-3 px-4">Current Resident(s)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.occupancy.roomDetails.map((r: any) => (
                    <tr key={r.roomNumber}>
                      <td className="py-3 px-4 font-bold text-slate-800">Room {r.roomNumber}</td>
                      <td className="py-3 px-4 text-slate-600">Floor {r.floor}</td>
                      <td className="py-3 px-4 font-medium text-slate-700">{r.totalBeds}</td>
                      <td className="py-3 px-4 font-bold text-indigo-600">{r.occupiedBeds}</td>
                      <td className="py-3 px-4 font-bold text-emerald-600">{r.availableBeds}</td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {r.occupants || <span className="text-slate-400 italic">All Vacant</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. FEE REPORT */}
        {reportType === 'FEES' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Expected Rent</span>
                <div className="text-2xl font-black text-slate-800 mt-1">
                  {formatCurrency(data.fees.totalExpected)}
                </div>
              </div>
              <div className="p-4 bg-emerald-50 rounded-2xl">
                <span className="text-[11px] font-bold text-emerald-600 uppercase">Collected</span>
                <div className="text-2xl font-black text-emerald-700 mt-1">
                  {formatCurrency(data.fees.totalCollected)}
                </div>
                <div className="text-[10px] text-emerald-600 mt-0.5">
                  {data.fees.collectionRate}% Realized
                </div>
              </div>
              <div className="p-4 bg-amber-50 rounded-2xl">
                <span className="text-[11px] font-bold text-amber-600 uppercase">Pending Rent</span>
                <div className="text-2xl font-black text-amber-700 mt-1">
                  {formatCurrency(data.fees.totalPending)}
                </div>
              </div>
              <div className="p-4 bg-rose-50 rounded-2xl">
                <span className="text-[11px] font-bold text-rose-500 uppercase">Overdue Amount</span>
                <div className="text-2xl font-black text-rose-700 mt-1">
                  {formatCurrency(data.fees.overdueAmount)}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Resident</th>
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Room / Bed</th>
                    <th className="py-3 px-4">Fee Amount</th>
                    <th className="py-3 px-4">Amount Paid</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Payment Date</th>
                    <th className="py-3 px-4">Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.fees.paymentRecords.map((p: any, idx: number) => (
                    <tr key={idx}>
                      <td className="py-3 px-4 font-bold text-slate-800">{p.studentName}</td>
                      <td className="py-3 px-4 text-slate-500">{p.studentId}</td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        Room {p.room} ({p.bed})
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">{formatCurrency(p.amount)}</td>
                      <td className="py-3 px-4 font-bold text-emerald-600">
                        {formatCurrency(p.amountPaid)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge status={p.status} />
                      </td>
                      <td className="py-3 px-4 text-slate-600">{formatDate(p.paymentDate)}</td>
                      <td className="py-3 px-4 text-slate-700">{p.method}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. STUDENT REPORT */}
        {reportType === 'STUDENTS' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl">
                <span className="text-[11px] font-bold text-slate-400 uppercase">
                  Total Enrolled
                </span>
                <div className="text-2xl font-black text-slate-800 mt-1">
                  {data.students.total}
                </div>
              </div>
              <div className="p-4 bg-emerald-50 rounded-2xl">
                <span className="text-[11px] font-bold text-emerald-600 uppercase">
                  Active Staying
                </span>
                <div className="text-2xl font-black text-emerald-700 mt-1">
                  {data.students.active}
                </div>
              </div>
              <div className="p-4 bg-amber-50 rounded-2xl">
                <span className="text-[11px] font-bold text-amber-600 uppercase">
                  Notice Period
                </span>
                <div className="text-2xl font-black text-amber-700 mt-1">
                  {data.students.notice}
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                <span className="text-[11px] font-bold text-slate-400 uppercase">
                  Historical Left
                </span>
                <div className="text-2xl font-black text-slate-600 mt-1">
                  {data.students.left}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-800">
                Resident Distribution by College / University
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data.students.collegeBreakdown.map((c: any) => (
                  <div
                    key={c.name}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                  >
                    <span className="text-xs font-bold text-slate-800">{c.name}</span>
                    <span className="px-3 py-1 bg-white rounded-xl text-xs font-bold text-blue-600 border border-slate-200">
                      {c.count} Student{c.count === 1 ? '' : 's'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
