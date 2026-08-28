import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';

interface AgentFile {
  id: number;
  filename: string;
  mimeType: string;
  size: number;
  agentName: string;
  createdAt: string;
}

export default function Collection() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<AgentFile[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const loadFiles = async () => {
    const res = await apiFetch('/api/agents/files');
    if (res.ok) setFiles(await res.json());
  };

  useEffect(() => { loadFiles(); }, []);

  const deleteFile = async (id: number) => {
    if (!confirm('Delete this file?')) return;
    await apiFetch(`/api/agents/files/${id}`, { method: 'DELETE' });
    loadFiles();
  };

  const filteredFiles = files.filter(f => {
    if (search && !f.filename.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const formatSize = (bytes: number) => {
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-5 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">📁 Collection</h1>
          <button onClick={() => navigate('/chat')} className="py-2 px-4 rounded-lg border border-gray-200 bg-white text-xs font-medium hover:bg-gray-50">← Back</button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <select value={filter} onChange={e => setFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none">
            <option value="all">Semua</option>
            <option value="csv">CSV</option>
            <option value="md">Markdown</option>
            <option value="code">Code</option>
          </select>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari file..." className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-black" />
        </div>

        {/* Files */}
        <div className="space-y-2">
          {filteredFiles.map(f => (
            <div key={f.id} className="border border-gray-200 rounded-xl p-4 flex items-center gap-4">
              <span className="text-2xl">📄</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{f.filename}</div>
                <div className="text-xs text-gray-500">
                  Oleh: {f.agentName || 'Unknown'} · {formatSize(f.size)} · {new Date(f.createdAt).toLocaleDateString('id-ID')}
                </div>
              </div>
              <a href={`/api/agents/files/${f.id}/download`} className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs hover:bg-gray-50 shrink-0">Download</a>
              <button onClick={() => deleteFile(f.id)} className="px-3 py-1.5 border border-red-200 text-red-500 rounded-lg text-xs hover:bg-red-50 shrink-0">Hapus</button>
            </div>
          ))}
          {filteredFiles.length === 0 && <p className="text-center text-gray-400 text-sm py-10">Belum ada file di Collection</p>}
        </div>

        {files.length > 0 && <div className="text-xs text-gray-400 mt-4">Total: {files.length} file</div>}
      </div>
    </div>
  );
}
