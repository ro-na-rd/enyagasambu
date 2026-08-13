'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  Gavel, Clock, Star, MapPin, Search, BadgeCheck, Shield, Truck,
  Package, Monitor, Home, Tag, BookOpen, Activity, Loader2, CheckCircle,
  AlertCircle, RefreshCw, Sparkles, DollarSign, Eye,
} from '@/lib/icons';

interface Auction {
  id: number;
  title: string;
  description: string;
  price: number | null;
  currency: string;
  location: string;
  listing_type: string;
  auction_start: string | null;
  ends_at: string;
  created_at: string;
  category_name: string;
  category_slug: string;
  seller_id: number;
  seller_name: string;
  seller_rating: number;
  seller_reviews: number;
  current_bid: number;
  bid_count: number;
  primary_image: string | null;
  condition: string;
  delivery_terms: string;
  is_featured: number;
  status?: string;
  final_price?: number | null;
  ended_at?: string | null;
}

interface FeedItem {
  id: number;
  listing_id: number;
  bidder_name: string;
  amount: number;
  created_at: string;
  listing_title: string;
  currency: string;
  category_slug: string;
  primary_image: string | null;
}

const NAVY = '#0f1e42';
const ORG = '#E85D04';
const DARK_ORG = '#c04a00';

const CAT_ICON: Record<string, React.ReactNode> = {
  electronics: <Monitor size={44} />,
  furniture: <Home size={44} />,
  fashion: <Tag size={44} />,
  clothing: <Tag size={44} />,
  'beauty-health': <Sparkles size={44} />,
  books: <BookOpen size={44} />,
  'food-beverage': <Package size={44} />,
  handcraft: <Sparkles size={44} />,
};

function formatMoney(n: number | null | undefined, currency = 'RWF') {
  if (n == null) return 'On request';
  return `${Number(n).toLocaleString('en-US')} ${currency}`;
}

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 45) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function useCountdown(target: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const ms = Math.max(0, new Date(target).getTime() - now);
  const s = Math.floor(ms / 1000);
  return {
    now,
    ended: ms <= 0,
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  };
}

function compactLabel(c: { ended: boolean; d: number; h: number; m: number; s: number }) {
  if (c.ended) return 'Ended';
  if (c.d > 0) return `${c.d}d ${c.h}h`;
  if (c.h > 0) return `${c.h}h ${c.m}m`;
  if (c.m > 0) return `${c.m}m ${c.s}s`;
  return `${c.s}s`;
}

const ENDING_SOON_MINUTES = 5;

function computeLiveStatus(a: Auction, now: number): 'upcoming' | 'live' | 'ending_soon' | 'ended' | 'sold' {
  if (a.status === 'sold') return 'sold';
  if (a.auction_start && new Date(a.auction_start).getTime() > now) return 'upcoming';
  const end = new Date(a.ends_at).getTime();
  if (end <= now) return 'ended';
  if ((end - now) / 60000 <= ENDING_SOON_MINUTES) return 'ending_soon';
  return 'live';
}

const STATUS_TABS: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'live', label: 'Live' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'ending_soon', label: 'Ending Soon' },
  { key: 'ended', label: 'Ended' },
];

const SORT_OPTIONS = [
  { key: 'ending_soon', label: 'Ending soon' },
  { key: 'newest', label: 'Newest' },
  { key: 'highest_bid', label: 'Highest bid' },
  { key: 'lowest_bid', label: 'Lowest bid' },
  { key: 'most_bids', label: 'Most bids' },
];

function Rating({ value }: { value: number }) {
  const v = Number.isFinite(value) ? value : 0;
  return (
    <span className="inline-flex items-center gap-0.5" title={`${v.toFixed(1)} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={11} color={i <= Math.round(v) ? '#f5a623' : '#d7dbe6'} />
      ))}
    </span>
  );
}

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const initials = name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  return (
    <span
      className="rounded-full inline-flex items-center justify-center text-white font-semibold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.38, background: `linear-gradient(135deg, ${NAVY}, ${ORG})` }}
    >
      {initials}
    </span>
  );
}

function CategoryImage({ auction, className }: { auction: Auction; className?: string }) {
  return (
    <div className={`flex items-center justify-center bg-gradient-to-br from-[#f0f2fa] to-[#fdeee0] ${className || ''}`}>
      {CAT_ICON[auction.category_slug] || <Package size={44} />}
    </div>
  );
}

function SellerRow({ auction, compact = false }: { auction: Auction; compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <Avatar name={auction.seller_name} size={compact ? 24 : 28} />
      <div className="min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-gray-700 truncate">{auction.seller_name}</span>
          <BadgeCheck size={13} color={ORG} />
        </div>
        <div className="flex items-center gap-1.5">
          <Rating value={auction.seller_rating} />
          <span className="text-[10px] text-gray-400">({auction.seller_reviews})</span>
        </div>
      </div>
    </div>
  );
}

interface BidStatus { loading?: boolean; message?: string; success?: boolean }

function mergeFeed(
  feedRes: FeedItem[],
  seen: Set<number>,
  onNew: (ids: number[]) => void
): FeedItem[] {
  const newIds = feedRes.filter((f) => !seen.has(f.id)).map((f) => f.id);
  if (newIds.length > 0) {
    newIds.forEach((id) => seen.add(id));
    onNew(newIds);
  }
  return feedRes;
}

export default function AuctionPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [ended, setEnded] = useState<Auction[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('ending_soon');
  const [bids, setBids] = useState<Record<number, string>>({});
  const [bidStatus, setBidStatus] = useState<Record<number, BidStatus>>({});
  const [feedFlash, setFeedFlash] = useState<Set<number>>(new Set());
  const seenFeed = useRef<Set<number>>(new Set());

  const flashNew = useCallback((ids: number[]) => {
    setFeedFlash(new Set(ids));
    setTimeout(() => setFeedFlash(new Set()), 4000);
  }, []);

  const loadAuctions = useCallback(async () => {
    try {
      const [active, end, feedRes] = await Promise.all([
        api.get('/auctions', { params: { status: statusFilter, sort: sortBy } }).then<Auction[]>((r) => r.data.auctions ?? []),
        api.get('/auctions/ended').then<Auction[]>((r) => r.data.auctions ?? []),
        api.get('/auctions/feed').then<FeedItem[]>((r) => r.data.feed ?? []),
      ]);
      setAuctions(active);
      setEnded(end);
      setFeed(mergeFeed(feedRes, seenFeed.current, flashNew));
    } catch {
      /* ignore network errors during polling */
    } finally {
      setLoading(false);
    }
  }, [flashNew, statusFilter, sortBy]);

  useEffect(() => {
    let cancelled = false;
    api.get('/auctions', { params: { status: statusFilter, sort: sortBy } }).then<Auction[]>((r) => r.data.auctions ?? [])
      .then((a) => { if (!cancelled) setAuctions(a); }).catch(() => {});
    api.get('/auctions/ended').then<Auction[]>((r) => r.data.auctions ?? [])
      .then((a) => { if (!cancelled) setEnded(a); }).catch(() => {});
    api.get('/auctions/feed').then<FeedItem[]>((r) => r.data.feed ?? [])
      .then((f) => { if (!cancelled) setFeed(mergeFeed(f, seenFeed.current, flashNew)); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });

    const feedTimer = setInterval(() => {
      api.get('/auctions/feed').then<FeedItem[]>((r) => r.data.feed ?? [])
        .then((f) => setFeed(mergeFeed(f, seenFeed.current, flashNew)))
        .catch(() => {});
    }, 5000);
    const auctionTimer = setInterval(() => loadAuctions(), 12000);
    return () => {
      cancelled = true;
      clearInterval(feedTimer);
      clearInterval(auctionTimer);
    };
  }, [loadAuctions, flashNew, statusFilter, sortBy]);

  const categories = useMemo(() => {
    const map: { slug: string; name: string }[] = [];
    const seenSlug = new Set<string>();
    auctions.forEach((a) => {
      if (!seenSlug.has(a.category_slug)) {
        seenSlug.add(a.category_slug);
        map.push({ slug: a.category_slug, name: a.category_name });
      }
    });
    return map;
  }, [auctions]);

  const featured = useMemo(
    () => auctions.find((a) => a.is_featured === 1) ?? auctions[0],
    [auctions]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return auctions.filter((a) => {
      const matchesCat = !category || a.category_slug === category;
      const matchesSearch =
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.description?.toLowerCase().includes(q) ||
        a.category_name.toLowerCase().includes(q) ||
        a.seller_name.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [auctions, category, search]);

  const placeBid = async (auction: Auction) => {
    if (!user) {
      router.push('/login');
      return;
    }
    const raw = bids[auction.id] ?? '';
    const amount = Number(raw.replace(/,/g, ''));
    const min = auction.current_bid + 500;
    if (!Number.isFinite(amount) || amount <= 0) {
      setBidStatus((s) => ({ ...s, [auction.id]: { message: 'Enter a valid bid amount.' } }));
      return;
    }
    if (amount < min) {
      setBidStatus((s) => ({ ...s, [auction.id]: { message: `Minimum bid is ${formatMoney(min)}.` } }));
      return;
    }
    setBidStatus((s) => ({ ...s, [auction.id]: { loading: true } }));
    try {
      await api.post(`/auctions/${auction.id}/bid`, { amount });
      setBidStatus((s) => ({ ...s, [auction.id]: { loading: false, success: true, message: `Bid of ${formatMoney(amount)} placed!` } }));
      loadAuctions();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Could not place bid. Try again.';
      setBidStatus((s) => ({ ...s, [auction.id]: { loading: false, success: false, message: msg } }));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      {/* ─── TRUST BAR ─── */}
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] text-gray-500">
        <span className="inline-flex items-center gap-1.5"><BadgeCheck size={14} color={ORG} /> Verified sellers</span>
        <span className="inline-flex items-center gap-1.5"><Shield size={14} color={ORG} /> Secure bidding</span>
        <span className="inline-flex items-center gap-1.5"><Truck size={14} color={ORG} /> Delivery &amp; pickup options</span>
        <span className="inline-flex items-center gap-1.5"><DollarSign size={14} color={ORG} /> No hidden fees</span>
      </div>

      {/* ─── HERO / FEATURED ─── */}
      {featured ? (
        <HeroAuction
          auction={featured}
          user={user}
          bidValue={bids[featured.id] ?? ''}
          status={bidStatus[featured.id]}
          onBidChange={(v) => setBids((s) => ({ ...s, [featured.id]: v }))}
          onBid={() => placeBid(featured)}
        />
      ) : loading ? (
        <div className="rounded-2xl border border-gray-100 bg-white animate-pulse" style={{ minHeight: 320 }} />
      ) : (
        <div className="text-center py-14 bg-white rounded-2xl border border-gray-100">
          <div className="flex justify-center text-gray-300 mb-3"><Gavel size={48} /></div>
          <h2 className="font-bold text-gray-700">No live auctions right now</h2>
          <p className="text-sm text-gray-400 mt-1">Check back soon — new items go under the hammer regularly.</p>
        </div>
      )}

      {/* ─── SEARCH + CATEGORY FILTERS ─── */}
      <section>
        <div className="flex flex-col sm:flex-row gap-3 items-stretch">
          <div className="flex flex-1 items-center rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm focus-within:border-orange-400">
            <span className="pl-4 text-gray-400"><Search size={18} /></span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search auctions — electronics, furniture, fashion..."
              className="flex-1 px-3 py-3 text-sm outline-none min-w-0"
            />
          </div>
          <Link
            href="/auction/create"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white shadow-sm hover:opacity-90 transition shrink-0"
            style={{ background: `linear-gradient(135deg, ${NAVY}, ${ORG})` }}
          >
            <Gavel size={16} /> Submit an item for auction
          </Link>
        </div>

        {/* Status tabs */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {STATUS_TABS.map((t) => (
            <FilterChip key={t.key} active={statusFilter === t.key} onClick={() => setStatusFilter(t.key)}>
              {t.label}
            </FilterChip>
          ))}
          <div className="flex-1" />
          <label className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500">
            Sort
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 outline-none focus:border-[#E85D04]"
            >
              {SORT_OPTIONS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          <FilterChip active={category === ''} onClick={() => setCategory('')}>All</FilterChip>
          {categories.map((c) => (
            <FilterChip key={c.slug} active={category === c.slug} onClick={() => setCategory(c.slug)}>
              {c.name}
            </FilterChip>
          ))}
        </div>
      </section>

      {/* ─── MAIN + LIVE FEED ─── */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Grid */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Live Auctions</h2>
            <span className="text-xs text-gray-400">
              {filtered.length} item{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                  <div className="bg-gray-100 animate-pulse" style={{ paddingTop: '75%' }} />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-gray-100 animate-pulse rounded w-3/4" />
                    <div className="h-5 bg-gray-100 animate-pulse rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
              <div className="flex justify-center text-gray-300 mb-3"><Search size={48} /></div>
              <h3 className="font-bold text-gray-700">No auctions found</h3>
              <p className="text-sm text-gray-400 mt-1">Try a different category or search term.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((a) => (
                <AuctionCard
                  key={a.id}
                  auction={a}
                  isOwn={user?.id === a.seller_id}
                  bidValue={bids[a.id] ?? ''}
                  status={bidStatus[a.id]}
                  onBidChange={(v) => setBids((s) => ({ ...s, [a.id]: v }))}
                  onBid={() => placeBid(a)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Live feed */}
        <LiveFeed feed={feed} flash={feedFlash} onRefresh={loadAuctions} />
      </div>

      {/* ─── SOLD / ENDED ─── */}
      {ended.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Recently Sold &amp; Ended</h2>
            <span className="text-xs text-gray-400">Auction history</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {ended.map((a) => (
              <Link
                key={a.id}
                href={`/auction/${a.id}`}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition group"
              >
                <div className="relative">
                  {a.primary_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.primary_image} alt={a.title} className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <CategoryImage auction={a} className="w-full h-32" />
                  )}
                  <span className="absolute top-2 left-2 text-[10px] font-semibold px-2 py-1 rounded-full bg-white/95 text-gray-700 shadow-sm">
                    {a.status === 'sold' ? 'Sold' : 'Ended'}
                  </span>
                </div>
                <div className="p-3">
                  <p className="text-xs font-semibold text-gray-800 leading-snug line-clamp-2">{a.title}</p>
                  <p className="text-sm font-bold mt-1.5" style={{ color: DARK_ORG }}>
                    {formatMoney(a.final_price, a.currency)}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Ended {relTime(a.ended_at || a.created_at)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ─── HOW IT WORKS ─── */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
        <h2 className="text-lg font-bold text-gray-900 text-center mb-6">How Live Bidding Works</h2>
        <div className="grid sm:grid-cols-3 gap-6 text-center">
          {[
            { icon: <Gavel size={26} />, title: '1. Browse & pick', desc: 'Explore live auctions, filter by category and watch real-time bids roll in.' },
            { icon: <DollarSign size={26} />, title: '2. Place your bid', desc: 'Enter an amount above the current highest bid. You will be outbid in seconds if someone wants it more.' },
            { icon: <Truck size={26} />, title: '3. Win & collect', desc: 'The highest bidder when the timer hits zero wins. Arrange delivery or pickup with the seller.' },
          ].map((s, i) => (
            <div key={i}>
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 text-white" style={{ background: `linear-gradient(135deg, ${NAVY}, ${ORG})` }}>
                {s.icon}
              </div>
              <h4 className="font-bold text-gray-900 mb-1">{s.title}</h4>
              <p className="text-sm text-gray-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ─── Sub-components ─── */

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-full text-xs font-semibold border transition"
      style={
        active
          ? { background: ORG, color: '#fff', borderColor: ORG, boxShadow: '0 4px 10px rgba(232,93,4,0.25)' }
          : { background: '#fff', color: '#4b5563', borderColor: '#e5e7eb' }
      }
    >
      {children}
    </button>
  );
}

function HeroAuction({
  auction, user, bidValue, status, onBidChange, onBid,
}: {
  auction: Auction;
  user: { id: number } | null;
  bidValue: string;
  status?: BidStatus;
  onBidChange: (v: string) => void;
  onBid: () => void;
}) {
  const c = useCountdown(auction.ends_at);
  const isOwn = user?.id === auction.seller_id;

  return (
    <section className="rounded-2xl overflow-hidden shadow-lg border border-gray-100 relative">
      <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${NAVY} 55%, ${ORG})`, opacity: 0.06 }} />
      <div className="relative grid md:grid-cols-2 gap-0 bg-white/95 backdrop-blur">
        {/* image */}
        <div className="relative min-h-56 md:min-h-full">
          {auction.primary_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={auction.primary_image} alt={auction.title} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#eef1f9] to-[#fdeee0]">
              {CAT_ICON[auction.category_slug] || <Package size={72} />}
            </div>
          )}
          <div className="absolute top-3 left-3 flex gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full text-white shadow" style={{ background: ORG }}>
              Featured
            </span>
            {!c.ended && (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full text-white bg-red-500/90 shadow">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                </span>
                Live
              </span>
            )}
          </div>
        </div>

        {/* info */}
        <div className="p-5 md:p-7 flex flex-col">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: DARK_ORG }}>
            <Gavel size={14} /> {auction.category_name} · Auction
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mt-1.5 leading-snug">{auction.title}</h1>

          <p className="text-sm text-gray-500 mt-2 leading-relaxed line-clamp-3">
            {auction.description || 'No description provided by the seller.'}
          </p>

          <div className="flex items-center gap-3 mt-3">
            <SellerRow auction={auction} />
            <span className="text-[10px] text-gray-400 inline-flex items-center gap-1"><MapPin size={12} /> {auction.location || 'Kigali'}</span>
          </div>

          {/* countdown */}
          <div className="flex items-center gap-2 mt-4">
            <Clock size={16} color={DARK_ORG} />
            <span className="text-xs font-semibold text-gray-600 mr-1">Ends in</span>
            {c.ended ? (
              <span className="text-xs font-bold text-red-600">Auction ended</span>
            ) : (
              <div className="flex gap-1.5">
                {c.d > 0 && <TimeTile v={String(c.d).padStart(2, '0')} label="days" />}
                <TimeTile v={String(c.h).padStart(2, '0')} label="hrs" />
                <TimeTile v={String(c.m).padStart(2, '0')} label="min" />
                <TimeTile v={String(c.s).padStart(2, '0')} label="sec" />
              </div>
            )}
          </div>

          {/* prices */}
          <div className="mt-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Starting price</p>
              <p className="text-xs text-gray-400 line-through">{formatMoney(auction.price, auction.currency)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Current highest bid</p>
              <p className="text-2xl font-bold" style={{ color: DARK_ORG }}>{formatMoney(auction.current_bid, auction.currency)}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{auction.bid_count} bid{auction.bid_count !== 1 ? 's' : ''} so far</p>
            </div>
          </div>

          {/* bid box */}
          <div className="mt-4">
            {c.ended ? (
              <div className="text-center py-3 rounded-xl bg-gray-100 text-sm font-semibold text-gray-500">This auction has ended</div>
            ) : isOwn ? (
              <div className="text-center py-3 rounded-xl bg-orange-50 text-sm font-semibold" style={{ color: DARK_ORG }}>
                This is your listing
              </div>
            ) : (
              <>
                <BidInput
                  value={bidValue}
                  min={auction.current_bid + 500}
                  status={status}
                  onChange={onBidChange}
                  onBid={onBid}
                />
                {status?.message && (
                  <p className={`mt-2 text-xs flex items-center gap-1.5 ${status.success ? 'text-green-600' : 'text-red-600'}`}>
                    {status.success ? <CheckCircle size={14} /> : <AlertCircle size={14} />} {status.message}
                  </p>
                )}
              </>
            )}
          </div>

          {/* trust chips */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
            <TrustChip icon={<BadgeCheck size={13} />} text={auction.condition} />
            <TrustChip icon={<Truck size={13} />} text={auction.delivery_terms} />
          </div>
        </div>
      </div>
    </section>
  );
}

function TimeTile({ v, label }: { v: string; label: string }) {
  return (
    <div className="text-center rounded-lg px-2 py-1.5 min-w-[46px]" style={{ background: NAVY }}>
      <div className="text-white font-bold text-lg leading-none">{v}</div>
      <div className="text-[9px] text-white/70 uppercase tracking-wider mt-0.5">{label}</div>
    </div>
  );
}

function TrustChip({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-600 bg-gray-50 border border-gray-100 rounded-full px-3 py-1.5">
      <span style={{ color: ORG }}>{icon}</span> {text}
    </span>
  );
}

function BidInput({
  value, min, status, onChange, onBid,
}: {
  value: string;
  min: number;
  status?: BidStatus;
  onChange: (v: string) => void;
  onBid: () => void;
}) {
  const minStr = min.toLocaleString('en-US');
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <div className="flex-1 flex items-center rounded-xl border border-gray-200 bg-white overflow-hidden focus-within:border-orange-400">
        <span className="pl-3 text-xs font-bold text-gray-400">RWF</span>
        <input
          type="text"
          inputMode="numeric"
          value={value}
          placeholder={minStr}
          onChange={(e) => onChange(e.target.value.replace(/[^\d,]/g, ''))}
          onKeyDown={(e) => { if (e.key === 'Enter') onBid(); }}
          className="flex-1 px-3 py-2.5 text-sm outline-none min-w-0 font-semibold"
          style={{ color: NAVY }}
        />
      </div>
      <button
        onClick={onBid}
        disabled={status?.loading}
        className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-90 active:scale-[0.98] transition disabled:opacity-60"
        style={{ background: ORG }}
      >
        {status?.loading ? <Loader2 size={16} className="animate-spin" /> : <Gavel size={16} />}
        {status?.loading ? 'Placing...' : 'Place Bid'}
      </button>
    </div>
  );
}

function AuctionCard({
  auction, isOwn, bidValue, status, onBidChange, onBid,
}: {
  auction: Auction;
  isOwn: boolean;
  bidValue: string;
  status?: BidStatus;
  onBidChange: (v: string) => void;
  onBid: () => void;
}) {
  const c = useCountdown(auction.ends_at);
  const liveStatus = computeLiveStatus(auction, c.now);

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition flex flex-col">
      <Link href={`/auction/${auction.id}`} className="block relative group">
        {auction.primary_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={auction.primary_image} alt={auction.title} className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <CategoryImage auction={auction} className="w-full aspect-[4/3]" />
        )}
        <span className="absolute top-2.5 left-2.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full text-white shadow" style={{ background: ORG }}>
          {auction.category_name}
        </span>
        <span className="absolute top-2.5 right-2.5 flex gap-1.5">
          {liveStatus === 'upcoming' && (
            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-indigo-600 text-white shadow">Upcoming</span>
          )}
          {liveStatus === 'ending_soon' && (
            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-500 text-white shadow inline-flex items-center gap-1">
              <Clock size={10} /> Ending soon
            </span>
          )}
          {liveStatus === 'sold' && (
            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-green-600 text-white shadow">Sold</span>
          )}
          {liveStatus === 'ended' && (
            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-gray-800 text-white shadow">Ended</span>
          )}
          {liveStatus === 'live' && (
            <span
              className="text-[10px] font-bold px-2 py-1 rounded-full shadow inline-flex items-center gap-1"
              style={{ background: c.h < 1 ? '#dc2626' : '#ffffff', color: c.h < 1 ? '#fff' : '#0f1e42' }}
            >
              {c.ended ? 'Ended' : <><Clock size={10} /> {compactLabel(c)}</>}
            </span>
          )}
        </span>
      </Link>

      <div className="p-3.5 flex flex-col flex-1">
        <Link href={`/auction/${auction.id}`}>
          <h3 className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2 hover:underline">{auction.title}</h3>
        </Link>
        <p className="text-[10px] text-gray-400 mt-1 inline-flex items-center gap-1">
          <BadgeCheck size={11} color={ORG} /> {auction.condition}
        </p>

        <div className="mt-2.5">
          <SellerRow auction={auction} compact />
        </div>

        <div className="flex items-baseline gap-2 mt-3">
          <span className="text-[10px] text-gray-400 line-through">{formatMoney(auction.price, auction.currency)}</span>
          <span className="ml-auto text-[10px] text-gray-400">{auction.bid_count} bid{auction.bid_count !== 1 ? 's' : ''}</span>
        </div>
        <p className="text-base font-bold" style={{ color: DARK_ORG }}>{formatMoney(auction.current_bid, auction.currency)}</p>

        <div className="mt-3 pt-3 border-t border-gray-100">
          {c.ended ? (
            <div className="text-center py-2 rounded-lg bg-gray-100 text-xs font-semibold text-gray-500">Auction ended</div>
          ) : isOwn ? (
            <div className="text-center py-2 rounded-lg bg-orange-50 text-xs font-semibold" style={{ color: DARK_ORG }}>Your listing</div>
          ) : (
            <>
              <div className="flex gap-1.5">
                <div className="flex-1 flex items-center rounded-lg border border-gray-200 overflow-hidden focus-within:border-orange-400">
                  <span className="pl-2 text-[10px] font-bold text-gray-400">RWF</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={bidValue}
                    placeholder={(auction.current_bid + 500).toLocaleString('en-US')}
                    onChange={(e) => onBidChange(e.target.value.replace(/[^\d,]/g, ''))}
                    className="flex-1 px-2 py-2 text-sm outline-none min-w-0 font-semibold w-full"
                    style={{ color: NAVY }}
                  />
                </div>
                <button
                  onClick={onBid}
                  disabled={status?.loading}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-white transition hover:opacity-90 active:scale-95 disabled:opacity-60"
                  style={{ background: ORG }}
                >
                  {status?.loading ? <Loader2 size={14} className="animate-spin" /> : 'Bid'}
                </button>
              </div>
              {status?.message && (
                <p className={`mt-1.5 text-[11px] ${status.success ? 'text-green-600' : 'text-red-600'}`}>{status.message}</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function LiveFeed({
  feed, flash, onRefresh,
}: {
  feed: FeedItem[];
  flash: Set<number>;
  onRefresh: () => void;
}) {
  return (
    <aside className="lg:w-80 shrink-0">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden lg:sticky lg:top-20">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="inline-flex items-center gap-2 text-sm font-bold text-gray-900">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
            Live Bidding Activity
          </span>
          <button
            onClick={onRefresh}
            className="text-gray-400 hover:text-gray-600 transition"
            title="Refresh"
          >
            <RefreshCw size={15} />
          </button>
        </div>

        <div className="max-h-[520px] overflow-y-auto divide-y divide-gray-50">
          {feed.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Activity size={28} className="mx-auto mb-2" />
              <p className="text-xs">No bids yet — be the first!</p>
            </div>
          ) : (
            feed.map((f, i) => (
              <div
                key={f.id}
                className={`flex items-start gap-2.5 px-4 py-2.5 transition-colors ${i === 0 ? 'bg-orange-50/60' : ''}`}
                style={flash.has(f.id) ? ({ animation: 'feedflash 2s ease-out' } as React.CSSProperties) : undefined}
              >
                <Avatar name={f.bidder_name} size={30} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-gray-800">{f.bidder_name}</span>
                    <span className="text-[10px] text-gray-400">{relTime(f.created_at)}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 truncate">bid on “{f.listing_title}”</p>
                </div>
                <span className="text-xs font-bold whitespace-nowrap" style={{ color: DARK_ORG }}>
                  {formatMoney(f.amount, f.currency)}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/60">
          <p className="text-[10px] text-gray-400 flex items-center gap-1">
            <Eye size={12} /> Auto-refreshes every 5 seconds
          </p>
        </div>
      </div>
    </aside>
  );
}
