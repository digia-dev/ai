import { useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare, Bot, Folder, User } from 'lucide-react';

export default function MobileNav() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const items = [
    { path: '/chat', icon: MessageSquare, label: 'Chat' },
    { path: '/agents', icon: Bot, label: 'Agent' },
    { path: '/collection', icon: Folder, label: 'Koleksi' },
    { path: '/account', icon: User, label: 'Akun' },
  ];
  
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50 safe-bottom">
      <div className="flex items-center justify-around h-16">
        {items.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path === '/chat' && location.pathname.startsWith('/chat'));
          const Icon = item.icon;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
