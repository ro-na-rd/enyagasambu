'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { MessageSquare } from '@/lib/icons';

const ORG = '#E85D04';

interface SupportRequest {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  category: string;
  subject: string;
  message: string;
  status: string;
  listing_title: string | null;
  created_at: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  payment: 'Payment',
  listing: 'Listing',
  access: 'Access',
  other: 'Other',
};

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-500',
  in_progress: 'bg-blue-500/10 text-blue-400',
  resolved: 'bg-green-500/10 text-green-400',
  closed: 'bg-gray-500/10 text-gray-500',
};

const NEXT_STATUS: Record<string, string> = {
  pending: 'in_progress',
  in_progress: 'resolved',
  resolved: 'closed',
  closed: 'pending',
};

export default function AdminSupportPage() {
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  const load = (status = '') => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    api.get(`/support?${params.toString()}`)
      .then(({ data }) => setRequests(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleStatus = async (id: number, status: string) => {
    await api.patch(`/support/${id}/status`, { status });
    load(filter);
  };

  const visible = filter ? requests.filter((r) => r.status === filter) : requests;

  return (
    <div className="p-4 lg:p-8 animate-fadeInUp">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${ORG}15` }}>
            <MessageSquare size={18} style={{ color: ORG }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Support Requests <span className="text-gray-600 text-base font-normal">({requests.length})</span></h1>
            <p className="text-sm text-gray-600 mt-0.5">Review and manage user support inquiries</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {['', 'pending', 'in_progress', 'resolved', 'closed'].map((s) => (
          <button key={s} onClick={() => { setFilter(s); setLoading(true); load(s); }}
            className="text-xs font-semibold px-3 py-1.5 rounded-full transition"
            style={filter === s
              ? { background: ORG, color: '#fff' }
              : { background: '#f6f8fa', color: '#6e7781', border: '1px solid #d0d7de' }}>
            {s === '' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center py-12 text-gray-600">Loading…</p>
      ) : visible.length === 0 ? (
        <p className="text-center py-12 text-gray-600">No support requests found</p>
      ) : (
        <div className="space-y-4">
          {visible.map((r) => (
            <div key={r.id} className="rounded-xl" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
              <button onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                className="w-full flex items-center gap-4 px-5 py-4 text-left">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-800 text-sm">{r.subject || CATEGORY_LABELS[r.category] || r.category}</p>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide"
                      style={{ background: `${ORG}15`, color: ORG }}>{CATEGORY_LABELS[r.category] || r.category}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {r.name} · {r.email} {r.phone ? `· ${r.phone}` : ''} {r.listing_title ? `· Listing: ${r.listing_title}` : ''}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[r.status] || 'bg-gray-500/10 text-gray-600'}`}>
                  {r.status.replace('_', ' ')}
                </span>
                <span className="text-xs text-gray-600 shrink-0">{new Date(r.created_at).toLocaleString()}</span>
              </button>

              {expanded === r.id && (
                <div className="px-5 pb-5 border-t border-gray-100 pt-4">
                  <p className="text-sm text-gray-700 leading-relaxed mb-4">{r.message}</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <button onClick={() => handleStatus(r.id, NEXT_STATUS[r.status] || 'in_progress')}
                      className="text-xs font-semibold px-4 py-2 rounded-lg text-white transition"
                      style={{ background: ORG }}>
                      {r.status === 'pending' ? 'Start Progress' :
                       r.status === 'in_progress' ? 'Mark Resolved' :
                       r.status === 'resolved' ? 'Close' : 'Reopen'}
                    </button>
                    {r.status !== 'closed' && (
                      <button onClick={() => handleStatus(r.id, 'closed')}
                        className="text-xs font-semibold px-4 py-2 rounded-lg transition"
                        style={{ color: '#f85149', background: '#f6f8fa', border: '1px solid #d0d7de' }}>
                        Close
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
