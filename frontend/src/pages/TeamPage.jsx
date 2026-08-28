import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Card, ProgressBar, progressColor, ActivityBadge, DueLabel } from '../components/ui';
import { api } from '../api/client';

export default function TeamPage() {
  const [data, setData] = useState(null);
  const [tasksByUser, setTasksByUser] = useState({});
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const [dashboard, allTasks] = await Promise.all([api.getDashboard(), api.getTasks()]);
      setData(dashboard);
      const grouped = {};
      for (const t of allTasks) {
        (grouped[t.owner_id] ||= []).push(t);
      }
      setTasksByUser(grouped);
    } catch (err) {
      setError(err.message);
    }
  }

  if (error) return <Layout><div className="text-rose-600">{error}</div></Layout>;
  if (!data) return <Layout><div className="text-slate-400">Loading team...</div></Layout>;

  const today = new Date().toISOString().slice(0, 10);

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Team View</h1>
      <p className="text-slate-400 text-sm mb-6">Everyone's progress, at a glance. Click a person for full details.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {data.people.map((p) => {
          const tasks = tasksByUser[p.id] || [];
          const dueTodayOrOverdue = tasks.filter(
            (t) => t.status !== 'COMPLETED' && t.due_date && t.due_date <= today
          );
          return (
            <Card key={p.id} className="p-5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/person/${p.id}`)}>
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold text-slate-800">{p.display_name}</div>
                <ActivityBadge status={p.activity_status} />
              </div>

              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-xl font-bold text-slate-800">{p.overall_progress}%</span>
                <span className="text-xs text-slate-400">overall progress</span>
              </div>
              <ProgressBar value={p.overall_progress} colorClass={progressColor(p.overall_progress)} />

              <div className="flex gap-4 mt-3 text-xs text-slate-500">
                <span>✓ Completed: <b className="text-slate-700">{p.completed}</b></span>
                <span>● In Progress: <b className="text-slate-700">{p.in_progress}</b></span>
                <span>○ Not Started: <b className="text-slate-700">{p.not_started}</b></span>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 text-xs space-y-1">
                <div className="text-slate-400">Current Task: <span className="text-slate-700 font-medium">{p.current_task || '—'}</span></div>
                <div className="text-slate-400">Next Task: <span className="text-slate-700 font-medium">{p.next_task || '—'}</span></div>
              </div>

              {dueTodayOrOverdue.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                  {dueTodayOrOverdue.slice(0, 3).map((t) => (
                    <div key={t.id} className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 truncate">{t.name}</span>
                      <DueLabel dueDate={t.due_date} status={t.status} />
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </Layout>
  );
}
