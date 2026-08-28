import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { removeToken } from '../lib/auth';
import Sidebar from '../components/Sidebar';
import MessageBubble from '../components/MessageBubble';
import ClarificationCard from '../components/ClarificationCard';
import { Menu, Paperclip, Mic, MicOff, ArrowUp, Loader2, Sparkles } from 'lucide-react';

interface Conversation {
  id: number;
  title: string;
}

interface Message {
  id: number;
  role: string;
  content: string;
}

interface Clarification {
  question: string;
  options: Array<{ id: string; label: string; description: string }>;
}

export default function Chat() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConvId, setCurrentConvId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [clarification, setClarification] = useState<Clarification | null>(null);
  const [chatTitle, setChatTitle] = useState('New Chat');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const loadConversations = async () => {
    try {
      const res = await apiFetch('/api/conversations');
      if (res.ok) setConversations(await res.json());
    } catch {}
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async (convId: number) => {
    try {
      const res = await apiFetch(`/api/conversations/${convId}/messages`);
      if (res.ok) setMessages(await res.json());
    } catch {}
  };

  const handleNewChat = () => {
    setCurrentConvId(null);
    setMessages([]);
    setChatTitle('New Chat');
    setClarification(null);
  };

  const handleSelectConversation = (id: number, title: string) => {
    setCurrentConvId(id);
    setChatTitle(title);
    setClarification(null);
    loadMessages(id);
    setSidebarOpen(false);
  };

  const handleDeleteConversation = async (id: number) => {
    if (!confirm('Delete this conversation?')) return;
    await apiFetch(`/api/conversations/${id}`, { method: 'DELETE' });
    if (currentConvId === id) handleNewChat();
    loadConversations();
  };

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;

    setInput('');
    setClarification(null);
    setMessages((prev) => [...prev, { id: Date.now(), role: 'user', content: msg }]);
    setLoading(true);

    try {
      const res = await apiFetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ conversationId: currentConvId, message: msg }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setCurrentConvId(data.conversationId);
      setChatTitle(msg.slice(0, 50));

      try {
        const parsed = JSON.parse(data.content);
        if (parsed.needs_clarification && parsed.question) {
          setClarification({
            question: parsed.question,
            options: parsed.options || [],
          });
        } else {
          setMessages((prev) => [...prev, { id: Date.now(), role: 'assistant', content: data.content }]);
        }
      } catch {
        setMessages((prev) => [...prev, { id: Date.now(), role: 'assistant', content: data.content }]);
      }

      loadConversations();
    } catch (err: any) {
      setMessages((prev) => [...prev, { id: Date.now(), role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (files: FileList) => {
    setUploading(true);
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);
      await apiFetch('/api/sources', { method: 'POST', body: formData });
    }
    setUploading(false);
  };

  const startVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Browser tidak mendukung voice input');
      return;
    }

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'id-ID';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => prev + transcript);
    };

    recognition.onend = () => {
      setIsRecording(false);
      recognitionRef.current = null;
    };

    recognition.onerror = () => {
      setIsRecording(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  const suggestions = [
    'Help me analyze my uploaded documents',
    'What can you do?',
    '#input saya akan meeting dengan TIM 28 agustus jam 2 siang',
    'Tell me about the Giantara ecosystem',
  ];

  return (
    <div className="flex h-screen bg-white">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 md:relative md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar
          conversations={conversations}
          currentConvId={currentConvId}
          onNewChat={handleNewChat}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={handleDeleteConversation}
          onShowSources={() => navigate('/sources')}
          onLogout={handleLogout}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center"
          >
            <Menu className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold">{chatTitle}</span>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {messages.length === 0 && !clarification && (
            <div className="text-center py-20 max-w-md mx-auto">
              <Sparkles className="w-10 h-10 mx-auto mb-4 text-gray-400" />
              <h2 className="text-xl font-bold mb-2">Hi, I'm Tara</h2>
              <p className="text-sm text-gray-500 mb-6">
                AI assistant for the Giantara ecosystem. Ask me anything, or upload sources for analysis.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s)}
                    className="text-left p-3 border border-gray-200 rounded-lg text-xs hover:bg-gray-50 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <MessageBubble key={m.id} role={m.role} content={m.content} />
          ))}

          {clarification && (
            <ClarificationCard
              question={clarification.question}
              options={clarification.options}
              onSelect={(label) => sendMessage(label)}
            />
          )}

          {loading && (
            <div className="flex gap-3 max-w-2xl mx-auto mb-4">
              <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold shrink-0">
                T
              </div>
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
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-black shrink-0 disabled:opacity-50"
              title="Upload source"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Paperclip className="w-5 h-5" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.docx,.doc,.txt,.md,.csv,.html"
              multiple
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            />

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ask Tara anything..."
              rows={1}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none resize-none min-h-[44px] max-h-[200px] focus:border-black"
            />

            <button
              onClick={startVoice}
              className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-colors ${
                isRecording
                  ? 'border-red-300 bg-red-50 text-red-500 animate-pulse-recording'
                  : 'border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-black'
              }`}
              title={isRecording ? 'Stop recording' : 'Voice input'}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center shrink-0 hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
