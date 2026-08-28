import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import MessageBubble from '../components/MessageBubble';

interface Agent {
  id: number;
  name: string;
  icon: string;
  model: string;
  temperature: number;
  systemPrompt: string;
}

interface Message {
  id: number;
  role: string;
  content: string;
  outputFiles: any[];
  tokensUsed: number;
}

const MODELS = [
  { value: 'deepseek/deepseek-v4-flash', label: 'DeepSeek V4 Flash', context: '1M' },
  { value: 'deepseek/deepseek-v3.2', label: 'DeepSeek V3.2', context: '1M' },
  { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini', context: '128K' },
  { value: 'openai/gpt-5.6-luna', label: 'GPT-5.6 Luna', context: '1M' },
  { value: 'openai/gpt-4.1-mini', label: 'GPT-4.1 Mini', context: '1M' },
  { value: 'anthropic/claude-3-haiku', label: 'Claude 3 Haiku', context: '200K' },
  { value: 'anthropic/claude-haiku-4.5', label: 'Claude Haiku 4.5', context: '200K' },
  { value: 'qwen/qwen3-coder', label: 'Qwen3 Coder', context: '262K' },
  { value: 'qwen/qwen3.5-flash', label: 'Qwen3.5 Flash', context: '1M' },
  { value: 'mistralai/mistral-nemo', label: 'Mistral Nemo', context: '131K' },
  { value: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B', context: '131K' },
  { value: 'meta-llama/llama-4-scout', label: 'Llama 4 Scout', context: '1M' },
  { value: 'google/gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite', context: '1M' },
];

export default function AgentChat() {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [currentConvId, setCurrentConvId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentModel, setCurrentModel] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (agentId) {
      apiFetch('/api/agents').then(r => r.ok ? r.json() : []).then((agents: Agent[]) => {
        const found = agents.find(a => a.id === Number(agentId));
        if (found) {
          setAgent(found);
          setCurrentModel(found.model);
        }
      }).catch(() => {});
    }
  }, [agentId]);

  useEffect(() => {
    if (agentId) {
      apiFetch(`/api/agents/${agentId}/conversations`).then(r => r.ok ? r.json() : []).then(setConversations).catch(() => {});
    }
  }, [agentId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async (convId: number) => {
    const res = await apiFetch(`/api/agents/conversations/${convId}/messages`);
    if (res.ok) setMessages(await res.json());
  };

  const handleSelectConversation = (id: number) => {
    setCurrentConvId(id);
    loadMessages(id);
    setSidebarOpen(false);
  };

  const handleDeleteConversation = async (id: number) => {
    if (!confirm('Delete this conversation?')) return;
    await apiFetch(`/api/agents/conversations/${id}`, { method: 'DELETE' });
    if (currentConvId === id) {
      setCurrentConvId(null);
      setMessages([]);
    }
    if (agentId) {
      const res = await apiFetch(`/api/agents/${agentId}/conversations`);
      if (res.ok) setConversations(await res.json());
    }
  };

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading || !agentId) return;

    setInput('');
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', content: msg, outputFiles: [], tokensUsed: 0 }]);
    setLoading(true);

    try {
      const res = await apiFetch('/api/agents/chat', {
        method: 'POST',
        body: JSON.stringify({ agentId: Number(agentId), conversationId: currentConvId, message: msg }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setCurrentConvId(data.conversationId);
      setMessages(prev => [...prev, {
        id: Date.now(),
        role: 'assistant',
        content: data.content,
        outputFiles: data.files || [],
        tokensUsed: 0,
      }]);

      const convRes = await apiFetch(`/api/agents/${agentId}/conversations`);
      if (convRes.ok) setConversations(await convRes.json());
    } catch (err: any) {
      setMessages(prev => [...prev, { id: Date.now(), role: 'assistant', content: `Error: ${err.message}`, outputFiles: [], tokensUsed: 0 }]);
    } finally {
      setLoading(false);
    }
  };

  const startVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Browser tidak mendukung voice input'); return; }
    if (isRecording && recognitionRef.current) { recognitionRef.current.stop(); setIsRecording(false); return; }
    const recognition = new SR();
    recognition.lang = 'id-ID';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onresult = (e: any) => setInput(prev => prev + e.results[0][0].transcript);
    recognition.onend = () => { setIsRecording(false); recognitionRef.current = null; };
    recognition.onerror = () => { setIsRecording(false); recognitionRef.current = null; };
    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  if (!agent) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="flex h-screen bg-white">
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Agent Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-[280px] bg-gray-50 border-r border-gray-200 flex flex-col transition-transform duration-300 md:relative md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <button onClick={() => navigate('/agents')} className="text-xs text-gray-500 hover:text-black">← Agents</button>
          <button onClick={() => { setCurrentConvId(null); setMessages([]); }} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-lg hover:bg-gray-100">+</button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {conversations.map(c => (
            <div key={c.id} onClick={() => handleSelectConversation(c.id)} className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer hover:bg-gray-100 mb-0.5 ${c.id === currentConvId ? 'bg-gray-100 font-semibold' : ''}`}>
              <span className="flex-1 truncate">{c.title || 'New Chat'}</span>
              <button onClick={(e) => { e.stopPropagation(); handleDeleteConversation(c.id); }} className="opacity-0 hover:opacity-100 text-gray-400 hover:text-black ml-2">×</button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center">☰</button>
          <span className="text-lg">{agent.icon}</span>
          <span className="text-sm font-semibold">{agent.name}</span>
          <select value={currentModel} onChange={e => setCurrentModel(e.target.value)} className="ml-2 text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none">
            {MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {messages.length === 0 && (
            <div className="text-center py-20 max-w-md mx-auto">
              <div className="text-4xl mb-4">{agent.icon}</div>
              <h2 className="text-xl font-bold mb-2">{agent.name}</h2>
              <p className="text-sm text-gray-500">Mulai percakapan dengan {agent.name}</p>
            </div>
          )}

          {messages.map(m => (
            <div key={m.id}>
              <MessageBubble role={m.role} content={m.content} />
              {m.outputFiles && m.outputFiles.length > 0 && (
                <div className="flex gap-2 flex-wrap mb-4 ml-11">
                  {m.outputFiles.map((f: any, i: number) => (
                    <a key={i} href={f.downloadUrl} className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-lg text-xs hover:bg-gray-200 transition-colors">
                      📎 {f.name}
                      <span className="text-gray-400">({(f.size / 1024).toFixed(1)} KB)</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 max-w-2xl mx-auto mb-4">
              <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold shrink-0">{agent.icon}</div>
              <div className="flex gap-1 pt-2">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-blink" style={{ animationDelay: '0s' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-blink" style={{ animationDelay: '0.2s' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-blink" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="px-5 py-4 border-t border-gray-200">
          <div className="max-w-2xl mx-auto flex gap-2 items-end">
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder={`Tanya ${agent.name}...`} rows={1} className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none resize-none min-h-[44px] max-h-[200px] focus:border-black" />
            <button onClick={startVoice} className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-colors ${isRecording ? 'border-red-300 bg-red-50 text-red-500 animate-pulse-recording' : 'border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-black'}`}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path d="M19 10v2a7 7 0 01-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
            </button>
            <button onClick={() => sendMessage()} disabled={loading || !input.trim()} className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center shrink-0 hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
