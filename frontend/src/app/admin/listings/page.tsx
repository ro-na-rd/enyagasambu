'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

const ORG = '#E85D04';
const NAVY = '#0f1e42';

interface Listing { id: number; title: string; status: string; listing_type: string; is_featured: boolean; seller_name: string; category_name: string; created_at: string; }

const statusColors: Record<string, string> = {
  active: 'bg-green-50 text-green-700',
  disabled: 'bg-red-50 text-red-600',
  sold: 'bg-blue-50 text-blue-700',
  expired: 'bg-gray-100 text-gray-500',
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
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Listings <span className="text-gray-400 text-base font-normal">({total})</span></h1>
        <p className="text-sm text-gray-500 mt-1">Manage all platform listings &mdash; activate, disable, or remove</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load(search, statusFilter)}
          placeholder="Search listings…"
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px]" />
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); load(search, e.target.value); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
          <option value="sold">Sold</option>
          <option value="expired">Expired</option>
        </select>
        <button onClick={() => load(search, statusFilter)} className="bg-[#FF6B00] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#e05d00] transition">Search</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Listing</th>
                <th className="text-left px-4 py-3">Seller</th>
                <th className="text-center px-4 py-3">Status</th>
                <th className="text-center px-4 py-3">Date</th>
                <th className="text-center px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {fetching ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">Loading…</td></tr>
              ) : listings.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">No listings found</td></tr>
              ) : listings.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 truncate max-w-[200px]">{l.title}</p>
                    <p className="text-xs text-gray-400">{l.category_name}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{l.seller_name}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[l.status] || 'bg-gray-100 text-gray-500'}`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-gray-400">{new Date(l.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-center flex-wrap">
                      {l.status === 'active' ? (
                        <button onClick={() => handleToggleStatus(l.id, 'disabled')}
                          className="text-red-500 text-[11px] hover:underline font-semibold">Disable</button>
                      ) : l.status === 'disabled' ? (
                        <button onClick={() => handleToggleStatus(l.id, 'active')}
                          className="text-green-600 text-[11px] hover:underline font-semibold">Enable</button>
                      ) : null}
                      <button onClick={() => handleDelete(l.id)}
                        className="text-red-600 text-[11px] hover:underline ml-1">Delete</button>
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
