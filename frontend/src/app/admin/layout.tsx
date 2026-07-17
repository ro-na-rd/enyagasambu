'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const NAVY = '#0f1e42';
const ORG = '#E85D04';

const menuItems = [
  { href: '/admin',          icon: '📊', label: 'Dashboard' },
  { href: '/admin/users',    icon: '👥', label: 'Users' },
  { href: '/admin/listings', icon: '🏠', label: 'Listings' },
  { href: '/admin/categories', icon: '📂', label: 'Categories' },
  { href: '/admin/content',  icon: '📝', label: 'Content Management' },
  { href: '/admin/certificates', icon: '🏅', label: 'Certificates' },
  { href: '/admin/reports',  icon: '📈', label: 'Reports' },
  { href: '/admin/analytics', icon: '📊', label: 'Analytics' },
  { href: '/admin/promos',   icon: '🎟️', label: 'Promo Codes' },
  { href: '/admin/settings', icon: '⚙️', label: 'Settings' },
  { href: '/admin/profile',  icon: '👤', label: 'Profile' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (!loading && !user && !isLoginPage) router.replace('/admin/login');
  }, [user, loading, router, isLoginPage]);

  useEffect(() => {
    const close = () => setNotifOpen(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  if (isLoginPage) return <>{children}</>;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-[#0f1e42] mx-auto mb-3 flex items-center justify-center text-white font-bold animate-pulse">E</div>
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="h-screen overflow-hidden flex bg-gray-50" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar - always fixed on desktop */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-[#0f1e42] text-white flex flex-col transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Brand */}
        <div className="px-5 py-5 border-b border-white/10">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-black text-sm" style={{ background: ORG }}>E</div>
            <div>
              <p className="font-bold text-sm leading-tight">E-Nyagasambu</p>
              <p className="text-[9px] font-bold tracking-widest uppercase opacity-50">Admin Panel</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {menuItems.map(({ href, icon, label }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                  active
                    ? 'bg-white/10 font-semibold'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}>
                <span className="text-base w-5 text-center">{icon}</span>
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-3 border-t border-white/10">
          <button onClick={() => { logout(); router.push('/admin/login'); }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition w-full">
            <span className="text-base w-5 text-center">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main area - offset for fixed sidebar */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        {/* Top header */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-gray-600 hover:text-gray-900 text-xl" onClick={() => setSidebarOpen(true)}>
              ☰
            </button>
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-400">
              <span className="text-gray-900 font-medium capitalize">
                {pathname === '/admin' ? 'Dashboard' : pathname.split('/').pop()?.replace(/-/g, ' ') || ''}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button onClick={(e) => { e.stopPropagation(); setNotifOpen(!notifOpen); }}
                className="relative text-gray-500 hover:text-gray-700 text-lg" title="Notifications">
                🔔
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">3</span>
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <span className="text-sm font-bold text-gray-800">Notifications</span>
                    <span className="text-xs text-gray-400">3 new</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {[
                      { text: 'New user registration: John Doe', time: '10 min ago' },
                      { text: 'Pending broker certificate request', time: '1 hour ago' },
                      { text: 'New listing reported: Spam detected', time: '3 hours ago' },
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
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: NAVY }}>
                {user.name?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="hidden sm:block text-sm">
                <p className="font-semibold text-gray-800 leading-tight">{user.name}</p>
                <p className="text-[10px] text-gray-400 capitalize">{user.role}</p>
              </div>
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
