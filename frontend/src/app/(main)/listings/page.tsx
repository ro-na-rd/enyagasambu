'use client';
import { Suspense, useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import ListingCard from '@/components/ListingCard';
import AppImage from '@/components/AppImage';
import { useLanguage } from '@/context/LanguageContext';
import { categoryMap } from '@/lib/translations';
import Link from 'next/link';
import { ShoppingCart, Store, List, Car, Wrench, Gavel, Megaphone, Search, SlidersHorizontal, TrendingUp } from '@/lib/icons';

interface Listing {
  id: number; title: string; price: number | null; price_type: string;
  currency?: string; location: string; listing_type: string; category_name: string;
  seller_name: string; primary_image: string | null; created_at: string;
}
interface Category { id: number; name: string; slug: string; type: string; }
interface Announcement { id: number; title: string; body: string; image_url: string | null; is_trending: boolean; created_at: string; }

const ORG = '#E85D04';
const NAVY = '#0f1e42';

const TABS = [
  { key: 'products',    label: 'Products',    type: 'sell',   group: 'product' },
  { key: 'properties',  label: 'Properties',  type: 'rent',   group: 'rental_property' },
  { key: 'rent',        label: 'Rent',         type: 'rent',   group: null },
  { key: 'vehicles',    label: 'Vehicles',    type: 'sell',   group: 'rental_vehicle' },
  { key: 'services',    label: 'Services',    type: 'sell',   group: 'service' },
  { key: 'auction',     label: 'Auction',     type: 'auction', group: null },
  { key: 'adverts',     label: 'Adverts',     type: null,     group: null },
];

const typeFilters = [
  { value: '', label: 'All' },
  { value: 'sell', label: 'For Sale' },
  { value: 'rent', label: 'For Rent' },
];

const typeLabels: Record<string, string> = {
  product: 'Products',
  rental_property: 'Properties',
  rental_vehicle: 'Vehicles',
  service: 'Services',
};

function AdvertImage({ advert }: { advert: Announcement }) {
  if (!advert.image_url) return null;
  return (
    <div className="relative w-full rounded-xl overflow-hidden mb-3" style={{ paddingTop: '60%' }}>
      <AppImage src={advert.image_url} alt={advert.title} className="absolute inset-0 w-full h-full object-cover" />
    </div>
  );
}

function ListingsContent() {
  const { T, lang } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = searchParams.get('tab') || '';
  const category = searchParams.get('category') || '';
  const type = searchParams.get('type') || '';
  const search = searchParams.get('search') || '';
  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [adverts, setAdverts] = useState<Announcement[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const perPage = 60;

  const currentTab = useMemo(() => TABS.find(t => t.key === tab) || null, [tab]);

  const filterKey = [category, type, search, tab].join('|');
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey);
    setPage(1);
    setLoading(true);
  }

  useEffect(() => {
    api.get('/listings/categories').then(({ data }) => setCategories(data.categories));
  }, []);

  useEffect(() => {
    if (currentTab?.key !== 'adverts') return;
    api.get('/announcements/public').then(({ data }) => setAdverts(data)).catch(() => setAdverts([]));
  }, [currentTab]);

  useEffect(() => {
    if (currentTab?.key === 'adverts') {
      Promise.resolve().then(() => setLoading(false));
      return;
    }
    const params = new URLSearchParams();
    if (currentTab?.type) params.set('type', currentTab.type);
    if (currentTab?.group && !category) params.set('group', currentTab.group);
    if (category) params.set('category', category);
    if (type) params.set('type', type);
    if (search) params.set('search', search);
    params.set('page', String(page));
    params.set('limit', String(perPage));
    api.get(`/listings?${params}`)
      .then(({ data }) => {
        setListings(data.listings);
        setTotal(data.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentTab, category, type, search, page]);

  const setFilter = (key: string, value: string) => {
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value); else p.delete(key);
    router.push(`/listings?${p}`);
  };

  const totalPages = Math.ceil(total / perPage);
  const groupedCategories: Record<string, Category[]> = {};
  const catsSource = currentTab?.group
    ? categories.filter(c => c.type === currentTab.group)
    : categories;
  catsSource.forEach(c => {
    if (!groupedCategories[c.type]) groupedCategories[c.type] = [];
    groupedCategories[c.type].push(c);
  });

  const trendingAdverts = adverts.filter(a => a.is_trending);
  const otherAdverts = adverts.filter(a => !a.is_trending);

  const tabLabels = [
    { key: 'products',    label: 'Products',    icon: <ShoppingCart size={18} /> },
    { key: 'properties',  label: 'Properties',  icon: <Store size={18} /> },
    { key: 'rent',        label: 'Rent',         icon: <List size={18} /> },
    { key: 'vehicles',    label: 'Vehicles',    icon: <Car size={18} /> },
    { key: 'services',    label: 'Services',    icon: <Wrench size={18} /> },
    { key: 'auction',     label: 'Auction',     icon: <Gavel size={18} /> },
    { key: 'adverts',     label: 'Adverts',     icon: <Megaphone size={18} /> },
  ];

  return (
    <div className="flex flex-col gap-6">
      {currentTab?.key === 'adverts' ? (
        /* ─── ADVERTS TAB ─── */
        <div className="space-y-8">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                  <div className="bg-gray-100 animate-pulse" style={{ paddingTop: '60%' }} />
                  <div className="p-5 space-y-2">
                    <div className="h-3 bg-gray-100 animate-pulse rounded w-3/4" />
                    <div className="h-3 bg-gray-100 animate-pulse rounded w-full" />
                    <div className="h-3 bg-gray-100 animate-pulse rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : adverts.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="text-6xl mb-4"><Megaphone size={48} /></div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">No adverts yet</h3>
              <p className="text-sm text-gray-400">Adverts posted by our team will appear here.</p>
            </div>
          ) : (
            <>
              {trendingAdverts.length > 0 && (
                <section>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp size={20} style={{ color: ORG }} /> Best Trending Products
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {trendingAdverts.map(advert => (
                      <article key={advert.id} className="bg-white rounded-2xl border-2 border-orange-200 p-5 shadow-sm">
                        <AdvertImage advert={advert} />
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white flex items-center gap-1">
                            <TrendingUp size={11} /> Trending
                          </span>
                          <span className="text-xs text-gray-400">{new Date(advert.created_at).toLocaleDateString()}</span>
                        </div>
                        <h4 className="font-bold text-gray-900 mb-2">{advert.title}</h4>
                        <p className="text-sm text-gray-600 whitespace-pre-line">{advert.body}</p>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {otherAdverts.length > 0 && (
                <section>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Latest Adverts</h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {otherAdverts.map(advert => (
                      <article key={advert.id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                        <AdvertImage advert={advert} />
                        <p className="text-xs font-semibold mb-2" style={{ color: ORG }}>{new Date(advert.created_at).toLocaleDateString()}</p>
                        <h4 className="font-bold text-gray-900 mb-2">{advert.title}</h4>
                        <p className="text-sm text-gray-600 whitespace-pre-line">{advert.body}</p>
                      </article>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      ) : (
        /* ─── LISTINGS GRID ─── */
        <div className="flex flex-row gap-6">
          <aside className="w-56 shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 lg:sticky lg:top-16">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                <SlidersHorizontal size={16} />
                <span className="text-sm font-bold text-gray-800">Filters</span>
              </div>

              {currentTab?.key !== 'auction' && (
                <>
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2">{T.type}</h3>
                  <div className="space-y-0.5 mb-4">
                    {typeFilters.map(({ value: v, label: l }) => (
                      <button key={v} onClick={() => setFilter('type', v)}
                        className={`block w-full text-left text-sm px-3 py-2 rounded-xl transition ${
                          (type || currentTab?.type || '') === v
                            ? 'bg-gradient-to-r from-[#E85D04]/10 to-orange-50 text-[#E85D04] font-bold'
                            : 'hover:bg-gray-50 text-gray-600'
                        }`}>
                        {l}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2">{T.category}</h3>
              <button onClick={() => setFilter('category', '')}
                className={`block w-full text-left text-sm px-3 py-2 rounded-xl mb-1 transition ${
                  !category
                    ? 'bg-gradient-to-r from-[#E85D04]/10 to-orange-50 text-[#E85D04] font-bold'
                    : 'hover:bg-gray-50 text-gray-600'
                }`}>
                {T.all}
              </button>

              {Object.entries(groupedCategories).map(([typeKey, cats]) => (
                <div key={typeKey} className="mb-2">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mt-3 mb-1 px-1">
                    {typeLabels[typeKey] || typeKey}
                  </p>
                  {cats.map((c) => (
                    <button key={c.slug} onClick={() => setFilter('category', c.slug)}
                      className={`block w-full text-left text-sm px-3 py-1.5 rounded-xl mb-0.5 transition ${
                        category === c.slug
                          ? 'bg-gradient-to-r from-[#E85D04]/10 to-orange-50 text-[#E85D04] font-bold'
                          : 'hover:bg-gray-50 text-gray-600'
                      }`}>
                      {categoryMap[c.slug]?.[lang] ?? c.name}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                  {search ? <span>Results for &ldquo;{search}&rdquo;</span> : tabLabels.find(t => t.key === tab)?.label || 'Browse Listings'}
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {loading ? 'Loading...' : `${total.toLocaleString()} listing${total !== 1 ? 's' : ''} found`}
                </p>
              </div>
              {total > perPage && !loading && (
                <div className="flex items-center gap-1">
                  <button onClick={() => { setLoading(true); setPage(p => Math.max(1, p - 1)); }}
                    disabled={page <= 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition text-sm">‹</button>
                  <span className="text-xs font-medium text-gray-500 px-2">{page} / {totalPages}</span>
                  <button onClick={() => { setLoading(true); setPage(p => Math.min(totalPages, p + 1)); }}
                    disabled={page >= totalPages}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition text-sm">›</button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                    <div className="bg-gray-100 animate-pulse" style={{ paddingTop: '80%' }} />
                    <div className="p-4 space-y-2">
                      <div className="h-3 bg-gray-100 animate-pulse rounded w-3/4" />
                      <div className="h-4 bg-gray-100 animate-pulse rounded w-1/2" />
                      <div className="h-3 bg-gray-100 animate-pulse rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="text-6xl mb-4"><Search size={48} /></div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">{T.noListingsFound}</h3>
                <p className="text-sm text-gray-400">{T.tryDifferent}</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
                </div>
                {totalPages > 1 && (
                  <div className="flex flex-wrap items-center justify-center gap-2 mt-10">
                    <button onClick={() => setPage(1)} disabled={page <= 1}
                      className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed">First</button>
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                      className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed text-sm">‹</button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) pageNum = i + 1;
                      else if (page <= 3) pageNum = i + 1;
                      else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                      else pageNum = page - 2 + i;
                      return (
                        <button key={pageNum} onClick={() => setPage(pageNum)}
                          className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-semibold transition ${
                            page === pageNum ? 'text-white' : 'text-gray-600 hover:bg-gray-100 border border-gray-200'
                          }`}
                          style={page === pageNum ? { background: `linear-gradient(135deg, ${NAVY}, ${ORG})` } : {}}>{pageNum}</button>
                      );
                    })}
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                      className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed text-sm">›</button>
                    <button onClick={() => setPage(totalPages)} disabled={page >= totalPages}
                      className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed">Last</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ListingsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 relative min-h-screen">
      <Suspense fallback={<div className="text-center py-16 text-gray-500 text-sm">Loading listings...</div>}>
        <ListingsContent />
      </Suspense>
      <Link href="/listings/create"
        className="fixed bottom-24 right-8 z-50 px-6 py-3.5 rounded-full shadow-2xl flex items-center gap-2 text-white text-sm font-bold hover:scale-105 active:scale-95 transition-all duration-200 hover:shadow-orange-500/30 group"
        style={{ background: `linear-gradient(135deg, ${NAVY}, ${ORG})` }}
        title="Create New Listing">
        <span className="text-xl leading-none group-hover:rotate-90 transition-transform duration-300">+</span>
        <span>Posting</span>
      </Link>
    </div>
  );
}
