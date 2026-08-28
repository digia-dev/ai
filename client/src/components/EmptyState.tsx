import { FolderOpen } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto mb-4 flex items-center justify-center">
        {icon || <FolderOpen className="w-7 h-7 text-gray-400" />}
      </div>
      <h3 className="font-semibold text-sm text-gray-700 mb-1">{title}</h3>
      {description && <p className="text-xs text-gray-500 mb-4 max-w-xs mx-auto">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-black text-white rounded-lg text-xs font-medium hover:bg-gray-800"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
