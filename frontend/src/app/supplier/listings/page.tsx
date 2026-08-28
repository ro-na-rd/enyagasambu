'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { Store, Loader2, MapPin } from '@/lib/icons';
import { useCurrency } from '@/context/CurrencyContext';

const ORG = '#E85D04';

interface MyListing {
  id: number;
  title: string;
  description: string | null;
  price: number | null;
  price_type: string;
  currency: string;
  location: string | null;
  status: string;
  listing_type: string;
  expires_at: string | null;
  created_at: string;
}

export default function SupplierListingsPage() {
  const [listings, setListings] = useState<MyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { format } = useCurrency();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/suppliers/me/listings');
      setListings(data.listings);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Listings</h1>
          <p className="text-sm text-gray-500 mt-0.5">All products and services posted by your business</p>
        </div>
        <Link href="/listings/create"
          className="text-white text-sm font-bold px-5 py-2.5 rounded-xl transition hover:opacity-90"
          style={{ background: ORG }}>
          + Create Listing
        </Link>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm rounded-xl px-4 py-3 mb-4" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 size={20} className="animate-spin mr-2" /> Loading listings...
        </div>
      ) : listings.length === 0 ? (
        <div className="rounded-2xl py-20 text-center" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
          <Store size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500 mb-5">No listings yet. Start posting your products and services.</p>
          <Link href="/listings/create"
            className="inline-block text-white text-sm font-bold px-6 py-2.5 rounded-xl transition hover:opacity-90"
            style={{ background: ORG }}>
            Create a Listing
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((l) => (
            <Link key={l.id} href={`/listings/${l.id}`} className="rounded-2xl p-5 hover:shadow-lg transition" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-bold text-gray-900 leading-snug">{l.title}</p>
                <span className="text-[10px] font-bold px-2 py-1 rounded-full capitalize shrink-0"
                  style={{ background: l.status === 'active' ? '#dcfce7' : '#f3f4f6', color: l.status === 'active' ? '#059669' : '#6b7280' }}>
                  {l.status}
                </span>
              </div>
              {l.description && <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{l.description}</p>}
              <div className="flex items-center justify-between mt-4">
                {l.price != null
                  ? <span className="text-sm font-extrabold" style={{ color: ORG }}>{format(Number(l.price))}</span>
                  : <span className="text-sm font-bold text-gray-400">{l.listing_type}</span>}
                {l.location && (
                  <span className="flex items-center gap-1 text-xs text-gray-400"><MapPin size={11} /> {l.location}</span>
                )}
              </div>
              <p className="text-[11px] text-gray-400 mt-2">Posted {new Date(l.created_at).toLocaleDateString()}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
