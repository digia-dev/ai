interface MessageBubbleProps {
  role: string;
  content: string;
}

export default function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className="flex gap-3 max-w-2xl mx-auto mb-4">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
          isUser ? 'bg-gray-200 text-black' : 'bg-black text-white'
        }`}
      >
        {isUser ? 'U' : 'T'}
      </div>
      <div className="text-sm leading-relaxed whitespace-pre-wrap flex-1 pt-1">
        {content}
      </div>
    </div>
  );
}
