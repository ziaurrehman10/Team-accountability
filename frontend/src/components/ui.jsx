export function ProgressBar({ value, colorClass = 'bg-brand-500' }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${colorClass} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function progressColor(pct) {
  if (pct >= 75) return 'bg-emerald-500';
  if (pct >= 45) return 'bg-amber-500';
  return 'bg-rose-500';
}

const STATUS_STYLES = {
  NOT_STARTED: { label: 'Not Started', dot: 'bg-slate-400', text: 'text-slate-600', bg: 'bg-slate-100', icon: '○' },
  IN_PROGRESS: { label: 'In Progress', dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50', icon: '●' },
  COMPLETED: { label: 'Completed', dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', icon: '✓' },
};

export function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.NOT_STARTED;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      <span>{s.icon}</span>
      {s.label}
    </span>
  );
}

export function statusMeta(status) {
  return STATUS_STYLES[status] || STATUS_STYLES.NOT_STARTED;
}

const ACTIVITY_STYLES = {
  ACTIVE: { label: 'Working', emoji: '🟢', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  NEEDS_ATTENTION: { label: 'Behind', emoji: '🟡', text: 'text-amber-700', bg: 'bg-amber-50' },
  NO_ACTIVITY: { label: 'No activity', emoji: '🔴', text: 'text-rose-700', bg: 'bg-rose-50' },
};

export function ActivityBadge({ status }) {
  const s = ACTIVITY_STYLES[status] || ACTIVITY_STYLES.NO_ACTIVITY;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
      <span>{s.emoji}</span>
      {s.label}
    </span>
  );
}

const PRIORITY_STYLES = {
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-blue-50 text-blue-700',
  HIGH: 'bg-rose-50 text-rose-700',
};

export function PriorityBadge({ priority }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${PRIORITY_STYLES[priority] || PRIORITY_STYLES.MEDIUM}`}>
      {priority}
    </span>
  );
}

export function Card({ children, className = '', ...rest }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr + 'T00:00:00');
  return Math.round((due - today) / (1000 * 60 * 60 * 24));
}

export function DueLabel({ dueDate, status }) {
  if (!dueDate) return <span className="text-slate-400 text-xs">No due date</span>;
  if (status === 'COMPLETED') return <span className="text-emerald-600 text-xs font-medium">Completed</span>;
  const diff = daysUntil(dueDate);
  if (diff < 0) return <span className="text-rose-600 text-xs font-semibold">⚠ Overdue ({dueDate})</span>;
  if (diff === 0) return <span className="text-amber-600 text-xs font-semibold">Due Today</span>;
  if (diff === 1) return <span className="text-amber-600 text-xs font-medium">Due Tomorrow</span>;
  return <span className="text-slate-500 text-xs">Due {dueDate}</span>;
}
