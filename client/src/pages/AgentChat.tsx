import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { useChat } from '../hooks/useChat';
import { useVoice } from '../hooks/useVoice';
import { useTTS } from '../hooks/useTTS';
import MessageBubble from '../components/MessageBubble';
import StreamingBubble from '../components/StreamingBubble';
import CitationsCard from '../components/CitationsCard';
import RelatedQuestions from '../components/RelatedQuestions';
import SummaryCard from '../components/SummaryCard';
import ChatInput from '../components/ChatInput';
import Modal from '../components/Modal';
import { SkeletonChat } from '../components/Skeleton';
import { ArrowLeft, Square, Sparkles } from 'lucide-react';
import { getAgentIcon } from '../lib/agentIcons';
import { isAuthenticated } from '../lib/auth';

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
  const location = useLocation();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  const {
    currentConvId, messages, loading, streamingContent, isStreaming, messagesEndRef,
    loadConversations, sendMessage, stopGeneration, regenerateMessage, editMessage,
    selectConversation,
  } = useChat({ agentId: agentId ? Number(agentId) : undefined });

  const [input, setInput] = useState('');
  const [editingMsgId, setEditingMsgId] = useState<number | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const { isSpeaking, speak, stop: stopSpeak } = useTTS();
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
  }, [agentId, loadConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const convId = params.get('conversationId');
    if (convId && agentId) {
      selectConversation(Number(convId));
    }
  }, [location.search, agentId, selectConversation]);

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

  const handleVoiceClick = () => {
    if (!isAuthenticated()) { setShowAuthModal(true); return; }
    toggleVoice();
  };

  const modelName = agent?.model.split('/').pop() || agent?.model;

  if (initialLoading) return <SkeletonChat />;
  if (!agent) return <div className="min-h-screen flex items-center justify-center text-sm text-gray-400">Agent tidak ditemukan</div>;

  return (
    <div className="flex flex-col h-full">
      {/* HEADER */}
      <div className="h-14 px-5 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={() => navigate('/agents')} className="text-gray-400 hover:text-black dark:hover:text-white shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </button>
          {getAgentIcon(agent.icon, 'w-5 h-5')}
          <span className="text-sm font-semibold dark:text-white truncate">{agent.name}</span>
          <span className="text-xs text-gray-400 hidden sm:inline">{modelName}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
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
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-5 py-5">
          {messages.length === 0 && (
            <div className="text-center py-20">
              <div className="mb-4">{getAgentIcon(agent.icon, 'w-10 h-10 mx-auto')}</div>
              <h2 className="text-xl font-bold mb-2 dark:text-white">{agent.name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Mulai percakapan dengan {agent.name}</p>
              <div className="max-w-xl mx-auto">
                <ChatInput
                  input={input}
                  setInput={setInput}
                  onSend={handleSend}
                  onVoice={handleVoiceClick}
                  isRecording={isRecording}
                  loading={loading}
                  placeholder={`Tanya ${agent.name}...`}
                />
              </div>
            </div>
          )}

          {messages.length > 5 && currentConvId && (
            <SummaryCard conversationId={currentConvId} />
          )}

          {messages.map((m, idx) => {
            if (m.role === 'assistant' && isStreaming && m.content === '' && streamingContent) {
              return <StreamingBubble key={m.id} content={streamingContent} />;
            }
            if (m.role === 'assistant' && isStreaming && m.id === messages[messages.length - 1]?.id && streamingContent) {
              return <StreamingBubble key={m.id} content={streamingContent} />;
            }

            const isLastAssistant = m.role === 'assistant' && idx === messages.length - 1;
            const isUserMsg = m.role === 'user';

            return (
              <div key={m.id}>
                {m.citations && m.citations.length > 0 && (
                  <CitationsCard citations={m.citations} />
                )}
                <MessageBubble
                  role={m.role}
                  content={m.content}
                  createdAt={m.createdAt}
                  isLast={isLastAssistant}
                  onRegenerate={isLastAssistant ? handleRegenerate : undefined}
                  onEdit={isUserMsg ? (newContent) => handleEdit(m.id, newContent) : undefined}
                  isEditing={editingMsgId === m.id}
                  onCancelEdit={() => setEditingMsgId(null)}
                  isSpeaking={isSpeaking}
                  onSpeak={() => speak(m.content)}
                  onStopSpeak={stopSpeak}
                />
                {m.relatedQuestions && m.relatedQuestions.length > 0 && (
                  <RelatedQuestions questions={m.relatedQuestions} onQuestionClick={handleSend} />
                )}
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* INPUT */}
      {messages.length > 0 && (
        <ChatInput
          input={input}
          setInput={setInput}
          onSend={handleSend}
          onVoice={handleVoiceClick}
          isRecording={isRecording}
          loading={loading}
          placeholder={`Tanya ${agent.name}...`}
        />
      )}

      {/* Auth Modal */}
      <Modal open={showAuthModal} onClose={() => setShowAuthModal(false)} maxWidth="max-w-sm">
        <div className="p-6 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6 text-gray-500" />
          </div>
          <h3 className="font-semibold text-sm mb-2">Masuk untuk menggunakan fitur ini</h3>
          <p className="text-xs text-gray-500 mb-5">Buat akun atau masuk untuk menggunakan upload file dan input suara.</p>
          <div className="flex gap-2 justify-center">
            <button onClick={() => { setShowAuthModal(false); navigate('/login'); }} className="px-4 py-2 bg-black text-white rounded-lg text-xs font-medium hover:bg-gray-800">
              Masuk
            </button>
            <button onClick={() => { setShowAuthModal(false); navigate('/register'); }} className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50">
              Daftar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}