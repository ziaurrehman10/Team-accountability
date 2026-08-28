import Layout from '../components/Layout';
import { Card } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Settings</h1>
      <p className="text-slate-400 text-sm mb-6">Your account details.</p>

      <Card className="p-6 max-w-md">
        <div className="space-y-4">
          <div>
            <div className="text-xs text-slate-400 mb-1">Display Name</div>
            <div className="text-sm font-medium text-slate-800">{user?.display_name}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">Username</div>
            <div className="text-sm font-medium text-slate-800">{user?.username}</div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="bg-rose-50 hover:bg-rose-100 text-rose-700 text-sm font-medium px-4 py-2 rounded-lg"
          >
            Logout
          </button>
        </div>
      </Card>
    </Layout>
  );
}
