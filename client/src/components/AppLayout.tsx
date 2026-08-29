import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { removeToken } from '../lib/auth';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current) return;

    const deltaX = e.changedTouches[0].clientX - touchStart.current.x;
    const deltaY = e.changedTouches[0].clientY - touchStart.current.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    if (Math.max(absDeltaX, absDeltaY) < 50) return;

    if (absDeltaX > absDeltaY) {
      if (deltaX > 0 && touchStart.current.x < 30) {
        setSidebarOpen(true);
      } else if (deltaX < 0 && sidebarOpen) {
        setSidebarOpen(false);
      }
    }

    touchStart.current = null;
  }, [sidebarOpen]);

  return (
    <div
      className="flex h-screen bg-white dark:bg-gray-900 transition-colors"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 md:relative md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar
          currentPath={location.pathname}
          onNewChat={() => navigate('/chat')}
          onLogout={handleLogout}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden fixed top-3 left-3 z-30 p-2 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700"
        >
          <Menu className="w-5 h-5" />
        </button>

        {children}
      </div>
    </div>
  );
}
