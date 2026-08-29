import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { formatTokens } from '../lib/constants';
import ThemeToggle from './ThemeToggle';
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
  Search,
  Shield,
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    agents: true,
    account: false,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Conversation[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    apiFetch('/api/agents').then(r => r.ok ? r.json() : []).then(setAgents).catch(() => {});
    apiFetch('/api/account/billing').then(r => r.ok ? r.json() : null).then(d => { if (d) setTokenBalance(d.tokenBalance); }).catch(() => {});
    apiFetch('/api/account/profile').then(r => r.ok ? r.json() : null).then(d => { if (d?.isAdmin) setIsAdmin(true); }).catch(() => {});

    const refreshBilling = () => {
      apiFetch('/api/account/billing').then(r => r.ok ? r.json() : null).then(d => { if (d) setTokenBalance(d.tokenBalance); }).catch(() => {});
    };
    window.addEventListener('tokens-used', refreshBilling);
    return () => window.removeEventListener('tokens-used', refreshBilling);
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const res = await apiFetch(`/api/conversations/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch {}
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        handleSearch(searchQuery);
      } else {
        setSearchResults([]);
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isActive = (path: string) => currentPath === path;

  const navItem = (path: string, icon: React.ReactNode, label: string, onClick?: () => void) => (
    <div
      onClick={onClick || (() => navigate(path))}
      className={`flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer rounded-lg transition-colors ${
        isActive(path)
          ? 'bg-gray-100 dark:bg-gray-700 font-semibold text-black dark:text-white'
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-black dark:hover:text-white'
      }`}
    >
      {icon}
      <span>{label}</span>
    </div>
  );

  const displayConversations = isSearching ? searchResults : conversations;

  return (
    <div className="w-[280px] bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full shrink-0">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 32 32" className="w-6 h-6">
            <path d="M16 2L28 16L16 30L4 16L16 2Z" fill="currentColor" className="text-black dark:text-white"/>
          </svg>
          <span className="font-bold text-sm dark:text-white">Tara AI</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={onNewChat}
            className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Chat baru"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari chat..."
            className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white placeholder-gray-400 outline-none focus:border-black dark:focus:border-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setSearchResults([]); setIsSearching(false); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black dark:hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Chat */}
        {navItem('/chat', <MessageSquare className="w-4 h-4" />, 'Chat', () => { onNewChat(); navigate('/chat'); })}

            {displayConversations.length > 0 && currentPath === '/chat' && (
          <div className="ml-4 space-y-0.5 mb-2">
            {displayConversations.map((c) => (
              <div
                key={c.id}
                onClick={() => onSelectConversation?.(c.id, c.title)}
                className={`group flex items-center justify-between px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                  c.id === currentConvId ? 'bg-gray-100 dark:bg-gray-700 font-semibold' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <span className="flex-1 truncate dark:text-gray-300">{c.title || 'Chat Baru'}</span>
                {!isSearching && onDeleteConversation && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteConversation(c.id); }}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 dark:hover:text-red-400 ml-2 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="my-1 border-t border-gray-200 dark:border-gray-700" />

        {/* Agents */}
        <div
          className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-black dark:hover:text-white transition-colors"
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
                  currentPath === `/agents/${a.id}` ? 'bg-gray-100 dark:bg-gray-700 font-semibold' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <span>{a.icon}</span>
                <span className="flex-1 truncate dark:text-gray-300">{a.name}</span>
              </div>
            ))}
            <div
              onClick={() => navigate('/agents')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs cursor-pointer text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <Plus className="w-3 h-3" />
              <span>Buat Agent Baru</span>
            </div>
          </div>
        )}

        <div className="my-1 border-t border-gray-200 dark:border-gray-700" />

        {/* Collection */}
        {navItem('/collection', <Folder className="w-4 h-4" />, 'Koleksi')}

        <div className="my-1 border-t border-gray-200 dark:border-gray-700" />

        {/* Account */}
        <div
          className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-black dark:hover:text-white transition-colors"
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
              className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar</span>
            </div>
            {isAdmin && (
              <div
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                <Shield className="w-4 h-4" />
                <span>Admin</span>
              </div>
            )}
          </div>
        )}

        <div className="my-1 border-t border-gray-200 dark:border-gray-700" />

        {/* Sources */}
        {navItem('/sources', <FileText className="w-4 h-4" />, 'Sumber')}
      </div>

      {/* Token Balance */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1"><Zap className="w-3 h-3" /> Token tersisa</span>
            <span className="font-semibold dark:text-white">{formatTokens(tokenBalance)}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-black dark:bg-white h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min(100, (tokenBalance / 10000) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
