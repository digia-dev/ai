import { useState, useRef, useCallback } from 'react';
import { apiFetch, apiFetchStream } from '../lib/api';

interface Citation {
  title: string;
  url: string;
  snippet: string;
  score: number;
}

interface Message {
  id: number;
  role: string;
  content: string;
  outputFiles?: any[];
  tokensUsed?: number;
  citations?: Citation[];
  relatedQuestions?: string[];
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
  const [focusMode, setFocusMode] = useState<string>('general');
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

  const regenerateMessage = useCallback(async (conversationId: number) => {
    if (loading) return;
    setLoading(true);
    setIsStreaming(true);
    setStreamingContent('');

    const assistantMsgId = Date.now() + 1;

    setMessages(prev => [...prev, {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      outputFiles: [],
      tokensUsed: 0,
      citations: [],
      relatedQuestions: [],
      createdAt: new Date().toISOString(),
    }]);

    try {
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const url = options.agentId ? '/api/agents/chat/stream' : '/api/chat/stream';
      const body = options.agentId
        ? { agentId: options.agentId, conversationId, message: '' }
        : { conversationId, message: '' };

      const res = await apiFetchStream(url, {
        method: 'POST',
        body: JSON.stringify({ ...body, regenerate: true }),
        signal: abortController.signal,
      });

      if (!res.ok) throw new Error('Gagal regenerate');

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulated = '';
      let finalCitations: Citation[] = [];
      let finalRelatedQuestions: string[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          if (trimmed.startsWith('data: ')) {
            const data = trimmed.slice(6);
            try {
              const parsed = JSON.parse(data);
              if (parsed.chunk) {
                accumulated += parsed.chunk;
                setStreamingContent(accumulated);
              }
              if (parsed.conversationId) {
                finalCitations = parsed.citations || [];
                finalRelatedQuestions = parsed.relatedQuestions || [];
                setMessages(prev => prev.map(m =>
                  m.id === assistantMsgId
                    ? { ...m, content: accumulated, outputFiles: parsed.files || [], citations: finalCitations, relatedQuestions: finalRelatedQuestions }
                    : m
                ));
              }
            } catch {}
          }
        }
      }

      setMessages(prev => prev.map(m =>
        m.id === assistantMsgId
          ? { ...m, content: accumulated, citations: finalCitations, relatedQuestions: finalRelatedQuestions }
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
  }, [options.agentId, loading, loadConversations]);

  const editMessage = useCallback(async (conversationId: number, msgId: number, newContent: string) => {
    if (!currentConvId) return;

    try {
      const url = `/api/conversations/${conversationId}/messages/${msgId}`;
      const res = await apiFetch(url, {
        method: 'PUT',
        body: JSON.stringify({ content: newContent }),
      });
      if (res.ok) {
        setMessages(prev => {
          const idx = prev.findIndex(m => m.id === msgId);
          if (idx === -1) return prev;
          const updated = [...prev];
          updated[idx] = { ...updated[idx], content: newContent };
          return updated.slice(0, idx + 1);
        });
        setLoading(true);
        setIsStreaming(true);
        setStreamingContent('');

        const assistantMsgId = Date.now() + 1;

        setMessages(prev => [...prev, {
          id: assistantMsgId,
          role: 'assistant',
          content: '',
          outputFiles: [],
          tokensUsed: 0,
          citations: [],
          relatedQuestions: [],
          createdAt: new Date().toISOString(),
        }]);

        const streamUrl = options.agentId ? '/api/agents/chat/stream' : '/api/chat/stream';
        const body = options.agentId
          ? { agentId: options.agentId, conversationId, message: '' }
          : { conversationId, message: '' };

        const streamRes = await apiFetchStream(streamUrl, {
          method: 'POST',
          body: JSON.stringify({ ...body, message: newContent }),
        });

        if (!streamRes.ok) throw new Error('Gagal regenerate setelah edit');

        const reader = streamRes.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let accumulated = '';
        let finalCitations: Citation[] = [];
        let finalRelatedQuestions: string[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            if (trimmed.startsWith('data: ')) {
              const data = trimmed.slice(6);
              try {
                const parsed = JSON.parse(data);
                if (parsed.chunk) {
                  accumulated += parsed.chunk;
                  setStreamingContent(accumulated);
                }
                if (parsed.conversationId) {
                  finalCitations = parsed.citations || [];
                  finalRelatedQuestions = parsed.relatedQuestions || [];
                  setMessages(prev => prev.map(m =>
                    m.id === assistantMsgId
                      ? { ...m, content: accumulated, outputFiles: parsed.files || [], citations: finalCitations, relatedQuestions: finalRelatedQuestions }
                      : m
                  ));
                }
              } catch {}
            }
          }
        }

        setMessages(prev => prev.map(m =>
          m.id === assistantMsgId
            ? { ...m, content: accumulated, citations: finalCitations, relatedQuestions: finalRelatedQuestions }
            : m
        ));

        loadConversations();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setIsStreaming(false);
      setStreamingContent('');
      abortControllerRef.current = null;
    }
  }, [currentConvId, options.agentId, loadConversations]);

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
      citations: [],
      relatedQuestions: [],
      createdAt: new Date().toISOString(),
    }]);

    try {
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const url = options.agentId ? '/api/agents/chat/stream' : '/api/chat/stream';
      const body = options.agentId
        ? { agentId: options.agentId, conversationId: currentConvId, message: text, focusMode }
        : { conversationId: currentConvId, message: text, focusMode };

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
      let finalCitations: Citation[] = [];
      let finalRelatedQuestions: string[] = [];

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
                finalCitations = parsed.citations || [];
                finalRelatedQuestions = parsed.relatedQuestions || [];
                setMessages(prev => prev.map(m =>
                  m.id === assistantMsgId
                    ? { ...m, content: accumulated, outputFiles: parsed.files || [], conversationId: parsed.conversationId, citations: finalCitations, relatedQuestions: finalRelatedQuestions }
                    : m
                ));
              }
            } catch {}
          }
        }
      }

      setMessages(prev => prev.map(m =>
        m.id === assistantMsgId
          ? { ...m, content: accumulated, citations: finalCitations, relatedQuestions: finalRelatedQuestions }
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
  }, [options.agentId, currentConvId, loading, loadConversations, focusMode]);

  return {
    conversations,
    currentConvId,
    messages,
    loading,
    error,
    streamingContent,
    isStreaming,
    focusMode,
    setFocusMode,
    messagesEndRef,
    loadConversations,
    loadMessages,
    selectConversation,
    newChat,
    deleteConversation,
    sendMessage,
    stopGeneration,
    regenerateMessage,
    editMessage,
    setCurrentConvId,
    setMessages,
  };
}
