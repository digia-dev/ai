import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { removeToken } from '../lib/auth';
import Sidebar from './Sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-white">
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
        {children}
      </div>
    </div>
  );
}
