import { useState, useRef, useCallback } from 'react';
import { apiFetch } from '../lib/api';

interface Message {
  id: number;
  role: string;
  content: string;
  outputFiles?: any[];
  tokensUsed?: number;
  createdAt?: string;
}

interface UseChatOptions {
  agentId?: number;
}

export function useChat(options: UseChatOptions = {}) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [currentConvId, setCurrentConvId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    try {
      const url = options.agentId
        ? `/api/agents/${options.agentId}/conversations`
        : '/api/conversations';
      const res = await apiFetch(url);
      if (res.ok) setConversations(await res.json());
    } catch {}
  }, [options.agentId]);

  const loadMessages = useCallback(async (convId: number) => {
    try {
      const url = options.agentId
        ? `/api/agents/conversations/${convId}/messages`
        : `/api/conversations/${convId}/messages`;
      const res = await apiFetch(url);
      if (res.ok) setMessages(await res.json());
    } catch {}
  }, [options.agentId]);

  const selectConversation = useCallback((id: number) => {
    setCurrentConvId(id);
    loadMessages(id);
    setError(null);
  }, [loadMessages]);

  const newChat = useCallback(() => {
    setCurrentConvId(null);
    setMessages([]);
    setError(null);
  }, []);

  const deleteConversation = useCallback(async (id: number) => {
    try {
      const url = options.agentId
        ? `/api/agents/conversations/${id}`
        : `/api/conversations/${id}`;
      await apiFetch(url, { method: 'DELETE' });
      if (currentConvId === id) newChat();
      loadConversations();
    } catch {}
  }, [options.agentId, currentConvId, newChat, loadConversations]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    setLoading(true);
    setError(null);
    setMessages(prev => [...prev, {
      id: Date.now(),
      role: 'user',
      content: text,
      outputFiles: [],
      tokensUsed: 0,
      createdAt: new Date().toISOString(),
    }]);

    try {
      const url = options.agentId ? '/api/agents/chat' : '/api/chat';
      const body = options.agentId
        ? { agentId: options.agentId, conversationId: currentConvId, message: text }
        : { conversationId: currentConvId, message: text };

      const res = await apiFetch(url, { method: 'POST', body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setCurrentConvId(data.conversationId);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.content,
        outputFiles: data.files || [],
        tokensUsed: data.tokensUsed || 0,
        createdAt: new Date().toISOString(),
      }]);

      loadConversations();
    } catch (err: any) {
      setError(err.message);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: `Maaf, terjadi kesalahan: ${err.message}`,
        outputFiles: [],
        tokensUsed: 0,
        createdAt: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  }, [options.agentId, currentConvId, loading, loadConversations]);

  return {
    conversations,
    currentConvId,
    messages,
    loading,
    error,
    messagesEndRef,
    loadConversations,
    loadMessages,
    selectConversation,
    newChat,
    deleteConversation,
    sendMessage,
    setCurrentConvId,
    setMessages,
  };
}
