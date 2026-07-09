'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

interface MyListing {
  id: number;
  title: string;
  price: number | null;
  price_type: string;
  listing_type: string;
  category_name: string;
  status: string;
  expires_at: string;
  primary_image: string | null;
}

export default function MyListingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [listings, setListings] = useState<MyListing[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      api.get('/listings/my').then(({ data }) => setListings(data.listings)).finally(() => setFetching(false));
    }
  }, [user]);

  if (loading || fetching) return <div className="text-center py-24 text-gray-500">Loading…</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
        <Link href="/listings/create" className="text-white text-sm font-semibold px-4 py-2 rounded-lg transition style={{ background: '#FF6B00' }}">
          + New Listing
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-5xl mb-4">📋</p>
          <p className="font-medium">No listings yet</p>
          <Link href="/listings/create" className="mt-3 inline-block text-[#FF6B00] underline text-sm">Create your first listing</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((l) => {
            const expired = new Date(l.expires_at) < new Date();
            return (
              <div key={l.id} className="bg-white rounded-xl shadow-sm flex items-center gap-4 p-4">
                <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                  {l.primary_image ? <img src={l.primary_image} alt="" className="w-full h-full object-cover" /> : <span className="text-2xl opacity-30">📦</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{l.title}</p>
                  <p className="text-xs text-gray-500">{l.category_name}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${expired ? 'bg-red-100 text-red-700' : l.status === 'active' ? 'bg-orange-100 text-[#FF6B00]' : 'bg-gray-100 text-gray-600'}`}>
                    {expired ? 'Expired' : l.status}
                  </span>
                </div>
                <Link href={`/listings/${l.id}`} className="text-[#FF6B00] text-sm font-medium hover:underline shrink-0">
                  View
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
