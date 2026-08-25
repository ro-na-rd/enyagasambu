'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Share2, Copy, Check, MessageCircle, Mail, Globe, Smartphone, Link as LinkIcon } from '@/lib/icons';

const NAVY = '#0f1e42';
const ORG = '#E85D04';

const platformIcons: Record<string, React.ReactNode> = {
  whatsapp: <MessageCircle size={18} />,
  facebook: <Globe size={18} />,
  twitter: <Globe size={18} />,
  instagram: <Globe size={18} />,
  email: <Mail size={18} />,
  sms: <Smartphone size={18} />,
  copy_link: <LinkIcon size={18} />,
  other: <Share2 size={18} />,
};

const platformColors: Record<string, string> = {
  whatsapp: '#25D366',
  facebook: '#1877F2',
  twitter: '#1DA1F2',
  email: '#EA4335',
  sms: '#6366f1',
  copy_link: ORG,
};

export default function AmbassadorPromotionsPage() {
  const [materials, setMaterials] = useState<{ type: string; title: string; content: string; description: string }[]>([]);
  const [stats, setStats] = useState<{ totalShares: number; byPlatform: { platform: string; count: number }[] } | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/ambassador/promotions/materials'),
      api.get('/ambassador/promotions/stats'),
    ])
      .then(([m, s]) => {
        setMaterials(m.data.materials);
        setStats(s.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    api.post('/ambassador/promotions/1/share', { platform: 'copy_link' }).catch(() => {});
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const shareOnPlatform = (platform: string, content: string) => {
    const encoded = encodeURIComponent(content);
    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encoded}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?quote=${encoded}`,
      twitter: `https://twitter.com/intent/tweet?text=${encoded}`,
      email: `mailto:?subject=Join%20E-Nyagasambu&body=${encoded}`,
    };
    if (urls[platform]) window.open(urls[platform], '_blank');
    api.post('/ambassador/promotions/1/share', { platform }).catch(() => {});
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="grid gap-4">{[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-xl" />)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Promotions</h1>
        <p className="text-sm text-gray-500 mt-1">Share and promote E-Nyagasambu services</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-2">
              <span style={{ color: ORG }}><Share2 size={24} /></span>
            </div>
            <p className="text-3xl font-extrabold" style={{ color: NAVY }}>{stats.totalShares}</p>
            <p className="text-sm font-semibold text-gray-800 mt-1">Total Shares</p>
          </div>
          {stats.byPlatform.slice(0, 3).map((p) => (
            <div key={p.platform} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-2">
                <span style={{ color: platformColors[p.platform] || NAVY }}>{platformIcons[p.platform]}</span>
              </div>
              <p className="text-3xl font-extrabold" style={{ color: platformColors[p.platform] || NAVY }}>{p.count}</p>
              <p className="text-sm font-semibold text-gray-800 mt-1 capitalize">{p.platform.replace('_', ' ')}</p>
            </div>
          ))}
        </div>
      )}

      <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-3">Promotional Materials</h2>
      <div className="space-y-4">
        {materials.map((mat, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-gray-800">{mat.title}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{mat.description}</p>
              </div>
              <button
                onClick={() => copyToClipboard(mat.content, i)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 hover:border-[#E85D04] hover:text-[#E85D04] transition shrink-0"
              >
                {copiedIdx === i ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
              </button>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 whitespace-pre-wrap max-h-32 overflow-auto font-mono">
              {mat.content}
            </div>
            {(mat.type === 'whatsapp' || mat.type === 'social_post') && (
              <div className="mt-3 flex gap-2">
                {mat.type === 'whatsapp' && (
                  <button
                    onClick={() => shareOnPlatform('whatsapp', mat.content)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition"
                    style={{ background: '#25D366' }}
                  >
                    <MessageCircle size={14} /> Share on WhatsApp
                  </button>
                )}
                {mat.type === 'social_post' && (
                  <>
                    <button onClick={() => shareOnPlatform('facebook', mat.content)}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition"
                      style={{ background: '#1877F2' }}>
                      <Globe size={14} /> Facebook
                    </button>
                    <button onClick={() => shareOnPlatform('twitter', mat.content)}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition"
                      style={{ background: '#1DA1F2' }}>
                      <Globe size={14} /> Twitter
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
