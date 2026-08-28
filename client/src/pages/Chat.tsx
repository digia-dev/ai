import { useState, useEffect } from 'react';
import { useChat } from '../hooks/useChat';
import { useVoice } from '../hooks/useVoice';
import MessageBubble from '../components/MessageBubble';
import ClarificationCard from '../components/ClarificationCard';
import ChatInput from '../components/ChatInput';
import { SkeletonChat } from '../components/Skeleton';
import { toast } from '../components/Toast';
import { Sparkles } from 'lucide-react';
import { apiFetch } from '../lib/api';

interface Clarification {
  question: string;
  options: Array<{ id: string; label: string; description: string }>;
}

export default function Chat() {
  const {
    currentConvId, messages, loading, messagesEndRef,
    loadConversations, sendMessage,
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
  }, [messages]);

  const handleSend = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');
    setClarification(null);
    setChatTitle(msg.slice(0, 50));

    try {
      const res = await apiFetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ conversationId: currentConvId, message: msg }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      try {
        const parsed = JSON.parse(data.content);
        if (parsed.needs_clarification && parsed.question) {
          setClarification({ question: parsed.question, options: parsed.options || [] });
        } else {
          await sendMessage(msg);
        }
      } catch {
        await sendMessage(msg);
      }
    } catch (err: any) {
      toast.error(err.message);
    }
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
      <div className="px-5 py-3 border-b border-gray-200">
        <span className="text-sm font-semibold">{chatTitle}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        {messages.length === 0 && !clarification && (
          <div className="text-center py-20 max-w-md mx-auto">
            <Sparkles className="w-10 h-10 mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-bold mb-2">Halo, saya Tara</h2>
            <p className="text-sm text-gray-500 mb-6">
              Asisten AI untuk ekosistem Giantara. Tanya apa saja, atau unggah sumber untuk dianalisis.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(s)}
                  className="text-left p-3 border border-gray-200 rounded-lg text-xs hover:bg-gray-50 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <MessageBubble key={m.id} role={m.role} content={m.content} createdAt={m.createdAt} />
        ))}

        {clarification && (
          <ClarificationCard
            question={clarification.question}
            options={clarification.options}
            onSelect={(label) => handleSend(label)}
          />
        )}

        {loading && (
          <div className="flex gap-3 max-w-2xl mx-auto mb-4">
            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold shrink-0">T</div>
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
