import { GitBranch } from 'lucide-react';

interface Branch {
  id: number;
  branchName: string;
  createdAt: string;
  parentId?: number;
}

interface BranchTreeProps {
  branches: Branch[];
  currentBranchId: number;
  onSelectBranch: (id: number) => void;
}

export default function BranchTree({ branches, currentBranchId, onSelectBranch }: BranchTreeProps) {
  if (branches.length <= 1) return null;

  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-x-auto">
      <GitBranch className="w-3 h-3 text-gray-400 shrink-0" />
      {branches.map((branch, idx) => (
        <div key={branch.id} className="flex items-center">
          <button
            onClick={() => onSelectBranch(branch.id)}
            className={`px-2 py-0.5 text-[10px] rounded transition-colors shrink-0 ${
              branch.id === currentBranchId
                ? 'bg-black dark:bg-white text-white dark:text-black font-semibold'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400'
            }`}
          >
            {branch.branchName}
          </button>
          {idx < branches.length - 1 && (
            <span className="text-gray-300 dark:text-gray-600 mx-0.5">→</span>
          )}
        </div>
      ))}
    </div>
  );
}
