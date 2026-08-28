import ReactMarkdown from 'react-markdown';

interface MessageBubbleProps {
  role: string;
  content: string;
}

export default function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end mb-6">
        <div className="max-w-[85%] bg-gray-800 text-white rounded-2xl rounded-br-md px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start gap-3 mb-6">
      <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold shrink-0 mt-1">
        T
      </div>
      <div className="max-w-[85%] text-sm leading-relaxed prose prose-sm prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2 prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-pre:bg-gray-100 prose-pre:p-3 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-code:text-sm prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-normal prose-strong:font-semibold prose-a:text-blue-600 prose-a:underline prose-table:border-collapse prose-th:border prose-th:border-gray-200 prose-th:px-3 prose-th:py-1.5 prose-th:text-left prose-td:border prose-td:border-gray-200 prose-td:px-3 prose-td:py-1.5">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
}
