'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { FileText, Loader2, AlertCircle, Info } from '@/lib/icons';
import { stripHtml } from '@/lib/text';

const NAVY = '#0f1e42';
const ORG = '#E85D04';

export default function LegalPage({ slug, fallbackTitle }: { slug: string; fallbackTitle: string }) {
  const [page, setPage] = useState<{ title: string; content: string; updated_at?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/content/public/${slug}`)
      .then(({ data }) => setPage(data))
      .catch(() => setError('This page is not available yet.'))
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <div className="min-h-screen bg-white">
      <section className="text-white py-14 px-4" style={{ background: `linear-gradient(135deg, ${NAVY} 60%, ${ORG} 100%)` }}>
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <FileText size={44} />
          </div>
          <h1 className="text-3xl font-extrabold">{page?.title || fallbackTitle}</h1>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-12">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 size={20} className="animate-spin mr-2" /> Loading...
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-sm rounded-xl px-4 py-4" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
            <AlertCircle size={16} /> {error}
          </div>
        ) : page ? (
          <div className="rounded-2xl p-6 sm:p-10" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
            {page.updated_at && (
              <p className="text-xs text-gray-400 mb-6 flex items-center gap-1.5">
                <Info size={13} /> Last updated {new Date(page.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
            <div className="legal-content whitespace-pre-wrap leading-relaxed text-gray-700">
              {stripHtml(page.content) || <span className="text-gray-400">No content yet.</span>}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
