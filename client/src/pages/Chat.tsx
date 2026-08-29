import { useState, useEffect } from 'react';
import { useChat } from '../hooks/useChat';
import { useVoice } from '../hooks/useVoice';
import MessageBubble from '../components/MessageBubble';
import StreamingBubble from '../components/StreamingBubble';
import ClarificationCard from '../components/ClarificationCard';
import ChatInput from '../components/ChatInput';
import { SkeletonChat } from '../components/Skeleton';
import { toast } from '../components/Toast';
import { Sparkles, Square } from 'lucide-react';
import { apiFetch } from '../lib/api';

interface Clarification {
  question: string;
  options: Array<{ id: string; label: string; description: string }>;
}

export default function Chat() {
  const {
    messages, loading, streamingContent, isStreaming, messagesEndRef,
    loadConversations, sendMessage, stopGeneration,
  } = useChat();
  const [input, setInput] = useState('');
  const [clarification, setClarification] = useState<Clarification | null>(null);
  const [chatTitle, setChatTitle] = useState('Chat Baru');
  const [uploading, setUploading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const { isRecording, toggle: toggleVoice } = useVoice({
    onResult: (transcript) => setInput(prev => prev + transcript),
  });

  useEffect(() => {
    loadConversations().finally(() => setInitialLoading(false));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handleSend = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');
    setClarification(null);
    setChatTitle(msg.slice(0, 50));
    await sendMessage(msg);
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
        <span className="text-sm font-semibold dark:text-white">{chatTitle}</span>
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

        {messages.map((m) => {
          if (m.role === 'assistant' && isStreaming && m.content === '' && streamingContent) {
            return <StreamingBubble key={m.id} content={streamingContent} />;
          }
          if (m.role === 'assistant' && isStreaming && m.id === messages[messages.length - 1]?.id && streamingContent) {
            return <StreamingBubble key={m.id} content={streamingContent} />;
          }
          return <MessageBubble key={m.id} role={m.role} content={m.content} createdAt={m.createdAt} />;
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

      <ChatInput
        input={input}
        setInput={setInput}
        onSend={handleSend}
        onUpload={handleUpload}
        onVoice={toggleVoice}
        isRecording={isRecording}
        loading={loading}
        uploading={uploading}
        placeholder="Tanya apa saja ke Tara..."
      />
    </>
  );
}
