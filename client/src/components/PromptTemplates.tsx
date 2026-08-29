import { useState, useEffect } from 'react';
import { FileText, X, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { apiFetch } from '../lib/api';

interface Template {
  id?: number;
  name: string;
  category: string;
  prompt: string;
}

interface PromptTemplatesProps {
  onSelect: (prompt: string) => void;
}

export default function PromptTemplates({ onSelect }: PromptTemplatesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', category: 'Custom', prompt: '' });

  useEffect(() => {
    if (isOpen) {
      apiFetch('/api/templates')
        .then(r => r.ok ? r.json() : [])
        .then(setTemplates)
        .catch(() => {});
    }
  }, [isOpen]);

  const categories = [...new Set(templates.map(t => t.category))];
  const filtered = selectedCategory ? templates.filter(t => t.category === selectedCategory) : templates;

  const handleSelect = (template: Template) => {
    onSelect(template.prompt);
    setIsOpen(false);
  };

  const handleAdd = async () => {
    if (!newTemplate.name || !newTemplate.prompt) return;
    const res = await apiFetch('/api/templates', {
      method: 'POST',
      body: JSON.stringify(newTemplate),
    });
    if (res.ok) {
      const created = await res.json();
      setTemplates(prev => [...prev, created]);
      setNewTemplate({ name: '', category: 'Custom', prompt: '' });
      setShowAdd(false);
    }
  };

  const handleDelete = async (id: number) => {
    await apiFetch(`/api/templates/${id}`, { method: 'DELETE' });
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        title="Prompt Templates"
      >
        <FileText className="w-3.5 h-3.5" />
        Templates
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute bottom-full mb-2 left-0 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg w-[320px] max-h-[400px] flex flex-col">
            <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <span className="text-xs font-semibold dark:text-white">Prompt Templates</span>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-black dark:hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700 flex gap-1 overflow-x-auto">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-2 py-0.5 text-[10px] rounded-full shrink-0 transition-colors ${
                  !selectedCategory ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                Semua
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2 py-0.5 text-[10px] rounded-full shrink-0 transition-colors ${
                    selectedCategory === cat ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filtered.map((template, i) => (
                <div
                  key={template.id || i}
                  onClick={() => handleSelect(template)}
                  className="group flex items-center gap-2 px-3 py-2 rounded-lg text-xs cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium dark:text-white truncate">{template.name}</div>
                    <div className="text-[10px] text-gray-400 truncate mt-0.5">{template.prompt.slice(0, 60)}...</div>
                  </div>
                  <div className="flex items-center gap-1">
                    {template.id && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(template.id!); }}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                    <ChevronRight className="w-3 h-3 text-gray-300" />
                  </div>
                </div>
              ))}
            </div>

            <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700">
              {showAdd ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate(p => ({ ...p, name: e.target.value }))}
                    placeholder="Nama template..."
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 outline-none dark:text-white"
                  />
                  <textarea
                    value={newTemplate.prompt}
                    onChange={(e) => setNewTemplate(p => ({ ...p, prompt: e.target.value }))}
                    placeholder="Prompt template... (gunakan {input} sebagai placeholder)"
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 outline-none resize-none h-20 dark:text-white"
                  />
                  <div className="flex gap-1">
                    <button onClick={handleAdd} className="px-3 py-1 text-[10px] bg-black dark:bg-white text-white dark:text-black rounded-lg">Simpan</button>
                    <button onClick={() => setShowAdd(false)} className="px-3 py-1 text-[10px] text-gray-500 hover:text-black dark:hover:text-white">Batal</button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAdd(true)}
                  className="w-full flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors dark:text-gray-400"
                >
                  <Plus className="w-3 h-3" />
                  Template baru
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
