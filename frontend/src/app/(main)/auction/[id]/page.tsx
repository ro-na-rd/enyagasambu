'use client';
import { use, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { getSocket, onEvent } from '@/lib/socket';
import {
  ArrowLeft, Gavel, Clock, Star, MapPin, BadgeCheck, Shield, Truck,
  Package, Monitor, Home, Tag, BookOpen, Loader2, CheckCircle, AlertCircle,
  Eye, Heart, Award, TrendingUp, Users, Sparkles, Calendar, Ban, Share2, Plus,
} from '@/lib/icons';

interface Bid {
  id: number;
  user_id: number | null;
  bidder_name: string;
  amount: number;
  created_at: string;
}

interface AuctionImage {
  id: number;
  image_url: string;
  is_primary: boolean;
}

interface AuctionDetail {
  id: number;
  title: string;
  description: string;
  price: number;
  minimum_increment: number;
  reserve_price: number | null;
  currency: string;
  location: string;
  category_id: number;
  category_name: string;
  category_slug: string;
  category_type: string;
  seller_id: number;
  seller_name: string;
  seller_rating: number;
  seller_reviews: number;
  auction_start: string | null;
  ends_at: string;
  created_at: string;
  status: 'upcoming' | 'live' | 'ending_soon' | 'ended' | 'sold';
  current_bid: number;
  highest_bid: number;
  bid_count: number;
  highest_bidder_id: number | null;
  highest_bidder_name: string | null;
  primary_image: string | null;
  is_featured: boolean;
  views: number;
  condition: string;
  delivery_terms: string;
  anti_sniping: boolean;
  sniping_window: number;
  images: AuctionImage[];
  bids: Bid[];
  watched: boolean;
  is_own: boolean;
}

interface BidEvent {
  auctionId: number;
  bid: Bid;
  currentBid: number;
  highestBidderId: number;
  highestBidderName: string;
  bidCount: number;
  endsAt?: string;
  extended?: boolean;
  title: string;
}

interface EndedEvent {
  auctionId: number;
  status: string;
  winnerId: number | null;
  winnerName: string | null;
  winningBid: number | null;
  title: string;
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
  if (n == null) return '—';
  return `${Number(n).toLocaleString('en-US')} ${currency}`;
}

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 10) return 'Just now';
  if (s < 60) return `${s} sec ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function useCountdown(target?: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const ms = target ? Math.max(0, new Date(target).getTime() - now) : 0;
  const s = Math.floor(ms / 1000);
  return {
    now,
    ended: !!target && ms <= 0,
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  };
}

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

function CategoryImage({ auction, className }: { auction: Pick<AuctionDetail, 'category_slug'>; className?: string }) {
  return (
    <div className={`flex items-center justify-center bg-gradient-to-br from-[#f0f2fa] to-[#fdeee0] ${className || ''}`}>
      {CAT_ICON[auction.category_slug] || <Package size={56} />}
    </div>
  );
}

function TimeTile({ v, label }: { v: string; label: string }) {
  return (
    <div className="text-center rounded-lg px-2.5 py-1.5 min-w-[50px]" style={{ background: NAVY }}>
      <div className="text-white font-bold text-lg leading-none">{v}</div>
      <div className="text-[9px] text-white/70 uppercase tracking-wider mt-0.5">{label}</div>
    </div>
  );
}

function CountdownRow({ target, label, color = NAVY }: { target: string; label: string; color?: string }) {
  const c = useCountdown(target);
  if (c.ended) {
    return (
      <div className="flex items-center gap-2">
        <Clock size={16} color={color} />
        <span className="text-xs font-semibold text-gray-500 mr-1">{label}</span>
        <span className="text-xs font-bold text-red-600">Ended</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <Clock size={16} color={color} />
      <span className="text-xs font-semibold text-gray-500 mr-1">{label}</span>
      <div className="flex gap-1.5">
        {c.d > 0 && <TimeTile v={String(c.d).padStart(2, '0')} label="days" />}
        <TimeTile v={String(c.h).padStart(2, '0')} label="hrs" />
        <TimeTile v={String(c.m).padStart(2, '0')} label="min" />
        <TimeTile v={String(c.s).padStart(2, '0')} label="sec" />
      </div>
    </div>
  );
}

function computeLiveStatus(a: AuctionDetail, now: number): AuctionDetail['status'] {
  if (a.status === 'sold' || a.status === 'ended') return a.status;
  if (a.auction_start && new Date(a.auction_start).getTime() > now) return 'upcoming';
  if (new Date(a.ends_at).getTime() <= now) return 'ended';
  return a.status === 'ending_soon' ? 'ending_soon' : 'live';
}

const STATUS_STYLE: Record<AuctionDetail['status'], { bg: string; color: string; label: string; icon: React.ReactNode; pulse?: boolean }> = {
  upcoming: { bg: '#eef2ff', color: '#4338ca', label: 'Upcoming', icon: <Clock size={11} /> },
  live: { bg: '#dc2626', color: '#fff', label: 'Live Auction', icon: <Gavel size={11} />, pulse: true },
  ending_soon: { bg: '#f59e0b', color: '#fff', label: 'Ending Soon', icon: <Clock size={11} />, pulse: true },
  ended: { bg: '#e5e7eb', color: '#4b5563', label: 'Auction Ended', icon: <Ban size={11} /> },
  sold: { bg: '#16a34a', color: '#fff', label: 'Sold', icon: <Award size={11} /> },
};

function StatusBadge({ status }: { status: AuctionDetail['status'] | null }) {
  if (!status) return null;
  const s = STATUS_STYLE[status];
  if (!s) return null;
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm"
      style={{ background: s.bg, color: s.color }}
    >
      {s.pulse ? (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: s.color }} />
          <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: s.color }} />
        </span>
      ) : (
        s.icon
      )}
      {s.label}
    </span>
  );
}

export default function AuctionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();

  const [auction, setAuction] = useState<AuctionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [activeImg, setActiveImg] = useState(0);
  const [bidAmount, setBidAmount] = useState('');
  const [bidStatus, setBidStatus] = useState<{ loading?: boolean; message?: string; success?: boolean }>({});
  const [watchBusy, setWatchBusy] = useState(false);
  const [watched, setWatched] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const { data } = await api.get(`/auctions/${id}`);
        if (ignore) return;
        setLoading(false);
        setFetchError('');
        setActiveImg(0);
        setBidAmount('');
        setBidStatus({});
        setAuction(data.auction);
        setWatched(data.auction.watched);
      } catch (err: unknown) {
        if (ignore) return;
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        setFetchError(msg || 'Auction not found');
        setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [id]);

  // Real-time bidding via Socket.IO
  useEffect(() => {
    const auctionId = Number(id);
    const s = getSocket();
    const doJoin = () => s.emit('auction:join', { auctionId });
    s.on('connect', doJoin);
    if (s.connected) doJoin();

    const offBid = onEvent('auction:bid', (raw) => {
      const payload = raw as BidEvent;
      if (payload.auctionId !== auctionId) return;
      setAuction((prev) => (prev ? {
        ...prev,
        current_bid: payload.currentBid,
        highest_bid: payload.currentBid,
        highest_bidder_id: payload.highestBidderId,
        highest_bidder_name: payload.highestBidderName,
        bid_count: payload.bidCount,
        ends_at: payload.endsAt || prev.ends_at,
        bids: [payload.bid, ...prev.bids].slice(0, 50),
      } : prev));
      setBidStatus({});
    });

    const offEnd = onEvent('auction:ended', (raw) => {
      const payload = raw as EndedEvent;
      if (payload.auctionId !== auctionId) return;
      setAuction((prev) => (prev ? { ...prev, status: payload.status === 'sold' ? 'sold' : 'ended' } : prev));
    });

    return () => {
      s.off('connect', doJoin);
      if (s.connected) s.emit('auction:leave', { auctionId });
      offBid();
      offEnd();
    };
  }, [id]);

  useEffect(() => {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  const handleQuickBid = (add: number) => {
    if (!auction) return;
    const value = auction.current_bid + add;
    setBidAmount(value.toLocaleString('en-US'));
    setBidStatus({});
  };

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/auction/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const placeBid = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!auction) return;
    const amount = Number(bidAmount.replace(/,/g, ''));
    const min = auction.current_bid + auction.minimum_increment;
    if (!Number.isFinite(amount) || amount <= 0) {
      setBidStatus({ success: false, message: 'Enter a valid bid amount.' });
      return;
    }
    if (amount < min) {
      setBidStatus({ success: false, message: `Minimum bid is ${formatMoney(min)}.` });
      return;
    }
    setBidStatus({ loading: true });
    try {
      const { data } = await api.post(`/auctions/${id}/bid`, { amount });
      setAuction((prev) => (prev ? {
        ...prev,
        current_bid: data.current_bid,
        highest_bid: data.current_bid,
        highest_bidder_id: data.highest_bidder_id,
        highest_bidder_name: data.highest_bidder_name,
        bid_count: data.bid_count,
        ends_at: data.ends_at || prev.ends_at,
        bids: [data.bid, ...prev.bids].slice(0, 50),
      } : prev));
      setBidAmount('');
      setBidStatus({ success: true, message: `Bid of ${formatMoney(amount)} placed!` });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Could not place bid. Try again.';
      setBidStatus({ success: false, message: msg });
    }
  };

  const toggleWatch = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    setWatchBusy(true);
    try {
      if (watched) {
        await api.delete(`/auctions/${id}/watch`);
        setWatched(false);
      } else {
        await api.post(`/auctions/${id}/watch`);
        setWatched(true);
      }
    } catch {
      /* ignore */
    } finally {
      setWatchBusy(false);
    }
  };

  const nowRef = useCountdown(auction?.ends_at);
  const liveStatus = auction ? computeLiveStatus(auction, nowRef.now) : null;
  const images = auction
    ? (auction.images.length > 0
        ? auction.images
        : auction.primary_image
          ? [{ id: 0, image_url: auction.primary_image, is_primary: true }]
          : [])
    : [];
  const activeImage = images[activeImg]?.image_url || null;
  const reserveMet = auction ? auction.reserve_price != null && auction.current_bid >= auction.reserve_price : false;

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-gray-100 rounded w-1/4" />
          <div className="h-96 bg-gray-100 rounded-2xl" />
          <div className="space-y-3">
            <div className="h-6 bg-gray-100 rounded w-3/4" />
            <div className="h-4 bg-gray-100 rounded w-1/2" />
            <div className="h-4 bg-gray-100 rounded w-1/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="flex justify-center text-gray-300 mb-4"><Gavel size={64} /></div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Auction Not Found</h2>
        <p className="text-gray-500 mb-6">{fetchError || 'This auction may have been removed.'}</p>
        <Link href="/auction" className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-lg text-white" style={{ background: ORG }}>
          <ArrowLeft size={14} /> Browse Auctions
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between mb-5">
        <Link href="/auction" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-[#E85D04] transition">
          <ArrowLeft size={15} /> Back to auctions
        </Link>
        <button
          onClick={handleCopyLink}
          className="text-xs font-medium text-gray-400 hover:text-gray-600 transition inline-flex items-center gap-1"
        >
          {copied ? <CheckCircle size={13} color="green" /> : <Link2 size={13} />}
          {copied ? 'Link copied!' : 'Copy link'}
        </button>
      </div>

      {/* Status banner */}
      <StatusBanner status={liveStatus} auction={auction} />

      <div className="grid lg:grid-cols-[1fr_380px] gap-6 mt-6">
        {/* LEFT: gallery + details */}
        <div className="space-y-6 min-w-0">
          {/* Gallery */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="relative aspect-[4/3] md:aspect-[16/9] bg-gradient-to-br from-[#f0f2fa] to-[#fdeee0]">
              {activeImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={activeImage} alt={auction.title} className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <CategoryImage auction={auction} className="w-full h-full" />
                </div>
              )}
              <div className="absolute top-3 left-3 flex gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full text-white shadow" style={{ background: ORG }}>
                  {auction.category_name}
                </span>
                <StatusBadge status={liveStatus} />
              </div>
              {auction.is_featured && (
                <span className="absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/95 text-gray-700 shadow-sm inline-flex items-center gap-1">
                  <Sparkles size={11} color={ORG} /> Featured
                </span>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImg(i)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition ${i === activeImg ? 'border-[#E85D04]' : 'border-transparent hover:border-gray-200'}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.image_url} alt={`${auction.title} ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            <div className="px-5 pb-4 flex items-center gap-3 text-[11px] text-gray-400">
              <span className="inline-flex items-center gap-1"><Eye size={12} /> {auction.views.toLocaleString()} views</span>
              <span className="inline-flex items-center gap-1"><Users size={12} /> {auction.bid_count} bid{auction.bid_count !== 1 ? 's' : ''}</span>
              <span className="inline-flex items-center gap-1"><Truck size={12} /> {auction.delivery_terms}</span>
            </div>
          </div>

          {/* Title + seller */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-snug">{auction.title}</h1>
                <p className="text-xs text-gray-400 mt-1.5 inline-flex items-center gap-1">
                  <MapPin size={12} /> {auction.location || 'Kigali'} · Listed {relTime(auction.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-full border border-gray-200 text-gray-600 hover:border-gray-300 transition"
                  title="Share auction"
                >
                  <Share2 size={13} color={copied ? 'green' : 'currentColor'} />
                  {copied ? 'Link copied!' : 'Share'}
                </button>
                <button
                  onClick={toggleWatch}
                  disabled={watchBusy}
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-full border transition disabled:opacity-60 ${
                    watched ? 'border-[#E85D04] bg-orange-50 text-[#E85D04]' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Heart size={13} color={watched ? '#E85D04' : 'currentColor'} />
                  {watched ? 'Watching' : 'Watch'}
                </button>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <Avatar name={auction.seller_name} size={40} />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-gray-800">{auction.seller_name}</span>
                  <BadgeCheck size={14} color={ORG} />
                  <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Verified seller</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Rating value={auction.seller_rating} />
                  <span className="text-[11px] text-gray-400">({auction.seller_reviews} reviews)</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed mt-4 whitespace-pre-line">
              {auction.description || 'No description provided by the seller.'}
            </p>

            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
              <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-600 bg-gray-50 border border-gray-100 rounded-full px-3 py-1.5">
                <BadgeCheck size={13} color={ORG} /> {auction.condition}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-600 bg-gray-50 border border-gray-100 rounded-full px-3 py-1.5">
                <Shield size={13} color={ORG} /> {auction.anti_sniping ? `Anti-sniping extends by ${auction.sniping_window}s` : 'Fixed closing time'}
              </span>
            </div>
          </div>

          {/* Bid history */}
          <BidHistory bids={auction.bids} currency={auction.currency} />
        </div>

        {/* RIGHT: bid card */}
        <div className="lg:sticky lg:top-20 h-fit space-y-4">
          <BidCard
            auction={auction}
            status={liveStatus}
            user={user}
            bidAmount={bidAmount}
            onBidChange={setBidAmount}
            onQuickBid={handleQuickBid}
            onBid={placeBid}
            bidStatus={bidStatus}
            reserveMet={reserveMet}
          />
        </div>
      </div>
    </div>
  );
}

function StatusBanner({ status, auction }: { status: AuctionDetail['status'] | null; auction: AuctionDetail }) {
  if (status === 'upcoming') {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 flex items-center gap-3">
        <Clock size={20} color="#b45309" />
        <div className="text-sm text-amber-900">
          <span className="font-bold">Starts in</span>
          <CountdownRow target={auction.auction_start!} label="Bidding opens" />
        </div>
      </div>
    );
  }
  if (status === 'sold') {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4">
        <div className="flex items-center gap-2 text-green-800 font-bold"><Award size={18} /> This auction has ended — SOLD!</div>
        <p className="text-sm text-green-700 mt-1">
          {auction.highest_bidder_name || 'A bidder'} won with <span className="font-bold">{formatMoney(auction.current_bid, auction.currency)}</span>.
        </p>
      </div>
    );
  }
  if (status === 'ended') {
    return (
      <div className="rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4">
        <div className="flex items-center gap-2 text-gray-700 font-bold"><Clock size={18} /> Auction ended</div>
        <p className="text-sm text-gray-500 mt-1">Final price: <span className="font-bold">{formatMoney(auction.current_bid, auction.currency)}</span>. No winner.</p>
      </div>
    );
  }
  return (
    <div
      className="rounded-2xl border px-5 py-4 flex items-center gap-3 flex-wrap"
      style={status === 'ending_soon'
        ? { borderColor: '#fbbf24', background: '#fffbeb' }
        : { borderColor: '#f1f5f9', background: '#fff', boxShadow: '0 1px 2px rgba(15,30,66,0.04)' }}
    >
      <CountdownRow target={auction.ends_at} label="Ends in" color={status === 'ending_soon' ? '#d97706' : NAVY} />
      <StatusBadge status={status} />
      {status === 'ending_soon' && (
        <span className="text-[11px] font-bold text-amber-600 animate-pulse inline-flex items-center gap-1">
          <Clock size={12} /> Auction ending soon!
        </span>
      )}
    </div>
  );
}

function BidCard({
  auction, status, user, bidAmount, onBidChange, onQuickBid, onBid, bidStatus, reserveMet,
}: {
  auction: AuctionDetail;
  status: AuctionDetail['status'] | null;
  user: { id: number } | null;
  bidAmount: string;
  onBidChange: (v: string) => void;
  onQuickBid: (add: number) => void;
  onBid: () => void;
  bidStatus: { loading?: boolean; message?: string; success?: boolean };
  reserveMet: boolean;
}) {
  const minBid = auction.current_bid + auction.minimum_increment;
  const isOwn = user?.id === auction.seller_id;
  const endingSoon = status === 'ending_soon';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <StatusBadge status={status} />
        {endingSoon && (
          <span className="text-[11px] font-bold text-amber-600 animate-pulse inline-flex items-center gap-1">
            <Clock size={12} /> Auction ending soon!
          </span>
        )}
      </div>

      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Current highest bid</p>
          <p className="text-2xl md:text-3xl font-bold mt-0.5" style={{ color: DARK_ORG }}>{formatMoney(auction.current_bid, auction.currency)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{auction.bid_count} bid{auction.bid_count !== 1 ? 's' : ''} so far</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Starting price</p>
          <p className="text-sm text-gray-400 line-through mt-0.5">{formatMoney(auction.price, auction.currency)}</p>
        </div>
      </div>

      {/* Highest bidder */}
      <div className="flex items-center gap-2.5 rounded-xl bg-gray-50 border border-gray-100 px-3.5 py-2.5">
        {auction.highest_bidder_name ? (
          <>
            <Avatar name={auction.highest_bidder_name} size={28} />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Highest bidder</p>
              <p className="text-sm font-bold text-gray-800 truncate">{auction.highest_bidder_name}</p>
            </div>
          </>
        ) : (
          <p className="text-xs text-gray-400 inline-flex items-center gap-1.5">
            <Gavel size={14} /> No bids yet — be the first to bid.
          </p>
        )}
      </div>

      {/* Countdown */}
      <CountdownRow target={auction.ends_at} label="Ends in" color={endingSoon ? '#d97706' : NAVY} />

      {/* Auction schedule */}
      <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-500">
        <span className="inline-flex items-center gap-1.5">
          <Calendar size={12} color={ORG} /> Starts {formatDateTime(auction.auction_start || auction.created_at)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Calendar size={12} color={ORG} /> Ends {formatDateTime(auction.ends_at)}
        </span>
      </div>

      {auction.reserve_price != null && (
        <div className={`text-[11px] font-semibold flex items-center gap-1.5 rounded-lg px-3 py-2 ${reserveMet ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
          {reserveMet ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
          {reserveMet ? 'Reserve price met' : `Reserve not yet met (${formatMoney(auction.reserve_price, auction.currency)})`}
        </div>
      )}

      <div className="space-y-2">
        {status === 'upcoming' ? (
          <div className="text-center py-3 rounded-xl bg-amber-50 text-sm font-semibold text-amber-800">
            Bidding opens {new Date(auction.auction_start!).toLocaleString()}
          </div>
        ) : status === 'ended' || status === 'sold' ? (
          <div className="text-center py-3 rounded-xl bg-gray-100 text-sm font-semibold text-gray-500">
            This auction has ended
          </div>
        ) : isOwn ? (
          <div className="text-center py-3 rounded-xl bg-orange-50 text-sm font-semibold" style={{ color: DARK_ORG }}>
            This is your auction listing
          </div>
        ) : !user ? (
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-90 transition"
            style={{ background: ORG }}
          >
            <Gavel size={15} /> Login to place a bid
          </Link>
        ) : (
          <>
            <div className="flex items-center rounded-xl border border-gray-200 bg-white overflow-hidden focus-within:border-orange-400">
              <span className="pl-3 text-xs font-bold text-gray-400">RWF</span>
              <input
                type="text"
                inputMode="numeric"
                value={bidAmount}
                placeholder={minBid.toLocaleString('en-US')}
                onChange={(e) => onBidChange(e.target.value.replace(/[^\d,]/g, ''))}
                onKeyDown={(e) => { if (e.key === 'Enter') onBid(); }}
                className="flex-1 px-3 py-3 text-base outline-none min-w-0 font-bold"
                style={{ color: NAVY }}
              />
            </div>

            {/* Quick bid buttons */}
            <div className="grid grid-cols-3 gap-1.5">
              {[1000, 5000, 10000].map((add) => (
                <button
                  key={add}
                  type="button"
                  onClick={() => onQuickBid(add)}
                  className="inline-flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold border transition hover:opacity-80 active:scale-95"
                  style={{ background: '#fff7ed', color: DARK_ORG, borderColor: '#ffd8b8' }}
                >
                  <Plus size={11} /> {add.toLocaleString('en-US')}
                </button>
              ))}
            </div>

            <button
              onClick={onBid}
              disabled={bidStatus.loading}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-90 active:scale-[0.98] transition disabled:opacity-60"
              style={{ background: ORG }}
            >
              {bidStatus.loading ? <Loader2 size={16} className="animate-spin" /> : <Gavel size={16} />}
              {bidStatus.loading ? 'Placing...' : 'Place Bid'}
            </button>
            {bidStatus.message && (
              <p className={`text-xs flex items-center gap-1.5 ${bidStatus.success ? 'text-green-600' : 'text-red-600'}`}>
                {bidStatus.success ? <CheckCircle size={14} /> : <AlertCircle size={14} />} {bidStatus.message}
              </p>
            )}
          </>
        )}
      </div>

      <div className="pt-4 border-t border-gray-100 space-y-2 text-[11px] text-gray-500">
        <p className="flex items-center gap-1.5">
          <TrendingUp size={12} color={ORG} /> Minimum increment: <span className="font-semibold">{formatMoney(auction.minimum_increment, auction.currency)}</span>
        </p>
        {auction.anti_sniping && (
          <p className="flex items-center gap-1.5">
            <Clock size={12} color={ORG} /> Anti-sniping active — bids in the final {auction.sniping_window}s extend the auction.
          </p>
        )}
      </div>
    </div>
  );
}

function BidHistory({ bids, currency }: { bids: Bid[]; currency: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-gray-900">Bid History</h2>
        <span className="text-[11px] text-gray-400">{bids.length} bid{bids.length !== 1 ? 's' : ''}</span>
      </div>
      {bids.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Gavel size={26} className="mx-auto mb-2" />
          <p className="text-xs">No bids yet — be the first to bid!</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {bids.map((b, i) => {
            const isTop = i === 0;
            return (
              <div key={b.id} className={`flex items-center gap-3 py-2.5 ${isTop ? 'bg-orange-50/60 -mx-5 px-5' : ''}`}>
                <Avatar name={b.bidder_name} size={28} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate flex items-center gap-1.5">
                    {b.bidder_name}
                    {isTop && <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full text-white" style={{ background: ORG }}>Top</span>}
                  </p>
                  <p className="text-[11px] text-gray-400">{relTime(b.created_at)}</p>
                </div>
                <span className="text-sm font-bold whitespace-nowrap" style={{ color: DARK_ORG }}>{formatMoney(b.amount, currency)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Link2({ size, color }: { size?: number; color?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
