import { useState, useRef } from 'react';
import { Image, Loader2, X, Upload } from 'lucide-react';
import { apiFetch } from '../lib/api';

interface ImageInputProps {
  onImageAnalyzed: (description: string) => void;
}

export default function ImageInput({ onImageAnalyzed }: ImageInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Hanya file gambar yang didukung');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!preview) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(preview);
      const blob = await response.blob();
      const base64 = await blobToBase64(blob);

      const res = await apiFetch('/api/analyze-image', {
        method: 'POST',
        body: JSON.stringify({ image: base64 }),
      });

      if (res.ok) {
        const data = await res.json();
        onImageAnalyzed(data.description);
        setIsOpen(false);
        setPreview(null);
      } else {
        const err = await res.json();
        setError(err.error || 'Gagal menganalisis gambar');
      }
    } catch {
      setError('Terjadi kesalahan');
    }
    setLoading(false);
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        title="Upload gambar"
      >
        <Image className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setIsOpen(false); setPreview(null); }} />
          <div className="absolute bottom-full mb-2 left-0 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg w-[360px]">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <span className="text-sm font-semibold dark:text-white">Upload Gambar</span>
              <button onClick={() => { setIsOpen(false); setPreview(null); }} className="text-gray-400 hover:text-black dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {preview ? (
                <div className="relative">
                  <img src={preview} alt="Preview" className="w-full rounded-lg max-h-[200px] object-contain" />
                  <button
                    onClick={() => setPreview(null)}
                    className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-lg hover:bg-black/70"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center gap-2 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                >
                  <Upload className="w-8 h-8 text-gray-400" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Klik untuk upload gambar</span>
                  <span className="text-[10px] text-gray-400">PNG, JPG, GIF (maks 5MB)</span>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />

              {error && (
                <div className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                  {error}
                </div>
              )}

              <button
                onClick={handleAnalyze}
                disabled={!preview || loading}
                className="w-full py-2 bg-black dark:bg-white text-white dark:text-black text-xs font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Menganalisis...
                  </>
                ) : (
                  <>
                    <Image className="w-3 h-3" />
                    Analisis Gambar
                  </>
                )}
              </button>

              <p className="text-[10px] text-gray-400 text-center">
                Gambar akan dianalisis oleh AI untuk deskripsi dan teks OCR
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
