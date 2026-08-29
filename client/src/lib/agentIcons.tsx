import {
  Bot,
  BarChart3,
  FileText,
  Code,
  Target,
  FlaskConical,
  BookOpen,
  Pen,
  Wrench,
  Palette,
  Lightbulb,
  Rocket,
  type LucideIcon,
} from 'lucide-react';

export const ICON_MAP: Record<string, LucideIcon> = {
  bot: Bot,
  'bar-chart': BarChart3,
  'file-text': FileText,
  code: Code,
  target: Target,
  flask: FlaskConical,
  book: BookOpen,
  pen: Pen,
  wrench: Wrench,
  palette: Palette,
  lightbulb: Lightbulb,
  rocket: Rocket,
};

export const AGENT_ICONS = [
  { name: 'bot', label: 'Bot' },
  { name: 'bar-chart', label: 'Chart' },
  { name: 'file-text', label: 'Dokumen' },
  { name: 'code', label: 'Code' },
  { name: 'target', label: 'Target' },
  { name: 'flask', label: 'Riset' },
  { name: 'book', label: 'Buku' },
  { name: 'pen', label: 'Tulis' },
  { name: 'wrench', label: 'Tool' },
  { name: 'palette', label: 'Desain' },
  { name: 'lightbulb', label: 'Ide' },
  { name: 'rocket', label: 'Rocket' },
];

export function getAgentIcon(iconName: string | null | undefined, size = 'w-4 h-4'): React.ReactNode {
  const Icon = ICON_MAP[iconName || ''] || Bot;
  return <Icon className={size} />;
}
