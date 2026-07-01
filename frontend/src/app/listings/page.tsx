'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import ListingCard from '@/components/ListingCard';
import { useLanguage } from '@/context/LanguageContext';
import { categoryMap } from '@/lib/translations';

interface Listing {
  id: number; title: string; price: number | null; price_type: string;
  location: string; listing_type: string; category_name: string;
  seller_name: string; primary_image: string | null; created_at: string;
}
interface Category { id: number; name: string; slug: string; type: string; }

function ListingsContent() {
  const { T, lang } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  const category = searchParams.get('category') || '';
  const type = searchParams.get('type') || '';
  const search = searchParams.get('search') || '';
  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/listings/categories').then(({ data }) => setCategories(data.categories));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (type) params.set('type', type);
    if (search) params.set('search', search);
    api.get(`/listings?${params}`).then(({ data }) => {
      setListings(data.listings); setTotal(data.total);
    }).finally(() => setLoading(false));
  }, [category, type, search]);

  const setFilter = (key: string, value: string) => {
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value); else p.delete(key);
    router.push(`/listings?${p}`);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Sidebar */}
      <aside className="sm:w-52 shrink-0">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-semibold text-gray-800 mb-3 text-sm">{T.type}</h3>
          {[['', T.all], ['sell', T.forSale], ['rent', T.forRent]].map(([v, l]) => (
            <button key={v} onClick={() => setFilter('type', v)}
              className={`block w-full text-left text-sm px-2 py-1.5 rounded mb-1 transition ${type === v ? 'bg-[#FF6B00] text-white' : 'hover:bg-gray-100 text-gray-700'}`}>
              {l}
            </button>
          ))}
          <h3 className="font-semibold text-gray-800 mb-3 mt-4 text-sm">{T.category}</h3>
          <button onClick={() => setFilter('category', '')}
            className={`block w-full text-left text-sm px-2 py-1.5 rounded mb-1 transition ${!category ? 'bg-[#FF6B00] text-white' : 'hover:bg-gray-100 text-gray-700'}`}>
            {T.all}
          </button>
          {categories.map((c) => (
            <button key={c.slug} onClick={() => setFilter('category', c.slug)}
              className={`block w-full text-left text-sm px-2 py-1.5 rounded mb-1 transition ${category === c.slug ? 'bg-[#FF6B00] text-white' : 'hover:bg-gray-100 text-gray-700'}`}>
              {categoryMap[c.slug]?.[lang] ?? c.name}
            </button>
          ))}
        </div>
      </aside>

      <div className="flex-1">
        <p className="text-gray-600 text-sm mb-4">
          {loading ? T.loading : `${total} ${total !== 1 ? T.listingsFound : T.listingFound}`}
        </p>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="bg-white rounded-lg h-56 animate-pulse" />)}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-5xl mb-4">🔍</p>
            <p className="font-medium">{T.noListingsFound}</p>
            <p className="text-sm mt-1">{T.tryDifferent}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ListingsPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Suspense fallback={<div className="text-gray-500 text-sm py-8">…</div>}>
        <ListingsContent />
      </Suspense>
    </div>
  );
}
