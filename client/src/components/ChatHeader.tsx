import { Globe } from 'lucide-react';
import BranchSelector from './BranchSelector';

interface ChatHeaderProps {
  title: string;
  branches: any[];
  currentBranchId: number;
  onSwitchBranch: (branchId: number) => void;
  onCreateBranch: (name: string) => void;
  webSearch: boolean;
  onToggleSearch: () => void;
}

export default function ChatHeader({
  title,
  branches,
  currentBranchId,
  onSwitchBranch,
  onCreateBranch,
  webSearch,
  onToggleSearch,
}: ChatHeaderProps) {
  return (
    <div className="h-14 px-5 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm font-semibold dark:text-white truncate">{title}</span>
        <BranchSelector
          branches={branches}
          currentBranchId={currentBranchId}
          onSwitchBranch={onSwitchBranch}
          onCreateBranch={onCreateBranch}
        />
      </div>
      <button
        onClick={onToggleSearch}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all shrink-0 ${
          webSearch
            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
            : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent'
        }`}
      >
        <Globe className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{webSearch ? 'Web' : ''}</span>
      </button>
    </div>
  );
}
