import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { Card, ProgressBar, progressColor, StatusBadge, PriorityBadge, DueLabel, ActivityBadge } from '../components/ui';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function PersonDetailPage() {
  const { userId } = useParams();
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [tasks, setTasks] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    load();
  }, [userId]);

  async function load() {
    try {
      const [s, t, u] = await Promise.all([
        api.getUserSummary(userId),
        api.getTasks(userId),
        api.getDailyUpdates(userId),
      ]);
      setSummary(s);
      setTasks(t);
      setUpdates(u);
    } catch (err) {
      setError(err.message);
    }
  }

  if (error) return <Layout><div className="text-rose-600">{error}</div></Layout>;
  if (!summary || !tasks) return <Layout><div className="text-slate-400">Loading...</div></Layout>;

  const isSelf = user && String(user.id) === String(userId);
  const completed = tasks.filter((t) => t.status === 'COMPLETED');
  const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS');
  const notStarted = tasks.filter((t) => t.status === 'NOT_STARTED');

  return (
    <Layout>
      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-slate-800">{summary.display_name}</h1>
        <ActivityBadge status={summary.activity_status} />
      </div>
      <p className="text-slate-400 text-sm mb-6">
        {isSelf ? 'This is your progress — head to My Tasks to make edits.' : "Read-only view — only " + summary.display_name + " can edit these."}
        {isSelf && (
          <> <Link to="/my-tasks" className="text-brand-600 font-medium">Go to My Tasks →</Link></>
        )}
      </p>

      <Card className="p-6 mb-6">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl font-bold text-slate-800">{summary.overall_progress}%</span>
          <span className="text-sm text-slate-400">overall progress</span>
        </div>
        <ProgressBar value={summary.overall_progress} colorClass={progressColor(summary.overall_progress)} />
        <div className="grid grid-cols-3 gap-4 mt-5 text-center">
          <Stat label="Completed" value={summary.completed} tone="emerald" />
          <Stat label="In Progress" value={summary.in_progress} tone="amber" />
          <Stat label="Not Started" value={summary.not_started} tone="slate" />
        </div>
      </Card>

      <TaskSection title="In Progress" icon="●" tasks={inProgress} />
      <TaskSection title="Completed" icon="✓" tasks={completed} />
      <TaskSection title="Not Started" icon="○" tasks={notStarted} />

      <Card className="p-6 mt-6">
        <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-4">Recent Daily Updates</div>
        {updates.length === 0 && <div className="text-sm text-slate-400">No updates yet.</div>}
        <div className="space-y-4">
          {updates.slice(0, 5).map((u) => (
            <div key={u.id} className="text-sm border-l-2 border-brand-200 pl-3">
              <div className="text-xs text-slate-400 mb-0.5">{new Date(u.created_at).toLocaleString()} {u.task_name_snapshot && `· ${u.task_name_snapshot}`}</div>
              <div className="text-slate-700">{u.what_completed}</div>
              {u.tomorrow_plan && <div className="text-slate-400 text-xs mt-0.5">Tomorrow: {u.tomorrow_plan}</div>}
            </div>
          ))}
        </div>
      </Card>
    </Layout>
  );
}

function Stat({ label, value, tone }) {
  const toneClass = { emerald: 'text-emerald-600', amber: 'text-amber-600', slate: 'text-slate-700' }[tone];
  return (
    <div>
      <div className={`text-xl font-bold ${toneClass}`}>{value}</div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  );
}

function TaskSection({ title, icon, tasks }) {
  if (tasks.length === 0) return null;
  return (
    <div className="mb-6">
      <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-2">{icon} {title} ({tasks.length})</div>
      <div className="space-y-2">
        {tasks.map((t) => (
          <Card key={t.id} className="p-4 flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-medium text-slate-800">{t.name}</span>
                <PriorityBadge priority={t.priority} />
              </div>
              <p className="text-xs text-slate-500 truncate">{t.description}</p>
            </div>
            <div className="w-36 shrink-0 text-right">
              <div className="text-sm font-semibold text-slate-700">{t.progress}%</div>
              <ProgressBar value={t.progress} colorClass={progressColor(t.progress)} />
              <div className="mt-1"><DueLabel dueDate={t.due_date} status={t.status} /></div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
