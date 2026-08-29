import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import MessageBubble from '../components/MessageBubble';
import { SkeletonChat } from '../components/Skeleton';
import { Paperclip, Share2 } from 'lucide-react';

interface SharedData {
  title: string;
  authorName: string;
  createdAt: string;
  views: number;
  messages: Array<{
    role: string;
    content: string;
    outputFiles: any[];
    createdAt: string;
  }>;
}

export default function SharedResult() {
  const { token } = useParams();
  const [data, setData] = useState<SharedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) {
      fetch(`/api/shared/${token}`)
        .then(r => {
          if (!r.ok) throw new Error('Link tidak ditemukan');
          return r.json();
        })
        .then(setData)
        .catch((e: any) => setError(e.message))
        .finally(() => setLoading(false));
    }
  }, [token]);

  const shareWhatsApp = () => {
    const text = `Hasil agent *${data?.title}* dari Tara AI:\n${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (loading) return <SkeletonChat />;
  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="text-4xl mb-4">🔗</div>
        <h2 className="text-lg font-bold mb-2">Link tidak ditemukan</h2>
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-5 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 32 32" className="w-5 h-5">
                <path d="M16 2L28 16L16 30L4 16L16 2Z" fill="black"/>
              </svg>
              <span className="font-bold text-sm">Tara AI</span>
            </div>
            <h1 className="text-sm font-semibold mt-1">{data?.title}</h1>
            <p className="text-xs text-gray-400">
              Oleh {data?.authorName} · {data?.createdAt && new Date(data.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} · {data?.views} views
            </p>
          </div>
          <button onClick={shareWhatsApp} className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs hover:bg-green-600">
            <Share2 className="w-3 h-3" /> Bagikan ke WhatsApp
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="max-w-2xl mx-auto px-5 py-5">
        {data?.messages.map((m, i) => (
          <div key={i}>
            <MessageBubble role={m.role} content={m.content} createdAt={m.createdAt} />
            {m.outputFiles && m.outputFiles.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-4 pl-11">
                {m.outputFiles.map((f: any, j: number) => (
                  <a key={j} href={f.downloadUrl} className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-lg text-xs hover:bg-gray-200 transition-colors">
                    <Paperclip className="w-3 h-3" /> {f.name}
                    <span className="text-gray-400">({(f.size / 1024).toFixed(1)} KB)</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 px-5 py-4 text-center">
        <p className="text-xs text-gray-400">Dibuat dengan Tara AI · giantara.web.id</p>
      </div>
    </div>
  );
}
