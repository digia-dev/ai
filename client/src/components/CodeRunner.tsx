import { useState } from 'react';
import { Play, Loader2, Terminal, X, Copy, Check } from 'lucide-react';
import { apiFetch } from '../lib/api';

interface CodeRunnerProps {
  code?: string;
  language?: string;
}

export default function CodeRunner({ code: initialCode, language: initialLang }: CodeRunnerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [code, setCode] = useState(initialCode || '');
  const [language, setLanguage] = useState(initialLang || 'javascript');
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleRun = async () => {
    if (!code.trim() || loading) return;
    setLoading(true);
    setOutput('');
    setError('');

    try {
      const res = await apiFetch('/api/execute-code', {
        method: 'POST',
        body: JSON.stringify({ code: code.trim(), language }),
      });

      if (res.ok) {
        const data = await res.json();
        setOutput(data.output || '');
        setError(data.error || '');
      } else {
        const err = await res.json();
        setError(err.error || 'Gagal eksekusi kode');
      }
    } catch {
      setError('Terjadi kesalahan');
    }
    setLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        title="Jalankan kode"
      >
        <Terminal className="w-3.5 h-3.5" />
        Run
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute bottom-full mb-2 left-0 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg w-[480px] max-h-[400px] flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-semibold dark:text-white">Code Runner</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-black dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 space-y-2 flex-1 overflow-auto">
              <div className="flex items-center gap-2">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 outline-none dark:text-white"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                </select>
                <div className="flex-1" />
                <button onClick={handleCopy} className="text-gray-400 hover:text-black dark:hover:text-white" title="Salin">
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>

              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Tulis kode di sini..."
                className="w-full px-3 py-2 text-xs font-mono border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 outline-none resize-none h-32 dark:text-gray-300 placeholder-gray-400"
              />

              <button
                onClick={handleRun}
                disabled={!code.trim() || loading}
                className="w-full py-2 bg-black dark:bg-white text-white dark:text-black text-xs font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3" />
                    Jalankan
                  </>
                )}
              </button>

              {(output || error) && (
                <div className="bg-gray-900 rounded-lg p-3 font-mono text-xs">
                  {output && (
                    <div className="text-green-400 whitespace-pre-wrap">{output}</div>
                  )}
                  {error && (
                    <div className="text-red-400 whitespace-pre-wrap">{error}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
