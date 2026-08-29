import { useState, useCallback, useEffect } from 'react';

type Locale = 'id' | 'en';

const STORAGE_KEY = 'tara-locale';

const translations: Record<Locale, Record<string, string>> = {
  id: {
    'app.name': 'Tara AI',
    'chat.new': 'Chat Baru',
    'chat.placeholder': 'Tanya apa saja ke Tara...',
    'chat.send': 'Kirim',
    'chat.stop': 'Hentikan',
    'chat.search': 'Cari chat...',
    'chat.empty.title': 'Halo, saya Tara',
    'chat.empty.desc': 'Asisten AI untuk ekosistem Giantara. Tanya apa saja, atau unggah sumber untuk dianalisis.',
    'chat.export': 'Export',
    'chat.artifacts': 'Artifacts',
    'chat.templates': 'Templates',
    'chat.image': 'Gambar',
    'chat.run': 'Jalankan',
    'chat.comments': 'Komentar',
    'chat.shortcuts': 'Keyboard Shortcuts',
    'chat.analytics': 'Analytics',
    'chat.webhooks': 'Webhooks',
    'chat.summary': 'Ringkas',
    'chat.branch': 'Branch',
    'chat.branch.new': 'Branch baru',
    'chat.regenerate': 'Regenerasi',
    'chat.edit': 'Edit',
    'chat.copy': 'Salin',
    'chat.copied': 'Tersalin',
    'chat.download': 'Download',
    'chat.delete': 'Hapus',
    'chat.save': 'Simpan',
    'chat.cancel': 'Batal',
    'chat.close': 'Tutup',
    'chat.loading': 'Loading...',
    'chat.error': 'Terjadi kesalahan',
    'nav.chat': 'Chat',
    'nav.agents': 'Agents',
    'nav.collection': 'Koleksi',
    'nav.account': 'Akun',
    'nav.profile': 'Profil',
    'nav.billing': 'Token & Pembayaran',
    'nav.history': 'Riwayat Penggunaan',
    'nav.logout': 'Keluar',
    'nav.sources': 'Sumber',
    'agent.create': 'Buat Agent Baru',
    'agent.empty': 'Agent tidak ditemukan',
    'agent.chat.placeholder': 'Tanya {{name}}...',
    'chat.regenerating': 'Regenerasi...',
    'chat.editing': 'Edit & regenerate...',
    'chat.toggle.shortcuts': 'Toggle shortcuts',
    'agent.share': 'Bagikan',
    'admin.dashboard': 'Admin Dashboard',
    'admin.stats': 'Statistik',
    'admin.users': 'Pengguna',
    'admin.health': 'Kesehatan',
    'admin.loading': 'Memuat...',
    'admin.users.title': 'Pengguna',
    'admin.conversations': 'Percakapan',
    'admin.messages': 'Pesan',
    'admin.tokens': 'Token',
    'admin.agents': 'Agent',
    'admin.status': 'Status',
    'admin.banned': 'Diblokir',
    'admin.active': 'Aktif',
    'admin.admin': 'Admin',
    'admin.system': 'Sistem',
    'admin.database': 'Database',
    'admin.uptime': 'Waktu Aktif',
    'admin.memory': 'Memori',
  },
  en: {
    'app.name': 'Tara AI',
    'chat.new': 'New Chat',
    'chat.placeholder': 'Ask Tara anything...',
    'chat.send': 'Send',
    'chat.stop': 'Stop',
    'chat.search': 'Search chats...',
    'chat.empty.title': "Hello, I'm Tara",
    'chat.empty.desc': 'AI assistant for the Giantara ecosystem. Ask anything, or upload sources for analysis.',
    'chat.export': 'Export',
    'chat.artifacts': 'Artifacts',
    'chat.templates': 'Templates',
    'chat.image': 'Image',
    'chat.run': 'Run',
    'chat.comments': 'Comments',
    'chat.shortcuts': 'Keyboard Shortcuts',
    'chat.analytics': 'Analytics',
    'chat.webhooks': 'Webhooks',
    'chat.summary': 'Summarize',
    'chat.branch': 'Branch',
    'chat.branch.new': 'New branch',
    'chat.regenerate': 'Regenerate',
    'chat.edit': 'Edit',
    'chat.copy': 'Copy',
    'chat.copied': 'Copied',
    'chat.download': 'Download',
    'chat.delete': 'Delete',
    'chat.save': 'Save',
    'chat.cancel': 'Cancel',
    'chat.close': 'Close',
    'chat.loading': 'Loading...',
    'chat.error': 'An error occurred',
    'nav.chat': 'Chat',
    'nav.agents': 'Agents',
    'nav.collection': 'Collection',
    'nav.account': 'Account',
    'nav.profile': 'Profile',
    'nav.billing': 'Tokens & Billing',
    'nav.history': 'Usage History',
    'nav.logout': 'Logout',
    'nav.sources': 'Sources',
    'agent.create': 'Create New Agent',
    'agent.empty': 'Agent not found',
    'agent.chat.placeholder': 'Ask {{name}}...',
    'agent.share': 'Share',
    'chat.regenerating': 'Regenerating...',
    'chat.editing': 'Edit & regenerate...',
    'chat.toggle.shortcuts': 'Toggle shortcuts',
    'admin.dashboard': 'Admin Dashboard',
    'admin.stats': 'Stats',
    'admin.users': 'Users',
    'admin.health': 'Health',
    'admin.loading': 'Loading...',
    'admin.users.title': 'Users',
    'admin.conversations': 'Conversations',
    'admin.messages': 'Messages',
    'admin.tokens': 'Tokens',
    'admin.agents': 'Agents',
    'admin.status': 'Status',
    'admin.banned': 'Banned',
    'admin.active': 'Active',
    'admin.admin': 'Admin',
    'admin.system': 'System',
    'admin.database': 'Database',
    'admin.uptime': 'Uptime',
    'admin.memory': 'Memory',
  },
};

function getStoredLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'id') return stored;
  } catch {}
  return 'id';
}

export function useTranslation() {
  const [locale, setLocaleState] = useState<Locale>(getStoredLocale);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === 'id' ? 'en' : 'id');
  }, [locale, setLocale]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const t = useCallback((key: string, params?: Record<string, string>) => {
    const value = translations[locale][key] || key;
    if (params) {
      return Object.entries(params).reduce(
        (str, [param, val]) => str.replace(`{{${param}}}`, val),
        value
      );
    }
    return value;
  }, [locale]);

  return { locale, setLocale, toggleLocale, t };
}
