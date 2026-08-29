import { useState, useEffect } from 'react';
import { BarChart3, MessageSquare, Zap, Bot, Activity, X } from 'lucide-react';
import { apiFetch } from '../lib/api';

interface AnalyticsData {
  totalConversations: number;
  totalMessages: number;
  totalTokens: number;
  tokenUsage: Array<{ date: string; used: number }>;
  agentUsage: Array<{ name: string; conversations: number }>;
  recentActivity: Array<{ createdAt: string; role: string; preview: string }>;
  billing: { tokenBalance: number; plan: string; trialTokens: number };
}

interface AnalyticsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AnalyticsDashboard({ isOpen, onClose }: AnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      apiFetch('/api/analytics/usage')
        .then(r => r.ok ? r.json() : null)
        .then(d => { setData(d); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-[600px] max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold dark:text-white">Analytics</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-black dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-10 text-gray-400">Loading...</div>
          ) : data ? (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">Percakapan</span>
                  </div>
                  <p className="text-2xl font-bold dark:text-white">{data.totalConversations}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">Pesan</span>
                  </div>
                  <p className="text-2xl font-bold dark:text-white">{data.totalMessages}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">Token Digunakan</span>
                  </div>
                  <p className="text-2xl font-bold dark:text-white">{data.totalTokens.toLocaleString()}</p>
                </div>
              </div>

              {/* Token Balance */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium dark:text-white">Token Balance</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{data.billing.plan || 'trial'}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div
                    className="bg-black dark:bg-white h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, ((data.billing.tokenBalance || 0) / 10000) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {(data.billing.tokenBalance || 0).toLocaleString()} / 10,000 token
                </p>
              </div>

              {/* Token Usage Chart (Simple) */}
              {data.tokenUsage.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <h3 className="text-sm font-medium dark:text-white mb-3">Penggunaan Token (7 Hari)</h3>
                  <div className="flex items-end gap-1 h-20">
                    {data.tokenUsage.slice(0, 7).reverse().map((item, i) => {
                      const maxVal = Math.max(...data.tokenUsage.slice(0, 7).map(t => t.used));
                      const height = maxVal > 0 ? (item.used / maxVal) * 100 : 0;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div
                            className="w-full bg-black dark:bg-white rounded-t"
                            style={{ height: `${Math.max(4, height)}%` }}
                          />
                          <span className="text-[9px] text-gray-400">
                            {new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric' })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Agent Usage */}
              {data.agentUsage.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <h3 className="text-sm font-medium dark:text-white mb-3">Agent Favorit</h3>
                  <div className="space-y-2">
                    {data.agentUsage.map((agent, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Bot className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs flex-1 dark:text-gray-300">{agent.name}</span>
                        <span className="text-xs text-gray-500">{agent.conversations} chat</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-sm font-medium dark:text-white mb-3">Aktivitas Terbaru</h3>
                <div className="space-y-2">
                  {data.recentActivity.slice(0, 5).map((activity, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${activity.role === 'user' ? 'bg-blue-400' : 'bg-green-400'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-600 dark:text-gray-300 truncate">{activity.preview}</p>
                        <p className="text-[10px] text-gray-400">
                          {new Date(activity.createdAt).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400">Gagal memuat data</div>
          )}
        </div>
      </div>
    </div>
  );
}
