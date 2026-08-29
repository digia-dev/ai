import { Globe } from 'lucide-react';

interface LanguageToggleProps {
  locale: string;
  onToggle: () => void;
}

export default function LanguageToggle({ locale, onToggle }: LanguageToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-1.5 px-2 py-1 text-[10px] text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
      title={locale === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}
    >
      <Globe className="w-3 h-3" />
      <span className="uppercase font-medium">{locale}</span>
    </button>
  );
}
