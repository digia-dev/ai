import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';

interface Billing {
  plan: string;
  tokenBalance: number;
  trialTokens: number;
  trialEndsAt: string;
}

interface Package {
  id: string;
  name: string;
  tokens: number;
  price: number;
  bonus: number;
}

const PAYMENT_METHODS = [
  { id: 'qris', name: 'QRIS', icon: '📷', desc: 'Scan di semua bank & e-wallet' },
  { id: 'gopay', name: 'GoPay', icon: '📱', desc: '' },
  { id: 'ovo', name: 'OVO', icon: '📱', desc: '' },
  { id: 'dana', name: 'Dana', icon: '📱', desc: '' },
  { id: 'shopeepay', name: 'ShopeePay', icon: '📱', desc: '' },
  { id: 'bank_transfer', name: 'Transfer Bank (VA)', icon: '🏦', desc: 'BCA / BRI / Mandiri / BNI' },
];

export default function AccountBilling() {
  const navigate = useNavigate();
  const [billing, setBilling] = useState<Billing | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPkg, setSelectedPkg] = useState<Package | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    apiFetch('/api/account/billing').then(r => r.ok ? r.json() : null).then(setBilling);
    apiFetch('/api/payments/packages').then(r => r.ok ? r.json() : []).then(setPackages);
  }, []);

  const handleBuy = (pkg: Package) => {
    setSelectedPkg(pkg);
    setShowPayment(true);
    setPaid(false);
  };

  const handlePay = async () => {
    if (!selectedPkg || !selectedMethod) return;
    setPaying(true);
    try {
      const res = await apiFetch('/api/payments/create', { method: 'POST', body: JSON.stringify({ packageId: selectedPkg.id }) });
      if (res.ok) {
        setPaid(true);
        // Refresh billing
        const bRes = await apiFetch('/api/account/billing');
        if (bRes.ok) setBilling(await bRes.json());
      }
    } catch {}
    setPaying(false);
  };

  const formatTokens = (n: number) => n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(0)}K` : String(n);

  const formatPrice = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-5 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">💳 Token & Billing</h1>
          <button onClick={() => navigate('/chat')} className="py-2 px-4 rounded-lg border border-gray-200 bg-white text-xs font-medium hover:bg-gray-50">← Back</button>
        </div>

        {/* Token Balance */}
        {billing && (
          <div className="border border-gray-200 rounded-xl p-5 mb-6">
            <h2 className="font-semibold text-sm mb-3">Saldo Token</h2>
            <div className="text-3xl font-bold mb-2">⚡ {formatTokens(billing.tokenBalance)}</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div className="bg-black h-2 rounded-full transition-all" style={{ width: `${Math.min(100, (billing.tokenBalance / 10000) * 100)}%` }} />
            </div>
            <div className="text-xs text-gray-500">
              Paket: {billing.plan} · Trial: {formatTokens(billing.trialTokens)} token
              {billing.trialEndsAt && ` · Berlaku hingga: ${new Date(billing.trialEndsAt).toLocaleDateString('id-ID')}`}
            </div>
          </div>
        )}

        {/* Token Packages */}
        <h2 className="font-semibold text-sm mb-3">Isi Ulang Token</h2>
        <p className="text-xs text-gray-500 mb-4">Pilih paket yang sesuai kebutuhanmu:</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          {packages.map(pkg => (
            <div key={pkg.id} className={`border rounded-xl p-4 cursor-pointer transition-all ${selectedPkg?.id === pkg.id ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`} onClick={() => handleBuy(pkg)}>
              <div className="text-sm font-semibold mb-1">{pkg.name}</div>
              <div className="text-2xl font-bold mb-1">{formatTokens(pkg.tokens)}</div>
              {pkg.bonus > 0 && <div className="text-xs text-green-600 mb-2">+{formatTokens(pkg.bonus)} bonus</div>}
              <div className="text-lg font-semibold">{formatPrice(pkg.price)}</div>
            </div>
          ))}
        </div>

        {/* Payment Modal */}
        {showPayment && selectedPkg && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowPayment(false)}>
            <div className="bg-white rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
              <div className="p-5 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold">Isi Ulang: {selectedPkg.name}</h3>
                <button onClick={() => setShowPayment(false)} className="text-gray-400 hover:text-black">✕</button>
              </div>

              {paid ? (
                <div className="p-8 text-center">
                  <div className="text-4xl mb-3">✓</div>
                  <h3 className="font-semibold text-lg mb-2">Pembayaran Berhasil!</h3>
                  <p className="text-sm text-gray-500 mb-4">{formatTokens(selectedPkg.tokens + selectedPkg.bonus)} token telah ditambahkan</p>
                  <button onClick={() => setShowPayment(false)} className="px-4 py-2 bg-black text-white rounded-lg text-sm">Kembali</button>
                </div>
              ) : (
                <div className="p-5">
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <div className="text-sm">Total: <span className="font-semibold">{formatPrice(selectedPkg.price)}</span></div>
                    <div className="text-xs text-gray-500">{formatTokens(selectedPkg.tokens)} token{selectedPkg.bonus > 0 ? ` + ${formatTokens(selectedPkg.bonus)} bonus` : ''}</div>
                  </div>

                  <h4 className="text-xs font-medium text-gray-500 mb-2">Metode Pembayaran</h4>
                  <div className="space-y-2 mb-4">
                    {PAYMENT_METHODS.map(m => (
                      <div key={m.id} onClick={() => setSelectedMethod(m.id)} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${selectedMethod === m.id ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <span className="text-lg">{m.icon}</span>
                        <div>
                          <div className="text-sm font-medium">{m.name}</div>
                          {m.desc && <div className="text-xs text-gray-500">{m.desc}</div>}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button onClick={handlePay} disabled={!selectedMethod || paying} className="w-full py-3 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-50">
                    {paying ? 'Memproses...' : `Bayar ${formatPrice(selectedPkg.price)}`}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
