import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Check } from 'lucide-react';

interface MessageBubbleProps {
  role: string;
  content: string;
  createdAt?: string;
}

export default function MessageBubble({ role, content, createdAt }: MessageBubbleProps) {
  const isUser = role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex gap-3 mb-6 group ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold shrink-0 mt-1">
          T
        </div>
      )}

      <div className={`max-w-[85%] relative ${isUser ? 'order-1' : ''}`}>
        <div className={`text-sm leading-relaxed px-4 py-3 ${
          isUser
            ? 'bg-gray-100 text-black rounded-2xl rounded-br-md'
            : 'prose prose-sm prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2 prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-pre:bg-gray-100 prose-pre:p-3 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-code:text-sm prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-normal prose-strong:font-semibold prose-a:text-blue-600 prose-a:underline prose-table:border-collapse prose-th:border prose-th:border-gray-200 prose-th:px-3 prose-th:py-1.5 prose-th:text-left prose-td:border prose-td:border-gray-200 prose-td:px-3 prose-td:py-1.5'
        }`}>
          {isUser ? (
            <span className="whitespace-pre-wrap">{content}</span>
          ) : (
            <ReactMarkdown>{content}</ReactMarkdown>
          )}
        </div>

        <div className={`flex items-center gap-2 mt-1 ${isUser ? 'justify-end' : ''}`}>
          {createdAt && (
            <span className="text-[10px] text-gray-400">
              {new Date(createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={handleCopy}
            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-black transition-opacity"
            title={copied ? 'Tersalin' : 'Salin'}
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      </div>
    </div>
  );
}
