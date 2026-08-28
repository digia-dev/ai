import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';

export default function Account() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    apiFetch('/api/account/profile').then(r => r.ok ? r.json() : null).then(d => {
      if (d) { setName(d.name); setEmail(d.email); }
    });
  }, []);

  const saveProfile = async () => {
    const res = await apiFetch('/api/account/profile', { method: 'PUT', body: JSON.stringify({ name, email }) });
    if (res.ok) { setMsg('Profil berhasil disimpan'); setTimeout(() => setMsg(''), 3000); }
  };

  const changePassword = async () => {
    if (!currentPass || !newPass) return;
    const res = await apiFetch('/api/account/password', { method: 'PUT', body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass }) });
    if (res.ok) { setMsg('Password berhasil diubah'); setCurrentPass(''); setNewPass(''); setTimeout(() => setMsg(''), 3000); }
    else { setMsg('Password gagal diubah'); setTimeout(() => setMsg(''), 3000); }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-5 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">👤 Profile</h1>
          <button onClick={() => navigate('/chat')} className="py-2 px-4 rounded-lg border border-gray-200 bg-white text-xs font-medium hover:bg-gray-50">← Back</button>
        </div>

        {msg && <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-lg">{msg}</div>}

        <div className="border border-gray-200 rounded-xl p-5 mb-6">
          <h2 className="font-semibold text-sm mb-4">Informasi Akun</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Nama</label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-black" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Email</label>
              <input value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-black" />
            </div>
            <button onClick={saveProfile} className="px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800">Simpan Perubahan</button>
          </div>
        </div>

        <div className="border border-gray-200 rounded-xl p-5 mb-6">
          <h2 className="font-semibold text-sm mb-4">Ubah Password</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Password saat ini</label>
              <input type="password" value={currentPass} onChange={e => setCurrentPass(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-black" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Password baru</label>
              <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-black" />
            </div>
            <button onClick={changePassword} className="px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800">Ubah Password</button>
          </div>
        </div>
      </div>
    </div>
  );
}
