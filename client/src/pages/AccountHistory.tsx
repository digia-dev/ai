import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { formatTokens } from '../lib/constants';
import { SkeletonPage } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';

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
  const [history, setHistory] = useState<LedgerEntry[]>([]);
  const [usage, setUsage] = useState<Usage>({ today: 0, week: 0, month: 0 });
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch('/api/account/tokens/history').then(r => r.ok ? r.json() : []),
      apiFetch('/api/account/usage').then(r => r.ok ? r.json() : null),
    ]).then(([h, u]) => {
      setHistory(h);
      if (u) setUsage(u);
    }).finally(() => setInitialLoading(false));
  }, []);

  const typeLabel = (t: string) => {
    const labels: Record<string, string> = { usage: 'Penggunaan', purchase: 'Isi Ulang', trial: 'Bonus', grant: 'Grant' };
    return labels[t] || t;
  };

  if (initialLoading) return <SkeletonPage />;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-5 py-6">
        <h1 className="text-xl font-bold mb-6">Riwayat Penggunaan</h1>

        <div className="border border-gray-200 rounded-xl p-5 mb-6">
          <h2 className="font-semibold text-sm mb-3">Ringkasan</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Hari ini', value: usage.today },
              { label: 'Minggu ini', value: usage.week },
              { label: 'Bulan ini', value: usage.month },
            ].map(s => (
              <div key={s.label} className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold">{formatTokens(s.value)}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

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
              <div className={`text-right font-medium ${h.type === 'usage' ? 'text-red-500' : 'text-green-600'}`}>
                {h.type === 'usage' ? '-' : '+'}{formatTokens(h.amount)}
              </div>
              <div className="text-right text-gray-500">{formatTokens(h.balance)}</div>
            </div>
          ))}
          {history.length === 0 && (
            <EmptyState title="Belum ada riwayat" description="Riwayat penggunaan token akan muncul di sini" />
          )}
        </div>
      </div>
    </div>
  );
}
