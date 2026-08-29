import { Globe, BookOpen, Newspaper, Code } from 'lucide-react';

interface FocusModeSelectorProps {
  value: string;
  onChange: (mode: string) => void;
}

const MODES = [
  { id: 'general', label: 'General', icon: Globe },
  { id: 'academic', label: 'Academic', icon: BookOpen },
  { id: 'news', label: 'News', icon: Newspaper },
  { id: 'code', label: 'Code', icon: Code },
];

export default function FocusModeSelector({ value, onChange }: FocusModeSelectorProps) {
  return (
    <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
      {MODES.map(mode => {
        const Icon = mode.icon;
        const isActive = value === mode.id;
        return (
          <button
            key={mode.id}
            onClick={() => onChange(mode.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors ${
              isActive
                ? 'bg-white dark:bg-gray-600 text-black dark:text-white shadow-sm font-medium'
                : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
            }`}
            title={mode.label}
          >
            <Icon className="w-3 h-3" />
            {mode.label}
          </button>
        );
      })}
    </div>
  );
}
