import { useState, useEffect, useRef } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { apiFetch } from '../lib/api';
import SourceCard from '../components/SourceCard';
import { SkeletonPage } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import { toast } from '../components/Toast';
import { Upload, FileText } from 'lucide-react';

interface Source {
  id: number;
  name: string;
  format: string;
  wordCount: number;
}

export default function Sources() {
  const [sources, setSources] = useState<Source[]>([]);
  const [textName, setTextName] = useState('');
  const [textContent, setTextContent] = useState('');
  const [uploading, setUploading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadSources = async () => {
    try {
      const res = await apiFetch('/api/sources');
      if (res.ok) setSources(await res.json());
    } catch {
      toast.error('Gagal memuat sumber');
    }
  };

  useEffect(() => {
    loadSources().finally(() => setInitialLoading(false));
  }, []);

  const uploadFiles = async (files: FileList | File[]) => {
    setUploading(true);
    let success = 0;
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiFetch('/api/sources', { method: 'POST', body: formData });
      if (res.ok) success++;
    }
    setUploading(false);
    if (success > 0) toast.success(`${success} sumber berhasil diunggah`);
    loadSources();
  };

  const addTextSource = async () => {
    if (!textName.trim() || !textContent.trim()) return;
    setUploading(true);
    const res = await apiFetch('/api/sources', {
      method: 'POST',
      body: JSON.stringify({ name: textName, content: textContent }),
    });
    setTextName('');
    setTextContent('');
    setUploading(false);
    if (res.ok) toast.success('Sumber teks berhasil ditambahkan');
    loadSources();
  };

  const deleteSource = async () => {
    if (!deleteId) return;
    await apiFetch(`/api/sources/${deleteId}`, { method: 'DELETE' });
    setDeleteId(null);
    toast.success('Sumber berhasil dihapus');
    loadSources();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 0) uploadFiles(e.dataTransfer.files);
  };

  if (initialLoading) return <SkeletonPage />;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-5 py-6">
        <h1 className="text-xl font-bold mb-6">Sumber</h1>

        <Tabs.Root defaultValue="file">
          <Tabs.List className="flex border-b border-gray-200 mb-5">
            <Tabs.Trigger value="file" className="px-5 py-2.5 text-xs font-medium text-gray-400 border-b-2 border-transparent data-[state=active]:text-black data-[state=active]:border-black transition-colors">
              Unggah File
            </Tabs.Trigger>
            <Tabs.Trigger value="text" className="px-5 py-2.5 text-xs font-medium text-gray-400 border-b-2 border-transparent data-[state=active]:text-black data-[state=active]:border-black transition-colors">
              Teks
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="file">
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors mb-5 ${
                dragging ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Upload className="w-8 h-8 mx-auto mb-3 text-gray-400" />
              <p className="text-sm text-gray-500">Klik atau seret file ke sini untuk mengunggah</p>
              <p className="text-xs text-gray-400 mt-1">PDF, DOCX, TXT, MD, CSV, HTML — Maks 10MB</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.docx,.doc,.txt,.md,.csv,.html"
              multiple
              onChange={(e) => e.target.files && uploadFiles(e.target.files)}
            />
          </Tabs.Content>

          <Tabs.Content value="text">
            <div className="space-y-3 mb-5">
              <input
                type="text"
                value={textName}
                onChange={(e) => setTextName(e.target.value)}
                placeholder="Nama sumber (contoh: Catatan Meeting)"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-black"
              />
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Tempel atau ketik konten teks di sini..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none resize-y min-h-[100px] focus:border-black"
              />
              <button
                onClick={addTextSource}
                disabled={uploading || !textName.trim() || !textContent.trim()}
                className="py-2 px-4 bg-black text-white text-xs font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                {uploading ? 'Menambahkan...' : 'Tambah Sumber'}
              </button>
            </div>
          </Tabs.Content>
        </Tabs.Root>

        <div className="space-y-2">
          {sources.map((s) => (
            <SourceCard
              key={s.id}
              id={s.id}
              name={s.name}
              format={s.format || 'text'}
              wordCount={s.wordCount}
              onDelete={(id) => setDeleteId(id)}
            />
          ))}
          {sources.length === 0 && (
            <EmptyState
              icon={<FileText className="w-7 h-7 text-gray-400" />}
              title="Belum ada sumber"
              description="Unggah file atau tambahkan teks untuk memulai"
            />
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        title="Hapus Sumber"
        message="Sumber yang dihapus tidak dapat dikembalikan."
        confirmLabel="Hapus"
        danger
        onConfirm={deleteSource}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
