import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { MODEL_LIST } from '../lib/constants';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { SkeletonPage } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { toast } from '../components/Toast';
import { Plus, Copy } from 'lucide-react';

interface Agent {
  id: number;
  name: string;
  icon: string;
  model: string;
  temperature: number;
  maxTokens: number;
  isDefault: boolean;
  isTemplate: boolean;
  systemPrompt: string;
  tags: Array<{ id: number; name: string; color: string }>;
}

interface Tag {
  id: number;
  name: string;
  color: string;
  agentCount: number;
}

const ICONS = ['🤖', '📊', '📝', '💻', '🎯', '🔬', '📚', '✍️', '🔧', '🎨', '💡', '🚀'];
const TAG_COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280'];

export default function AgentManager() {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editAgent, setEditAgent] = useState<Agent | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [showTagModal, setShowTagModal] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const [filterTag, setFilterTag] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', icon: '🤖', model: 'deepseek/deepseek-v4-flash', temperature: 0.7, maxTokens: 4096, systemPrompt: '' });

  const loadAgents = async () => {
    try {
      const res = await apiFetch('/api/agents');
      if (res.ok) setAgents(await res.json());
    } catch { toast.error('Gagal memuat agent'); }
  };

  const loadTags = async () => {
    try {
      const res = await apiFetch('/api/tags');
      if (res.ok) setTags(await res.json());
    } catch {}
  };

  useEffect(() => {
    Promise.all([loadAgents(), loadTags()]).finally(() => setInitialLoading(false));
  }, []);

  const openCreate = () => {
    setEditAgent(null);
    setSelectedTags([]);
    setForm({ name: '', icon: '🤖', model: 'deepseek/deepseek-v4-flash', temperature: 0.7, maxTokens: 4096, systemPrompt: '' });
    setShowModal(true);
  };

  const openEdit = (agent: Agent) => {
    setEditAgent(agent);
    setSelectedTags(agent.tags?.map(t => t.id) || []);
    setForm({ name: agent.name, icon: agent.icon, model: agent.model, temperature: agent.temperature, maxTokens: agent.maxTokens, systemPrompt: agent.systemPrompt });
    setShowModal(true);
  };

  const saveAgent = async () => {
    if (!form.name || !form.systemPrompt) { toast.error('Nama dan system prompt wajib diisi'); return; }
    if (editAgent) {
      await apiFetch(`/api/agents/${editAgent.id}`, { method: 'PUT', body: JSON.stringify(form) });
      await apiFetch(`/api/agents/${editAgent.id}/tags`, { method: 'POST', body: JSON.stringify({ tagIds: selectedTags }) });
      toast.success('Agent berhasil diperbarui');
    } else {
      const res = await apiFetch('/api/agents', { method: 'POST', body: JSON.stringify(form) });
      if (res.ok) {
        const agent = await res.json();
        if (selectedTags.length > 0) {
          await apiFetch(`/api/agents/${agent.id}/tags`, { method: 'POST', body: JSON.stringify({ tagIds: selectedTags }) });
        }
      }
      toast.success('Agent berhasil dibuat');
    }
    setShowModal(false);
    loadAgents();
  };

  const cloneTemplate = async (templateId: number) => {
    const res = await apiFetch(`/api/agents/${templateId}/clone`, { method: 'POST' });
    if (res.ok) {
      toast.success('Template berhasil digunakan! Agent baru sudah dibuat.');
      loadAgents();
      const agent = await res.json();
      navigate(`/agents/${agent.id}`);
    } else {
      toast.error('Gagal mengklon template');
    }
  };

  const deleteAgent = async () => {
    if (!deleteId) return;
    await apiFetch(`/api/agents/${deleteId}`, { method: 'DELETE' });
    setDeleteId(null);
    toast.success('Agent berhasil dihapus');
    loadAgents();
  };

  const createTag = async () => {
    if (!newTagName.trim()) return;
    await apiFetch('/api/tags', { method: 'POST', body: JSON.stringify({ name: newTagName.trim(), color: newTagColor }) });
    setNewTagName('');
    setShowTagModal(false);
    loadTags();
  };

  const deleteTag = async (_id: number) => {
    await apiFetch(`/api/tags/${_id}`, { method: 'DELETE' });
    if (filterTag === _id) setFilterTag(null);
    loadTags();
    loadAgents();
  };

  const templates = agents.filter(a => a.isDefault && a.isTemplate);
  const customAgents = agents.filter(a => !a.isDefault);
  const filteredCustom = filterTag ? customAgents.filter(a => a.tags?.some(t => t.id === filterTag)) : customAgents;

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

        {/* Templates */}
        <h2 className="text-xs font-semibold text-gray-500 mb-3">Template Agent</h2>
        <p className="text-xs text-gray-400 mb-3">Pilih template untuk membuat agent baru dengan prompt yang sudah siap.</p>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {templates.map(a => (
            <div key={a.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{a.icon}</span>
                <div>
                  <div className="font-semibold text-sm">{a.name}</div>
                  <div className="text-xs text-gray-500">{a.model}</div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-3 line-clamp-2">{a.systemPrompt.slice(0, 120)}...</p>
              <button onClick={() => cloneTemplate(a.id)} className="flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-lg text-xs hover:bg-gray-800">
                <Copy className="w-3 h-3" /> Gunakan Template
              </button>
            </div>
          ))}
        </div>

        {/* Tags Filter */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <button onClick={() => setFilterTag(null)} className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${!filterTag ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            Semua
          </button>
          {tags.map(t => (
            <span key={t.id} className="flex items-center gap-1 group">
              <button onClick={() => setFilterTag(filterTag === t.id ? null : t.id)} className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-colors" style={{ backgroundColor: filterTag === t.id ? t.color : '#f3f4f6', color: filterTag === t.id ? 'white' : '#4b5563' }}>
                {t.name}
                <span className="opacity-60">({t.agentCount})</span>
              </button>
              <button onClick={() => deleteTag(t.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 text-xs transition-opacity" title="Hapus tag">✕</button>
            </span>
          ))}
          <button onClick={() => setShowTagModal(true)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-gray-400 hover:text-black hover:bg-gray-100">
            <Plus className="w-3 h-3" /> Tag
          </button>
        </div>

        {/* Custom Agents */}
        <h2 className="text-xs font-semibold text-gray-500 mb-3">Agent Kamu</h2>
        <div className="space-y-2">
          {filteredCustom.map(a => (
            <div key={a.id} className="border border-gray-200 rounded-xl p-4 flex items-center gap-4">
              <span className="text-2xl">{a.icon}</span>
              <div className="flex-1">
                <div className="font-semibold text-sm">{a.name}</div>
                <div className="text-xs text-gray-500">{a.model} · Temp: {a.temperature}</div>
                {a.tags && a.tags.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {a.tags.map(t => (
                      <span key={t.id} className="px-1.5 py-0.5 rounded text-[10px] text-white" style={{ backgroundColor: t.color }}>{t.name}</span>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => navigate(`/agents/${a.id}`)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs hover:bg-gray-50">Chat</button>
              <button onClick={() => openEdit(a)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs hover:bg-gray-50">Edit</button>
              <button onClick={() => setDeleteId(a.id)} className="px-3 py-1.5 border border-red-200 text-red-500 rounded-lg text-xs hover:bg-red-50">Hapus</button>
            </div>
          ))}
          {filteredCustom.length === 0 && (
            <EmptyState
              title={filterTag ? 'Tidak ada agent dengan tag ini' : 'Belum ada agent custom'}
              description={filterTag ? 'Coba filter tag lain' : 'Buat agent baru atau gunakan template'}
              action={filterTag ? undefined : { label: 'Buat Agent Baru', onClick: openCreate }}
            />
          )}
        </div>
      </div>

      {/* Agent Create/Edit Modal */}
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
            <label className="text-xs font-medium text-gray-500 block mb-1">Tags</label>
            <div className="flex flex-wrap gap-1">
              {tags.map(t => (
                <button key={t.id} onClick={() => setSelectedTags(prev => prev.includes(t.id) ? prev.filter(id => id !== t.id) : [...prev, t.id])} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors" style={{ backgroundColor: selectedTags.includes(t.id) ? t.color : '#f3f4f6', color: selectedTags.includes(t.id) ? 'white' : '#4b5563' }}>
                  {t.name}
                </button>
              ))}
              {tags.length === 0 && <span className="text-xs text-gray-400">Buat tag terlebih dahulu</span>}
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

      {/* Tag Create Modal */}
      <Modal open={showTagModal} onClose={() => setShowTagModal(false)} maxWidth="max-w-sm">
        <div className="p-5">
          <h3 className="font-semibold text-sm mb-4">Buat Tag Baru</h3>
          <input value={newTagName} onChange={e => setNewTagName(e.target.value)} placeholder="Nama tag" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-black mb-3" />
          <div className="flex gap-1 mb-4">
            {TAG_COLORS.map(c => (
              <button key={c} onClick={() => setNewTagColor(c)} className="w-7 h-7 rounded-full transition-transform" style={{ backgroundColor: c, transform: newTagColor === c ? 'scale(1.2)' : 'scale(1)' }} />
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowTagModal(false)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs hover:bg-gray-50">Batal</button>
            <button onClick={createTag} className="px-3 py-1.5 bg-black text-white rounded-lg text-xs hover:bg-gray-800">Buat</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={deleteId !== null} title="Hapus Agent" message="Agent yang dihapus tidak dapat dikembalikan." confirmLabel="Hapus" danger onConfirm={deleteAgent} onCancel={() => setDeleteId(null)} />
    </div>
  );
}
