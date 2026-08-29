import { useState } from 'react';
import { FileText, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { apiFetch } from '../lib/api';

interface SummaryCardProps {
  conversationId: number;
}

export default function SummaryCard({ conversationId }: SummaryCardProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const generateSummary = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/conversations/${conversationId}/summary`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary);
      }
    } catch {}
    setLoading(false);
  };

  if (!summary && !loading) {
    return (
      <button
        onClick={generateSummary}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
      >
        <FileText className="w-3 h-3" />
        Ringkas
      </button>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 mb-4">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs font-semibold dark:text-white">Ringkasan Percakapan</span>
        </div>
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
        ) : (
          isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        )}
      </div>

      {isExpanded && summary && (
        <div className="mt-2 text-xs text-gray-600 dark:text-gray-300 prose prose-xs dark:prose-invert max-w-none whitespace-pre-wrap">
          {summary}
        </div>
      )}
    </div>
  );
}
