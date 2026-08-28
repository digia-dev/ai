import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { useChat } from '../hooks/useChat';
import { useVoice } from '../hooks/useVoice';
import { useModels } from '../hooks/useModels';
import MessageBubble from '../components/MessageBubble';
import ChatInput from '../components/ChatInput';
import { SkeletonChat } from '../components/Skeleton';
import { ArrowLeft, Paperclip } from 'lucide-react';

interface Agent {
  id: number;
  name: string;
  icon: string;
  model: string;
  temperature: number;
  systemPrompt: string;
}

export default function AgentChat() {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const { currentModel, setCurrentModel, models } = useModels();

  const {
    messages, loading, messagesEndRef,
    loadConversations, sendMessage,
  } = useChat({ agentId: agentId ? Number(agentId) : undefined });

  const [input, setInput] = useState('');

  const { isRecording, toggle: toggleVoice } = useVoice({
    onResult: (transcript) => setInput(prev => prev + transcript),
  });

  useEffect(() => {
    if (agentId) {
      apiFetch('/api/agents')
        .then(r => r.ok ? r.json() : [])
        .then((agents: Agent[]) => {
          const found = agents.find(a => a.id === Number(agentId));
          if (found) {
            setAgent(found);
            setCurrentModel(found.model);
          }
        })
        .finally(() => setInitialLoading(false));
    }
  }, [agentId]);

  useEffect(() => {
    if (agentId) loadConversations();
  }, [agentId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading || !agentId) return;
    setInput('');
    await sendMessage(msg);
  };

  if (initialLoading) return <SkeletonChat />;
  if (!agent) return <div className="min-h-screen flex items-center justify-center text-sm text-gray-400">Agent tidak ditemukan</div>;

  return (
    <>
      <div className="px-5 py-3 border-b border-gray-200 flex items-center gap-3">
        <button onClick={() => navigate('/agents')} className="text-gray-400 hover:text-black">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-lg">{agent.icon}</span>
        <span className="text-sm font-semibold">{agent.name}</span>
        <select
          value={currentModel}
          onChange={e => setCurrentModel(e.target.value)}
          className="ml-2 text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none"
        >
          {models.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
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
            <MessageBubble role={m.role} content={m.content} createdAt={m.createdAt} />
            {m.outputFiles && m.outputFiles.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-4 pl-11">
                {m.outputFiles.map((f: any, i: number) => (
                  <a key={i} href={f.downloadUrl} className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-lg text-xs hover:bg-gray-200 transition-colors">
                    <Paperclip className="w-3 h-3" /> {f.name}
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

      <ChatInput
        input={input}
        setInput={setInput}
        onSend={handleSend}
        onVoice={toggleVoice}
        isRecording={isRecording}
        loading={loading}
        showUpload={false}
        placeholder={`Tanya ${agent.name}...`}
      />
    </>
  );
}
