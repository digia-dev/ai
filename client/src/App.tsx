import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Auth from './pages/Auth';
import Chat from './pages/Chat';
import Sources from './pages/Sources';
import AgentChat from './pages/AgentChat';
import AgentManager from './pages/AgentManager';
import Account from './pages/Account';
import AccountBilling from './pages/AccountBilling';
import AccountHistory from './pages/AccountHistory';
import Collection from './pages/Collection';
import AppLayout from './components/AppLayout';
import { ToastContainer } from './components/Toast';
import { getCurrentUser } from './lib/auth';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    getCurrentUser().then((user) => {
      setAuthed(!!user);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-sm text-gray-400">Memuat...</div>;
  if (!authed) return <Navigate to="/login" replace />;
  return <AppLayout>{children}</AppLayout>;
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<Auth />} />
        <Route path="/register" element={<Auth />} />
        <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/sources" element={<ProtectedRoute><Sources /></ProtectedRoute>} />
        <Route path="/agents" element={<ProtectedRoute><AgentManager /></ProtectedRoute>} />
        <Route path="/agents/:agentId" element={<ProtectedRoute><AgentChat /></ProtectedRoute>} />
        <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
        <Route path="/account/billing" element={<ProtectedRoute><AccountBilling /></ProtectedRoute>} />
        <Route path="/account/history" element={<ProtectedRoute><AccountHistory /></ProtectedRoute>} />
        <Route path="/collection" element={<ProtectedRoute><Collection /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/chat" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
