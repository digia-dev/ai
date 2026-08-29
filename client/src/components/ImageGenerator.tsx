import { useState } from 'react';
import { Image, Loader2, Download, X } from 'lucide-react';
import { apiFetch } from '../lib/api';

interface ImageGeneratorProps {
  onImageGenerated?: (url: string) => void;
}

export default function ImageGenerator({ onImageGenerated }: ImageGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const res = await apiFetch('/api/generate-image', {
        method: 'POST',
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedImage(data.url);
        onImageGenerated?.(data.url);
      } else {
        const err = await res.json();
        setError(err.error || 'Gagal generate gambar');
      }
    } catch {
      setError('Terjadi kesalahan');
    }
    setLoading(false);
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const a = document.createElement('a');
    a.href = generatedImage;
    a.download = `generated-${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        title="Generate gambar"
      >
        <Image className="w-3.5 h-3.5" />
        Gambar
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute bottom-full mb-2 left-0 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg w-[360px]">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <span className="text-sm font-semibold dark:text-white">Generate Gambar</span>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-black dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Deskripsi gambar yang ingin dibuat..."
                className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 outline-none resize-none h-20 dark:text-white placeholder-gray-400"
              />

              {error && (
                <div className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                  {error}
                </div>
              )}

              {generatedImage && (
                <div className="relative">
                  <img src={generatedImage} alt="Generated" className="w-full rounded-lg" />
                  <button
                    onClick={handleDownload}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-lg hover:bg-black/70"
                  >
                    <Download className="w-3 h-3" />
                  </button>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || loading}
                className="w-full py-2 bg-black dark:bg-white text-white dark:text-black text-xs font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Image className="w-3 h-3" />
                    Generate (50 token)
                  </>
                )}
              </button>

              <p className="text-[10px] text-gray-400 text-center">
                Menggunakan Stable Diffusion via Pollinations AI
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
