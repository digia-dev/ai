import { ExternalLink, Globe } from 'lucide-react';

interface Citation {
  title: string;
  url: string;
  snippet: string;
  score: number;
}

interface CitationsCardProps {
  citations: Citation[];
  compact?: boolean;
}

function getFaviconUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
  } catch {
    return '';
  }
}

export default function CitationsCard({ citations, compact = false }: CitationsCardProps) {
  if (!citations || citations.length === 0) return null;

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1.5 mb-3 pl-11">
        {citations.map((c, i) => (
          <a
            key={i}
            href={c.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-[11px] hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
          >
            <span className="w-4 h-4 rounded bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-[9px] font-bold shrink-0">
              {i + 1}
            </span>
            <span className="text-gray-700 dark:text-gray-300 truncate max-w-[120px]">
              {new URL(c.url).hostname.replace('www.', '')}
            </span>
          </a>
        ))}
      </div>
    );
  }

  return (
    <div className="mb-4 pl-11">
      <div className="flex items-center gap-2 mb-2">
        <Globe className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {citations.length} sumber
        </span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {citations.map((c, i) => {
          const faviconUrl = getFaviconUrl(c.url);
          let hostname = '';
          try {
            hostname = new URL(c.url).hostname.replace('www.', '');
          } catch {}

          return (
            <a
              key={i}
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 w-[200px] p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
            >
              <div className="flex items-center gap-2 mb-1.5">
                {faviconUrl ? (
                  <img src={faviconUrl} alt="" className="w-4 h-4 rounded-sm" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <div className="w-4 h-4 rounded-sm bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-[8px] text-gray-500">
                    {hostname.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{hostname}</span>
                <ExternalLink className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-auto" />
              </div>
              <div className="text-xs font-medium text-gray-800 dark:text-gray-200 line-clamp-2 leading-snug">
                {c.title}
              </div>
              {c.snippet && (
                <div className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-1 leading-relaxed">
                  {c.snippet}
                </div>
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
}
