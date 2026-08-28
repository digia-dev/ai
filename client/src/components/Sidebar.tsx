import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { formatTokens } from '../lib/constants';
import {
  Plus,
  MessageSquare,
  X,
  Bot,
  Folder,
  User,
  UserCircle,
  CreditCard,
  BarChart3,
  FileText,
  Zap,
  LogOut,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

interface Conversation {
  id: number;
  title: string;
}

interface Agent {
  id: number;
  name: string;
  icon: string;
  model: string;
  isDefault: boolean;
}

interface SidebarProps {
  currentPath: string;
  conversations?: Conversation[];
  currentConvId?: number | null;
  onSelectConversation?: (id: number, title: string) => void;
  onDeleteConversation?: (id: number) => void;
  onNewChat: () => void;
  onLogout: () => void;
}

export default function Sidebar({
  currentPath,
  conversations = [],
  currentConvId = null,
  onSelectConversation,
  onDeleteConversation,
  onNewChat,
  onLogout,
}: SidebarProps) {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    agents: true,
    account: false,
  });

  useEffect(() => {
    apiFetch('/api/agents').then(r => r.ok ? r.json() : []).then(setAgents).catch(() => {});
    apiFetch('/api/account/billing').then(r => r.ok ? r.json() : null).then(d => { if (d) setTokenBalance(d.tokenBalance); }).catch(() => {});
  }, []);

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isActive = (path: string) => currentPath === path;

  const navItem = (path: string, icon: React.ReactNode, label: string, onClick?: () => void) => (
    <div
      onClick={onClick || (() => navigate(path))}
      className={`flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer rounded-lg transition-colors ${
        isActive(path)
          ? 'bg-gray-100 font-semibold text-black'
          : 'text-gray-600 hover:bg-gray-50 hover:text-black'
      }`}
    >
      {icon}
      <span>{label}</span>
    </div>
  );

  return (
    <div className="w-[280px] bg-gray-50 border-r border-gray-200 flex flex-col h-full shrink-0">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 32 32" className="w-6 h-6">
            <path d="M16 2L28 16L16 30L4 16L16 2Z" fill="black"/>
          </svg>
          <span className="font-bold text-sm">Tara AI</span>
        </div>
        <button
          onClick={onNewChat}
          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-100"
          title="Chat baru"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* Chat */}
        {navItem('/chat', <MessageSquare className="w-4 h-4" />, 'Chat', () => { onNewChat(); navigate('/chat'); })}

        {conversations.length > 0 && currentPath === '/chat' && (
          <div className="ml-4 space-y-0.5 mb-2">
            {conversations.map((c) => (
              <div
                key={c.id}
                onClick={() => onSelectConversation?.(c.id, c.title)}
                className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                  c.id === currentConvId ? 'bg-gray-100 font-semibold' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span className="flex-1 truncate">{c.title || 'Chat Baru'}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteConversation?.(c.id); }}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-black ml-2"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="my-1 border-t border-gray-200" />

        {/* Agents */}
        <div
          className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer rounded-lg text-gray-600 hover:bg-gray-50 hover:text-black transition-colors"
          onClick={() => toggleSection('agents')}
        >
          <Bot className="w-4 h-4" />
          <span className="flex-1">Agents</span>
          {expandedSections.agents ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </div>
        {expandedSections.agents && (
          <div className="ml-4 space-y-0.5">
            {agents.map((a) => (
              <div
                key={a.id}
                onClick={() => navigate(`/agents/${a.id}`)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                  currentPath === `/agents/${a.id}` ? 'bg-gray-100 font-semibold' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span>{a.icon}</span>
                <span className="flex-1 truncate">{a.name}</span>
              </div>
            ))}
            <div
              onClick={() => navigate('/agents')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs cursor-pointer text-gray-400 hover:bg-gray-50 hover:text-gray-600"
            >
              <Plus className="w-3 h-3" />
              <span>Buat Agent Baru</span>
            </div>
          </div>
        )}

        <div className="my-1 border-t border-gray-200" />

        {/* Collection */}
        {navItem('/collection', <Folder className="w-4 h-4" />, 'Koleksi')}

        <div className="my-1 border-t border-gray-200" />

        {/* Account */}
        <div
          className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer rounded-lg text-gray-600 hover:bg-gray-50 hover:text-black transition-colors"
          onClick={() => toggleSection('account')}
        >
          <User className="w-4 h-4" />
          <span className="flex-1">Akun</span>
          {expandedSections.account ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </div>
        {expandedSections.account && (
          <div className="ml-4 space-y-0.5">
            {navItem('/account', <UserCircle className="w-4 h-4" />, 'Profil')}
            {navItem('/account/billing', <CreditCard className="w-4 h-4" />, 'Token & Pembayaran')}
            {navItem('/account/history', <BarChart3 className="w-4 h-4" />, 'Riwayat Penggunaan')}
            <div
              onClick={onLogout}
              className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer rounded-lg text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar</span>
            </div>
          </div>
        )}

        <div className="my-1 border-t border-gray-200" />

        {/* Sources */}
        {navItem('/sources', <FileText className="w-4 h-4" />, 'Sumber')}
      </div>

      {/* Token Balance */}
      <div className="p-3 border-t border-gray-200">
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-500 flex items-center gap-1"><Zap className="w-3 h-3" /> Token tersisa</span>
            <span className="font-semibold">{formatTokens(tokenBalance)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-black h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min(100, (tokenBalance / 10000) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
