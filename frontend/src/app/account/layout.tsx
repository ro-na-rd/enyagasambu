'use client';
import AppImage from '@/components/AppImage';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard, List, Search, Plus, Coins, HelpCircle, LogOut, Menu,
  Store, Home, ChevronDown,
} from '@/lib/icons';
import NotificationBell from '@/components/NotificationBell';

const NAVY = '#0f1e42';
const BLUE = '#1e3a8a';
const ORG = '#E85D04';

const NAV = [
  { href: '/account', label: 'Dashboard', Icon: LayoutDashboard, exact: true },
  { href: '/my-listings', label: 'My Listings', Icon: List },
  { href: '/listings/create', label: 'Post a Listing', Icon: Plus },
  { href: '/listings', label: 'Browse Listings', Icon: Store },
  { href: '/coins', label: 'Coins Wallet', Icon: Coins },
  { href: '/support', label: 'Help & Support', Icon: HelpCircle },
  { href: '/', label: 'Back to Site', Icon: Home },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role === 'broker') router.replace('/broker');
    else if (user.role === 'ambassador') router.replace('/ambassador');
    else if (user.role === 'supplier') router.replace('/supplier');
    else if (user.role === 'admin' || user.role === 'moderator' || user.role === 'staff') router.replace('/staff');
  }, [user, loading, router]);

  useEffect(() => {
    const close = () => setProfileOpen(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f0f2f6' }}>
        <div className="text-center">
          <AppImage src="/assets/logo.png" alt="E-Nyagasambu" className="w-14 h-14 mx-auto mb-4 object-contain" />
          <p className="text-gray-500 text-sm animate-pulse">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const initials = user.name?.split(' ').map((p: string) => p[0]).join('').toUpperCase().slice(0, 2) || 'U';
  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <div className="h-screen overflow-hidden flex" style={{ background: '#f0f2f6' }}>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 flex flex-col transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ background: `linear-gradient(180deg, ${BLUE} 0%, ${NAVY} 100%)` }}
      >
        <div className="px-5 py-5">
          <Link href="/account" className="flex items-center gap-3">
            <AppImage src="/assets/LOGO1.png" alt="E-Nyagasambu" className="w-10 h-10 object-contain shrink-0" />
            <div className="leading-tight">
              <p className="text-white text-base font-extrabold tracking-tight">
                <span style={{ color: '#E85D04' }}>E-</span>Nyagasambu
              </p>
              <p className="text-[9px] font-semibold tracking-[0.22em] uppercase" style={{ color: '#93c5fd' }}>
                Digital Marketplace
              </p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {NAV.map(({ href, label, Icon, exact }) => {
            const active = isActive(href, exact);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition"
                style={active
                  ? { background: '#fff', color: BLUE, fontWeight: 700 }
                  : { color: '#c5cce8', fontWeight: 500 }}
                onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; } }}
                onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#c5cce8'; } }}
              >
                <Icon size={18} />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 pb-5">
          <div className="rounded-2xl p-4 text-white" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <p className="text-sm font-bold leading-snug mb-1">Sell faster with instant reach</p>
            <p className="text-xs mb-3" style={{ color: '#93c5fd' }}>Reach buyers across Rwanda in seconds.</p>
            <Link
              href="/listings/create"
              className="flex items-center justify-center gap-2 text-white text-sm font-bold py-2 rounded-full"
              style={{ background: ORG }}
            >
              Post Now <ChevronDown size={14} style={{ transform: 'rotate(-90deg)' }} />
            </Link>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center gap-3 sticky top-0 z-10">
          <button className="lg:hidden text-gray-600" onClick={() => setSidebarOpen(true)} aria-label="Menu">
            <Menu size={20} />
          </button>

          <form action="/listings" method="GET" className="hidden md:flex items-center flex-1 max-w-md border border-gray-200 rounded-lg px-3 py-1.5 gap-2" style={{ background: '#f8f9fc' }}>
            <Search size={16} className="text-gray-400 shrink-0" />
            <input name="search" placeholder="Search listings, categories…" className="flex-1 bg-transparent text-sm outline-none min-w-0 placeholder:text-gray-400" />
          </form>

          <div className="flex-1 md:hidden" />

          <span className="hidden sm:flex items-center gap-2 text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg px-3 py-2" style={{ background: '#f8f9fc' }}>
            {today}
          </span>

          <NotificationBell />

          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setProfileOpen(!profileOpen); }}
              className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-1.5 py-1 transition"
            >
              {user.photo_url ? (
                <span className="w-9 h-9 rounded-full overflow-hidden shrink-0" style={{ border: `2px solid ${ORG}` }}>
                  <AppImage src={user.photo_url} alt={user.name} className="w-full h-full object-cover" />
                </span>
              ) : (
                <span className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: `linear-gradient(135deg, ${BLUE}, ${NAVY})` }}>
                  {initials}
                </span>
              )}
              <span className="hidden sm:block text-left leading-tight">
                <span className="block text-[13px] font-bold text-gray-800 truncate max-w-32">{user.name}</span>
                <span className="block text-[10px] font-semibold" style={{ color: ORG }}>Member</span>
              </span>
              <ChevronDown size={14} className="text-gray-400" />
            </button>
            {profileOpen && (
              <div className="fixed right-4 top-16 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 lg:absolute lg:right-0 lg:top-full lg:mt-1" onClick={(e) => e.stopPropagation()}>
                <p className="px-4 py-2 border-b border-gray-100">
                  <span className="block text-sm font-bold text-gray-800 truncate">{user.name}</span>
                  <span className="block text-xs text-gray-400 truncate">{user.email || ''}</span>
                </p>
                <Link href="/account/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">My Profile</Link>
                <Link href="/my-listings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">My Listings</Link>
                <Link href="/coins" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Coins Wallet</Link>
                <hr className="my-1 border-gray-100" />
                <button
                  onClick={() => { logout(); router.push('/login'); }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
