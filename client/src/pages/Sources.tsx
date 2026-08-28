import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Tabs from '@radix-ui/react-tabs';
import { apiFetch } from '../lib/api';
import SourceCard from '../components/SourceCard';

interface Source {
  id: number;
  name: string;
  format: string;
  wordCount: number;
}

export default function Sources() {
  const navigate = useNavigate();
  const [sources, setSources] = useState<Source[]>([]);
  const [textName, setTextName] = useState('');
  const [textContent, setTextContent] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const loadSources = async () => {
    try {
      const res = await apiFetch('/api/sources');
      if (res.ok) setSources(await res.json());
    } catch {}
  };

  useEffect(() => {
    loadSources();
  }, []);

  const uploadFiles = async (files: FileList | File[]) => {
    setUploading(true);
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);
      await apiFetch('/api/sources', { method: 'POST', body: formData });
    }
    setUploading(false);
    loadSources();
  };

  const addTextSource = async () => {
    if (!textName.trim() || !textContent.trim()) return;
    setUploading(true);
    await apiFetch('/api/sources', {
      method: 'POST',
      body: JSON.stringify({ name: textName, content: textContent }),
    });
    setTextName('');
    setTextContent('');
    setUploading(false);
    loadSources();
  };

  const deleteSource = async (id: number) => {
    if (!confirm('Delete this source?')) return;
    await apiFetch(`/api/sources/${id}`, { method: 'DELETE' });
    loadSources();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dropRef.current?.classList.remove('border-black');
    if (e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-5 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">Sources</h1>
          <button
            onClick={() => navigate('/chat')}
            className="py-2 px-4 rounded-lg border border-gray-200 bg-white text-xs font-medium hover:bg-gray-50"
          >
            ← Back to Chat
          </button>
        </div>

        <Tabs.Root defaultValue="file">
          <Tabs.List className="flex border-b border-gray-200 mb-5">
            <Tabs.Trigger
              value="file"
              className="px-5 py-2.5 text-xs font-medium text-gray-400 border-b-2 border-transparent data-[state=active]:text-black data-[state=active]:border-black"
            >
              File Upload
            </Tabs.Trigger>
            <Tabs.Trigger
              value="text"
              className="px-5 py-2.5 text-xs font-medium text-gray-400 border-b-2 border-transparent data-[state=active]:text-black data-[state=active]:border-black"
            >
              Text Source
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="file">
            <div
              ref={dropRef}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); dropRef.current?.classList.add('border-black'); }}
              onDragLeave={() => dropRef.current?.classList.remove('border-black')}
              onDrop={handleDrop}
              className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center cursor-pointer hover:border-black transition-colors mb-5"
            >
              <div className="text-3xl mb-2">📎</div>
              <p className="text-sm text-gray-500">Click or drag files here to upload</p>
              <p className="text-xs text-gray-400 mt-1">PDF, DOCX, TXT, MD, CSV, HTML — Max 10MB</p>
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
                placeholder="Source name (e.g. Meeting Notes)"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-black"
              />
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Paste or type your text content here..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none resize-y min-h-[100px] focus:border-black"
              />
              <button
                onClick={addTextSource}
                disabled={uploading || !textName.trim() || !textContent.trim()}
                className="py-2 px-4 bg-black text-white text-xs font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                {uploading ? 'Adding...' : 'Add Source'}
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
              onDelete={deleteSource}
            />
          ))}
          {sources.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-10">
              No sources yet. Upload a file or add text.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
