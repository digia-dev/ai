import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';

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

const MODELS = [
  { value: 'deepseek/deepseek-v4-flash', label: 'DeepSeek V4 Flash' },
  { value: 'deepseek/deepseek-v3.2', label: 'DeepSeek V3.2' },
  { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'openai/gpt-5.6-luna', label: 'GPT-5.6 Luna' },
  { value: 'openai/gpt-4.1-mini', label: 'GPT-4.1 Mini' },
  { value: 'anthropic/claude-3-haiku', label: 'Claude 3 Haiku' },
  { value: 'anthropic/claude-haiku-4.5', label: 'Claude Haiku 4.5' },
  { value: 'qwen/qwen3-coder', label: 'Qwen3 Coder' },
  { value: 'qwen/qwen3.5-flash', label: 'Qwen3.5 Flash' },
  { value: 'mistralai/mistral-nemo', label: 'Mistral Nemo' },
  { value: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B' },
  { value: 'meta-llama/llama-4-scout', label: 'Llama 4 Scout' },
  { value: 'google/gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite' },
];

const ICONS = ['🤖', '📊', '📝', '💻', '🎯', '🔬', '📚', '✍️', '🔧', '🎨', '💡', '🚀'];

export default function AgentManager() {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editAgent, setEditAgent] = useState<Agent | null>(null);
  const [form, setForm] = useState({ name: '', icon: '🤖', model: 'deepseek/deepseek-v4-flash', temperature: 0.7, maxTokens: 4096, systemPrompt: '' });

  const loadAgents = async () => {
    const res = await apiFetch('/api/agents');
    if (res.ok) setAgents(await res.json());
  };

  useEffect(() => { loadAgents(); }, []);

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
    if (!form.name || !form.systemPrompt) return alert('Name dan system prompt wajib diisi');
    if (editAgent) {
      await apiFetch(`/api/agents/${editAgent.id}`, { method: 'PUT', body: JSON.stringify(form) });
    } else {
      await apiFetch('/api/agents', { method: 'POST', body: JSON.stringify(form) });
    }
    setShowModal(false);
    loadAgents();
  };

  const deleteAgent = async (id: number) => {
    if (!confirm('Delete this agent?')) return;
    await apiFetch(`/api/agents/${id}`, { method: 'DELETE' });
    loadAgents();
  };

  const defaultAgents = agents.filter(a => a.isDefault);
  const customAgents = agents.filter(a => !a.isDefault);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-5 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">🤖 Agents</h1>
          <button onClick={() => navigate('/chat')} className="py-2 px-4 rounded-lg border border-gray-200 bg-white text-xs font-medium hover:bg-gray-50">← Back to Chat</button>
        </div>

        {/* Default Agents */}
        <h2 className="text-sm font-semibold text-gray-500 mb-3">Default Agents</h2>
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

        {/* Custom Agents */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-500">Your Custom Agents</h2>
          <button onClick={openCreate} className="px-3 py-1.5 bg-black text-white rounded-lg text-xs hover:bg-gray-800">+ Create New Agent</button>
        </div>
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
              <button onClick={() => deleteAgent(a.id)} className="px-3 py-1.5 border border-red-200 text-red-500 rounded-lg text-xs hover:bg-red-50">Delete</button>
            </div>
          ))}
          {customAgents.length === 0 && <p className="text-center text-gray-400 text-sm py-8">Belum ada custom agent. Klik "Create New Agent" untuk membuat.</p>}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="p-5 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold">{editAgent ? 'Edit Agent' : 'Create New Agent'}</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-black">✕</button>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Icon</label>
                    <div className="flex flex-wrap gap-1">
                      {ICONS.map(icon => (
                        <button key={icon} onClick={() => setForm(f => ({ ...f, icon }))} className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${form.icon === icon ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>{icon}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-medium text-gray-500 block mb-1">Name</label>
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-black" placeholder="Agent name" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Model</label>
                  <select value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none">
                    {MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
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
                <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                <button onClick={saveAgent} className="px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800">{editAgent ? 'Save Changes' : 'Create Agent'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
