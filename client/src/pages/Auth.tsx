import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setToken } from '../lib/auth';
import { apiFetch } from '../lib/api';
import { Eye, EyeOff } from 'lucide-react';

export default function Auth() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegister && password !== confirmPassword) {
      setError('Password tidak cocok');
      return;
    }

    setLoading(true);
    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const body = isRegister ? { email, password, name } : { email, password };
      const res = await apiFetch(endpoint, { method: 'POST', body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setToken(data.token);
      navigate('/chat');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-white dark:bg-gray-900">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <svg viewBox="0 0 32 32" className="w-10 h-10 mx-auto mb-4">
            <path d="M16 2L28 16L16 30L4 16L16 2Z" fill="currentColor" className="text-black dark:text-white"/>
          </svg>
          <h1 className="text-2xl font-bold dark:text-white">{isRegister ? 'Buat Akun' : 'Tara AI'}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isRegister ? 'Gabung dengan ekosistem Giantara' : 'Asisten AI bertenaga Giantara'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Nama</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama kamu" className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm outline-none focus:border-black dark:focus:border-blue-500 bg-white dark:bg-gray-800 text-black dark:text-white" required />
            </div>
          )}

          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="kamu@contoh.com" className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm outline-none focus:border-black dark:focus:border-blue-500 bg-white dark:bg-gray-800 text-black dark:text-white" required />
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Password</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 karakter" className="w-full px-3 py-2.5 pr-10 border border-gray-200 dark:border-gray-600 rounded-lg text-sm outline-none focus:border-black dark:focus:border-blue-500 bg-white dark:bg-gray-800 text-black dark:text-white" required minLength={6} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black dark:hover:text-white">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {isRegister && (
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Konfirmasi Password</label>
              <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Ulangi password" className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm outline-none focus:border-black dark:focus:border-blue-500 bg-white dark:bg-gray-800 text-black dark:text-white" required minLength={6} />
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50">
            {loading ? 'Memuat...' : isRegister ? 'Daftar' : 'Masuk'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-5">
          {isRegister ? 'Sudah punya akun?' : 'Belum punya akun?'}{' '}
          <button onClick={() => { setIsRegister(!isRegister); setError(''); setConfirmPassword(''); }} className="text-black dark:text-white font-semibold hover:underline">
            {isRegister ? 'Masuk' : 'Daftar'}
          </button>
        </p>

        {!isRegister && (
          <p className="text-center text-xs text-gray-400 mt-3">
            <button className="hover:underline hover:text-black dark:hover:text-white">Lupa password?</button>
          </p>
        )}
      </div>
    </div>
  );
}
