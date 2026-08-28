import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { formatTokens, formatPrice } from '../lib/constants';
import { SkeletonPage } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import { toast } from '../components/Toast';
import { Zap } from 'lucide-react';

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
  { id: 'qris', name: 'QRIS', desc: 'Scan di semua bank & e-wallet' },
  { id: 'gopay', name: 'GoPay', desc: '' },
  { id: 'ovo', name: 'OVO', desc: '' },
  { id: 'dana', name: 'Dana', desc: '' },
  { id: 'shopeepay', name: 'ShopeePay', desc: '' },
  { id: 'bank_transfer', name: 'Transfer Bank (VA)', desc: 'BCA / BRI / Mandiri / BNI' },
];

export default function AccountBilling() {
  const [billing, setBilling] = useState<Billing | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPkg, setSelectedPkg] = useState<Package | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch('/api/account/billing').then(r => r.ok ? r.json() : null),
      apiFetch('/api/payments/packages').then(r => r.ok ? r.json() : []),
    ]).then(([b, p]) => {
      if (b) setBilling(b);
      setPackages(p);
    }).finally(() => setInitialLoading(false));
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
        const bRes = await apiFetch('/api/account/billing');
        if (bRes.ok) setBilling(await bRes.json());
        toast.success('Pembayaran berhasil!');
      } else {
        toast.error('Pembayaran gagal');
      }
    } catch {
      toast.error('Terjadi kesalahan');
    }
    setPaying(false);
  };

  if (initialLoading) return <SkeletonPage />;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-5 py-6">
        <h1 className="text-xl font-bold mb-6">Token & Pembayaran</h1>

        {billing && (
          <div className="border border-gray-200 rounded-xl p-5 mb-6">
            <h2 className="font-semibold text-sm mb-3">Saldo Token</h2>
            <div className="flex items-center gap-2 text-3xl font-bold mb-2">
              <Zap className="w-7 h-7" /> {formatTokens(billing.tokenBalance)}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div className="bg-black h-2 rounded-full transition-all" style={{ width: `${Math.min(100, (billing.tokenBalance / 10000) * 100)}%` }} />
            </div>
            <div className="text-xs text-gray-500">
              Paket: {billing.plan} · Trial: {formatTokens(billing.trialTokens)} token
              {billing.trialEndsAt && ` · Berlaku hingga: ${new Date(billing.trialEndsAt).toLocaleDateString('id-ID')}`}
            </div>
          </div>
        )}

        <h2 className="font-semibold text-sm mb-3">Isi Ulang Token</h2>
        <p className="text-xs text-gray-500 mb-4">Pilih paket yang sesuai kebutuhanmu:</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          {packages.map(pkg => (
            <div
              key={pkg.id}
              className={`border rounded-xl p-4 cursor-pointer transition-all hover:shadow-sm ${
                selectedPkg?.id === pkg.id ? 'border-black bg-gray-50' : 'border-gray-200'
              }`}
              onClick={() => handleBuy(pkg)}
            >
              <div className="text-sm font-semibold mb-1">{pkg.name}</div>
              <div className="text-2xl font-bold mb-1">{formatTokens(pkg.tokens)}</div>
              {pkg.bonus > 0 && <div className="text-xs text-green-600 mb-2">+{formatTokens(pkg.bonus)} bonus</div>}
              <div className="text-lg font-semibold">{formatPrice(pkg.price)}</div>
            </div>
          ))}
        </div>

        {packages.length === 0 && (
          <EmptyState title="Belum ada paket" description="Paket token akan segera tersedia" />
        )}

        <Modal open={showPayment} onClose={() => setShowPayment(false)} maxWidth="max-w-md">
          {paid ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-green-50 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl text-green-500">✓</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">Pembayaran Berhasil!</h3>
              <p className="text-sm text-gray-500 mb-4">{selectedPkg && formatTokens(selectedPkg.tokens + selectedPkg.bonus)} token telah ditambahkan</p>
              <button onClick={() => setShowPayment(false)} className="px-4 py-2 bg-black text-white rounded-lg text-sm">Kembali</button>
            </div>
          ) : (
            <div className="p-5">
              <h3 className="font-semibold text-sm mb-4">Isi Ulang: {selectedPkg?.name}</h3>
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="text-sm">Total: <span className="font-semibold">{selectedPkg && formatPrice(selectedPkg.price)}</span></div>
                <div className="text-xs text-gray-500">{selectedPkg && formatTokens(selectedPkg.tokens)} token{selectedPkg && selectedPkg.bonus > 0 ? ` + ${formatTokens(selectedPkg.bonus)} bonus` : ''}</div>
              </div>

              <h4 className="text-xs font-medium text-gray-500 mb-2">Metode Pembayaran</h4>
              <div className="space-y-2 mb-4">
                {PAYMENT_METHODS.map(m => (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMethod(m.id)}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedMethod === m.id ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="w-2 h-2 rounded-full border-2 border-gray-300 shrink-0" style={{ borderColor: selectedMethod === m.id ? 'black' : undefined, backgroundColor: selectedMethod === m.id ? 'black' : undefined }} />
                    <div>
                      <div className="text-sm font-medium">{m.name}</div>
                      {m.desc && <div className="text-xs text-gray-500">{m.desc}</div>}
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={handlePay} disabled={!selectedMethod || paying} className="w-full py-3 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-50">
                {paying ? 'Memproses...' : `Bayar ${selectedPkg && formatPrice(selectedPkg.price)}`}
              </button>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
