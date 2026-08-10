'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { Loader2, AlertCircle, Search, Phone } from '@/lib/icons';

interface Lead {
  id: number;
  buyer_name: string;
  buyer_phone: string | null;
  sale_status: 'pending' | 'sold' | 'rented';
  created_at: string;
  listing_id: number;
  listing_title: string;
  price: string | null;
  currency: string;
  category_name: string | null;
}

const statusColors: Record<string, string> = {
  pending: 'bg-blue-50 text-blue-700',
  sold: 'bg-green-50 text-green-700',
  rented: 'bg-yellow-50 text-yellow-700',
};

const statusLabel: Record<string, string> = {
  pending: 'New',
  sold: 'Sold',
  rented: 'Rented',
};

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

export default function BrokerLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'sold' | 'rented'>('all');

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/broker/leads');
      setLeads(data.leads || []);
    } catch {
      setError('Could not load your leads. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const filtered = leads.filter((l) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      l.buyer_name.toLowerCase().includes(q) ||
      (l.buyer_phone || '').toLowerCase().includes(q) ||
      l.listing_title.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || l.sale_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Leads</h1>
      <p className="text-sm text-gray-500 mb-6">Buyers who unlocked contact on your listings.</p>

      {error && (
        <div className="mb-4 flex items-center justify-between text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <span>{error}</span>
          <button onClick={fetchLeads} className="font-semibold underline">Retry</button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
          <div className="relative w-full max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leads..."
              className="w-full pl-9 pr-3 border border-gray-300 rounded-lg py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E85D04]/40"
            />
          </div>
          <div className="flex items-center gap-2">
            {(['all', 'pending', 'sold', 'rented'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition ${
                  statusFilter === s
                    ? 'bg-[#E85D04] text-white border-[#E85D04]'
                    : 'text-gray-500 border-gray-200 hover:border-gray-300'
                }`}
              >
                {s === 'all' ? 'All' : statusLabel[s]}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-16 text-gray-400">
              <Loader2 size={20} className="animate-spin" /> Loading leads…
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Phone size={36} className="mb-3" />
              <p className="text-sm">
                {leads.length === 0
                  ? 'No leads yet. When a buyer unlocks contact on one of your listings, they appear here.'
                  : 'No leads match your search.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Interest</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-900">{l.buyer_name}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{l.buyer_phone || '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{l.listing_title}</td>
                    <td className="px-4 py-3 text-gray-500">{l.category_name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusColors[l.sale_status] || 'bg-gray-100 text-gray-500'}`}>
                        {statusLabel[l.sale_status] || l.sale_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{formatDate(l.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
