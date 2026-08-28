import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { Card, ProgressBar, progressColor, StatusBadge, PriorityBadge, DueLabel } from '../components/ui';
import { api } from '../api/client';

export default function MyTasksPage() {
  const [tasks, setTasks] = useState(null);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const t = await api.getMyTasks();
      setTasks(t);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUpdate(taskId, payload) {
    setSavingId(taskId);
    try {
      const updated = await api.updateTask(taskId, payload);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  }

  if (error) return <Layout><div className="text-rose-600">{error}</div></Layout>;
  if (!tasks) return <Layout><div className="text-slate-400">Loading tasks...</div></Layout>;

  const groups = {
    IN_PROGRESS: tasks.filter((t) => t.status === 'IN_PROGRESS'),
    NOT_STARTED: tasks.filter((t) => t.status === 'NOT_STARTED'),
    COMPLETED: tasks.filter((t) => t.status === 'COMPLETED'),
  };

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-slate-800 mb-1">My Tasks</h1>
      <p className="text-slate-400 text-sm mb-6">Update your progress — status and completion are calculated from it automatically.</p>

      <TaskGroup title="In Progress" tasks={groups.IN_PROGRESS} expandedId={expandedId} setExpandedId={setExpandedId} onUpdate={handleUpdate} savingId={savingId} />
      <TaskGroup title="Not Started" tasks={groups.NOT_STARTED} expandedId={expandedId} setExpandedId={setExpandedId} onUpdate={handleUpdate} savingId={savingId} />
      <TaskGroup title="Completed" tasks={groups.COMPLETED} expandedId={expandedId} setExpandedId={setExpandedId} onUpdate={handleUpdate} savingId={savingId} />
    </Layout>
  );
}

function TaskGroup({ title, tasks, expandedId, setExpandedId, onUpdate, savingId }) {
  if (tasks.length === 0) return null;
  return (
    <div className="mb-6">
      <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-2">{title} ({tasks.length})</div>
      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            expanded={expandedId === task.id}
            onToggle={() => setExpandedId(expandedId === task.id ? null : task.id)}
            onUpdate={onUpdate}
            saving={savingId === task.id}
          />
        ))}
      </div>
    </div>
  );
}

function TaskRow({ task, expanded, onToggle, onUpdate, saving }) {
  const [progress, setProgress] = useState(task.progress);
  const [notes, setNotes] = useState(task.notes || '');

  useEffect(() => {
    setProgress(task.progress);
    setNotes(task.notes || '');
  }, [task.progress, task.notes]);

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4 cursor-pointer" onClick={onToggle}>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className="font-semibold text-slate-800">{task.name}</span>
            <PriorityBadge priority={task.priority} />
            <StatusBadge status={task.status} />
          </div>
          <p className="text-sm text-slate-500 truncate">{task.description}</p>
        </div>
        <div className="w-40 shrink-0 text-right">
          <div className="text-sm font-semibold text-slate-700 mb-1">{task.progress}%</div>
          <ProgressBar value={task.progress} colorClass={progressColor(task.progress)} />
          <div className="mt-1"><DueLabel dueDate={task.due_date} status={task.status} /></div>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-3" onClick={(e) => e.stopPropagation()}>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Progress: {progress}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-full accent-brand-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Notes</label>
            <textarea
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What are you working on / any blockers?"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onUpdate(task.id, { progress, notes })}
              disabled={saving}
              className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Progress'}
            </button>
            {task.status !== 'COMPLETED' && (
              <button
                onClick={() => onUpdate(task.id, { status: 'COMPLETED' })}
                disabled={saving}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-medium px-4 py-1.5 rounded-lg"
              >
                Mark Completed
              </button>
            )}
            {task.status === 'NOT_STARTED' && (
              <button
                onClick={() => onUpdate(task.id, { status: 'IN_PROGRESS' })}
                disabled={saving}
                className="bg-amber-50 hover:bg-amber-100 text-amber-700 text-sm font-medium px-4 py-1.5 rounded-lg"
              >
                Start Task
              </button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
