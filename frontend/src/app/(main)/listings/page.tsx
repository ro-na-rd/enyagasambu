'use client';
import { Suspense, useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import ListingCard from '@/components/ListingCard';
import { useLanguage } from '@/context/LanguageContext';
import { categoryMap } from '@/lib/translations';
import Link from 'next/link';

interface Listing {
  id: number; title: string; price: number | null; price_type: string;
  location: string; listing_type: string; category_name: string;
  seller_name: string; primary_image: string | null; created_at: string;
}
interface Category { id: number; name: string; slug: string; type: string; }

const ORG = '#E85D04';
const NAVY = '#1B2A5E';

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
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const perPage = 60;

  useEffect(() => {
    api.get('/listings/categories').then(({ data }) => setCategories(data.categories));
  }, []);

  const currentTab = useMemo(() => TABS.find(t => t.key === tab) || null, [tab]);

  useEffect(() => {
    setPage(1);
  }, [category, type, search, tab]);

  useEffect(() => {
    if (currentTab?.key === 'adverts') { setLoading(false); return; }
    setLoading(true);
    const params = new URLSearchParams();
    if (currentTab?.type) params.set('type', currentTab.type);
    if (currentTab?.group && !category) params.set('group', currentTab.group);
    if (category) params.set('category', category);
    if (type) params.set('type', type);
    if (search) params.set('search', search);
    params.set('page', String(page));
    params.set('limit', String(perPage));
    api.get(`/listings?${params}`).then(({ data }) => {
      setListings(data.listings); setTotal(data.total);
    }).finally(() => setLoading(false));
  }, [currentTab, category, type, search, page]);

  const switchTab = (key: string) => {
    const p = new URLSearchParams();
    if (key) p.set('tab', key);
    if (search) p.set('search', search);
    router.push(`/listings?${p}`);
  };

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

  const tabLabels = [
    { key: 'products',    label: 'Products',    icon: '🛍️' },
    { key: 'properties',  label: 'Properties',  icon: '🏠' },
    { key: 'rent',        label: 'Rent',         icon: '📋' },
    { key: 'vehicles',    label: 'Vehicles',    icon: '🚗' },
    { key: 'services',    label: 'Services',    icon: '🔧' },
    { key: 'auction',     label: 'Auction',     icon: '🔨' },
    { key: 'adverts',     label: 'Adverts',     icon: '📢' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Horizontal Tab Bar */}
      <div className="flex overflow-x-auto gap-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-1.5 sticky top-16 z-40">
        {tabLabels.map(({ key, label, icon }) => {
          const active = tab === key || (!tab && key === 'products');
          return (
            <button key={key} onClick={() => switchTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                active
                  ? 'text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              style={active ? { background: `linear-gradient(135deg, ${NAVY}, ${ORG})` } : {}}>
              <span className="text-base">{icon}</span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {currentTab?.key === 'adverts' ? (
        /* ─── ADVERTS TAB ─── */
        <div className="space-y-8">

          {/* Hero */}
          <div className="bg-gradient-to-br from-[#1B2A5E] to-[#E85D04] rounded-2xl p-8 md:p-12 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative z-10">
              <div className="text-5xl mb-4">📢</div>
              <h2 className="text-3xl md:text-4xl font-bold mb-3">E-Nyagasambu Digital Marketplace</h2>
              <p className="text-lg text-white/80 max-w-2xl mx-auto">
                Rwanda&apos;s premier online marketplace — buy, sell, rent, and connect across 
                23 categories with thousands of active listings.
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: '2,700+', label: 'Active Listings', icon: '📦', color: '#E85D04' },
              { value: '23', label: 'Categories', icon: '🏪', color: '#1B2A5E' },
              { value: '1,000+', label: 'Trusted Sellers', icon: '👥', color: '#E85D04' },
              { value: '6,500+', label: 'Product Images', icon: '🖼️', color: '#1B2A5E' },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center">
                <div className="text-3xl mb-1">{s.icon}</div>
                <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
                <div className="text-xs text-gray-500 font-medium">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Why Advertise */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Why Advertise on E-Nyagasambu</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: '🇷🇼', title: 'Rwanda Focused', desc: 'Targeted reach to Rwandan buyers and sellers across all districts. Your products seen by local customers ready to purchase.' },
                { icon: '📱', title: 'Mobile First', desc: 'Optimized for mobile users across Kigali and beyond. MTN MoMo integration for seamless payments.' },
                { icon: '🪙', title: 'Coin Economy', desc: 'Unique coin-based system for connecting with sellers, boosting listings, and accessing premium features.' },
                { icon: '🔒', title: 'Verified Sellers', desc: 'Trusted seller network with broker and ambassador certificate verification. Safe and secure transactions.' },
                { icon: '📊', title: 'Analytics & Reports', desc: 'Track your listing performance with detailed views, inquiries, and engagement metrics.' },
                { icon: '🌍', title: 'Multi-Language', desc: 'Reach customers in English, French, and Kinyarwanda. Break language barriers and expand your market.' },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <h4 className="font-bold text-gray-900 mb-1">{item.title}</h4>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">How It Works</h3>
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                { step: '1', icon: '📝', title: 'Create Your Listing', desc: 'Sign up as a seller and post your products, properties, or services with photos and pricing.' },
                { step: '2', icon: '📢', title: 'Promote & Boost', desc: 'Boost your listings with coins to appear as featured. Get noticed by more buyers.' },
                { step: '3', icon: '🤝', title: 'Connect & Sell', desc: 'Buyers unlock your contact details. Negotiate, close deals, and grow your business.' },
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 text-white text-xl font-bold"
                    style={{ background: `linear-gradient(135deg, ${NAVY}, ${ORG})` }}>{item.step}</div>
                  <div className="text-2xl mb-1">{item.icon}</div>
                  <h4 className="font-bold text-gray-900 mb-1">{item.title}</h4>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Platform Features */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Everything You Need</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: '🛍️', title: 'Products', desc: 'Electronics, Fashion, Food & Beverage, Furniture, Beauty & Health, Books, Handcraft, Clothing, Farmer Products' },
                { icon: '🏠', title: 'Properties', desc: 'Houses & Apartments, Offices for rent across Kigali, Butare, Rubavu, Musanze, and other Rwandan cities.' },
                { icon: '🚗', title: 'Vehicles', desc: 'Cars and motorcycles for sale. From budget-friendly commuters to premium vehicles.' },
                { icon: '🔧', title: 'Services', desc: 'Transport, Technician, Mechanical, Gardening, Arts & Tourism, Construction, Health, Education, Jobs, Supply Chain.' },
                { icon: '🔨', title: 'Auctions', desc: 'Live auction listings for premium and rare items. Bid and win at the best prices.' },
                { icon: '🤝', title: 'Broker Portal', desc: 'Dedicated broker system with client management, commission tracking, and certificate verification.' },
                { icon: '⭐', title: 'Ambassador Program', desc: 'Earn rewards by referring new sellers and buyers. Track your referrals and bonuses.' },
                { icon: '🎫', title: 'Promo Codes', desc: 'Create and manage discount promo codes. Attract more buyers with special offers.' },
                { icon: '📋', title: 'Subscription Plans', desc: 'Free, Standard, and Premium plans. Longer listing durations, more active listings, and featured slots.' },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl shrink-0">{item.icon}</span>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-0.5">{item.title}</h4>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* User Roles */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">Who Can Join</h3>
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                { icon: '👤', title: 'Buyers', features: ['Browse 2,700+ listings', 'Connect with sellers via coins', 'Multi-language support', 'No account needed to browse'] },
                { icon: '💼', title: 'Sellers', features: ['Post products & services', 'Boost listings for visibility', 'Get direct buyer inquiries', 'Analytics & performance tracking'] },
                { icon: '🏢', title: 'Brokers & Ambassadors', features: ['Certificate verification system', 'Commission tracking', 'Referral rewards program', 'Dedicated dashboard & reports'] },
              ].map((role, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-5">
                  <div className="text-3xl mb-2">{role.icon}</div>
                  <h4 className="font-bold text-gray-900 mb-2">{role.title}</h4>
                  <ul className="space-y-1.5">
                    {role.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-r from-[#1B2A5E] to-[#E85D04] rounded-2xl p-8 md:p-10 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-3">Ready to Grow Your Business?</h3>
              <p className="text-white/80 max-w-xl mx-auto mb-6">
                Join thousands of sellers already using E-Nyagasambu to reach customers across Rwanda. 
                Post your first listing today — it&apos;s free to start.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link href="/listings/create"
                  className="inline-block bg-white text-[#1B2A5E] font-bold px-8 py-3 rounded-xl hover:shadow-lg transition shadow-md">
                  Start Selling Now
                </Link>
                <Link href="/register"
                  className="inline-block border-2 border-white text-white font-bold px-8 py-3 rounded-xl hover:bg-white/10 transition">
                  Create Account
                </Link>
                <Link href="/broker/register"
                  className="inline-block border-2 border-white text-white font-bold px-8 py-3 rounded-xl hover:bg-white/10 transition">
                  Become a Broker
                </Link>
              </div>
            </div>
          </div>

        </div>
      ) : (
        /* ─── LISTINGS GRID ─── */
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="lg:w-56 shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 lg:sticky lg:top-36">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>
                </svg>
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
            <div className="flex items-center justify-between mb-5">
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {search ? <span>Results for &ldquo;{search}&rdquo;</span> : tabLabels.find(t => t.key === tab)?.label || 'Browse Listings'}
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {loading ? 'Loading...' : `${total.toLocaleString()} listing${total !== 1 ? 's' : ''} found`}
                </p>
              </div>
              {total > perPage && !loading && (
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition text-sm">‹</button>
                  <span className="text-xs font-medium text-gray-500 px-2">{page} / {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))}
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
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">{T.noListingsFound}</h3>
                <p className="text-sm text-gray-400">{T.tryDifferent}</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
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
        className="fixed bottom-8 right-8 z-50 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-white text-3xl font-bold hover:scale-110 active:scale-95 transition-all duration-200 hover:shadow-orange-500/30 group"
        style={{ background: `linear-gradient(135deg, ${NAVY}, ${ORG})` }}
        title="Create New Listing">
        <span className="group-hover:rotate-90 transition-transform duration-300">+</span>
      </Link>
    </div>
  );
}
