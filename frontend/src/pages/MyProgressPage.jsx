import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { Card, ProgressBar, progressColor } from '../components/ui';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function MyProgressPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState(null);
  const [updates, setUpdates] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [taskId, setTaskId] = useState('');
  const [whatCompleted, setWhatCompleted] = useState('');
  const [workNote, setWorkNote] = useState('');
  const [tomorrowPlan, setTomorrowPlan] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const [t, u] = await Promise.all([api.getMyTasks(), api.getDailyUpdates(user.id)]);
      setTasks(t);
      setUpdates(u);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!whatCompleted.trim()) {
      setError('Please describe what you completed today.');
      return;
    }
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const task = tasks.find((t) => String(t.id) === String(taskId));
      await api.createDailyUpdate({
        task_id: task ? task.id : null,
        task_name_snapshot: task ? task.name : '',
        what_completed: whatCompleted,
        work_note: workNote,
        tomorrow_plan: tomorrowPlan,
      });
      setWhatCompleted('');
      setWorkNote('');
      setTomorrowPlan('');
      setTaskId('');
      setSuccess('Daily update logged.');
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (error && !tasks) return <Layout><div className="text-rose-600">{error}</div></Layout>;
  if (!tasks || !updates) return <Layout><div className="text-slate-400">Loading...</div></Layout>;

  const overall = tasks.length ? Math.round(tasks.reduce((s, t) => s + t.progress, 0) / tasks.length) : 0;

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-slate-800 mb-1">My Progress</h1>
      <p className="text-slate-400 text-sm mb-6">Log what you worked on today so the team can see your activity.</p>

      <Card className="p-6 mb-6">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-2xl font-bold text-slate-800">{overall}%</span>
          <span className="text-sm text-slate-400">your overall progress</span>
        </div>
        <ProgressBar value={overall} colorClass={progressColor(overall)} />
      </Card>

      <Card className="p-6 mb-6">
        <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-4">What I Worked On Today</div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Task</label>
            <select
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
            >
              <option value="">General / not tied to a specific task</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">What I completed</label>
            <textarea
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              rows={2}
              value={whatCompleted}
              onChange={(e) => setWhatCompleted(e.target.value)}
              placeholder="Finished inheritance and polymorphism."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Time / work note</label>
            <input
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={workNote}
              onChange={(e) => setWorkNote(e.target.value)}
              placeholder="Completed today's planned section."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Tomorrow</label>
            <input
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={tomorrowPlan}
              onChange={(e) => setTomorrowPlan(e.target.value)}
              placeholder="Practice OOP exercises."
            />
          </div>

          {error && <div className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</div>}
          {success && <div className="text-sm text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">{success}</div>}

          <button
            type="submit"
            disabled={submitting}
            className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-5 py-2 rounded-lg disabled:opacity-60"
          >
            {submitting ? 'Saving...' : 'Log Update'}
          </button>
        </form>
      </Card>

      <Card className="p-6">
        <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-4">My Update History</div>
        {updates.length === 0 && <div className="text-sm text-slate-400">No updates logged yet.</div>}
        <div className="space-y-4">
          {updates.map((u) => (
            <div key={u.id} className="text-sm border-l-2 border-brand-200 pl-3">
              <div className="text-xs text-slate-400 mb-0.5">
                {new Date(u.created_at).toLocaleString()} {u.task_name_snapshot && `· ${u.task_name_snapshot}`}
              </div>
              <div className="text-slate-700">{u.what_completed}</div>
              {u.work_note && <div className="text-slate-500 text-xs mt-0.5">{u.work_note}</div>}
              {u.tomorrow_plan && <div className="text-slate-400 text-xs mt-0.5">Tomorrow: {u.tomorrow_plan}</div>}
            </div>
          ))}
        </div>
      </Card>
    </Layout>
  );
}
