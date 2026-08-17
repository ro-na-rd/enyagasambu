'use client';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useCurrency } from '@/context/CurrencyContext';
import { Suspense, useState } from 'react';
import type { Lang } from '@/lib/translations';
import { Search, UserPlus, Star, Heart, Menu, X, Coins, List, Gift, Wrench, LogOut, Home } from '@/lib/icons';
import { categoryMap } from '@/lib/translations';

const navy = '#0f1e42';
const org = '#E85D04';

function catLabel(slug: string, lang: 'en' | 'fr' | 'rw') {
  return categoryMap[slug]?.[lang] ?? categoryMap[slug]?.en ?? slug;
}

export default function Navbar() {
  return (
    <Suspense fallback={<NavbarView pathname={null} tab={null} />}>
      <NavbarInner />
    </Suspense>
  );
}

function NavbarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return <NavbarView pathname={pathname} tab={searchParams.get('tab') || ''} />;
}

function SearchForm({ placeholder, onDone }: { placeholder: string; onDone?: () => void }) {
  return (
    <form action="/listings" method="GET" onSubmit={onDone}
      className="flex items-center overflow-hidden w-full"
      style={{ border: `2px solid ${navy}`, borderRadius: 4 }}>
      <input
        name="search"
        placeholder={placeholder}
        className="flex-1 px-3 py-1.5 text-sm outline-none min-w-0"
        style={{ background: '#fff', color: '#333', border: 'none' }}
      />
      <button
        type="submit"
        className="flex items-center justify-center px-3 py-2 shrink-0"
        style={{ background: navy, border: 'none', cursor: 'pointer' }}
      >
        <Search size={16} color="#fff" strokeWidth={2.5} />
      </button>
    </form>
  );
}

function NavbarView({ pathname, tab }: { pathname: string | null; tab: string | null }) {
  const { user, logout } = useAuth();
  const { lang, setLang, T } = useLanguage();
  const { currency, setCurrency, currencies } = useCurrency();
  const [menuOpen, setMenuOpen] = useState(false);
  const [catsOpen, setCatsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [prefOpen, setPrefOpen] = useState(false);
  const close = () => setMenuOpen(false);
  const closeMobile = () => setMobileOpen(false);

  const activeKey = pathname === '/' ? 'home' : pathname === '/listings' ? (tab === '' ? 'products' : tab) : pathname === '/auction' ? 'auction' : null;
  const isListings = pathname === '/listings';

  const NAV_LINKS = [
    { key: 'home', href: '/', label: T.home, icon: <Home size={16} /> },
    { key: 'products', href: '/listings?tab=products', label: T.products },
    { key: 'properties', href: '/listings?tab=properties', label: T.properties },
    { key: 'rent', href: '/listings?tab=rent', label: T.rent },
    { key: 'vehicles', href: '/listings?tab=vehicles', label: T.vehicles },
    { key: 'services', href: '/listings?tab=services', label: T.services },
    { key: 'auction', href: '/auction', label: T.auction },
    { key: 'adverts', href: '/listings?tab=adverts', label: T.adverts },
  ];

  const CAT_LINKS: { label: string; href: string; disabled?: boolean }[] = [
    { label: T.allCategories, href: '/listings' },
    { label: T.electronics, href: '/listings?category=electronics' },
    { label: catLabel('food-beverage', lang), href: '/listings?category=food-beverage' },
    { label: T.clothing, href: '/listings?category=clothing' },
    { label: T.construction, href: '/listings?category=construction' },
    { label: T.health, href: '/listings?category=health' },
    { label: T.education, href: '/listings?category=education' },
    { label: catLabel('farmer-product', lang), href: '/listings?category=farmer-product' },
    { label: catLabel('supply-chain', lang), href: '/listings?category=supply-chain' },
  ];

  return (
    <>
      {/* ── TOP BAR ── */}
      <div className="text-white text-xs px-3 sm:px-5 py-1.5 flex items-center gap-3 sm:gap-4 flex-wrap relative z-[60]" style={{ background: navy }}>
        <span className="mr-auto hidden sm:inline" style={{ opacity: 0.75, fontSize: 12 }}>{T.marketOnline}</span>
        <Link href="/support" className="transition" style={{ color: '#cdd4f0' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={e => (e.currentTarget.style.color = '#cdd4f0')}>
          {T.support}
        </Link>
        <Link href="/about" className="transition" style={{ color: '#cdd4f0' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={e => (e.currentTarget.style.color = '#cdd4f0')}>
          {T.about}
        </Link>
        {user
          ? <span className="hidden sm:inline" style={{ color: 'rgba(255,255,255,0.7)' }}>{user.name.split(' ')[0]}</span>
          : <Link href="/login" className="transition" style={{ color: '#cdd4f0' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = '#cdd4f0')}>
            {T.signIn}
          </Link>
        }

        {/* Language & Currency selector */}
        <div className="relative">
          <button
            onClick={() => setPrefOpen(!prefOpen)}
            className="transition text-[11px] font-semibold cursor-pointer flex items-center gap-1.5"
            style={{
              border: '1px solid rgba(205, 212, 240, 0.5)',
              background: prefOpen ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.1)',
              color: prefOpen ? navy : '#cdd4f0',
              padding: '4px 10px',
              borderRadius: 6,
              backdropFilter: prefOpen ? 'blur(10px)' : 'none',
              boxShadow: prefOpen ? '0 4px 12px rgba(0, 0, 0, 0.15)' : 'none',
            }}
            onMouseEnter={e => {
              if (!prefOpen) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(205, 212, 240, 0.8)';
              }
            }}
            onMouseLeave={e => {
              if (!prefOpen) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(205, 212, 240, 0.5)';
              }
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700 }}>{lang.toUpperCase()}</span>
            <span style={{ opacity: 0.6, fontSize: 8 }}>•</span>
            <span style={{ fontSize: 12, fontWeight: 700 }}>{currency}</span>
            <span style={{ fontSize: 8, marginLeft: 2, transition: 'transform 0.2s', transform: prefOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
          </button>
          {prefOpen && (
            <div
              className="absolute right-0 top-full mt-2 z-[100] bg-white rounded-xl shadow-2xl border border-gray-100 py-3 min-w-[180px]"
              style={{
                animation: 'fadeIn 0.2s ease-out',
                backdropFilter: 'blur(20px)',
              }}
              onMouseLeave={() => setPrefOpen(false)}
            >
              <style jsx>{`
                @keyframes fadeIn {
                  from { opacity: 0; transform: translateY(-8px); }
                  to { opacity: 1; transform: translateY(0); }
                }
              `}</style>

              <p className="px-4 pb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100">Language</p>
              <div className="flex gap-2 px-4 py-3">
                {(['en', 'fr', 'rw'] as Lang[]).map(code => (
                  <button
                    key={code}
                    onClick={() => setLang(code)}
                    className="transition text-[11px] font-semibold cursor-pointer px-3 py-1.5 rounded-lg flex-1"
                    style={{
                      border: `1.5px solid ${lang === code ? navy : '#e5e7eb'}`,
                      background: lang === code ? navy : '#f9fafb',
                      color: lang === code ? '#fff' : '#374151',
                      boxShadow: lang === code ? '0 2px 8px rgba(15, 30, 66, 0.3)' : 'none',
                    }}
                    onMouseEnter={e => {
                      if (lang !== code) {
                        e.currentTarget.style.background = '#f3f4f6';
                        e.currentTarget.style.borderColor = '#d1d5db';
                      }
                    }}
                    onMouseLeave={e => {
                      if (lang !== code) {
                        e.currentTarget.style.background = '#f9fafb';
                        e.currentTarget.style.borderColor = '#e5e7eb';
                      }
                    }}
                  >
                    {code.toUpperCase()}
                  </button>
                ))}
              </div>

              <p className="px-4 pb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100 mt-2">Currency</p>
              <div className="py-2">
                {currencies.map(c => (
                  <button
                    key={c.code}
                    onClick={() => { setCurrency(c.code); setPrefOpen(false); }}
                    className="w-full text-left px-4 py-2 text-xs transition flex items-center justify-between group"
                    style={{
                      color: currency === c.code ? '#E85D04' : '#374151',
                      background: currency === c.code ? 'rgba(232, 93, 4, 0.05)' : 'transparent',
                    }}
                    onMouseEnter={e => {
                      if (currency !== c.code) {
                        e.currentTarget.style.background = '#f9fafb';
                      }
                    }}
                    onMouseLeave={e => {
                      if (currency !== c.code) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        background: currency === c.code ? 'rgba(232, 93, 4, 0.1)' : '#f3f4f6',
                        padding: '2px 6px',
                        borderRadius: 4,
                        color: currency === c.code ? '#E85D04' : '#6b7280'
                      }}>
                        {c.code}
                      </span>
                      <span className="font-medium">{c.name}</span>
                    </span>
                    {currency === c.code && (
                      <span style={{ color: '#E85D04', fontSize: 10 }}>✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MAIN HEADER — white bg + orange bottom border ── */}
      <div
        className="bg-white px-3 sm:px-5 py-2.5 flex items-center justify-between gap-2"
        style={{ borderBottom: `2px solid ${org}` }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
          <img src="/assets/logo.png" alt="E-Nyagasambu" className="w-11 h-11 object-contain shrink-0" />
          <div className="min-w-0">
            <h1 className="font-medium text-lg sm:text-xl leading-tight truncate" style={{ color: navy }}>
              <span style={{ color: org }}>E</span>-Nyagasambu
            </h1>
            <p className="font-bold uppercase hidden sm:block" style={{ fontSize: 10, color: org, letterSpacing: '2px' }}>
              {T.digitalMarketPlace}
            </p>
          </div>
        </Link>

        {/* Header right: search + links */}
        <div className="flex items-center gap-2 sm:gap-3 md:flex-col md:items-end">
          {/* Search bar — desktop only; mobile search lives in the hamburger menu */}
          <div className="hidden md:flex w-full" style={{ maxWidth: 360 }}>
            <SearchForm placeholder={T.searchPlaceholder} />
          </div>

          {/* Header links row */}
          <div className="flex items-center gap-2 sm:gap-3" style={{ fontSize: 12 }}>
            <Link href="/supplier/register" className="hidden lg:flex items-center gap-1 transition hover:opacity-70" style={{ color: navy, textDecoration: 'none' }}>
              <UserPlus size={13} />
              {T.supplierRegistration}
            </Link>
            <Link href="/ambassador/register" className="hidden lg:flex items-center gap-1 transition hover:opacity-70" style={{ color: navy, textDecoration: 'none' }}>
              <Star size={13} />
              {T.ambassadorRegistration}
            </Link>
            <Link href="/donate" className="hidden lg:flex items-center gap-1 transition hover:opacity-70" style={{ color: navy, textDecoration: 'none' }}>
              <Heart size={13} />
              {T.donate}
            </Link>

            {/* Post to sell — always visible */}
            <Link href="/listings/create"
              className="text-white text-xs font-semibold px-3 sm:px-4 py-1.5 rounded transition hover:opacity-90 whitespace-nowrap"
              style={{ background: org }}>
              {T.navPosting}
            </Link>

            {/* My Listings */}
            <Link href="/my-listings"
              className="hidden sm:flex text-xs font-semibold px-3 sm:px-4 py-1.5 rounded transition hover:opacity-80 whitespace-nowrap"
              style={{ color: navy, border: `1px solid ${navy}`, textDecoration: 'none' }}>
              {T.myListings}
            </Link>

            {/* Auth controls (logged in) */}
            {user && (
              <div className="flex items-center gap-2 ml-0.5 pl-2" style={{ borderLeft: '1px solid #ddd' }}>
                <Link href="/coins"
                  className="text-xs px-2 py-1 rounded flex items-center gap-1 whitespace-nowrap"
                  style={{ background: '#0f1e42', color: '#fff' }}>
                  <Coins size={13} /> {user.coins}
                </Link>
                <div className="relative">
                  <button onClick={() => setMenuOpen(!menuOpen)}
                    className="text-sm font-medium flex items-center gap-1 cursor-pointer transition hover:opacity-70"
                    style={{ color: navy, background: 'none', border: 'none', padding: 0, font: 'inherit' }}>
                    {user.name.split(' ')[0]} <span style={{ fontSize: 9 }}>▾</span>
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 mt-2 bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100 z-30" style={{ width: 220, maxWidth: 'calc(100vw - 24px)' }}>
                      <Link href="/my-listings" className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold hover:bg-gray-50 border-b" style={{ color: navy }} onClick={close}><List size={15} /> {T.myListings}</Link>
                      <Link href="/coins" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 text-gray-800" onClick={close}><Coins size={15} /> {T.coinsWallet}</Link>
                      <Link href="/subscriptions" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 text-gray-800" onClick={close}><Star size={15} /> {T.sellerPlans}</Link>
                      <Link href="/referral" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 text-gray-800" onClick={close}><Gift size={15} /> {T.referEarn}</Link>
                      {(user.role === 'admin' || user.role === 'staff') && (
                        <Link href="/staff" className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold hover:bg-gray-50 border-t" style={{ color: navy }} onClick={close}>
                          <Wrench size={15} /> {T.staffDashboard}
                        </Link>
                      )}
                      <button onClick={() => { logout(); close(); }}
                        className="w-full flex items-center gap-2 text-left px-4 py-2.5 text-sm text-red-600 hover:bg-gray-50 border-t">
                        {T.signOut}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileOpen(o => !o)}
              className="md:hidden flex items-center justify-center cursor-pointer transition hover:opacity-70"
              aria-label="Menu"
              style={{ background: 'none', border: 'none', color: navy, padding: '4px' }}
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── MOBILE MENU ── */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 shadow-lg max-h-[calc(100vh-120px)] overflow-y-auto">
          <div className="px-4 py-3 space-y-4">
            <SearchForm placeholder={T.searchPlaceholder} onDone={closeMobile} />

            {/* Nav links */}
            <nav className="flex flex-col">
              {NAV_LINKS.map(({ key, href, label, icon }) => (
                <Link key={key} href={href} onClick={closeMobile}
                  className="py-2.5 text-sm flex items-center justify-between"
                  style={{ color: key === activeKey ? org : navy, fontWeight: key === activeKey ? 700 : 500, textDecoration: 'none' }}>
                  <span className="flex items-center gap-2">{icon}{label}</span>
                  {key === 'adverts' && <span style={{ fontSize: 9 }}>▾</span>}
                </Link>
              ))}
            </nav>

            {/* Adverts categories */}
            <div className="pt-3 border-t border-gray-100">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">{T.allCategories}</p>
              <div className="flex flex-wrap gap-1.5">
                {CAT_LINKS.map(({ label, href, disabled }) => (
                  disabled ? (
                    <span key={label} className="text-xs px-2.5 py-1 rounded border border-gray-200 text-gray-300 cursor-not-allowed">
                      {label}
                    </span>
                  ) : (
                    <Link key={label} href={href} onClick={closeMobile}
                      className="text-xs px-2.5 py-1 rounded border transition"
                      style={{ borderColor: org, color: org, textDecoration: 'none' }}>
                      {label}
                    </Link>
                  )
                ))}
              </div>
            </div>

            {/* Quick links */}
            <div className="flex flex-col gap-1 pt-3 border-t border-gray-100">
              <Link href="/supplier/register" onClick={closeMobile} className="py-1.5 text-sm" style={{ color: navy, textDecoration: 'none' }}>
                <UserPlus size={13} className="inline mr-1" style={{ verticalAlign: '-2px' }} /> {T.supplierRegistration}
              </Link>
              <Link href="/ambassador/register" onClick={closeMobile} className="py-1.5 text-sm" style={{ color: navy, textDecoration: 'none' }}>
                <Star size={13} className="inline mr-1" style={{ verticalAlign: '-2px' }} /> {T.ambassadorRegistration}
              </Link>
              <Link href="/donate" onClick={closeMobile} className="py-1.5 text-sm" style={{ color: navy, textDecoration: 'none' }}>
                <Heart size={13} className="inline mr-1" style={{ verticalAlign: '-2px' }} /> {T.donate}
              </Link>
              <Link href="/my-listings" onClick={closeMobile} className="py-1.5 text-sm" style={{ color: navy, textDecoration: 'none' }}>
                <List size={13} className="inline mr-1" style={{ verticalAlign: '-2px' }} /> {T.myListings}
              </Link>
              <Link href="/broker/register" onClick={closeMobile} className="py-1.5 text-sm" style={{ color: navy, textDecoration: 'none' }}>
                {T.brokerPortal}
              </Link>
              <Link href="/listings" onClick={closeMobile} className="py-1.5 text-sm" style={{ color: navy, textDecoration: 'none' }}>
                {T.allSuppliers}
              </Link>
            </div>

            {/* Auth + language */}
            <div className="flex flex-col gap-3 pt-3 border-t border-gray-100">
              {user ? (
                <button onClick={() => { logout(); closeMobile(); }}
                  className="flex items-center gap-2 text-sm text-red-600 cursor-pointer" style={{ background: 'none', border: 'none', font: 'inherit' }}>
                  <LogOut size={15} /> {T.signOut}
                </button>
              ) : (
                <Link href="/login" onClick={closeMobile} className="text-sm font-semibold" style={{ color: org, textDecoration: 'none' }}>
                  {T.signIn}
                </Link>
              )}

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Language</p>
                <div className="flex gap-2">
                  {(['en', 'fr', 'rw'] as Lang[]).map(code => (
                    <button key={code} onClick={() => setLang(code)}
                      className="transition text-[11px] font-semibold cursor-pointer px-3 py-1.5 rounded-lg flex-1"
                      style={{
                        border: `1.5px solid ${lang === code ? navy : '#e5e7eb'}`,
                        background: lang === code ? navy : '#f9fafb',
                        color: lang === code ? '#fff' : '#374151',
                        boxShadow: lang === code ? '0 2px 8px rgba(15, 30, 66, 0.3)' : 'none',
                      }}>
                      {code.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Currency</p>
                <div className="flex flex-col gap-1">
                  {currencies.map(c => (
                    <button
                      key={c.code}
                      onClick={() => setCurrency(c.code)}
                      className="w-full text-left px-3 py-2 text-xs rounded-lg transition flex items-center justify-between"
                      style={{
                        border: `1px solid ${currency === c.code ? '#E85D04' : '#e5e7eb'}`,
                        background: currency === c.code ? 'rgba(232, 93, 4, 0.05)' : '#fff',
                        color: currency === c.code ? '#E85D04' : '#374151',
                      }}
                      onMouseEnter={e => {
                        if (currency !== c.code) {
                          e.currentTarget.style.background = '#f9fafb';
                        }
                      }}
                      onMouseLeave={e => {
                        if (currency !== c.code) {
                          e.currentTarget.style.background = '#fff';
                        }
                      }}
                    >
                      <span className="flex items-center gap-2">
                        <span style={{
                          fontSize: 10,
                          fontWeight: 700,
                          background: currency === c.code ? 'rgba(232, 93, 4, 0.1)' : '#f3f4f6',
                          padding: '2px 5px',
                          borderRadius: 3,
                          color: currency === c.code ? '#E85D04' : '#6b7280'
                        }}>
                          {c.code}
                        </span>
                        <span className="font-medium">{c.name}</span>
                      </span>
                      {currency === c.code && (
                        <span style={{ color: '#E85D04', fontSize: 10 }}>✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN NAV (desktop) ── */}
      <nav className="hidden md:flex px-5 items-center justify-between sticky top-0 z-40" style={{ background: navy }}>
        <div className="flex">
          {NAV_LINKS.map(({ key, href, label, icon }) => {
            const isActive = key === activeKey;
            if (key === 'adverts') {
              return (
                <div
                  key={key}
                  className="relative"
                  onMouseEnter={() => setCatsOpen(true)}
                  onMouseLeave={() => setCatsOpen(false)}
                >
                  <Link
                    href={href}
                    className="text-sm px-4 py-3 transition block flex items-center gap-1"
                    style={{
                      color: '#cdd4f0',
                      borderBottom: (isActive || catsOpen) ? `3px solid ${org}` : '3px solid transparent',
                      textDecoration: 'none',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.color = '#fff';
                      e.currentTarget.style.borderBottomColor = org;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.color = '#cdd4f0';
                      e.currentTarget.style.borderBottomColor = (isActive || catsOpen) ? org : 'transparent';
                    }}
                    onClick={() => setCatsOpen(o => !o)}
                  >
                    {label} <span style={{ fontSize: 9 }}>▾</span>
                  </Link>
                  {catsOpen && (
                    <div className="absolute left-0 top-full bg-white rounded-b-lg shadow-2xl border border-gray-100 z-30 py-2 min-w-56 max-h-[calc(100vh-80px)] overflow-y-auto">
                      {CAT_LINKS.map(({ label: cLabel, href: cHref, disabled }) => (
                        disabled ? (
                          <span
                            key={cLabel}
                            className="block px-4 py-2 text-sm text-gray-400 cursor-not-allowed"
                            title="Coming soon"
                          >
                            {cLabel}
                          </span>
                        ) : (
                          <Link
                            key={cLabel}
                            href={cHref}
                            className="block px-4 py-2 text-sm text-gray-700 transition"
                            style={{ textDecoration: 'none' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#fff4ec'; e.currentTarget.style.color = org; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#374151'; }}
                            onClick={() => setCatsOpen(false)}
                          >
                            {cLabel}
                          </Link>
                        )
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <Link
                key={key}
                href={href}
                className="text-sm px-4 py-3 transition block flex items-center gap-1.5"
                style={{
                  color: '#cdd4f0',
                  borderBottom: isActive ? `3px solid ${org}` : '3px solid transparent',
                  textDecoration: 'none',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = '#fff';
                  e.currentTarget.style.borderBottomColor = org;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = '#cdd4f0';
                  e.currentTarget.style.borderBottomColor = isActive ? org : 'transparent';
                }}
              >
                {icon}
                {label}
              </Link>
            );
          })}
        </div>
        <div className="flex items-center gap-5 shrink-0">
          <Link href="/broker/register" className="text-sm py-3 transition" style={{ color: '#cdd4f0', textDecoration: 'none' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = '#cdd4f0')}>
            {T.brokerPortal}
          </Link>
          <Link href="/listings" className="text-sm py-3 transition" style={{ color: '#cdd4f0', textDecoration: 'none' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = '#cdd4f0')}>
            {T.allSuppliers}
          </Link>
        </div>
      </nav>

      {/* ── CATEGORY PILLS (desktop) ── */}
      {!isListings && (
        <div className="hidden md:flex px-5 py-1.5 gap-2 flex-wrap sticky z-40" style={{ background: '#0f1e42', borderTop: '1px solid rgba(255,255,255,0.25)', top: 44 }}>
          {CAT_LINKS.map(({ label, href, disabled }, i) => (
            disabled ? (
              <span
                key={label}
                className="text-xs font-medium"
                title="Coming soon"
                style={{
                  padding: '5px 14px', borderRadius: 3,
                  border: '1px solid #4a5580',
                  background: 'transparent',
                  color: '#6a7090',
                  cursor: 'not-allowed',
                  opacity: 0.55,
                }}
              >
                {label}
              </span>
            ) : (
              <Link
                key={label}
                href={href}
                className="text-xs font-medium transition"
                style={{
                  padding: '5px 14px',
                  borderRadius: 3,
                  border: `1px solid ${i === 0 ? org : '#6a7dbf'}`,
                  background: i === 0 ? org : 'transparent',
                  color: i === 0 ? '#fff' : '#c5cce8',
                  textDecoration: 'none',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = i === 0 ? org : 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = i === 0 ? org : 'transparent'; e.currentTarget.style.color = i === 0 ? '#fff' : '#c5cce8'; }}
              >
                {label}
              </Link>
            )
          ))}
        </div>
      )}
    </>
  );
}
