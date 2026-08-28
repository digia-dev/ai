interface Conversation {
  id: number;
  title: string;
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
        {conversations.map((c) => (
          <div
            key={c.id}
            onClick={() => onSelectConversation(c.id, c.title)}
            className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs cursor-pointer hover:bg-gray-100 mb-0.5 ${
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
      </div>

      <div className="p-3 border-t border-gray-200 flex gap-2">
        <button
          onClick={onShowSources}
          className="flex-1 py-2 rounded-lg border border-gray-200 bg-white text-xs hover:bg-gray-50"
        >
          Sources
        </button>
        <button
          onClick={onLogout}
          className="flex-1 py-2 rounded-lg border border-gray-200 bg-white text-xs hover:bg-gray-50"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
