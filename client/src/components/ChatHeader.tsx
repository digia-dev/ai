import BranchSelector from './BranchSelector';

interface ChatHeaderProps {
  title: string;
  branches: any[];
  currentBranchId: number;
  onSwitchBranch: (branchId: number) => void;
  onCreateBranch: (name: string) => void;
}

export default function ChatHeader({
  title,
  branches,
  currentBranchId,
  onSwitchBranch,
  onCreateBranch,
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
    </div>
  );
}
