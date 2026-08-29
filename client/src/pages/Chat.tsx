import { useState, useEffect } from 'react';
import { useChat } from '../hooks/useChat';
import { useVoice } from '../hooks/useVoice';
import { useArtifacts } from '../hooks/useArtifacts';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useTranslation } from '../hooks/useTranslation';
import { useTTS } from '../hooks/useTTS';
import MessageBubble from '../components/MessageBubble';
import StreamingBubble from '../components/StreamingBubble';
import ClarificationCard from '../components/ClarificationCard';
import CitationsCard from '../components/CitationsCard';
import RelatedQuestions from '../components/RelatedQuestions';
import FocusModeSelector from '../components/FocusModeSelector';
import ChatInput from '../components/ChatInput';
import ArtifactPanel from '../components/ArtifactPanel';
import ExportMenu from '../components/ExportMenu';
import BranchSelector from '../components/BranchSelector';
import SummaryCard from '../components/SummaryCard';
import PromptTemplates from '../components/PromptTemplates';
import ImageGenerator from '../components/ImageGenerator';
import CodeRunner from '../components/CodeRunner';
import ImageInput from '../components/ImageInput';
import ModelCompare from '../components/ModelCompare';
import ConversationComments from '../components/ConversationComments';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import WebhooksManager from '../components/WebhooksManager';
import LanguageToggle from '../components/LanguageToggle';
import { SkeletonChat } from '../components/Skeleton';
import { toast } from '../components/Toast';
import { Sparkles, Square, Code, Keyboard, BarChart3, Webhook } from 'lucide-react';
import { apiFetch } from '../lib/api';

interface Clarification {
  question: string;
  options: Array<{ id: string; label: string; description: string }>;
}

export default function Chat() {
  const {
    messages, loading, streamingContent, isStreaming, focusMode, setFocusMode, messagesEndRef,
    loadConversations, sendMessage, stopGeneration, currentConvId, regenerateMessage, editMessage,
    branches, currentBranchId, loadBranches, switchBranch, createBranch,
  } = useChat();
  const { locale, toggleLocale, t } = useTranslation();
  const [input, setInput] = useState('');
  const [clarification, setClarification] = useState<Clarification | null>(null);
  const [chatTitle, setChatTitle] = useState(t('chat.new'));
  const [uploading, setUploading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [editingMsgId, setEditingMsgId] = useState<number | null>(null);
  const [showArtifactPanel, setShowArtifactPanel] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showWebhooks, setShowWebhooks] = useState(false);

  const { artifacts, activeArtifactId, selectArtifact, closeArtifact } = useArtifacts(messages);
  const { isSpeaking, speak, stop: stopSpeak } = useTTS();

  const { isRecording, toggle: toggleVoice } = useVoice({
    onResult: (transcript) => setInput(prev => prev + transcript),
  });

  useKeyboardShortcuts({
    'ctrl+k': () => setShowShortcuts(s => !s),
    'ctrl+n': () => {
      setInput('');
      setChatTitle(t('chat.new'));
    },
    'ctrl+enter': () => {
      if (input.trim()) handleSend();
    },
    'escape': () => {
      if (isStreaming) stopGeneration();
      if (showArtifactPanel) { setShowArtifactPanel(false); closeArtifact(); }
    },
  });

  useEffect(() => {
    loadConversations().finally(() => setInitialLoading(false));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  useEffect(() => {
    if (artifacts.length > 0 && !showArtifactPanel) {
      setShowArtifactPanel(true);
    }
  }, [artifacts.length]);

  useEffect(() => {
    if (currentConvId) loadBranches(currentConvId);
  }, [currentConvId, loadBranches]);

  const handleSend = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');
    setClarification(null);
    setChatTitle(msg.slice(0, 50));
    await sendMessage(msg);
  };

  const handleRegenerate = async () => {
    if (!currentConvId || loading) return;
    setChatTitle(t('chat.regenerating'));
    await regenerateMessage(currentConvId);
  };

  const handleEdit = async (msgId: number, newContent: string) => {
    if (!currentConvId || loading) return;
    setEditingMsgId(null);
    setChatTitle(t('chat.editing'));
    await editMessage(currentConvId, msgId, newContent);
  };

  const handleArtifactClick = () => {
    setShowArtifactPanel(true);
  };

  const handleSwitchBranch = async (branchId: number) => {
    if (!currentConvId) return;
    await switchBranch(currentConvId, branchId);
  };

  const handleCreateBranch = async (name: string) => {
    if (!currentConvId) return;
    const branch = await createBranch(currentConvId, name);
    if (branch) {
      await switchBranch(currentConvId, branch.id);
      toast.success(`Branch "${name}" dibuat`);
    }
  };

  const handleTemplateSelect = (prompt: string) => {
    setInput(prompt.replace('{input}', ''));
  };

  const handleUpload = async (files: FileList) => {
    setUploading(true);
    let successCount = 0;
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiFetch('/api/sources', { method: 'POST', body: formData });
      if (res.ok) successCount++;
    }
    setUploading(false);
    if (successCount > 0) toast.success(`${successCount} sumber berhasil diunggah`);
  };

  const suggestions = [
    'Bantu saya analisis dokumen yang diunggah',
    'Apa yang bisa kamu lakukan?',
    'Rencanakan meeting tim minggu depan',
    'Ceritakan tentang ekosistem Giantara',
  ];

  if (initialLoading) return <SkeletonChat />;

  return (
    <>
      <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold dark:text-white">{chatTitle}</span>
          <BranchSelector
            branches={branches}
            currentBranchId={currentBranchId}
            onSwitchBranch={handleSwitchBranch}
            onCreateBranch={handleCreateBranch}
          />
        </div>
        <div className="flex items-center gap-2">
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
          {messages.length > 0 && (
            <ExportMenu messages={messages} title={chatTitle} />
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
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 py-5">
            {messages.length === 0 && !clarification && (
              <div className="text-center py-20 max-w-md mx-auto">
                <Sparkles className="w-10 h-10 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <h2 className="text-xl font-bold mb-2 dark:text-white">Halo, saya Tara</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Asisten AI untuk ekosistem Giantara. Tanya apa saja, atau unggah sumber untuk dianalisis.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(s)}
                      className="text-left p-3 border border-gray-200 dark:border-gray-600 rounded-lg text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors dark:text-gray-300"
                    >
                      {s}
                    </button>
                  ))}
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
                    isSpeaking={isSpeaking}
                    onSpeak={() => speak(m.content)}
                    onStopSpeak={stopSpeak}
                  />
                  {m.citations && m.citations.length > 0 && (
                    <CitationsCard citations={m.citations} />
                  )}
                  {m.relatedQuestions && m.relatedQuestions.length > 0 && (
                    <RelatedQuestions questions={m.relatedQuestions} onQuestionClick={handleSend} />
                  )}
                </div>
              );
            })}

            {clarification && (
              <ClarificationCard
                question={clarification.question}
                options={clarification.options}
                onSelect={(label) => handleSend(label)}
              />
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="px-5 py-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5 overflow-x-auto flex-1 min-w-0">
              <PromptTemplates onSelect={handleTemplateSelect} />
              <ImageGenerator />
              <CodeRunner />
              {currentConvId && <ConversationComments conversationId={currentConvId} />}
              <ImageInput onImageAnalyzed={(desc) => setInput(prev => prev + '\n\n' + desc)} />
              <ModelCompare />
              <button
                onClick={() => setShowAnalytics(true)}
                className="flex items-center gap-1 px-2 py-1.5 text-xs text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors shrink-0"
                title={t('chat.analytics')}
              >
                <BarChart3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowWebhooks(true)}
                className="flex items-center gap-1 px-2 py-1.5 text-xs text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors shrink-0"
                title={t('chat.webhooks')}
              >
                <Webhook className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowShortcuts(true)}
                className="flex items-center gap-1 px-2 py-1.5 text-xs text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors shrink-0"
                title={t('chat.shortcuts')}
              >
                <Keyboard className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <LanguageToggle locale={locale} onToggle={toggleLocale} />
              <span className="text-[10px] text-gray-400">Ctrl+K</span>
            </div>
          </div>

          <ChatInput
            input={input}
            setInput={setInput}
            onSend={handleSend}
            onUpload={handleUpload}
            onVoice={toggleVoice}
            isRecording={isRecording}
            loading={loading}
            uploading={uploading}
            placeholder={t('chat.placeholder')}
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

      <AnalyticsDashboard isOpen={showAnalytics} onClose={() => setShowAnalytics(false)} />
      <WebhooksManager isOpen={showWebhooks} onClose={() => setShowWebhooks(false)} />

      {showShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowShortcuts(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold mb-4 dark:text-white">{t('chat.shortcuts')}</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-300">{t('chat.send')}</span><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px]">Ctrl+Enter</kbd></div>
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-300">{t('chat.new')}</span><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px]">Ctrl+N</kbd></div>
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-300">{t('chat.stop')}</span><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px]">Esc</kbd></div>
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-300">{t('chat.shortcuts')}</span><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px]">Ctrl+K</kbd></div>
            </div>
            <button onClick={() => setShowShortcuts(false)} className="mt-4 w-full py-2 text-xs bg-black dark:bg-white text-white dark:text-black rounded-lg">Tutup</button>
          </div>
        </div>
      )}
    </>
  );
}
