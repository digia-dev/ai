import { useState, useRef, useCallback } from 'react';
import { apiFetch, apiFetchStream } from '../lib/api';

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
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

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

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    setLoading(true);
    setIsStreaming(true);
    setStreamingContent('');
    setError(null);
    setMessages(prev => [...prev, {
      id: Date.now(),
      role: 'user',
      content: text,
      outputFiles: [],
      tokensUsed: 0,
      createdAt: new Date().toISOString(),
    }]);

    const userMsgId = Date.now();
    const assistantMsgId = userMsgId + 1;

    setMessages(prev => [...prev, {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      outputFiles: [],
      tokensUsed: 0,
      createdAt: new Date().toISOString(),
    }]);

    try {
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const url = options.agentId ? '/api/agents/chat/stream' : '/api/chat/stream';
      const body = options.agentId
        ? { agentId: options.agentId, conversationId: currentConvId, message: text }
        : { conversationId: currentConvId, message: text };

      const res = await apiFetchStream(url, {
        method: 'POST',
        body: JSON.stringify(body),
        signal: abortController.signal,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          if (trimmed.startsWith('event: error')) {
            const errorLine = lines[lines.indexOf(line) + 1];
            if (errorLine) {
              try {
                const errData = JSON.parse(errorLine.replace('data: ', ''));
                throw new Error(errData.error);
              } catch {}
            }
          }

          if (trimmed.startsWith('data: ')) {
            const data = trimmed.slice(6);
            try {
              const parsed = JSON.parse(data);
              if (parsed.chunk) {
                accumulated += parsed.chunk;
                setStreamingContent(accumulated);
              }
              if (parsed.conversationId) {
                setCurrentConvId(parsed.conversationId);
                setMessages(prev => prev.map(m =>
                  m.id === assistantMsgId
                    ? { ...m, content: accumulated, outputFiles: parsed.files || [], conversationId: parsed.conversationId }
                    : m
                ));
              }
            } catch {}
          }
        }
      }

      setMessages(prev => prev.map(m =>
        m.id === assistantMsgId
          ? { ...m, content: accumulated }
          : m
      ));

      loadConversations();
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setMessages(prev => prev.filter(m => m.id !== assistantMsgId));
      } else {
        setError(err.message);
        setMessages(prev => prev.map(m =>
          m.id === assistantMsgId
            ? { ...m, content: `Maaf, terjadi kesalahan: ${err.message}` }
            : m
        ));
      }
    } finally {
      setLoading(false);
      setIsStreaming(false);
      setStreamingContent('');
      abortControllerRef.current = null;
    }
  }, [options.agentId, currentConvId, loading, loadConversations]);

  return {
    conversations,
    currentConvId,
    messages,
    loading,
    error,
    streamingContent,
    isStreaming,
    messagesEndRef,
    loadConversations,
    loadMessages,
    selectConversation,
    newChat,
    deleteConversation,
    sendMessage,
    stopGeneration,
    setCurrentConvId,
    setMessages,
  };
}
