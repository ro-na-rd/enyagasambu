'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const NAVY = '#0f1e42';
const ORG = '#E85D04';

const menuItems = [
  { href: '/broker',            icon: '📊', label: 'Dashboard' },
  { href: '/broker/profile',    icon: '👤', label: 'My Profile' },
  { href: '/broker/certificate', icon: '🪪', label: 'My Certificate' },
  { href: '/broker/clients',    icon: '👥', label: 'My Clients' },
  { href: '/broker/listings',   icon: '🏠', label: 'My Properties/Listings' },
  { href: '/broker/transactions', icon: '💳', label: 'Transactions' },
  { href: '/broker/commissions', icon: '💰', label: 'Commission & Earnings' },
  { href: '/broker/leads',      icon: '📋', label: 'Leads' },
  { href: '/broker/messages',   icon: '✉️', label: 'Messages' },
  { href: '/broker/reports',    icon: '📈', label: 'Reports' },
  { href: '/broker/notifications', icon: '🔔', label: 'Notifications' },
  { href: '/broker/settings',   icon: '⚙️', label: 'Settings' },
  { href: '/broker/help',       icon: '❓', label: 'Help & Support' },
];

export default function BrokerLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [msgOpen, setMsgOpen] = useState(false);

  const isLoginPage = pathname === '/broker/login' || pathname === '/broker/register';

  useEffect(() => {
    if (!loading && !user && !isLoginPage) router.replace('/broker/login');
    if (!loading && user && user.role !== 'broker' && !isLoginPage) router.replace('/broker/login');
  }, [user, loading, router, isLoginPage]);

  useEffect(() => {
    const close = () => { setProfileOpen(false); setNotifOpen(false); setMsgOpen(false); };
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  if (isLoginPage) return <>{children}</>;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8f9fc' }}>
        <div className="text-center">
          <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-black text-xl shadow-lg" style={{ background: `linear-gradient(135deg, ${NAVY}, ${ORG})` }}>E</div>
          <p className="text-gray-500 text-sm animate-pulse">Loading broker dashboard…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const initials = user.name?.split(' ').map((p: string) => p[0]).join('').toUpperCase().slice(0, 2) || 'B';

  return (
    <div className="h-screen overflow-hidden flex" style={{ background: '#f0f2f6' }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar - always fixed on desktop */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Brand */}
        <div className="px-5 py-5 border-b border-gray-100">
          <Link href="/broker" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-black text-sm" style={{ background: `linear-gradient(135deg, ${NAVY}, ${ORG})` }}>E</div>
            <div>
              <p className="font-bold text-sm leading-tight" style={{ color: NAVY }}>E-Nyagasambu</p>
              <p className="text-[9px] font-bold tracking-widest uppercase" style={{ color: ORG }}>Broker Portal</p>
            </div>
          </Link>
        </div>

        {/* User summary */}
        <div className="px-4 py-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm" style={{ background: NAVY }}>
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
              <p className="text-[10px] text-gray-500">Broker</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {menuItems.map(({ href, icon, label }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                  active
                    ? 'font-semibold' + ' bg-orange-50 text-[#E85D04]'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}>
                <span className="text-base w-5 text-center">{icon}</span>
                <span>{label}</span>
                {active && <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: ORG }} />}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-3 border-t border-gray-100">
          <button onClick={() => { logout(); router.push('/broker/login'); }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 transition w-full">
            <span className="text-base w-5 text-center">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main area - offset for fixed sidebar */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        {/* Top header */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-gray-600 hover:text-gray-900 text-xl" onClick={() => setSidebarOpen(true)}>
              ☰
            </button>
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-400">
              <span className="text-gray-900 font-medium capitalize">
                {pathname === '/broker' ? 'Dashboard' : pathname.split('/').pop()?.replace(/-/g, ' ') || ''}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications Dropdown */}
            <div className="relative">
              <button onClick={(e) => { e.stopPropagation(); setProfileOpen(false); setNotifOpen(!notifOpen); }}
                className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition" title="Notifications">
                🔔
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">3</span>
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-full mt-1 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <span className="text-sm font-bold text-gray-800">Notifications</span>
                    <span className="text-xs text-gray-400">3 new</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {[
                      { text: 'New lead: David Habimana interested in 3-Bedroom House', time: '5 min ago' },
                      { text: 'Listing approved: 3-Bedroom House Kacyiru', time: '2 hours ago' },
                      { text: 'Commission of RWF 4,250 has been credited', time: '1 day ago' },
                    ].map((n, i) => (
                      <div key={i} className="flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition cursor-pointer">
                        <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-sm shrink-0">🔔</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700 leading-snug">{n.text}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link href="/broker/notifications" className="block text-center text-xs font-semibold text-[#E85D04] py-3 border-t border-gray-100 hover:bg-gray-50 rounded-b-xl">
                    View All Notifications
                  </Link>
                </div>
              )}
            </div>
            {/* Messages Dropdown */}
            <div className="relative">
              <button onClick={(e) => { e.stopPropagation(); setProfileOpen(false); setMsgOpen(!msgOpen); }}
                className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition" title="Messages">
                ✉️
                <span className="absolute top-1 right-1 w-4 h-4 bg-orange-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">2</span>
              </button>
              {msgOpen && (
                <div className="absolute right-0 top-full mt-1 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <span className="text-sm font-bold text-gray-800">Messages</span>
                    <span className="text-xs text-gray-400">2 unread</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {[
                      { from: 'David Habimana', subject: 'Inquiry about 3-Bedroom House', time: 'Today' },
                      { from: 'Eva Uwase', subject: 'Commercial Plot Pricing', time: 'Yesterday' },
                      { from: 'Admin Team', subject: 'Broker Verification Update', time: '2 days ago' },
                    ].map((m, i) => (
                      <div key={i} className="flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition cursor-pointer">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: NAVY }}>
                          {m.from.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800">{m.from}</p>
                          <p className="text-xs text-gray-600 mt-0.5">{m.subject}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{m.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link href="/broker/messages" className="block text-center text-xs font-semibold text-[#E85D04] py-3 border-t border-gray-100 hover:bg-gray-50 rounded-b-xl">
                    View All Messages
                  </Link>
                </div>
              )}
            </div>
            <div className="relative pl-2 ml-1 border-l border-gray-200">
              <button onClick={(e) => { e.stopPropagation(); setProfileOpen(!profileOpen); }}
                className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-2 py-1 transition">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: NAVY }}>
                  {initials}
                </div>
                <div className="hidden sm:block text-left text-sm">
                  <p className="font-semibold text-gray-800 leading-tight -mb-0.5">{user.name?.split(' ')[0]}</p>
                  <p className="text-[10px] text-gray-400">Broker</p>
                </div>
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50" onClick={(e) => e.stopPropagation()}>
                  <Link href="/broker/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">My Profile</Link>
                  <Link href="/broker/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Settings</Link>
                  <hr className="my-1 border-gray-100" />
                  <button onClick={() => { logout(); router.push('/broker/login'); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
