'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useCurrency } from '@/context/CurrencyContext';
import { Heart, Search, Filter, TrendingUp, Users, Smartphone, CreditCard } from '@/lib/icons';

const ORG = '#E85D04';
const NAVY = '#0f1e42';

interface Donation {
  id: number;
  donor_name: string;
  donor_email: string | null;
  donor_phone: string | null;
  amount_rwf: number;
  method: string;
  provider: string | null;
  status: string;
  reference_id: string | null;
  card_last4: string | null;
  card_brand: string | null;
  message: string | null;
  account_name: string | null;
  created_at: string;
}

interface Stats { total_raised: number; confirmed_count: number; momo_count: number; card_count: number; all_count: number; }

const statusColors: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-700',
  verified: 'bg-blue-100 text-blue-700',
  pending: 'bg-amber-100 text-amber-700',
  failed: 'bg-red-100 text-red-600',
};

export default function AdminDonationsPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [stats, setStats] = useState<Stats>({ total_raised: 0, confirmed_count: 0, momo_count: 0, card_count: 0, all_count: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [fetching, setFetching] = useState(true);
  const { format } = useCurrency();

  const load = (q = '', status = '', method = '') => {
    const params = new URLSearchParams();
    if (q) params.set('search', q);
    if (status) params.set('status', status);
    if (method) params.set('method', method);
    api.get(`/admin/donations?${params.toString()}`)
      .then(({ data }) => { setDonations(data.donations); setStats(data.stats); })
      .finally(() => setFetching(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="p-4 lg:p-8 animate-fadeInUp">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${ORG}15` }}>
            <Heart size={18} style={{ color: ORG }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Donations</h1>
            <p className="text-sm text-gray-600 mt-0.5">Track all supporter contributions and amounts</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, #0f1e42, #1a2d5a)', boxShadow: '0 8px 24px rgba(15,30,66,0.15)' }}>
          <p className="text-[11px] uppercase tracking-widest text-white/60 font-semibold">Total Raised</p>
          <p className="text-xl lg:text-2xl font-extrabold text-white mt-1">{format(stats.total_raised)}</p>
        </div>
        <div className="rounded-2xl p-4 border border-gray-200" style={{ background: '#ffffff' }}>
          <p className="text-[11px] uppercase tracking-widest text-gray-400 font-semibold">Confirmed</p>
          <p className="text-xl lg:text-2xl font-extrabold mt-1" style={{ color: ORG }}>
            <TrendingUp size={20} className="inline mr-1" />{stats.confirmed_count}
          </p>
        </div>
        <div className="rounded-2xl p-4 border border-gray-200" style={{ background: '#ffffff' }}>
          <p className="text-[11px] uppercase tracking-widest text-gray-400 font-semibold">MoMo Donations</p>
          <p className="text-xl lg:text-2xl font-extrabold text-gray-800 mt-1">
            <Smartphone size={20} className="inline mr-1" style={{ color: NAVY }} />{stats.momo_count}
          </p>
        </div>
        <div className="rounded-2xl p-4 border border-gray-200" style={{ background: '#ffffff' }}>
          <p className="text-[11px] uppercase tracking-widest text-gray-400 font-semibold">Card Donations</p>
          <p className="text-xl lg:text-2xl font-extrabold text-gray-800 mt-1">
            <CreditCard size={20} className="inline mr-1" style={{ color: NAVY }} />{stats.card_count}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setFetching(true); load(search, statusFilter, methodFilter); } }}
            placeholder="Search by name, phone or reference…"
            className="border rounded-lg pl-9 pr-3 py-2 text-sm w-full"
            style={{ background: '#f6f8fa', borderColor: '#d0d7de', color: '#1a1a1a' }}
          />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setFetching(true); load(search, e.target.value, methodFilter); }}
          className="border rounded-lg px-3 py-2 text-sm" style={{ background: '#f6f8fa', borderColor: '#d0d7de', color: '#1a1a1a' }}>
          <option value="">All Statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="verified">Verified</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
        <select value={methodFilter} onChange={(e) => { setMethodFilter(e.target.value); setFetching(true); load(search, statusFilter, e.target.value); }}
          className="border rounded-lg px-3 py-2 text-sm" style={{ background: '#f6f8fa', borderColor: '#d0d7de', color: '#1a1a1a' }}>
          <option value="">All Methods</option>
          <option value="momo">Mobile Money</option>
          <option value="card">Bank Card</option>
        </select>
        <button onClick={() => { setFetching(true); load(search, statusFilter, methodFilter); }}
          className="text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          style={{ background: ORG }}>
          <Filter size={14} className="inline mr-1" /> Filter
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200" style={{ background: '#f0f2f5' }}>
                <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase font-semibold tracking-wider">Donor</th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase font-semibold tracking-wider">Phone</th>
                <th className="text-right px-4 py-3 text-gray-500 text-xs uppercase font-semibold tracking-wider">Amount</th>
                <th className="text-center px-4 py-3 text-gray-500 text-xs uppercase font-semibold tracking-wider">Method</th>
                <th className="text-center px-4 py-3 text-gray-500 text-xs uppercase font-semibold tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase font-semibold tracking-wider">Reference</th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase font-semibold tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {fetching ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-600">Loading…</td></tr>
              ) : donations.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-600">No donations found</td></tr>
              ) : donations.map((d, idx) => (
                <tr key={d.id} className="hover:bg-gray-50 transition" style={{ animationDelay: `${idx * 0.03}s` }}>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ background: `linear-gradient(135deg, ${NAVY}, ${ORG})` }}>
                        {d.donor_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{d.donor_name}</p>
                        {d.donor_email && <p className="text-xs text-gray-600">{d.donor_email}</p>}
                        {d.message && <p className="text-[11px] text-gray-500 italic truncate max-w-[200px]">"{d.message}"</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-gray-500">{d.donor_phone || '—'}</td>
                  <td className="px-4 py-3.5 text-right font-bold whitespace-nowrap" style={{ color: ORG }}>
                    {format(d.amount_rwf)}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                      {d.method === 'momo' ? <Smartphone size={12} /> : <CreditCard size={12} />}
                      {d.method === 'momo' ? (d.provider || 'momo') : (d.card_brand || 'card')}
                      {d.card_last4 ? ` •••• ${d.card_last4}` : ''}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${statusColors[d.status] || 'bg-gray-100 text-gray-600'}`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-gray-500 text-xs font-mono">{d.reference_id ? d.reference_id.slice(0, 8) : '—'}</td>
                  <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">
                    {new Date(d.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
