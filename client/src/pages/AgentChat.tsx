import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { useChat } from '../hooks/useChat';
import { useVoice } from '../hooks/useVoice';
import { useArtifacts } from '../hooks/useArtifacts';
import MessageBubble from '../components/MessageBubble';
import StreamingBubble from '../components/StreamingBubble';
import CitationsCard from '../components/CitationsCard';
import RelatedQuestions from '../components/RelatedQuestions';
import FocusModeSelector from '../components/FocusModeSelector';
import ChatInput from '../components/ChatInput';
import ArtifactPanel from '../components/ArtifactPanel';
import ExportMenu from '../components/ExportMenu';
import { SkeletonChat } from '../components/Skeleton';
import { toast } from '../components/Toast';
import { ArrowLeft, Paperclip, Share2, Copy, Check, ExternalLink, Square, Code } from 'lucide-react';

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
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);

  const {
    currentConvId, messages, loading, streamingContent, isStreaming, focusMode, setFocusMode, messagesEndRef,
    loadConversations, sendMessage, stopGeneration, regenerateMessage, editMessage,
  } = useChat({ agentId: agentId ? Number(agentId) : undefined });

  const [input, setInput] = useState('');
  const [editingMsgId, setEditingMsgId] = useState<number | null>(null);
  const [showArtifactPanel, setShowArtifactPanel] = useState(false);

  const { artifacts, activeArtifactId, selectArtifact, closeArtifact } = useArtifacts(messages);

  const { isRecording, toggle: toggleVoice } = useVoice({
    onResult: (transcript) => setInput(prev => prev + transcript),
  });

  useEffect(() => {
    if (agentId) {
      apiFetch('/api/agents')
        .then(r => r.ok ? r.json() : [])
        .then((agents: Agent[]) => {
          const found = agents.find(a => a.id === Number(agentId));
          if (found) setAgent(found);
        })
        .finally(() => setInitialLoading(false));
    }
  }, [agentId]);

  useEffect(() => {
    if (agentId) loadConversations();
  }, [agentId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  useEffect(() => {
    if (artifacts.length > 0 && !showArtifactPanel) {
      setShowArtifactPanel(true);
    }
  }, [artifacts.length]);

  const handleSend = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading || !agentId) return;
    setInput('');
    await sendMessage(msg);
  };

  const handleRegenerate = async () => {
    if (!currentConvId || loading) return;
    await regenerateMessage(currentConvId);
  };

  const handleEdit = async (msgId: number, newContent: string) => {
    if (!currentConvId || loading) return;
    setEditingMsgId(null);
    await editMessage(currentConvId, msgId, newContent);
  };

  const handleArtifactClick = () => {
    setShowArtifactPanel(true);
  };

  const handleShare = async () => {
    if (!currentConvId) { toast.error('Mulai percakapan terlebih dahulu'); return; }
    const res = await apiFetch('/api/shared', { method: 'POST', body: JSON.stringify({ conversationId: currentConvId, title: agent?.name }) });
    if (res.ok) {
      const data = await res.json();
      const url = `${window.location.origin}/shared/${data.token}`;
      setShareLink(url);
      setShowShareMenu(true);
    } else {
      toast.error('Gagal membuat link');
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Link disalin!');
  };

  const shareWhatsApp = () => {
    const text = `Hasil agent *${agent?.name}* dari Tara AI:\n${shareLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (initialLoading) return <SkeletonChat />;
  if (!agent) return <div className="min-h-screen flex items-center justify-center text-sm text-gray-400">Agent tidak ditemukan</div>;

  const modelName = agent.model.split('/').pop() || agent.model;

  return (
    <>
      <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
        <button onClick={() => navigate('/agents')} className="text-gray-400 hover:text-black dark:hover:text-white">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-lg">{agent.icon}</span>
        <div className="flex-1 flex items-center gap-2">
          <span className="text-sm font-semibold dark:text-white">{agent.name}</span>
          <span className="text-xs text-gray-400">{modelName}</span>
          <FocusModeSelector value={focusMode} onChange={setFocusMode} />
          {artifacts.length > 0 && (
            <button
              onClick={() => setShowArtifactPanel(!showArtifactPanel)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors ${
                showArtifactPanel ? 'bg-black dark:bg-white text-white dark:text-black' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Code className="w-3 h-3" />
              Artifacts ({artifacts.length})
            </button>
          )}
          {isStreaming && (
            <button
              onClick={stopGeneration}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Square className="w-3 h-3" />
              Hentikan
            </button>
          )}
        </div>
        {messages.length > 0 && (
          <ExportMenu messages={messages} title={agent.name} />
        )}
        <button onClick={handleShare} className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-xs hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300" title="Bagikan hasil">
          <Share2 className="w-3 h-3" /> Bagikan
        </button>
      </div>

      {showShareMenu && shareLink && (
        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center gap-2">
          <input readOnly value={shareLink} className="flex-1 px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-xs outline-none dark:text-white" />
          <button onClick={copyLink} className="flex items-center gap-1 px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black rounded-lg text-xs hover:bg-gray-800 dark:hover:bg-gray-200">
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Tersalin' : 'Salin'}
          </button>
          <button onClick={shareWhatsApp} className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs hover:bg-green-600">
            WhatsApp
          </button>
          <button onClick={() => { window.open(shareLink, '_blank'); }} className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-xs hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300">
            <ExternalLink className="w-3 h-3" /> Buka
          </button>
          <button onClick={() => setShowShareMenu(false)} className="text-gray-400 hover:text-black dark:hover:text-white text-xs">✕</button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 py-5">
            {messages.length === 0 && (
              <div className="text-center py-20 max-w-md mx-auto">
                <div className="text-4xl mb-4">{agent.icon}</div>
                <h2 className="text-xl font-bold mb-2 dark:text-white">{agent.name}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Mulai percakapan dengan {agent.name}</p>
              </div>
            )}

            {messages.map((m, idx) => {
              if (m.role === 'assistant' && isStreaming && m.content === '' && streamingContent) {
                return (
                  <div key={m.id}>
                    <StreamingBubble content={streamingContent} />
                  </div>
                );
              }
              if (m.role === 'assistant' && isStreaming && m.id === messages[messages.length - 1]?.id && streamingContent) {
                return (
                  <div key={m.id}>
                    <StreamingBubble content={streamingContent} />
                    {m.outputFiles && m.outputFiles.length > 0 && (
                      <div className="flex gap-2 flex-wrap mb-4 pl-11">
                        {m.outputFiles.map((f: any, i: number) => (
                          <a key={i} href={f.downloadUrl} className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors dark:text-gray-300">
                            <Paperclip className="w-3 h-3" /> {f.name}
                            <span className="text-gray-400">({(f.size / 1024).toFixed(1)} KB)</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              const isLastAssistant = m.role === 'assistant' && idx === messages.length - 1;
              const isUserMsg = m.role === 'user';

              return (
                <div key={m.id}>
                  <MessageBubble
                    role={m.role}
                    content={m.content}
                    createdAt={m.createdAt}
                    isLast={isLastAssistant}
                    onRegenerate={isLastAssistant ? handleRegenerate : undefined}
                    onEdit={isUserMsg ? (newContent) => handleEdit(m.id, newContent) : undefined}
                    isEditing={editingMsgId === m.id}
                    onCancelEdit={() => setEditingMsgId(null)}
                    onArtifactClick={handleArtifactClick}
                  />
                  {m.citations && m.citations.length > 0 && (
                    <CitationsCard citations={m.citations} />
                  )}
                  {m.relatedQuestions && m.relatedQuestions.length > 0 && (
                    <RelatedQuestions questions={m.relatedQuestions} onQuestionClick={handleSend} />
                  )}
                  {m.outputFiles && m.outputFiles.length > 0 && (
                    <div className="flex gap-2 flex-wrap mb-4 pl-11">
                      {m.outputFiles.map((f: any, i: number) => (
                        <a key={i} href={f.downloadUrl} className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors dark:text-gray-300">
                          <Paperclip className="w-3 h-3" /> {f.name}
                          <span className="text-gray-400">({(f.size / 1024).toFixed(1)} KB)</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

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
        </div>

        {showArtifactPanel && (
          <ArtifactPanel
            artifacts={artifacts}
            activeArtifactId={activeArtifactId}
            onSelectArtifact={selectArtifact}
            onClose={() => { setShowArtifactPanel(false); closeArtifact(); }}
          />
        )}
      </div>
    </>
  );
}
