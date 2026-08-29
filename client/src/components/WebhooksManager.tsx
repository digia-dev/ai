import { useState, useEffect } from 'react';
import { Webhook, Plus, Trash2, Send, X } from 'lucide-react';
import { apiFetch } from '../lib/api';

interface WebhookItem {
  id: number;
  name: string;
  type: string;
  url: string;
  active: boolean;
  createdAt: string;
}

interface WebhooksManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WebhooksManager({ isOpen, onClose }: WebhooksManagerProps) {
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newWebhook, setNewWebhook] = useState({ name: '', type: 'slack', url: '' });
  const [testing, setTesting] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      apiFetch('/api/webhooks')
        .then(r => r.ok ? r.json() : [])
        .then(setWebhooks)
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  const handleAdd = async () => {
    if (!newWebhook.name || !newWebhook.url) return;
    const res = await apiFetch('/api/webhooks', {
      method: 'POST',
      body: JSON.stringify(newWebhook),
    });
    if (res.ok) {
      const webhook = await res.json();
      setWebhooks(prev => [webhook, ...prev]);
      setNewWebhook({ name: '', type: 'slack', url: '' });
      setShowAdd(false);
    }
  };

  const handleDelete = async (id: number) => {
    await apiFetch(`/api/webhooks/${id}`, { method: 'DELETE' });
    setWebhooks(prev => prev.filter(w => w.id !== id));
  };

  const handleTest = async (id: number) => {
    setTesting(id);
    await apiFetch(`/api/webhooks/${id}/test`, { method: 'POST' });
    setTesting(null);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'slack': return '💬';
      case 'discord': return '🎮';
      case 'email': return '📧';
      default: return '🔗';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-[480px] max-h-[60vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Webhook className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold dark:text-white">Webhooks</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-black dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-10 text-gray-400">Loading...</div>
          ) : (
            <div className="space-y-3">
              {webhooks.length === 0 && !showAdd && (
                <div className="text-center py-10">
                  <Webhook className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm text-gray-400">Belum ada webhook</p>
                  <p className="text-xs text-gray-400 mt-1">Tambahkan webhook untuk notifikasi ke Slack, Discord, atau Email</p>
                </div>
              )}

              {webhooks.map((webhook) => (
                <div key={webhook.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <span className="text-lg">{getTypeIcon(webhook.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium dark:text-white">{webhook.name}</p>
                    <p className="text-xs text-gray-400 truncate">{webhook.url}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleTest(webhook.id)}
                      disabled={testing === webhook.id}
                      className="p-1.5 text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                      title="Test webhook"
                    >
                      <Send className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDelete(webhook.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                      title="Hapus"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}

              {showAdd && (
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3">
                  <input
                    type="text"
                    value={newWebhook.name}
                    onChange={(e) => setNewWebhook(p => ({ ...p, name: e.target.value }))}
                    placeholder="Nama webhook..."
                    className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 outline-none dark:text-white"
                  />
                  <select
                    value={newWebhook.type}
                    onChange={(e) => setNewWebhook(p => ({ ...p, type: e.target.value }))}
                    className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 outline-none dark:text-white"
                  >
                    <option value="slack">Slack</option>
                    <option value="discord">Discord</option>
                    <option value="email">Email</option>
                  </select>
                  <input
                    type="text"
                    value={newWebhook.url}
                    onChange={(e) => setNewWebhook(p => ({ ...p, url: e.target.value }))}
                    placeholder={newWebhook.type === 'email' ? 'Email address' : 'Webhook URL'}
                    className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 outline-none dark:text-white"
                  />
                  <div className="flex gap-2">
                    <button onClick={handleAdd} className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black text-xs rounded-lg">Simpan</button>
                    <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-xs text-gray-500 hover:text-black dark:hover:text-white">Batal</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {!showAdd && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowAdd(true)}
              className="w-full flex items-center justify-center gap-2 py-2 text-xs text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Webhook
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
