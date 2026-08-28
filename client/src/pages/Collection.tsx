import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { SkeletonPage } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import { toast } from '../components/Toast';
import { FolderOpen } from 'lucide-react';

interface AgentFile {
  id: number;
  filename: string;
  mimeType: string;
  size: number;
  agentName: string;
  createdAt: string;
}

export default function Collection() {
  const [files, setFiles] = useState<AgentFile[]>([]);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  const loadFiles = async () => {
    try {
      const res = await apiFetch('/api/agents/files');
      if (res.ok) setFiles(await res.json());
    } catch {
      toast.error('Gagal memuat koleksi');
    }
  };

  useEffect(() => {
    loadFiles().finally(() => setInitialLoading(false));
  }, []);

  const deleteFile = async () => {
    if (!deleteId) return;
    await apiFetch(`/api/agents/files/${deleteId}`, { method: 'DELETE' });
    setDeleteId(null);
    toast.success('File berhasil dihapus');
    loadFiles();
  };

  const filteredFiles = files.filter(f =>
    !search || f.filename.toLowerCase().includes(search.toLowerCase())
  );

  const formatSize = (bytes: number) => bytes >= 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${bytes} B`;

  if (initialLoading) return <SkeletonPage />;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-5 py-6">
        <h1 className="text-xl font-bold mb-6">Koleksi</h1>

        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari file..."
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-black mb-4"
        />

        <div className="space-y-2">
          {filteredFiles.map(f => (
            <div key={f.id} className="border border-gray-200 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                <FolderOpen className="w-5 h-5 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{f.filename}</div>
                <div className="text-xs text-gray-500">
                  Oleh: {f.agentName || 'Tidak diketahui'} · {formatSize(f.size)} · {new Date(f.createdAt).toLocaleDateString('id-ID')}
                </div>
              </div>
              <a href={`/api/agents/files/${f.id}/download`} className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs hover:bg-gray-50 shrink-0">Unduh</a>
              <button onClick={() => setDeleteId(f.id)} className="px-3 py-1.5 border border-red-200 text-red-500 rounded-lg text-xs hover:bg-red-50 shrink-0">Hapus</button>
            </div>
          ))}
          {filteredFiles.length === 0 && (
            <EmptyState
              title={search ? 'Tidak ada file yang cocok' : 'Belum ada file di Koleksi'}
              description={search ? 'Coba kata kunci lain' : 'File yang dihasilkan oleh agent akan muncul di sini'}
            />
          )}
        </div>

        {files.length > 0 && <div className="text-xs text-gray-400 mt-4">Total: {files.length} file</div>}
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        title="Hapus File"
        message="File yang dihapus tidak dapat dikembalikan."
        confirmLabel="Hapus"
        danger
        onConfirm={deleteFile}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
