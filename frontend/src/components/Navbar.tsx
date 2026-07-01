'use client';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useState } from 'react';
import type { Lang } from '@/lib/translations';

const navy = '#1B2A5E';
const org  = '#E85D04';

function ReadMeModal({ onClose }: { onClose: () => void }) {
  const { T } = useLanguage();
  return (
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-8 relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-5 text-2xl text-gray-400 hover:text-gray-700">&times;</button>
        <div className="flex items-center gap-3 mb-5 pb-4 border-b">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-xl" style={{ background: navy }}>E</div>
          <div>
            <p className="font-extrabold text-lg leading-tight" style={{ color: navy }}>E-Nyagasambu</p>
            <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: org }}>Digital Market Place</p>
          </div>
        </div>
        <h3 className="font-bold text-sm mb-1" style={{ color: org }}>About E-Nyagasambu</h3>
        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
          E-Nyagasambu is Rwanda's digital marketplace platform connecting buyers, sellers, brokers
          and ambassadors across all sectors — products, properties, vehicles, services and auctions.
        </p>

        <h3 className="font-bold text-sm mb-1" style={{ color: org }}>How It Works</h3>
        <ol className="text-sm text-gray-600 mb-4 list-decimal pl-5 space-y-1 leading-relaxed">
          <li><strong>Register</strong> — create a free account and receive 100 starter coins.</li>
          <li><strong>Top up Coins</strong> — buy coins via MTN MoMo or Airtel Money to unlock features.</li>
          <li><strong>Post a Listing</strong> — costs 400 coins; add title, description, category, price, location and up to 6 photos.</li>
          <li><strong>Browse &amp; Search</strong> — filter by category, location or keyword. Listings show public info (title, price, location, photos).</li>
          <li><strong>Reveal Seller Contact</strong> — costs 300 coins + OTP phone verification to protect both parties.</li>
          <li><strong>Boost a Listing</strong> — spend 200 coins to feature your listing for 7 days (appears at the top).</li>
          <li><strong>Refer &amp; Earn</strong> — share your referral code; earn coins every time someone signs up with it.</li>
          <li><strong>Seller Plans</strong> — subscribe for a monthly plan to reduce per-listing coin cost.</li>
          <li><strong>Auction</strong> — submit items for timed public auction; bidders compete until the timer ends.</li>
        </ol>

        <h3 className="font-bold text-sm mb-1" style={{ color: org }}>Storage</h3>
        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
          Listing images are uploaded to the backend server and stored in the <code className="bg-gray-100 px-1 rounded">backend/uploads/</code> folder,
          organized by listing ID. The frontend fetches images via <code className="bg-gray-100 px-1 rounded">/uploads/&lt;filename&gt;</code>.
          The uploads folder is excluded from git to keep the repository lightweight — images live only on the server.
        </p>

        <h3 className="font-bold text-sm mb-1" style={{ color: org }}>Tech Stack</h3>
        <ul className="text-sm text-gray-600 mb-4 list-disc pl-5 space-y-1">
          <li><strong>Frontend</strong> — Next.js 15 (App Router), Tailwind CSS, TypeScript</li>
          <li><strong>Backend</strong> — Node.js, Express.js, MySQL (via mysql2)</li>
          <li><strong>Auth</strong> — JWT tokens stored in localStorage</li>
          <li><strong>Payments</strong> — MTN MoMo &amp; Airtel Money (coin top-up)</li>
          <li><strong>OTP</strong> — SMS verification before seller contact is revealed</li>
        </ul>

        <h3 className="font-bold text-sm mb-1" style={{ color: org }}>User Roles</h3>
        <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
          <li><strong>Buyer</strong> — browse, search, reveal contacts</li>
          <li><strong>Seller</strong> — post &amp; manage listings, boost, subscribe</li>
          <li><strong>Staff</strong> — moderate listings and users</li>
          <li><strong>Admin</strong> — full platform control</li>
          <li><strong>Ambassador</strong> — promote the platform, earn referral coins</li>
        </ul>
      </div>
    </div>
  );
}

export default function Navbar() {
  const { user, logout }   = useAuth();
  const { lang, setLang, T } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [readme,   setReadme]   = useState(false);
  const close = () => setMenuOpen(false);

  const NAV_LINKS = [
    { href: '/listings?category=products',       label: T.products,        active: true },
    { href: '/listings?category=properties',     label: T.properties },
    { href: '/listings?category=rent',           label: 'Rent' },
    { href: '/listings?category=vehicles',       label: T.vehicles },
    { href: '/listings?category=services',       label: T.services },
    { href: '/listings?category=auction',        label: T.auction },
    { href: '/listings?category=adverts',        label: T.adverts },
  ];

  const CAT_LINKS: { label: string; href: string; disabled?: boolean }[] = [
    { label: T.allCategories,    href: '/listings' },
    { label: T.electronics,      href: '/listings?category=electronics' },
    { label: 'Food & Beverage',  href: '/listings?category=food-beverage' },
    { label: T.clothing,         href: '/listings?category=clothing' },
    { label: T.construction,     href: '/listings?category=construction' },
    { label: T.health,           href: '/listings?category=health' },
    { label: T.education,        href: '/listings?category=education' },
    { label: 'Farmer Product',   href: '/listings?category=farmer-product' },
    { label: 'Supply Chain',     href: '/listings?category=supply-chain' },
  ];

  return (
    <>
      {readme && <ReadMeModal onClose={() => setReadme(false)} />}

      {/* ── TOP BAR ── */}
      <div className="text-white text-xs px-5 py-1.5 flex items-center gap-4" style={{ background: navy }}>
        <span className="mr-auto" style={{ opacity: 0.75, fontSize: 12 }}>{T.marketOnline}</span>
        <a href="#" className="transition" style={{ color: '#cdd4f0' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={e => (e.currentTarget.style.color = '#cdd4f0')}>
          {T.support}
        </a>
        <Link href="/about" className="transition" style={{ color: '#cdd4f0' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={e => (e.currentTarget.style.color = '#cdd4f0')}>
          {T.about}
        </Link>
        {user
          ? <span style={{ color: 'rgba(255,255,255,0.7)' }}>{user.name.split(' ')[0]}</span>
          : <Link href="/login" className="transition" style={{ color: '#cdd4f0' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = '#cdd4f0')}>
              {T.signIn}
            </Link>
        }

        {/* Language pills — EN | FR | RW */}
        <div className="flex gap-1.5 items-center">
          {(['en', 'fr', 'rw'] as Lang[]).map(code => (
            <button
              key={code}
              onClick={() => setLang(code)}
              className="transition text-[11px] font-semibold cursor-pointer"
              style={{
                border:     `1px solid ${lang === code ? '#fff' : '#cdd4f0'}`,
                background: lang === code ? '#fff' : 'transparent',
                color:      lang === code ? navy   : '#cdd4f0',
                padding:    '2px 8px',
                borderRadius: 3,
              }}
            >
              {code.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ── MAIN HEADER — white bg + orange bottom border ── */}
      <div
        className="bg-white px-5 py-2.5 flex items-center justify-between"
        style={{ borderBottom: `2px solid ${org}` }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <div className="rounded-full bg-white flex items-center justify-center overflow-hidden"
            style={{ width: 54, height: 54, border: `2px solid ${org}` }}>
            <svg viewBox="0 0 200 200" width="50" height="50" xmlns="http://www.w3.org/2000/svg">
              <path d="M100,10 A90,90 0 0,1 190,100" fill="none" stroke={org} strokeWidth="5" strokeLinecap="round"/>
              <circle cx="100" cy="100" r="86" fill="none" stroke={navy} strokeWidth="3" strokeDasharray="5 3"/>
              <text x="18" y="148" fontFamily="Arial Black,Arial" fontSize="128" fontWeight="900" fill={navy}>E</text>
              <circle cx="87"  cy="157" r="8" fill={org}/>
              <circle cx="117" cy="157" r="8" fill={org}/>
              <rect   x="71"   y="128" width="58" height="22" rx="4" fill={org}/>
              <circle cx="168" cy="38"  r="14" fill="none" stroke={navy} strokeWidth="2.5"/>
              <circle cx="168" cy="33"  r="5.5" fill={navy}/>
              <path d="M158,44 Q168,53 178,44" fill={navy}/>
              <circle cx="183" cy="108" r="14" fill="none" stroke={org} strokeWidth="2.5"/>
              <circle cx="183" cy="103" r="5.5" fill={org}/>
              <path d="M173,114 Q183,123 193,114" fill={org}/>
              <circle cx="160" cy="172" r="14" fill="none" stroke={navy} strokeWidth="2.5"/>
              <circle cx="160" cy="167" r="5.5" fill={navy}/>
              <path d="M150,178 Q160,187 170,178" fill={navy}/>
              <line x1="168" y1="52"  x2="176" y2="94"  stroke={navy} strokeWidth="1.5" strokeDasharray="4 3"/>
              <line x1="176" y1="122" x2="165" y2="158" stroke={navy} strokeWidth="1.5" strokeDasharray="4 3"/>
            </svg>
          </div>
          <div>
            <h1 className="font-medium text-xl leading-tight" style={{ color: navy }}>
              <span style={{ color: org }}>E</span>-Nyagasambu
            </h1>
            <p className="font-bold uppercase" style={{ fontSize: 10, color: org, letterSpacing: '2px' }}>
              Digital Market Place
            </p>
          </div>
        </Link>

        {/* Header right: search + links */}
        <div className="flex flex-col items-end gap-2">

          {/* Search bar — navy border, navy button */}
          <form action="/listings" method="GET"
            className="flex items-center overflow-hidden"
            style={{ border: `2px solid ${navy}`, borderRadius: 4, width: 360 }}>
            <input
              name="search"
              placeholder={T.searchPlaceholder}
              className="flex-1 px-3 py-1.5 text-sm outline-none min-w-0"
              style={{ background: '#fff', color: '#333', border: 'none' }}
            />
            <button
              type="submit"
              className="flex items-center justify-center px-3 py-2 shrink-0"
              style={{ background: navy, border: 'none', cursor: 'pointer' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>
          </form>

          {/* Header links row */}
          <div className="flex items-center gap-3" style={{ fontSize: 12 }}>
            <Link href="/register" className="flex items-center gap-1 transition hover:opacity-70" style={{ color: navy, textDecoration: 'none' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
              Supplier registration
            </Link>
            <Link href="/register" className="flex items-center gap-1 transition hover:opacity-70" style={{ color: navy, textDecoration: 'none' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              Ambassador registration
            </Link>
            <Link href="/coins" className="flex items-center gap-1 transition hover:opacity-70" style={{ color: navy, textDecoration: 'none' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              {T.donate}
            </Link>
            <button onClick={() => setReadme(true)} className="flex items-center gap-1 transition hover:opacity-70 cursor-pointer" style={{ color: navy, background: 'none', border: 'none', padding: 0, font: 'inherit' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              Support with us
            </button>

            {/* Auth controls (logged in) */}
            {user && (
              <div className="flex items-center gap-2 ml-1 pl-2" style={{ borderLeft: '1px solid #ddd' }}>
                <Link href="/listings/create"
                  className="text-white text-xs font-semibold px-3 py-1 rounded transition hover:opacity-90"
                  style={{ background: org }}>
                  {T.listItem}
                </Link>
                <Link href="/coins"
                  className="text-xs px-2 py-1 rounded flex items-center gap-1"
                  style={{ background: '#0f1e5a', color: '#fff' }}>
                  🪙 {user.coins}
                </Link>
                <div className="relative">
                  <button onClick={() => setMenuOpen(!menuOpen)}
                    className="text-sm font-medium flex items-center gap-1 cursor-pointer transition hover:opacity-70"
                    style={{ color: navy, background: 'none', border: 'none', padding: 0, font: 'inherit' }}>
                    {user.name.split(' ')[0]} <span style={{ fontSize: 9 }}>▾</span>
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 mt-2 bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100 z-50" style={{ width: 220 }}>
                      <Link href="/dashboard"      className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold hover:bg-gray-50 border-b" style={{ color: navy }} onClick={close}>🏠 My Dashboard</Link>
                      <Link href="/my-listings"    className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 text-gray-800" onClick={close}>📋 {T.myListings}</Link>
                      <Link href="/coins"          className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 text-gray-800" onClick={close}>🪙 {T.coinsWallet}</Link>
                      <Link href="/subscriptions"  className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 text-gray-800" onClick={close}>⭐ {T.sellerPlans}</Link>
                      <Link href="/referral"       className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 text-gray-800" onClick={close}>🎁 {T.referEarn}</Link>
                      {(user.role === 'admin' || user.role === 'staff') && (
                        <Link href="/staff" className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold hover:bg-gray-50 border-t" style={{ color: navy }} onClick={close}>
                          🛠️ {T.staffDashboard}
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

            {/* Not logged in — show Sign In / Register */}
            {!user && (
              <div className="flex items-center gap-2 ml-1 pl-2" style={{ borderLeft: '1px solid #ddd' }}>
                <Link href="/login"    className="text-sm transition hover:opacity-70" style={{ color: navy }}>{T.signIn}</Link>
                <Link href="/register" className="text-white text-xs font-semibold px-3 py-1 rounded transition hover:opacity-90" style={{ background: org }}>{T.register}</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MAIN NAV ── */}
      <nav className="px-5 flex items-center justify-between" style={{ background: navy }}>
        <div className="flex">
          {NAV_LINKS.map(({ href, label, active }) => (
            <Link
              key={label}
              href={href}
              className="text-sm px-4 py-3 transition block"
              style={{
                color:        '#cdd4f0',
                borderBottom: active ? `3px solid ${org}` : '3px solid transparent',
                textDecoration: 'none',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.borderBottomColor = org;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = '#cdd4f0';
                e.currentTarget.style.borderBottomColor = active ? org : 'transparent';
              }}
            >
              {label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-5">
          <Link href="/certificate?type=broker" className="text-sm py-3 transition" style={{ color: '#cdd4f0', textDecoration: 'none' }}
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

      {/* ── CATEGORY PILLS ── */}
      <div className="px-5 py-1.5 flex gap-2 flex-wrap" style={{ background: '#1d3080' }}>
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
                padding:      '5px 14px',
                borderRadius: 3,
                border:       `1px solid ${i === 0 ? org : '#6a7dbf'}`,
                background:   i === 0 ? org : 'transparent',
                color:        i === 0 ? '#fff' : '#c5cce8',
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
    </>
  );
}
