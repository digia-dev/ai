import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { MODEL_LIST } from '../lib/constants';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { SkeletonPage } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { toast } from '../components/Toast';
import { Plus } from 'lucide-react';

interface Agent {
  id: number;
  name: string;
  icon: string;
  model: string;
  temperature: number;
  maxTokens: number;
  isDefault: boolean;
  systemPrompt: string;
}

const ICONS = ['🤖', '📊', '📝', '💻', '🎯', '🔬', '📚', '✍️', '🔧', '🎨', '💡', '🚀'];

export default function AgentManager() {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editAgent, setEditAgent] = useState<Agent | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', icon: '🤖', model: 'deepseek/deepseek-v4-flash', temperature: 0.7, maxTokens: 4096, systemPrompt: '' });

  const loadAgents = async () => {
    try {
      const res = await apiFetch('/api/agents');
      if (res.ok) setAgents(await res.json());
    } catch {
      toast.error('Gagal memuat agent');
    }
  };

  useEffect(() => {
    loadAgents().finally(() => setInitialLoading(false));
  }, []);

  const openCreate = () => {
    setEditAgent(null);
    setForm({ name: '', icon: '🤖', model: 'deepseek/deepseek-v4-flash', temperature: 0.7, maxTokens: 4096, systemPrompt: '' });
    setShowModal(true);
  };

  const openEdit = (agent: Agent) => {
    setEditAgent(agent);
    setForm({ name: agent.name, icon: agent.icon, model: agent.model, temperature: agent.temperature, maxTokens: agent.maxTokens, systemPrompt: agent.systemPrompt });
    setShowModal(true);
  };

  const saveAgent = async () => {
    if (!form.name || !form.systemPrompt) {
      toast.error('Nama dan system prompt wajib diisi');
      return;
    }
    if (editAgent) {
      await apiFetch(`/api/agents/${editAgent.id}`, { method: 'PUT', body: JSON.stringify(form) });
      toast.success('Agent berhasil diperbarui');
    } else {
      await apiFetch('/api/agents', { method: 'POST', body: JSON.stringify(form) });
      toast.success('Agent berhasil dibuat');
    }
    setShowModal(false);
    loadAgents();
  };

  const deleteAgent = async () => {
    if (!deleteId) return;
    await apiFetch(`/api/agents/${deleteId}`, { method: 'DELETE' });
    setDeleteId(null);
    toast.success('Agent berhasil dihapus');
    loadAgents();
  };

  const defaultAgents = agents.filter(a => a.isDefault);
  const customAgents = agents.filter(a => !a.isDefault);

  if (initialLoading) return <SkeletonPage />;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-5 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">Agents</h1>
          <button onClick={openCreate} className="flex items-center gap-1.5 px-3 py-2 bg-black text-white rounded-lg text-xs font-medium hover:bg-gray-800">
            <Plus className="w-3 h-3" /> Buat Agent Baru
          </button>
        </div>

        {defaultAgents.length > 0 && (
          <>
            <h2 className="text-xs font-semibold text-gray-500 mb-3">Agent Default</h2>
            <div className="space-y-2 mb-6">
              {defaultAgents.map(a => (
                <div key={a.id} className="border border-gray-200 rounded-xl p-4 flex items-center gap-4">
                  <span className="text-2xl">{a.icon}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{a.name}</div>
                    <div className="text-xs text-gray-500">{a.model} · Temp: {a.temperature}</div>
                  </div>
                  <button onClick={() => navigate(`/agents/${a.id}`)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs hover:bg-gray-50">Chat</button>
                </div>
              ))}
            </div>
          </>
        )}

        <h2 className="text-xs font-semibold text-gray-500 mb-3">Agent Kamu</h2>
        <div className="space-y-2">
          {customAgents.map(a => (
            <div key={a.id} className="border border-gray-200 rounded-xl p-4 flex items-center gap-4">
              <span className="text-2xl">{a.icon}</span>
              <div className="flex-1">
                <div className="font-semibold text-sm">{a.name}</div>
                <div className="text-xs text-gray-500">{a.model} · Temp: {a.temperature}</div>
              </div>
              <button onClick={() => navigate(`/agents/${a.id}`)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs hover:bg-gray-50">Chat</button>
              <button onClick={() => openEdit(a)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs hover:bg-gray-50">Edit</button>
              <button onClick={() => setDeleteId(a.id)} className="px-3 py-1.5 border border-red-200 text-red-500 rounded-lg text-xs hover:bg-red-50">Hapus</button>
            </div>
          ))}
          {customAgents.length === 0 && (
            <EmptyState
              title="Belum ada agent custom"
              description="Buat agent baru untuk memulai"
              action={{ label: 'Buat Agent Baru', onClick: openCreate }}
            />
          )}
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <div className="p-5 border-b border-gray-200">
          <h3 className="font-semibold text-sm">{editAgent ? 'Edit Agent' : 'Buat Agent Baru'}</h3>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Icon</label>
            <div className="flex flex-wrap gap-1">
              {ICONS.map(icon => (
                <button key={icon} onClick={() => setForm(f => ({ ...f, icon }))} className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-colors ${form.icon === icon ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>{icon}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Nama</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-black" placeholder="Nama agent" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Model</label>
            <select value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none">
              {MODEL_LIST.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-500 block mb-1">Temperature: {form.temperature}</label>
              <input type="range" min="0" max="2" step="0.1" value={form.temperature} onChange={e => setForm(f => ({ ...f, temperature: parseFloat(e.target.value) }))} className="w-full" />
            </div>
            <div className="w-24">
              <label className="text-xs font-medium text-gray-500 block mb-1">Max Tokens</label>
              <input type="number" value={form.maxTokens} onChange={e => setForm(f => ({ ...f, maxTokens: parseInt(e.target.value) || 4096 }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">System Prompt</label>
            <textarea value={form.systemPrompt} onChange={e => setForm(f => ({ ...f, systemPrompt: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none resize-y min-h-[150px] focus:border-black" placeholder="Instruksi untuk AI agent..." />
          </div>
        </div>
        <div className="p-5 border-t border-gray-200 flex justify-end gap-2">
          <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Batal</button>
          <button onClick={saveAgent} className="px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800">{editAgent ? 'Simpan' : 'Buat'}</button>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteId !== null}
        title="Hapus Agent"
        message="Agent yang dihapus tidak dapat dikembalikan."
        confirmLabel="Hapus"
        danger
        onConfirm={deleteAgent}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
