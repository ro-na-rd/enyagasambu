'use client';
import { Fragment, useEffect, useState } from 'react';
import api from '@/lib/api';
import { Gavel, Search, Trash2, Eye, Activity } from '@/lib/icons';

const ORG = '#E85D04';

interface Auction {
  id: number;
  title: string;
  price: number;
  currency: string;
  status: string;
  is_featured: boolean;
  seller_name: string;
  seller_phone: string;
  category_name: string;
  created_at: string;
  expires_at: string;
  highest_bid: number | null;
  bid_count: number;
  reserve_price: number | null;
  minimum_increment: number;
  primary_image: string | null;
}

interface Bid {
  id: number;
  bidder_name: string;
  amount: number;
  created_at: string;
  bidder_phone: string | null;
}

const statusColors: Record<string, string> = {
  active: 'bg-green-500/10 text-green-400',
  sold: 'bg-blue-500/10 text-blue-400',
  expired: 'bg-gray-500/10 text-gray-500',
  disabled: 'bg-red-500/10 text-red-400',
};

function computeDisplayStatus(a: Auction): string {
  if (a.status === 'sold' || a.status === 'expired' || a.status === 'disabled') return a.status;
  const now = Date.now();
  const ends = a.expires_at ? new Date(a.expires_at).getTime() : 0;
  if (ends && ends <= now) return 'expired';
  return 'live';
}

export default function AdminAuctionsPage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [bids, setBids] = useState<Record<number, Bid[]>>({});
  const [openBids, setOpenBids] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [total, setTotal] = useState(0);
  const [fetching, setFetching] = useState(true);

  const load = (q = '', status = '') => {
    const params = new URLSearchParams();
    if (q) params.set('search', q);
    if (status) params.set('status', status);
    api.get(`/admin/auctions?${params.toString()}`)
      .then(({ data }) => { setAuctions(data.auctions); setTotal(data.total); })
      .finally(() => setFetching(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this auction permanently? All bids will also be removed.')) return;
    await api.delete(`/admin/auctions/${id}`);
    load(search, statusFilter);
  };

  const toggleBids = async (id: number) => {
    if (openBids === id) { setOpenBids(null); return; }
    setOpenBids(id);
    try {
      const { data } = await api.get(`/admin/auctions/${id}/bids`);
      setBids((b) => ({ ...b, [id]: data.bids || [] }));
    } catch { setBids((b) => ({ ...b, [id]: [] })); }
  };

  return (
    <div className="p-4 lg:p-8 animate-fadeInUp">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${ORG}15` }}>
            <Gavel size={18} style={{ color: ORG }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Auctions <span className="text-gray-600 text-base font-normal">({total})</span></h1>
            <p className="text-sm text-gray-600 mt-0.5">Manage all live auctions, view bids, and remove problematic auctions</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setFetching(true); load(search, statusFilter); } }}
            placeholder="Search by title or seller…"
            className="border rounded-lg pl-9 pr-3 py-2 text-sm w-full"
            style={{ background: '#f6f8fa', borderColor: '#d0d7de', color: '#1a1a1a' }} />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setFetching(true); load(search, e.target.value); }}
          className="border rounded-lg px-3 py-2 text-sm"
          style={{ background: '#f6f8fa', borderColor: '#d0d7de', color: '#1a1a1a' }}>
          <option value="">All Status</option>
          <option value="live">Live</option>
          <option value="ended">Ended</option>
          <option value="sold">Sold</option>
          <option value="disabled">Disabled</option>
        </select>
        <button onClick={() => { setFetching(true); load(search, statusFilter); }}
          className="text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          style={{ background: ORG }}>
          <Search size={14} className="inline mr-1" /> Search
        </button>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200" style={{ background: '#f0f2f5' }}>
                <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase font-semibold tracking-wider">Auction</th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase font-semibold tracking-wider">Seller</th>
                <th className="text-center px-4 py-3 text-gray-500 text-xs uppercase font-semibold tracking-wider">Current Bid</th>
                <th className="text-center px-4 py-3 text-gray-500 text-xs uppercase font-semibold tracking-wider">Bids</th>
                <th className="text-center px-4 py-3 text-gray-500 text-xs uppercase font-semibold tracking-wider">Status</th>
                <th className="text-center px-4 py-3 text-gray-500 text-xs uppercase font-semibold tracking-wider">Ends</th>
                <th className="text-center px-4 py-3 text-gray-500 text-xs uppercase font-semibold tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {fetching ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-600">Loading…</td></tr>
              ) : auctions.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-600">No auctions found</td></tr>
              ) : auctions.map((a) => {
                const st = computeDisplayStatus(a);
                const currentBid = a.highest_bid != null ? a.highest_bid : a.price;
                return (
                  <Fragment key={a.id}>
                    <tr className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          {a.primary_image
                            ? <img src={a.primary_image} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                            : <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${ORG}10`, color: ORG }}>
                                <Gavel size={16} />
                              </div>}
                          <div>
                            <p className="font-medium text-gray-800 truncate max-w-[200px]">{a.title}</p>
                            <p className="text-xs text-gray-600">{a.category_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-gray-800">{a.seller_name}</p>
                        {a.seller_phone && <p className="text-xs text-gray-600">{a.seller_phone}</p>}
                      </td>
                      <td className="px-4 py-3.5 text-center font-semibold text-gray-800">
                        {a.currency || 'RWF'} {currentBid.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 text-center text-gray-600">{a.bid_count}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[st] || 'bg-gray-500/10 text-gray-600'}`}>
                          {st}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center text-xs text-gray-600">
                        {a.expires_at ? new Date(a.expires_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3 justify-center">
                          <button onClick={() => toggleBids(a.id)}
                            className="text-xs font-semibold hover:underline text-blue-400 hover:text-blue-300 flex items-center gap-1">
                            <Activity size={12} /> {openBids === a.id ? 'Hide Bids' : 'Bids'}
                          </button>
                          <button onClick={() => handleDelete(a.id)}
                            className="text-xs font-semibold hover:underline text-red-500 hover:text-red-400 flex items-center gap-1">
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                    {openBids === a.id && (
                      <tr>
                        <td colSpan={7} className="px-6 py-4" style={{ background: '#fafbff' }}>
                          <div className="flex items-center gap-2 mb-3">
                            <Eye size={14} style={{ color: ORG }} />
                            <p className="text-sm font-semibold text-gray-800">Bids on &ldquo;{a.title}&rdquo;</p>
                          </div>
                          {bids[a.id]?.length ? (
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {bids[a.id].map((b) => (
                                <div key={b.id} className="bg-white rounded-lg border border-gray-100 px-4 py-3">
                                  <p className="text-sm font-semibold text-gray-800">{b.bidder_name}</p>
                                  <p className="text-xs text-gray-600 mt-0.5">
                                    {b.bidder_phone || '—'} · {(a.currency || 'RWF')} {b.amount.toLocaleString()}
                                  </p>
                                  <p className="text-[11px] text-gray-500 mt-1">{new Date(b.created_at).toLocaleString()}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-600">No bids yet.</p>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
