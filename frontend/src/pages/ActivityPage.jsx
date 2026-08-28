import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { Card } from '../components/ui';
import { api } from '../api/client';

const KIND_ICON = {
  completion: '✅',
  deadline: '⏰',
  overdue: '🔴',
  info: '🔔',
};

export default function ActivityPage() {
  const [activity, setActivity] = useState(null);
  const [notifications, setNotifications] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  async function load() {
    try {
      const [a, n] = await Promise.all([api.getActivity(), api.getNotifications()]);
      setActivity(a);
      setNotifications(n);
    } catch (err) {
      setError(err.message);
    }
  }

  if (error) return <Layout><div className="text-rose-600">{error}</div></Layout>;

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Activity</h1>
      <p className="text-slate-400 text-sm mb-6">What the team has been up to, newest first.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-4">Recent Activity</div>
          {!activity ? (
            <div className="text-slate-400 text-sm">Loading...</div>
          ) : activity.length === 0 ? (
            <div className="text-slate-400 text-sm">No activity yet.</div>
          ) : (
            <ul className="space-y-3">
              {activity.map((a) => (
                <li key={a.id} className="text-sm border-l-2 border-brand-200 pl-3">
                  <div className="text-slate-700">{a.message}</div>
                  <div className="text-xs text-slate-400">{new Date(a.created_at).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-6">
          <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-4">Notifications</div>
          {!notifications ? (
            <div className="text-slate-400 text-sm">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="text-slate-400 text-sm">You're all caught up.</div>
          ) : (
            <ul className="space-y-3">
              {notifications.map((n) => (
                <li key={n.id} className="flex items-start gap-2 text-sm">
                  <span>{KIND_ICON[n.kind] || '🔔'}</span>
                  <div>
                    <div className="text-slate-700">{n.message}</div>
                    <div className="text-xs text-slate-400">{new Date(n.created_at).toLocaleString()}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </Layout>
  );
}
