import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import PersonCard from '../components/PersonCard';
import { Card, ActivityBadge } from '../components/ui';
import { api } from '../api/client';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  async function load() {
    try {
      const d = await api.getDashboard();
      setData(d);
    } catch (err) {
      setError(err.message);
    }
  }

  if (error) return <Layout><div className="text-rose-600">{error}</div></Layout>;
  if (!data) return <Layout><div className="text-slate-400">Loading dashboard...</div></Layout>;

  const { team_summary, people } = data;

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Team Progress</h1>
      <p className="text-slate-400 text-sm mb-6">Live overview of everyone's tasks and activity.</p>

      <Card className="p-6 mb-6">
        <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-4">Team Summary</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <SummaryStat label="Total Tasks" value={team_summary.total_tasks} />
          <SummaryStat label="Completed" value={team_summary.completed} tone="emerald" />
          <SummaryStat label="In Progress" value={team_summary.in_progress} tone="amber" />
          <SummaryStat label="Not Started" value={team_summary.not_started} tone="slate" />
        </div>
        <div className="flex items-center justify-between flex-wrap gap-3 pt-4 border-t border-slate-100">
          <div>
            <span className="text-2xl font-bold text-slate-800">{team_summary.overall_progress}%</span>
            <span className="text-sm text-slate-400 ml-2">overall team progress</span>
          </div>
          <div className="text-sm text-slate-500">
            Active members: <span className="font-semibold text-slate-700">{team_summary.active_members}/{team_summary.total_members}</span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {people.map((p) => (
          <PersonCard key={p.id} person={p} />
        ))}
      </div>

      <Card className="p-6">
        <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-4">Today's Status</div>
        <div className="space-y-2">
          {people.map((p) => (
            <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50">
              <span className="text-sm font-medium text-slate-700">{p.display_name}</span>
              <ActivityBadge status={p.activity_status} />
            </div>
          ))}
        </div>
      </Card>
    </Layout>
  );
}

function SummaryStat({ label, value, tone = 'slate' }) {
  const toneClass = {
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
    slate: 'text-slate-700',
  }[tone];
  return (
    <div>
      <div className={`text-2xl font-bold ${toneClass}`}>{value}</div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  );
}
