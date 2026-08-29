import { ExternalLink } from 'lucide-react';

interface Citation {
  title: string;
  url: string;
  snippet: string;
  score: number;
}

interface CitationsCardProps {
  citations: Citation[];
}

export default function CitationsCard({ citations }: CitationsCardProps) {
  if (!citations || citations.length === 0) return null;

  return (
    <div className="mb-4 pl-11">
      <div className="flex flex-wrap gap-2">
        {citations.map((c, i) => (
          <a
            key={i}
            href={c.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors max-w-[300px]"
          >
            <span className="w-5 h-5 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-[10px] font-bold shrink-0">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-black dark:text-white truncate">{c.title}</div>
              <div className="text-gray-500 dark:text-gray-400 text-[10px] truncate">{new URL(c.url).hostname}</div>
            </div>
            <ExternalLink className="w-3 h-3 text-gray-400 shrink-0" />
          </a>
        ))}
      </div>
    </div>
  );
}
