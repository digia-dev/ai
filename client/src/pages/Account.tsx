import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { SkeletonPage } from '../components/Skeleton';
import { toast } from '../components/Toast';
import { Eye, EyeOff } from 'lucide-react';

export default function Account() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch('/api/account/profile')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) { setName(d.name); setEmail(d.email); } })
      .finally(() => setLoading(false));
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    const res = await apiFetch('/api/account/profile', { method: 'PUT', body: JSON.stringify({ name, email }) });
    setSaving(false);
    if (res.ok) toast.success('Profil berhasil disimpan');
    else toast.error('Gagal menyimpan profil');
  };

  const changePassword = async () => {
    if (!currentPass || !newPass) {
      toast.error('Mohon isi password saat ini dan password baru');
      return;
    }
    const res = await apiFetch('/api/account/password', { method: 'PUT', body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass }) });
    if (res.ok) {
      toast.success('Password berhasil diubah');
      setCurrentPass('');
      setNewPass('');
    } else {
      toast.error('Password gagal diubah');
    }
  };

  if (loading) return <SkeletonPage />;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-5 py-6">
        <h1 className="text-xl font-bold mb-6">Profil</h1>

        <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 mb-6">
          <h2 className="font-semibold text-sm mb-4 dark:text-white">Informasi Akun</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Nama</label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm outline-none focus:border-black dark:focus:border-blue-500 bg-white dark:bg-gray-700 text-black dark:text-white" />
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm outline-none focus:border-black dark:focus:border-blue-500 bg-white dark:bg-gray-700 text-black dark:text-white" />
            </div>
            <button onClick={saveProfile} disabled={saving} className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50">
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <h2 className="font-semibold text-sm mb-4 dark:text-white">Ubah Password</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Password saat ini</label>
              <div className="relative">
                <input type={showCurrentPass ? 'text' : 'password'} value={currentPass} onChange={e => setCurrentPass(e.target.value)} className="w-full px-3 py-2 pr-10 border border-gray-200 dark:border-gray-600 rounded-lg text-sm outline-none focus:border-black dark:focus:border-blue-500 bg-white dark:bg-gray-700 text-black dark:text-white" />
                <button onClick={() => setShowCurrentPass(!showCurrentPass)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black dark:hover:text-white">
                  {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Password baru</label>
              <div className="relative">
                <input type={showNewPass ? 'text' : 'password'} value={newPass} onChange={e => setNewPass(e.target.value)} className="w-full px-3 py-2 pr-10 border border-gray-200 dark:border-gray-600 rounded-lg text-sm outline-none focus:border-black dark:focus:border-blue-500 bg-white dark:bg-gray-700 text-black dark:text-white" />
                <button onClick={() => setShowNewPass(!showNewPass)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black dark:hover:text-white">
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button onClick={changePassword} className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm hover:bg-gray-800 dark:hover:bg-gray-200">Ubah Password</button>
          </div>
        </div>
      </div>
    </div>
  );
}
