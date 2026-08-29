import { useState, useEffect } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';
import { apiFetch } from '../lib/api';

interface Comment {
  id: number;
  content: string;
  userName: string;
  createdAt: string;
}

interface ConversationCommentsProps {
  conversationId: number;
}

export default function ConversationComments({ conversationId }: ConversationCommentsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    if (isOpen) {
      apiFetch(`/api/conversations/${conversationId}/comments`)
        .then(r => r.ok ? r.json() : [])
        .then(setComments)
        .catch(() => {});
    }
  }, [isOpen, conversationId]);

  const handleSend = async () => {
    if (!newComment.trim()) return;
    const res = await apiFetch(`/api/conversations/${conversationId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content: newComment.trim() }),
    });
    if (res.ok) {
      const comment = await res.json();
      setComments(prev => [...prev, { ...comment, userName: 'Anda' }]);
      setNewComment('');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        title="Komentar"
      >
        <MessageSquare className="w-3.5 h-3.5" />
        {comments.length > 0 && <span>{comments.length}</span>}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute bottom-full mb-2 right-0 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg w-[320px] max-h-[400px] flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <span className="text-sm font-semibold dark:text-white">Komentar</span>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-black dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[100px]">
              {comments.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">Belum ada komentar</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold dark:text-white">{comment.userName}</span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(comment.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300">{comment.content}</p>
                  </div>
                ))
              )}
            </div>

            <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Tambah komentar..."
                  className="flex-1 px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 outline-none dark:text-white"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={!newComment.trim()}
                  className="w-8 h-8 flex items-center justify-center bg-black dark:bg-white text-white dark:text-black rounded-lg disabled:opacity-30"
                >
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
