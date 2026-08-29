import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';

interface StreamingBubbleProps {
  content: string;
}

export default function StreamingBubble({ content }: StreamingBubbleProps) {
  return (
    <div className="flex gap-3 mb-6 justify-start">
      <div className="w-8 h-8 rounded-full bg-black dark:bg-gray-600 text-white dark:text-gray-200 flex items-center justify-center text-xs font-bold shrink-0 mt-1">
        T
      </div>

      <div className="max-w-[85%]">
        <div className="text-sm leading-relaxed px-4 py-3 prose prose-sm dark:prose-invert prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2 prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800 prose-pre:p-3 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-code:text-sm prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-normal prose-strong:font-semibold prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:underline prose-table:border-collapse prose-th:border prose-th:border-gray-200 dark:prose-th:border-gray-600 prose-th:px-3 prose-th:py-1.5 prose-th:text-left prose-td:border prose-td:border-gray-200 dark:prose-td:border-gray-600 prose-td:px-3 prose-td:py-1.5">
          <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
            {content}
          </ReactMarkdown>
          <span className="inline-block w-0.5 h-4 bg-black animate-pulse ml-0.5 align-middle" />
        </div>
      </div>
    </div>
  );
}
