import { useState } from 'react';
import { Layers, Loader2, X, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import { apiFetch } from '../lib/api';

const MODELS = [
  { id: 'deepseek/deepseek-chat-v3-0324:free', name: 'DeepSeek V3' },
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini Flash' },
  { id: 'qwen/qwen3-coder', name: 'Qwen Coder' },
  { id: 'mistralai/mistral-small-3.1-24b-instruct:free', name: 'Mistral' },
  { id: 'meta-llama/llama-4-scout:free', name: 'Llama 4' },
];

interface ModelCompareProps {
  onResult?: (results: Array<{ model: string; response: string }>) => void;
}

export default function ModelCompare({ onResult }: ModelCompareProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [selectedModels, setSelectedModels] = useState<string[]>(['deepseek/deepseek-chat-v3-0324:free', 'qwen/qwen3-coder']);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Array<{ model: string; response: string }>>([]);

  const toggleModel = (modelId: string) => {
    setSelectedModels(prev =>
      prev.includes(modelId) ? prev.filter(m => m !== modelId) : [...prev, modelId]
    );
  };

  const handleCompare = async () => {
    if (!prompt.trim() || selectedModels.length < 2 || loading) return;
    setLoading(true);
    setResults([]);

    const promises = selectedModels.map(async (model) => {
      try {
        const res = await apiFetch('/api/compare-models', {
          method: 'POST',
          body: JSON.stringify({ prompt: prompt.trim(), model }),
        });
        if (res.ok) {
          const data = await res.json();
          return { model, response: data.response };
        }
        return { model, response: 'Error: Gagal mendapatkan response' };
      } catch {
        return { model, response: 'Error: Terjadi kesalahan' };
      }
    });

    const allResults = await Promise.all(promises);
    setResults(allResults);
    onResult?.(allResults);
    setLoading(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        title="Bandingkan model"
      >
        <Layers className="w-3.5 h-3.5" />
        Compare
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute bottom-full mb-2 left-0 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg w-[500px] max-h-[500px] flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-semibold dark:text-white">Model Compare</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-black dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 flex-1 overflow-auto">
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Pilih Model (min 2)</span>
                <div className="flex flex-wrap gap-1">
                  {MODELS.map(model => (
                    <button
                      key={model.id}
                      onClick={() => toggleModel(model.id)}
                      className={`px-2 py-1 text-[10px] rounded-lg transition-colors ${
                        selectedModels.includes(model.id)
                          ? 'bg-black dark:bg-white text-white dark:text-black'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {model.name}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Masukkan prompt untuk dibandingkan..."
                className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 outline-none resize-none h-20 dark:text-white placeholder-gray-400"
              />

              <button
                onClick={handleCompare}
                disabled={!prompt.trim() || selectedModels.length < 2 || loading}
                className="w-full py-2 bg-black dark:bg-white text-white dark:text-black text-xs font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Comparing...
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-3 h-3" />
                    Bandingkan {selectedModels.length} Model
                  </>
                )}
              </button>

              {results.length > 0 && (
                <div className="space-y-3 mt-4">
                  <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Hasil</span>
                  {results.map((result, i) => (
                    <div key={i} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-semibold bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded dark:text-white">
                          {MODELS.find(m => m.id === result.model)?.name || result.model}
                        </span>
                      </div>
                      <div className="text-xs prose prose-xs dark:prose-invert max-w-none dark:text-gray-300">
                        <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                          {result.response}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
