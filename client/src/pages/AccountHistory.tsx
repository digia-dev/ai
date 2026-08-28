import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';

interface LedgerEntry {
  id: number;
  type: string;
  amount: number;
  balance: number;
  description: string;
  createdAt: string;
}

interface Usage {
  today: number;
  week: number;
  month: number;
}

export default function AccountHistory() {
  const navigate = useNavigate();
  const [history, setHistory] = useState<LedgerEntry[]>([]);
  const [usage, setUsage] = useState<Usage>({ today: 0, week: 0, month: 0 });

  useEffect(() => {
    apiFetch('/api/account/tokens/history').then(r => r.ok ? r.json() : []).then(setHistory);
    apiFetch('/api/account/usage').then(r => r.ok ? r.json() : null).then(d => { if (d) setUsage(d); });
  }, []);

  const formatTokens = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

  const typeLabel = (t: string) => {
    const labels: Record<string, string> = { usage: 'penggunaan', purchase: 'isi ulang', trial: 'bonus', grant: 'grant' };
    return labels[t] || t;
  };

  const typeColor = (t: string) => {
    return t === 'usage' ? 'text-red-500' : 'text-green-600';
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-5 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">📊 Usage History</h1>
          <button onClick={() => navigate('/chat')} className="py-2 px-4 rounded-lg border border-gray-200 bg-white text-xs font-medium hover:bg-gray-50">← Back</button>
        </div>

        {/* Usage Stats */}
        <div className="border border-gray-200 rounded-xl p-5 mb-6">
          <h2 className="font-semibold text-sm mb-3">Ringkasan Penggunaan</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold">{formatTokens(usage.today)}</div>
              <div className="text-xs text-gray-500">Hari ini</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold">{formatTokens(usage.week)}</div>
              <div className="text-xs text-gray-500">Minggu ini</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold">{formatTokens(usage.month)}</div>
              <div className="text-xs text-gray-500">Bulan ini</div>
            </div>
          </div>
        </div>

        {/* Token Ledger */}
        <h2 className="font-semibold text-sm mb-3">Riwayat Token</h2>
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="grid grid-cols-4 gap-2 px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500">
            <div>Tanggal</div>
            <div>Tipe</div>
            <div className="text-right">Jumlah</div>
            <div className="text-right">Saldo</div>
          </div>
          {history.map(h => (
            <div key={h.id} className="grid grid-cols-4 gap-2 px-4 py-2.5 border-t border-gray-100 text-xs">
              <div>{new Date(h.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
              <div>{typeLabel(h.type)}</div>
              <div className={`text-right font-medium ${typeColor(h.type)}`}>{h.type === 'usage' ? '-' : '+'}{formatTokens(h.amount)}</div>
              <div className="text-right text-gray-500">{formatTokens(h.balance)}</div>
            </div>
          ))}
          {history.length === 0 && <div className="px-4 py-8 text-center text-gray-400 text-sm">Belum ada riwayat</div>}
        </div>
      </div>
    </div>
  );
}
