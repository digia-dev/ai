import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { Users, MessageSquare, Coins, Bot, Shield, Activity, Ban, CheckCircle, ArrowLeft, Server, BarChart3 } from 'lucide-react';

interface Stats {
  users: number;
  conversations: number;
  messages: number;
  totalTokens: number;
  agents: number;
}

interface User {
  id: number;
  email: string;
  name: string;
  createdAt: string;
  isAdmin: boolean;
  banned: boolean;
  tokenBalance: number;
  conversationCount: number;
  messageCount: number;
}

interface Health {
  status: string;
  database: string;
  uptime: number;
  memory: { rss: number; heapUsed: number; heapTotal: number };
  nodeVersion: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'stats' | 'users' | 'health'>('stats');
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [health, setHealth] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [tab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === 'stats') {
        const res = await apiFetch('/api/admin/stats');
        if (res.ok) setStats(await res.json());
      } else if (tab === 'users') {
        const res = await apiFetch('/api/admin/users');
        if (res.ok) setUsers(await res.json());
      } else if (tab === 'health') {
        const res = await apiFetch('/api/admin/health');
        if (res.ok) setHealth(await res.json());
      }
    } catch (err) {
      console.error('Admin load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBan = async (userId: number) => {
    try {
      const res = await apiFetch(`/api/admin/users/${userId}/ban`, { method: 'POST' });
      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, banned: !u.banned } : u));
      }
    } catch (err) {
      console.error('Ban error:', err);
    }
  };

  const handleMakeAdmin = async (userId: number) => {
    try {
      const res = await apiFetch(`/api/admin/users/${userId}/admin`, { method: 'POST' });
      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, isAdmin: !u.isAdmin } : u));
      }
    } catch (err) {
      console.error('Admin toggle error:', err);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/')}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Admin Dashboard
          </h1>
        </div>

        <div className="flex gap-2 mb-6">
          {(['stats', 'users', 'health'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {t === 'stats' && <BarChart3 className="w-4 h-4 inline mr-1" />}
              {t === 'users' && <Users className="w-4 h-4 inline mr-1" />}
              {t === 'health' && <Activity className="w-4 h-4 inline mr-1" />}
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : tab === 'stats' && stats ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard icon={<Users className="w-5 h-5" />} label="Users" value={stats.users} />
            <StatCard icon={<MessageSquare className="w-5 h-5" />} label="Conversations" value={stats.conversations} />
            <StatCard icon={<MessageSquare className="w-5 h-5" />} label="Messages" value={stats.messages} />
            <StatCard icon={<Coins className="w-5 h-5" />} label="Tokens" value={stats.totalTokens} />
            <StatCard icon={<Bot className="w-5 h-5" />} label="Agents" value={stats.agents} />
          </div>
        ) : tab === 'users' ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Conversations</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Messages</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Tokens</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-sm">{u.name || u.email}</div>
                        <div className="text-xs text-gray-400">{u.email}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{u.conversationCount}</td>
                    <td className="px-4 py-3 text-sm">{u.messageCount}</td>
                    <td className="px-4 py-3 text-sm">{u.tokenBalance.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      {u.banned ? (
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">Banned</span>
                      ) : u.isAdmin ? (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">Admin</span>
                      ) : (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">Active</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleBan(u.id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            u.banned
                              ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                              : 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                          }`}
                          title={u.banned ? 'Unban' : 'Ban'}
                        >
                          {u.banned ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleMakeAdmin(u.id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            u.isAdmin
                              ? 'text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                              : 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                          }`}
                          title={u.isAdmin ? 'Remove admin' : 'Make admin'}
                        >
                          <Shield className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : tab === 'health' && health ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Server className="w-5 h-5" /> System
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className="font-medium text-green-600">{health.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Database</span>
                  <span className={`font-medium ${health.database === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
                    {health.database}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Node.js</span>
                  <span className="font-medium">{health.nodeVersion}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Uptime</span>
                  <span className="font-medium">{Math.floor(health.uptime / 3600)}h {Math.floor((health.uptime % 3600) / 60)}m</span>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5" /> Memory
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">RSS</span>
                  <span className="font-medium">{formatBytes(health.memory.rss)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Heap Used</span>
                  <span className="font-medium">{formatBytes(health.memory.heapUsed)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Heap Total</span>
                  <span className="font-medium">{formatBytes(health.memory.heapTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center gap-2 text-gray-400 mb-2">{icon}</div>
      <div className="text-2xl font-bold">{value.toLocaleString()}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
