'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Package, Search, Filter } from '@/lib/icons';

const ORG = '#E85D04';
const NAVY = '#0f1e42';

interface Listing { id: number; title: string; status: string; listing_type: string; is_featured: boolean; seller_name: string; category_name: string; created_at: string; }

const statusColors: Record<string, string> = {
  active: 'bg-green-500/10 text-green-400',
  disabled: 'bg-red-500/10 text-red-400',
  sold: 'bg-blue-500/10 text-blue-400',
  expired: 'bg-gray-500/10 text-gray-500',
};

export default function AdminListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [total, setTotal] = useState(0);
  const [fetching, setFetching] = useState(true);

  const load = (q = '', status = '') => {
    setFetching(true);
    const params = new URLSearchParams();
    if (q) params.set('search', q);
    if (status) params.set('status', status);
    api.get(`/admin/listings?${params.toString()}`)
      .then(({ data }) => { setListings(data.listings); setTotal(data.total); })
      .finally(() => setFetching(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Remove this listing permanently?')) return;
    await api.delete(`/admin/listings/${id}`);
    load(search, statusFilter);
  };

  const handleToggleStatus = async (id: number, newStatus: string) => {
    await api.patch(`/admin/listings/${id}/status`, { status: newStatus });
    load(search, statusFilter);
  };

  return (
    <div className="p-4 lg:p-8 animate-fadeInUp">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${ORG}15` }}>
            <Package size={18} style={{ color: ORG }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Listings <span className="text-gray-600 text-base font-normal">({total})</span></h1>
            <p className="text-sm text-gray-600 mt-0.5">Manage all platform listings &mdash; activate, disable, or remove</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load(search, statusFilter)}
            placeholder="Search listings…"
            className="border rounded-lg pl-9 pr-3 py-2 text-sm w-full"
            style={{ background: '#f6f8fa', borderColor: '#d0d7de', color: '#1a1a1a' }} />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); load(search, e.target.value); }}
          className="border rounded-lg px-3 py-2 text-sm"
          style={{ background: '#f6f8fa', borderColor: '#d0d7de', color: '#1a1a1a' }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
          <option value="sold">Sold</option>
          <option value="expired">Expired</option>
        </select>
        <button onClick={() => load(search, statusFilter)}
          className="text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          style={{ background: ORG }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#c44d00'}
          onMouseLeave={(e) => e.currentTarget.style.background = ORG}>
          <Filter size={14} className="inline mr-1" /> Filter
        </button>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200" style={{ background: '#f0f2f5' }}>
                <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase font-semibold tracking-wider">Listing</th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase font-semibold tracking-wider">Seller</th>
                <th className="text-center px-4 py-3 text-gray-500 text-xs uppercase font-semibold tracking-wider">Status</th>
                <th className="text-center px-4 py-3 text-gray-500 text-xs uppercase font-semibold tracking-wider">Date</th>
                <th className="text-center px-4 py-3 text-gray-500 text-xs uppercase font-semibold tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {fetching ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-600">Loading…</td></tr>
              ) : listings.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-600">No listings found</td></tr>
              ) : listings.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `${ORG}10`, color: ORG }}>
                        <Package size={14} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 truncate max-w-[200px]">{l.title}</p>
                        <p className="text-xs text-gray-600">{l.category_name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-gray-500">{l.seller_name}</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[l.status] || 'bg-gray-500/10 text-gray-600'}`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center text-xs text-gray-600">{new Date(l.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2 justify-center flex-wrap">
                      {l.status === 'active' ? (
                        <button onClick={() => handleToggleStatus(l.id, 'disabled')}
                          className="text-xs font-semibold hover:underline text-red-400 hover:text-red-300">Disable</button>
                      ) : l.status === 'disabled' ? (
                        <button onClick={() => handleToggleStatus(l.id, 'active')}
                          className="text-xs font-semibold hover:underline text-green-400 hover:text-green-300">Enable</button>
                      ) : null}
                      <button onClick={() => handleDelete(l.id)}
                        className="text-xs font-semibold hover:underline text-red-500 hover:text-red-400 ml-1">Delete</button>
                    </div>
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
