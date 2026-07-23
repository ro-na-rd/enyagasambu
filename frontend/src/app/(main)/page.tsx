'use client';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Package, Building2, Car, Users, Smartphone, List, Store, Gavel, User, Coins, Gift, Star, MapPin } from '@/lib/icons';

interface Listing {
  id: number;
  title: string;
  price: number | null;
  price_type: string;
  category: string;
  location: string;
  type: string;
  created_at: string;
}

const STATS_ICONS: Record<string, React.FC<{ size?: number }>> = {
  products: Package,
  properties: Building2,
  vehicles: Car,
  suppliers: Users,
};
const STATS = [
  { iconKey: 'products', num: '2,480+' },
  { iconKey: 'properties', num: '340+' },
  { iconKey: 'vehicles', num: '185+' },
  { iconKey: 'suppliers', num: '1,200+' },
] as const;

const FEATURED_ICONS: Record<string, React.FC<{ size?: number }>> = {
  phone: Smartphone,
  motorcycle: Car,
  grain: Package,
};
const FEATURED = [
  { iconKey: 'phone', name: 'Samsung Galaxy A54 – 256GB',   price: '185,000 RWF',   loc: 'Kigali, Gasabo' },
  { iconKey: 'motorcycle', name: 'Electric motorcycle – 2023',    price: '1,200,000 RWF', loc: 'Musanze' },
  { iconKey: 'grain', name: 'Maize grain – 50 kg bag',       price: '18,500 RWF',    loc: 'Rwamagana' },
];

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
  { name: 'RDB',       logo: '/partners/rdb.jpg',       bg: '#fff' },
  { name: 'BNR',       logo: '/partners/bnr.jpg',       bg: '#fff' },
  { name: 'RRA',       logo: '/partners/rra.png',       bg: '#fff' },
  { name: 'MINECOFIN', logo: '/partners/minecofin.svg', bg: '#f0f4f8' },
  { name: 'RSSB',      logo: '/partners/rssb.jpg',      bg: '#fff' },
  { name: 'RPPA',      logo: '/partners/rppa.jpg',      bg: '#fff' },
];

const navy  = '#0f1e42';
const org   = '#E85D04';
const darkOrg = '#c04a00';

export default function HomePage() {
  const { T } = useLanguage();
  const { user } = useAuth();
  const [recent, setRecent] = useState<Listing[]>([]);

  useEffect(() => {
    api.get('/listings?limit=4')
      .then(r => setRecent((r.data.listings ?? r.data ?? []).slice(0, 4)))
      .catch(() => {});
  }, []);

  const suppliersLabel: Record<string, string> = { en: 'Suppliers', fr: 'Fournisseurs', rw: 'Abatanga' };

  return (
    <div>
      {/* ── HERO ── */}
      <section
        className="text-white text-center py-10 px-4"
        style={{ background: `linear-gradient(135deg, ${navy} 60%, ${org} 100%)` }}
      >
        <h2 className="text-2xl sm:text-3xl font-semibold mb-2">{T.welcomeTitle}</h2>
        <p className="text-sm opacity-85 mb-6">{T.welcomeSubtitle}</p>

        <form
          action="/listings"
          method="GET"
          className="flex max-w-xl mx-auto rounded overflow-hidden shadow-2xl"
        >
          <select
            name="category"
            className="px-3 py-3 text-sm border-r border-gray-200 outline-none shrink-0"
            style={{ color: '#333', background: '#fff' }}
          >
            <option value="">{T.allCategories}</option>
            <option value="products">{T.products}</option>
            <option value="properties">{T.properties}</option>
            <option value="vehicles">{T.vehicles}</option>
            <option value="services">{T.services}</option>
            <option value="auction">{T.auction}</option>
          </select>
          <input
            name="search"
            placeholder={T.whatLookingFor}
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
          <SideCard title={<><List size={14} className="inline" /> My Account</>} titleBg={navy}>
            <SideLink href={user ? '/dashboard' : '/login'}>
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
          <SideCard title={<><Store size={14} className="inline" /> Sell on E-Nyagasambu</>} titleBg={navy}>
            {SELL_LINKS.map(label => (
              <SideLink key={label} href="/listings/create">
                <span>{label}</span><Chevron />
              </SideLink>
            ))}
          </SideCard>

          {/* Live Auctions */}
          <SideCard title={<><Gavel size={14} className="inline" /> Live Auctions</>} titleBg={darkOrg}>
            <div className="p-3 text-sm">
              <p className="text-xs text-gray-500 mb-2">Ending soon</p>
              <AuctionItem label="Toyota Land Cruiser 2018" price="45,000 RWF" time="2h 14m" />
              <AuctionItem label="Commercial Plot – Musanze"  price="12M RWF"    time="5h 30m" />
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
          <section>
            <SectionHeader title="Featured Products" href="/listings" linkLabel="See all →" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {FEATURED.map(({ iconKey, name, price, loc }) => {
                const Icon = FEATURED_ICONS[iconKey];
                return (
                <Link key={name} href="/listings"
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-blue-300 transition block">
                  <div className="h-28 flex items-center justify-center bg-gray-50" style={{ color: org }}><Icon size={40} /></div>
                  <div className="p-2.5">
                    <p className="text-sm text-gray-800 mb-1 leading-snug">{name}</p>
                    <p className="text-sm font-medium" style={{ color: org }}>{price}</p>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><MapPin size={12} /> {loc}</p>
                  </div>
                </Link>
              );
              })}
            </div>
          </section>

          {/* Recent Listings & Notices */}
          <section>
            <SectionHeader title="Recent Listings & Notices" href="/listings" linkLabel="View all →" />
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
            <SectionHeader title="Join E-Nyagasambu" />
            <p className="text-sm text-gray-500 mb-3">
              Register as a buyer, seller, broker or ambassador and grow your business digitally.
            </p>
            <div className="flex gap-2 flex-wrap">
              <RegBtn href="/register" primary>Buyer Registration →</RegBtn>
              <RegBtn href="/register" primary>Supplier Registration →</RegBtn>
              <RegBtn href="/ambassador/register" primary>Ambassador Portal →</RegBtn>
              <RegBtn href="/broker/register" primary>Broker Portal →</RegBtn>
              <RegBtn href="/coins"    primary>Donate / Support →</RegBtn>
            </div>
          </section>
        </div>
      </div>

      {/* ── PARTNERS BAR ── */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-3 text-center">Our Partners</p>
        <div className="flex flex-wrap justify-center items-center gap-6">
          {PARTNERS.map(p => (
            <div key={p.name} className="flex flex-col items-center gap-1 group">
              <div className="rounded-lg overflow-hidden flex items-center justify-center border border-gray-100 transition group-hover:shadow-md"
                style={{ width: 90, height: 48, background: p.bg, padding: 6 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.logo} alt={p.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              </div>
              <span className="text-[10px] text-gray-400 font-medium">{p.name}</span>
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

function AuctionItem({ label, price, time }: { label: string; price: string; time: string }) {
  return (
    <div className="mb-3 last:mb-0">
      <p className="text-gray-800 mb-0.5">{label}</p>
      <div className="flex justify-between text-xs">
        <span className="font-medium" style={{ color: org }}>Current: {price}</span>
        <span className="text-gray-500">{time}</span>
      </div>
    </div>
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
