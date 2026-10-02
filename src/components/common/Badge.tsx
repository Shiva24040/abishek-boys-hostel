import React from 'react';

interface BadgeProps {
  status?: string;
  variant?: 'purple' | 'blue' | 'green' | 'red' | 'amber' | 'gray' | 'emerald' | 'rose' | string;
  size?: 'sm' | 'md';
  className?: string;
  children?: React.ReactNode;
}

export default function Badge({ status, variant, size = 'sm', className = '', children }: BadgeProps) {
  let styles = 'bg-slate-100 text-slate-700 border-slate-200';

  if (variant) {
    switch (variant) {
      case 'purple':
        styles = 'bg-purple-50 text-purple-700 border-purple-200';
        break;
      case 'blue':
        styles = 'bg-blue-50 text-blue-700 border-blue-200';
        break;
      case 'green':
      case 'emerald':
        styles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      case 'red':
      case 'rose':
        styles = 'bg-rose-50 text-rose-700 border-rose-200';
        break;
      case 'amber':
        styles = 'bg-amber-50 text-amber-700 border-amber-200';
        break;
      case 'gray':
        styles = 'bg-slate-100 text-slate-700 border-slate-200';
        break;
      default:
        styles = 'bg-slate-100 text-slate-700 border-slate-200';
    }
  } else {
    const norm = (status || '').toUpperCase().trim();

    // Fee & Payment status
    if (norm === 'PAID') {
      styles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (norm === 'PENDING') {
      styles = 'bg-amber-50 text-amber-700 border-amber-200';
    } else if (norm === 'OVERDUE') {
      styles = 'bg-rose-50 text-rose-700 border-rose-200';
    } else if (norm === 'PARTIALLY_PAID') {
      styles = 'bg-sky-50 text-sky-700 border-sky-200';
    }
    // Occupancy status
    else if (norm === 'OCCUPIED') {
      styles = 'bg-slate-800 text-white border-slate-700';
    } else if (norm === 'AVAILABLE') {
      styles = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
    // Student status
    else if (norm === 'ACTIVE') {
      styles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (norm === 'NOTICE_PERIOD') {
      styles = 'bg-amber-50 text-amber-700 border-amber-200';
    } else if (norm === 'LEFT') {
      styles = 'bg-zinc-100 text-zinc-600 border-zinc-200';
    }
    // Complaint status
    else if (norm === 'OPEN') {
      styles = 'bg-amber-50 text-amber-700 border-amber-200';
    } else if (norm === 'IN_PROGRESS') {
      styles = 'bg-indigo-50 text-indigo-700 border-indigo-200';
    } else if (norm === 'RESOLVED') {
      styles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    // Complaint Priority
    else if (norm === 'LOW') {
      styles = 'bg-slate-100 text-slate-700 border-slate-200';
    } else if (norm === 'MEDIUM') {
      styles = 'bg-blue-50 text-blue-700 border-blue-200';
    } else if (norm === 'HIGH') {
      styles = 'bg-amber-100 text-amber-800 border-amber-300';
    } else if (norm === 'EMERGENCY' || norm === 'URGENT') {
      styles = 'bg-red-100 text-red-800 border-red-300';
    }
    // Receipt status
    else if (norm === 'APPROVED') {
      styles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (norm === 'REJECTED') {
      styles = 'bg-rose-50 text-rose-700 border-rose-200';
    }
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm font-medium';
  const label = children !== undefined ? children : (status || '').toUpperCase().trim().replace(/_/g, ' ');

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${sizeClasses} ${styles} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
      {label}
    </span>
  );
}

