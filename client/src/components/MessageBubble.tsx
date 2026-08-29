import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import { Copy, Check, RotateCw, Pencil, ExternalLink, Volume2, VolumeX } from 'lucide-react';

interface MessageBubbleProps {
  role: string;
  content: string;
  createdAt?: string;
  isLast?: boolean;
  onRegenerate?: () => void;
  onEdit?: (newContent: string) => void;
  isEditing?: boolean;
  onCancelEdit?: () => void;
  onArtifactClick?: (language: string, content: string, title?: string) => void;
  isSpeaking?: boolean;
  onSpeak?: () => void;
  onStopSpeak?: () => void;
}

function CodeBlock({ children, className, onArtifactClick, ...props }: any) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const codeContent = String(children).trim();

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(codeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClick = () => {
    if (onArtifactClick && codeContent.length > 50) {
      onArtifactClick(language, codeContent);
    }
  };

  if (className) {
    return (
      <div className="relative group cursor-pointer" onClick={handleClick}>
        {language && (
          <span className="absolute top-2 left-3 text-[10px] text-gray-400 font-mono">{language}</span>
        )}
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {codeContent.length > 50 && (
            <button
              onClick={(e) => { e.stopPropagation(); onArtifactClick?.(language, codeContent); }}
              className="text-gray-400 hover:text-white p-1 rounded bg-gray-700/50"
              title="Buka di panel"
            >
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={handleCopy}
            className="text-gray-400 hover:text-white p-1 rounded bg-gray-700/50"
            title="Salin kode"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
        <pre className={className} {...props}>
          {children}
        </pre>
      </div>
    );
  }

  return (
    <code className={className} {...props}>
      {children}
    </code>
  );
}

export default function MessageBubble({
  role,
  content,
  createdAt,
  isLast = false,
  onRegenerate,
  onEdit,
  isEditing = false,
  onCancelEdit,
  onArtifactClick,
  isSpeaking = false,
  onSpeak,
  onStopSpeak,
}: MessageBubbleProps) {
  const isUser = role === 'user';
  const [copied, setCopied] = useState(false);
  const [editContent, setEditContent] = useState(content);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== content) {
      onEdit?.(editContent);
    }
    onCancelEdit?.();
  };

  return (
    <div className={`flex gap-3 mb-6 group ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-black dark:bg-gray-600 text-white dark:text-gray-200 flex items-center justify-center text-xs font-bold shrink-0 mt-1">
          T
        </div>
      )}

      <div className={`max-w-[85%] relative ${isUser ? 'order-1' : ''}`}>
        <div className={`text-sm leading-relaxed px-4 py-3 ${
          isUser
            ? 'bg-gray-100 dark:bg-gray-700 text-black dark:text-white rounded-2xl rounded-br-md'
            : 'prose prose-sm dark:prose-invert prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2 prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800 prose-pre:p-3 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-code:text-sm prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-normal prose-strong:font-semibold prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:underline prose-table:border-collapse prose-th:border prose-th:border-gray-200 dark:prose-th:border-gray-600 prose-th:px-3 prose-th:py-1.5 prose-th:text-left prose-td:border prose-td:border-gray-200 dark:prose-td:border-gray-600 prose-td:px-3 prose-td:py-1.5'
        }`}>
          {isUser ? (
            isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm outline-none resize-none min-h-[60px] dark:text-white"
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={onCancelEdit}
                    className="px-3 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-3 py-1 text-xs bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                  >
                    Simpan
                  </button>
                </div>
              </div>
            ) : (
              <span className="whitespace-pre-wrap">{content}</span>
            )
          ) : (
            <ReactMarkdown
              rehypePlugins={[rehypeHighlight]}
              components={{
                pre: ({ children, ...props }) => (
                  <CodeBlock {...props} onArtifactClick={onArtifactClick}>{children}</CodeBlock>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
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
          {isUser && !isEditing && onEdit && (
            <button
              onClick={() => {
                setEditContent(content);
                onEdit(content);
              }}
              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-black transition-opacity"
              title="Edit"
            >
              <Pencil className="w-3 h-3" />
            </button>
          )}
          {!isUser && isLast && onRegenerate && (
            <button
              onClick={onRegenerate}
              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-black transition-opacity"
              title="Regenerate"
            >
              <RotateCw className="w-3 h-3" />
            </button>
          )}
          {!isUser && onSpeak && (
            <button
              onClick={isSpeaking ? onStopSpeak : onSpeak}
              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-black transition-opacity"
              title={isSpeaking ? 'Stop' : 'Dengarkan'}
            >
              {isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
