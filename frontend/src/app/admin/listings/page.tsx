'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';

interface Listing { id: number; title: string; status: string; listing_type: string; is_featured: boolean; seller_name: string; category_name: string; created_at: string; }

export default function AdminListingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) router.push('/');
  }, [user, loading, router]);

  const load = (q = '') => {
    setFetching(true);
    api.get(`/admin/listings?search=${q}`)
      .then(({ data }) => { setListings(data.listings); setTotal(data.total); })
      .finally(() => setFetching(false));
  };

  useEffect(() => { if (user?.role === 'admin') load(); }, [user]);

  const handleDelete = async (id: number) => {
    if (!confirm('Remove this listing?')) return;
    await api.delete(`/admin/listings/${id}`);
    load(search);
  };

  if (loading) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-[#FF6B00] text-sm hover:underline">← Dashboard</Link>
        <h1 className="text-2xl font-bold text-gray-900">Listings <span className="text-gray-400 text-base font-normal">({total})</span></h1>
      </div>

      <div className="flex gap-3 mb-5">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load(search)}
          placeholder="Search listing titles…"
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none "
        />
        <button onClick={() => load(search)} className="bg-[#FF6B00] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#e05d00]">Search</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Title</th>
              <th className="text-left px-4 py-3">Seller</th>
              <th className="text-center px-4 py-3">Type</th>
              <th className="text-center px-4 py-3">Status</th>
              <th className="text-center px-4 py-3">Featured</th>
              <th className="text-center px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {fetching ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">Loading…</td></tr>
            ) : listings.map((l) => (
              <tr key={l.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/listings/${l.id}`} className="font-medium text-gray-900 hover:text-[#FF6B00] truncate block max-w-[200px]">{l.title}</Link>
                  <p className="text-xs text-gray-400">{l.category_name}</p>
                </td>
                <td className="px-4 py-3 text-gray-600">{l.seller_name}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${l.listing_type === 'rent' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-[#FF6B00]'}`}>
                    {l.listing_type}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${l.status === 'active' ? 'bg-orange-100 text-[#FF6B00]' : 'bg-gray-100 text-gray-600'}`}>
                    {l.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">{l.is_featured ? '⭐' : '—'}</td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => handleDelete(l.id)} className="text-red-600 text-xs hover:underline">Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
