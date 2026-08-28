import { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface ToastItem {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}

let toastId = 0;
let listeners: ((items: ToastItem[]) => void)[] = [];
let toasts: ToastItem[] = [];

function notify(type: ToastItem['type'], message: string) {
  const id = ++toastId;
  toasts = [...toasts, { id, type, message }];
  listeners.forEach(l => l(toasts));
  setTimeout(() => {
    toasts = toasts.filter(t => t.id !== id);
    listeners.forEach(l => l(toasts));
  }, 4000);
}

export const toast = {
  success: (msg: string) => notify('success', msg),
  error: (msg: string) => notify('error', msg),
  info: (msg: string) => notify('info', msg),
};

export function ToastContainer() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    listeners.push(setItems);
    return () => { listeners = listeners.filter(l => l !== setItems); };
  }, []);

  const dismiss = (id: number) => {
    toasts = toasts.filter(t => t.id !== id);
    listeners.forEach(l => l(toasts));
  };

  if (items.length === 0) return null;

  const icons = {
    success: <CheckCircle className="w-4 h-4 text-green-500" />,
    error: <AlertCircle className="w-4 h-4 text-red-500" />,
    info: <Info className="w-4 h-4 text-blue-500" />,
  };

  return (
    <div className="fixed bottom-4 right-4 z-[100] space-y-2">
      {items.map(t => (
        <div key={t.id} className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-lg text-sm animate-[slide-up_0.2s_ease-out]">
          {icons[t.type]}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => dismiss(t.id)} className="text-gray-400 hover:text-black">
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
