import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';

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
  conversations: Conversation[];
  currentConvId: number | null;
  onNewChat: () => void;
  onSelectConversation: (id: number, title: string) => void;
  onDeleteConversation: (id: number) => void;
  onShowSources: () => void;
  onLogout: () => void;
}

export default function Sidebar({
  conversations,
  currentConvId,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  onShowSources,
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

  const formatTokens = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
  };

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
          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-lg hover:bg-gray-100"
          title="New Chat"
        >
          +
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {/* Chat Section */}
        <div
          className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-500 cursor-pointer hover:text-gray-700"
          onClick={() => navigate('/chat')}
        >
          <span>💬</span>
          <span>Chat</span>
        </div>
        {conversations.map((c) => (
          <div
            key={c.id}
            onClick={() => onSelectConversation(c.id, c.title)}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer hover:bg-gray-100 mb-0.5 ${
              c.id === currentConvId ? 'bg-gray-100 font-semibold' : ''
            }`}
          >
            <span className="flex-1 truncate">{c.title || 'New Chat'}</span>
            <button
              onClick={(e) => { e.stopPropagation(); onDeleteConversation(c.id); }}
              className="opacity-0 hover:opacity-100 text-gray-400 hover:text-black ml-2"
            >
              ×
            </button>
          </div>
        ))}

        {/* Divider */}
        <div className="my-2 border-t border-gray-200" />

        {/* Agents Section */}
        <div
          className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-500 cursor-pointer hover:text-gray-700"
          onClick={() => toggleSection('agents')}
        >
          <span>🤖</span>
          <span>Agents</span>
          <span className="ml-auto text-[10px]">{expandedSections.agents ? '▾' : '▸'}</span>
        </div>
        {expandedSections.agents && (
          <>
            {agents.map((a) => (
              <div
                key={a.id}
                onClick={() => navigate(`/agents/${a.id}`)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs cursor-pointer hover:bg-gray-100 mb-0.5"
              >
                <span>{a.icon}</span>
                <span className="flex-1 truncate">{a.name}</span>
              </div>
            ))}
            <div
              onClick={() => navigate('/agents')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs cursor-pointer hover:bg-gray-100 text-gray-500"
            >
              <span>+</span>
              <span>Create New Agent</span>
            </div>
          </>
        )}

        {/* Divider */}
        <div className="my-2 border-t border-gray-200" />

        {/* Collection */}
        <div
          onClick={() => navigate('/collection')}
          className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-500 cursor-pointer hover:text-gray-700"
        >
          <span>📁</span>
          <span>Collection</span>
        </div>

        {/* Divider */}
        <div className="my-2 border-t border-gray-200" />

        {/* Account Section */}
        <div
          className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-500 cursor-pointer hover:text-gray-700"
          onClick={() => toggleSection('account')}
        >
          <span>👤</span>
          <span>Account</span>
          <span className="ml-auto text-[10px]">{expandedSections.account ? '▾' : '▸'}</span>
        </div>
        {expandedSections.account && (
          <>
            <div
              onClick={() => navigate('/account')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs cursor-pointer hover:bg-gray-100 mb-0.5"
            >
              <span>📋</span>
              <span>Profile</span>
            </div>
            <div
              onClick={() => navigate('/account/billing')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs cursor-pointer hover:bg-gray-100 mb-0.5"
            >
              <span>💳</span>
              <span>Token & Billing</span>
            </div>
            <div
              onClick={() => navigate('/account/history')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs cursor-pointer hover:bg-gray-100 mb-0.5"
            >
              <span>📊</span>
              <span>Usage History</span>
            </div>
          </>
        )}

        {/* Divider */}
        <div className="my-2 border-t border-gray-200" />

        {/* Sources */}
        <div
          onClick={onShowSources}
          className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-500 cursor-pointer hover:text-gray-700"
        >
          <span>📄</span>
          <span>Sources</span>
        </div>
      </div>

      {/* Token Balance */}
      <div className="p-3 border-t border-gray-200">
        <div className="bg-white border border-gray-200 rounded-lg p-3 mb-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-500">⚡ Token tersisa</span>
            <span className="font-semibold">{formatTokens(tokenBalance)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-black h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min(100, (tokenBalance / 10000) * 100)}%` }}
            />
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full py-2 rounded-lg border border-gray-200 bg-white text-xs hover:bg-gray-50"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
