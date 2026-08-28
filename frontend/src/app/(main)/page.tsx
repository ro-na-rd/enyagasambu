'use client';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useSiteContent } from '@/lib/useSiteContent';
import { Package, Building2, Car, Users, List, Store, Gavel, User, Coins, Gift, MapPin } from '@/lib/icons';

interface Listing {
  id: number;
  title: string;
  price: number | null;
  price_type: string;
  currency: string;
  category: string;
  category_name?: string;
  location: string;
  type: string;
  primary_image?: string | null;
  created_at: string;
}

interface Auction {
  id: number;
  title: string;
  current_bid: number;
  price: number | null;
  currency: string;
  ends_at: string;
}

const STATS_ICONS: Record<string, React.FC<{ size?: number }>> = {
  products: Package,
  properties: Building2,
  vehicles: Car,
  suppliers: Users,
};
const STAT_KEYS = ['products', 'properties', 'vehicles', 'suppliers'] as const;

const FALLBACK_NOTICES = [
  { tag: 'Property', auction: false, text: '3-bedroom house for sale – Kimironko, Kigali. Modern finish, gated compound.',               date: '22 Jun 2026' },
  { tag: 'Auction',  auction: true,  text: 'Public auction: office furniture & equipment – Ministry of Finance surplus assets.',         date: '21 Jun 2026' },
  { tag: 'Service',  auction: false, text: 'Professional plumbing & electrical installation services – Northern Province.',              date: '20 Jun 2026' },
  { tag: 'Vehicle',  auction: false, text: 'Toyota Hilux 2020 double cabin – low mileage, accident-free, asking 28M RWF.',               date: '20 Jun 2026' },
];

const SELL_LINKS = [
  'Post a product',
  'Post a property',
  'Post a vehicle',
  'Offer a service',
  'Submit for auction',
  'Place an advert',
];

const PARTNERS = [
  { name: 'KBL', logo: '/partners/kbl.png', bg: '#fff', label: 'Kigali Business Lab' },
];
const EMPTY_PARTNER_SLOTS = 5;

const FALLBACK_JOIN_BUTTONS = [
  { label: 'Buyer Registration', href: '/register' },
  { label: 'Supplier Registration', href: '/register' },
  { label: 'Ambassador Portal', href: '/ambassador/register' },
  { label: 'Broker Portal', href: '/broker/register' },
  { label: 'Donate / Support', href: '/donate' },
];

const navy  = '#0f1e42';
const org   = '#E85D04';
const darkOrg = '#c04a00';

export default function HomePage() {
  const { T } = useLanguage();
  const { get } = useSiteContent();
  const { user } = useAuth();
  const [recent, setRecent] = useState<Listing[]>([]);
  const [featured, setFeatured] = useState<Listing[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({ products: 0, properties: 0, vehicles: 0, suppliers: 0 });
  const [joinButtons, setJoinButtons] = useState(FALLBACK_JOIN_BUTTONS);

  useEffect(() => {
    api.get('/listings?limit=4')
      .then(r => setRecent((r.data.listings ?? r.data ?? []).slice(0, 4)))
      .catch(() => {});
    api.get('/listings?featured=1&limit=4')
      .then(r => setFeatured((r.data.listings ?? r.data ?? []).slice(0, 4)))
      .catch(() => {});
    api.get('/auctions?limit=5&sort=ending_soon')
      .then(r => setAuctions((r.data.auctions ?? []).slice(0, 5)))
      .catch(() => {});
    api.get('/stats')
      .then(r => setStats(r.data.stats ?? {}))
      .catch(() => {});
    api.get('/home-buttons/public')
      .then(({ data }) => {
        if (data?.buttons?.length) {
          const seen = new Set();
          const unique = data.buttons.filter((b: { label: string; href: string }) => {
            const k = `${b.label}-${b.href}`;
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
          });
          setJoinButtons(unique);
        }
      })
      .catch(() => {});
  }, []);

  const suppliersLabel: Record<string, string> = { en: 'Suppliers', fr: 'Fournisseurs', rw: 'Abatanga' };

  const STATS = STAT_KEYS.map((key) => ({
    iconKey: key,
    num: `${(stats[key] ?? 0).toLocaleString('en-US')}+`,
  }));

  return (
    <div>
      {/* ── HERO ── */}
      <section
        className="text-white text-center py-10 px-4"
        style={{ background: `linear-gradient(135deg, ${navy} 60%, ${org} 100%)` }}
      >
        <h2 className="text-2xl sm:text-3xl font-semibold mb-2">{get('home.hero_title', T.welcomeTitle)}</h2>
        <p className="text-sm opacity-85 mb-6">{get('home.hero_subtitle', T.welcomeSubtitle)}</p>

        <form
          action="/listings"
          method="GET"
          className="flex flex-col sm:flex-row max-w-xl mx-auto rounded overflow-hidden shadow-2xl"
        >
          <select
            name="category"
            className="px-3 py-3 text-sm border-r border-b sm:border-b-0 border-gray-200 outline-none shrink-0 bg-white"
            style={{ color: '#333', background: '#fff' }}
          >
            <option value="">{T.allCategories}</option>
            <option value="products">{T.products}</option>
            <option value="properties">{T.properties}</option>
            <option value="vehicles">{T.vehicles}</option>
            <option value="services">{T.services}</option>
            <option value="auction">{T.auction}</option>
          </select>
          <div className="flex flex-1 min-w-0">
            <input
              name="search"
              placeholder={get('home.search_placeholder', T.whatLookingFor)}
              className="flex-1 px-4 py-3 text-sm outline-none min-w-0"
              style={{ color: '#333', background: '#fff' }}
            />
            <button
              type="submit"
              className="text-white font-semibold px-6 py-3 text-sm shrink-0 transition hover:opacity-90"
              style={{ background: org }}
            >
              {T.searchArrow}
            </button>
          </div>
        </form>
      </section>

      {/* ── TWO-COLUMN LAYOUT ── */}
      <div
        className="flex gap-4 px-5 py-4"
        style={{ alignItems: 'flex-start' }}
      >
        {/* ────────── SIDEBAR ────────── */}
        <aside className="hidden md:flex flex-col gap-3 shrink-0" style={{ width: 240 }}>

          {/* My Account */}
          <SideCard title={<><List size={14} className="inline" /> {get('home.my_account_title', 'My Account')}</>} titleBg={navy}>
            <SideLink href={user ? '/my-listings' : '/login'}>
              <span className="flex items-center gap-1.5"><User size={13} /> {user ? user.name.split(' ')[0] : `${T.signIn} / ${T.register}`}</span>
              <Chevron />
            </SideLink>
            <SideLink href="/my-listings">
              <span className="flex items-center gap-1.5"><List size={13} /> My Listings</span><Badge>→</Badge>
            </SideLink>
            <SideLink href={user ? '/coins' : '/login'}>
              <span className="flex items-center gap-1.5"><Coins size={13} /> Coin Wallet</span><Badge>{user ? user.coins : '0'}</Badge>
            </SideLink>
            <SideLink href={user ? '/referral' : '/login'}>
              <span className="flex items-center gap-1.5"><Gift size={13} /> Refer &amp; Earn</span><Chevron />
            </SideLink>
          </SideCard>

          {/* Sell */}
          <SideCard title={<><Store size={14} className="inline" /> {get('home.sell_card_title', 'Sell on E-Nyagasambu')}</>} titleBg={navy}>
            {SELL_LINKS.map(label => (
              <SideLink key={label} href="/listings/create">
                <span>{label}</span><Chevron />
              </SideLink>
            ))}
          </SideCard>

          {/* Live Auctions */}
          <SideCard title={<><Gavel size={14} className="inline" /> {get('home.live_auctions_title', 'Live Auctions')}</>} titleBg={darkOrg}>
            <div className="p-3 text-sm">
              <p className="text-xs text-gray-500 mb-2">Ending soon</p>
              {auctions.length === 0 ? (
                <p className="text-xs text-gray-400 py-2">No live auctions right now.</p>
              ) : (
                auctions.map(a => (
                  <AuctionItem key={a.id} href={`/auction/${a.id}`} label={a.title} price={a.current_bid ?? a.price} currency={a.currency} endTime={a.ends_at} />
                ))
              )}
              <Link href="/auction" className="block text-center text-xs font-semibold mt-2 pt-2 border-t border-gray-100 transition hover:opacity-80" style={{ color: darkOrg }}>
                View live auctions →
              </Link>
            </div>
          </SideCard>
        </aside>

        {/* ────────── MAIN CONTENT ────────── */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {STATS.map(({ iconKey, num }) => {
              const Icon = STATS_ICONS[iconKey];
              const label = iconKey === 'suppliers'
                ? (suppliersLabel as Record<string, string>)[T.marketOnline === 'Nyagasambu Market Online' ? 'en' : T.marketOnline === 'Marché en Ligne de Nyagasambu' ? 'fr' : 'rw'] ?? 'Suppliers'
                : T[iconKey as keyof typeof T] as string;
              return (
                <div key={iconKey} className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                  <div className="mb-1 flex justify-center" style={{ color: org }}><Icon size={24} /></div>
                  <div className="text-xl font-semibold" style={{ color: navy }}>{num}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                </div>
              );
            })}
          </div>

          {/* Featured Products */}
          {featured.length > 0 && (
            <section>
              <SectionHeader title={get('home.featured_title', 'Featured Products')} href="/listings" linkLabel="See all →" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {featured.map(l => (
                  <Link key={l.id} href={`/listings/${l.id}`}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-blue-300 transition block group flex flex-col">
                    <div className="aspect-square flex items-center justify-center bg-gray-50 overflow-hidden">
                      {l.primary_image ? (
                        <img src={l.primary_image} alt={l.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div style={{ color: org }}><Package size={40} /></div>
                      )}
                    </div>
                    <div className="p-3 flex flex-col flex-1">
                      <p className="text-sm text-gray-800 mb-1 leading-snug truncate">{l.title}</p>
                      <p className="text-sm font-medium mt-auto" style={{ color: org }}>
                        {l.price != null ? `${Number(l.price).toLocaleString()} ${l.currency || 'RWF'}` : 'On request'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><MapPin size={12} /> {l.location || 'Kigali'}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Recent Listings & Notices */}
          <section>
            <SectionHeader title={get('home.recent_title', 'Recent Listings & Notices')} href="/listings" linkLabel="View all →" />
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {recent.length > 0
                ? recent.map(l => (
                    <Link key={l.id} href={`/listings/${l.id}`}
                      className="flex items-start gap-3 px-3 py-2.5 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition">
                      <NoticeTag auction={l.type === 'auction'}>{l.type || l.category}</NoticeTag>
                      <div>
                        <p className="text-sm text-gray-800 leading-snug">{l.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(l.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </Link>
                  ))
                : FALLBACK_NOTICES.map(({ tag, auction, text, date }) => (
                    <div key={text} className="flex items-start gap-3 px-3 py-2.5 border-b border-gray-100 last:border-b-0">
                      <NoticeTag auction={auction}>{tag}</NoticeTag>
                      <div>
                        <p className="text-sm text-gray-800 leading-snug">{text}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{date}</p>
                      </div>
                    </div>
                  ))
              }
            </div>
          </section>

          {/* Join E-Nyagasambu — Buyer / Seller CTA */}
          <section className="bg-white border border-gray-200 rounded-lg p-4">
            <SectionHeader title={get('home.join_title', 'Join E-Nyagasambu')} />
            <p className="text-sm text-gray-500 mb-3">
              {get('home.join_desc', 'Register as a buyer, seller, broker or ambassador and grow your business digitally.')}
            </p>
            <div className="flex gap-2 flex-wrap">
              {joinButtons.map((b) => (
                <RegBtn key={`${b.label}-${b.href}`} href={b.href} primary>{(b.label).replace(/→\s*$/, '').trim()} →</RegBtn>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* ── PARTNERS BAR ── */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-3 text-center">{get('home.partners_title', 'Our Partners')}</p>
        <div className="flex flex-wrap justify-center items-center gap-6">
          {PARTNERS.map(p => (
            <div key={p.name} className="flex flex-col items-center gap-1 group">
              <div className="rounded-lg overflow-hidden flex items-center justify-center border border-gray-100 transition group-hover:shadow-md"
                style={{ width: 90, height: 48, background: p.bg, padding: 6 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.logo} alt={p.label} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              </div>
              <span className="text-[10px] text-gray-400 font-medium">{p.label}</span>
            </div>
          ))}
          {Array.from({ length: EMPTY_PARTNER_SLOTS }).map((_, i) => (
            <div key={`slot-${i}`} className="flex flex-col items-center gap-1">
              <div className="rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center"
                style={{ width: 90, height: 48 }}>
                <span className="text-[10px] text-gray-300 font-medium">Partner</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── small helper components ─── */

function SideCard({ title, titleBg, children }: { title: React.ReactNode; titleBg: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="text-white text-xs font-medium px-3 py-2" style={{ background: titleBg }}>{title}</div>
      {children}
    </div>
  );
}

function SideLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href}
      className="flex items-center justify-between px-3 py-2 text-xs text-gray-700 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition"
      style={{ '--hover-color': org } as React.CSSProperties}
      onMouseEnter={e => (e.currentTarget.style.color = org)}
      onMouseLeave={e => (e.currentTarget.style.color = '')}>
      {children}
    </Link>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: '#f0f2fa', color: navy }}>{children}</span>
  );
}

function Chevron() {
  return <span className="text-gray-400 text-xs">›</span>;
}

function AuctionItem({ href, label, price, currency, endTime }: { href: string; label: string; price: number | null; currency: string; endTime: string }) {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const tick = () => {
      const diff = new Date(endTime).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('Ended'); return; }
      const s = Math.floor(diff / 1000);
      const d = Math.floor(s / 86400);
      const h = Math.floor((s % 86400) / 3600);
      const m = Math.floor((s % 3600) / 60);
      const sec = s % 60;
      setTimeLeft(d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${sec}s` : `${sec}s`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [endTime]);

  return (
    <Link href={href} className="block mb-3 last:mb-0 hover:opacity-80 transition">
      <p className="text-gray-800 mb-0.5 line-clamp-1">{label}</p>
      <div className="flex justify-between text-xs">
        <span className="font-medium" style={{ color: org }}>Current: {(price ?? 0).toLocaleString('en-US')} {currency}</span>
        <span className="text-gray-500">{timeLeft}</span>
      </div>
    </Link>
  );
}

function SectionHeader({ title, href, linkLabel }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="flex justify-between items-center mb-2">
      <span className="text-sm font-medium border-l-[3px] pl-2.5" style={{ color: navy, borderColor: org }}>{title}</span>
      {href && linkLabel && (
        <Link href={href} className="text-xs hover:underline" style={{ color: org }}>{linkLabel}</Link>
      )}
    </div>
  );
}

function NoticeTag({ children, auction }: { children: React.ReactNode; auction: boolean }) {
  return (
    <span
      className="text-[10px] font-medium px-2 py-0.5 rounded mt-0.5 whitespace-nowrap capitalize shrink-0"
      style={{
        background: auction ? '#fff3e8' : '#e8edf7',
        color:      auction ? darkOrg   : navy,
      }}
    >
      {children}
    </span>
  );
}

function RegBtn({ href, primary, children }: { href: string; primary: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-xs font-medium px-4 py-2 rounded transition hover:opacity-90"
      style={
        primary
          ? { background: org,  color: '#fff',  border: `1px solid ${org}` }
          : { background: 'transparent', color: navy, border: `1px solid #6a7dbf` }
      }
    >
      {children}
    </Link>
  );
}
