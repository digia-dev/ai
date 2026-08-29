import { useState } from 'react';
import { GitBranch, Plus, Check } from 'lucide-react';

interface Branch {
  id: number;
  branchName: string;
  createdAt: string;
}

interface BranchSelectorProps {
  branches: Branch[];
  currentBranchId: number;
  onSwitchBranch: (branchId: number) => void;
  onCreateBranch?: (name: string) => void;
  isAgent?: boolean;
}

export default function BranchSelector({ branches, currentBranchId, onSwitchBranch, onCreateBranch, isAgent }: BranchSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');

  if (isAgent || branches.length === 0) return null;

  const currentBranch = branches.find(b => b.id === currentBranchId);

  const handleCreate = () => {
    if (newName.trim() && onCreateBranch) {
      onCreateBranch(newName.trim());
      setNewName('');
      setIsCreating(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1 text-[10px] text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        title="Branch"
      >
        <GitBranch className="w-3 h-3" />
        <span>{currentBranch?.branchName || 'Main'}</span>
        {branches.length > 1 && (
          <span className="text-[9px] bg-gray-200 dark:bg-gray-600 px-1 rounded">{branches.length}</span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[160px]">
            {branches.map(branch => (
              <button
                key={branch.id}
                onClick={() => { onSwitchBranch(branch.id); setIsOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {branch.id === currentBranchId ? (
                  <Check className="w-3 h-3 text-green-500" />
                ) : (
                  <span className="w-3 h-3" />
                )}
                <span className={`${branch.id === currentBranchId ? 'font-semibold dark:text-white' : 'dark:text-gray-300'}`}>
                  {branch.branchName}
                </span>
              </button>
            ))}

            <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

            {isCreating ? (
              <div className="px-2 py-1">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nama branch..."
                  className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 outline-none dark:text-white"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreate();
                    if (e.key === 'Escape') setIsCreating(false);
                  }}
                />
                <div className="flex gap-1 mt-1">
                  <button onClick={handleCreate} className="text-[10px] px-2 py-0.5 bg-black dark:bg-white text-white dark:text-black rounded">Buat</button>
                  <button onClick={() => setIsCreating(false)} className="text-[10px] px-2 py-0.5 text-gray-500 hover:text-black dark:hover:text-white">Batal</button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsCreating(true)}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors dark:text-gray-400"
              >
                <Plus className="w-3 h-3" />
                Branch baru
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
