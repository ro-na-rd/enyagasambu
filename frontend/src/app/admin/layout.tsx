'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Users, Package, Folder, FileText, Award, BarChart3,
  Activity, Ticket, Settings, User, LogOut, Bell, Menu, X, ChevronRight,
  Shield, Sparkles, AlertOctagon, Medal, UserPlus
} from '@/lib/icons';

const BRAND = {
  navy: '#0f1e42',
  navyLight: '#1a2d5a',
  navyDark: '#0a1430',
  orange: '#E85D04',
  orangeLight: '#FF8A3D',
  orangeDark: '#c44d00',
};

interface NavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/admin', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { href: '/admin/users', icon: <Users size={18} />, label: 'Users' },
  { href: '/admin/listings', icon: <Package size={18} />, label: 'Listings' },
  { href: '/admin/categories', icon: <Folder size={18} />, label: 'Categories' },
  { href: '/admin/certificates', icon: <Award size={18} />, label: 'Certificates' },
  { href: '/admin/analytics', icon: <BarChart3 size={18} />, label: 'Analytics' },
  { href: '/admin/reports', icon: <Activity size={18} />, label: 'Reports' },
  { href: '/admin/promos', icon: <Ticket size={18} />, label: 'Promotions' },
  { href: '/admin/content', icon: <FileText size={18} />, label: 'Content' },
  { href: '/admin/settings', icon: <Settings size={18} />, label: 'Settings' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (!loading && !user && !isLoginPage) router.replace('/login');
    if (!loading && user && !['admin', 'moderator', 'staff'].includes(user.role) && !isLoginPage) {
      router.replace('/login');
    }
  }, [user, loading, router, isLoginPage]);

  useEffect(() => {
    const close = () => setNotifOpen(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  if (isLoginPage) return <>{children}</>;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#ffffff' }}>
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white font-black text-xl"
            style={{ background: `linear-gradient(135deg, ${BRAND.orange}, ${BRAND.orangeDark})`, boxShadow: `0 8px 32px ${BRAND.orange}44` }}>
            E
          </div>
          <div className="flex gap-1 justify-center">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-white/30 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <div className="h-screen overflow-hidden flex" style={{ background: '#ffffff', fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 flex flex-col transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        w-[260px]`}
        style={{ background: `linear-gradient(180deg, ${BRAND.navy} 0%, #0a0e1a 100%)`, borderRight: '1px solid rgba(255,255,255,0.04)' }}>

        {/* Brand */}
        <div className="px-5 py-5 flex items-center gap-3 border-b border-white/[0.05]">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-base shrink-0"
            style={{ background: `linear-gradient(135deg, ${BRAND.orange}, ${BRAND.orangeLight})`, boxShadow: `0 4px 20px ${BRAND.orange}44` }}>
            E
          </div>
          <div className="min-w-0">
            <p className="font-bold text-[13px] text-white leading-tight tracking-tight">E-Nyagasambu</p>
            <p className="text-[9px] font-semibold tracking-[0.2em] uppercase" style={{ color: `${BRAND.orange}bb` }}>Admin Panel</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto text-white/30 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {NAV_ITEMS.map(({ href, icon, label }) => {
            const active = isActive(href);
            return (
              <Link key={href} href={href} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group
                  ${active
                    ? 'text-white shadow-lg'
                    : 'text-white/40 hover:text-white/80 hover:bg-white/[0.04]'
                  }`}
                style={active ? { background: `linear-gradient(135deg, ${BRAND.orange}22, ${BRAND.orange}08)`, borderLeft: `2px solid ${BRAND.orange}` } : {}}>
                <span className={`flex items-center justify-center w-7 h-7 rounded-lg transition-colors
                  ${active ? 'text-white' : 'text-white/30 group-hover:text-white/60'}`}
                  style={active ? { background: `${BRAND.orange}22` } : {}}>
                  {icon}
                </span>
                <span>{label}</span>
                {active && <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: BRAND.orange }} />}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="px-3 py-3 border-t border-white/[0.05]">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.03]">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ background: `linear-gradient(135deg, ${BRAND.orange}, ${BRAND.orangeDark})` }}>
              {user.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-white/40 capitalize">{user.role}</p>
            </div>
            <button onClick={() => { logout(); router.push('/admin/login'); }}
              className="text-white/20 hover:text-white/60 transition-colors p-1 rounded-lg hover:bg-white/[0.04]"
              title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-[260px]">

        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200 px-4 lg:px-6 h-16 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-gray-500 hover:text-white p-2 -ml-2 rounded-xl hover:bg-gray-100 transition"
              onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <span className="text-gray-700">Admin</span>
              <ChevronRight size={14} className="text-gray-700" />
              <span className="font-semibold text-gray-800">
                {pathname === '/admin' ? 'Dashboard' : pathname.split('/').pop()?.replace(/-/g, ' ') || ''}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <div className="relative">
              <button onClick={(e) => { e.stopPropagation(); setNotifOpen(!notifOpen); }}
                className="relative p-2.5 rounded-xl text-gray-500 hover:text-white hover:bg-gray-100 transition-all">
                <Bell size={18} />
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full text-[8px] font-bold text-white flex items-center justify-center"
                  style={{ background: BRAND.orange }}>3</span>
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-[#ffffff] rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
                  onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                    <span className="text-sm font-bold text-gray-900">Notifications</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${BRAND.orange}20`, color: BRAND.orange }}>3 new</span>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {[
                      { text: 'New user registration: Jean Pierre', time: '5 min ago', type: 'user' },
                      { text: 'Pending broker certificate request', time: '1 hour ago', type: 'cert' },
                      { text: 'New listing reported: Spam detected', time: '3 hours ago', type: 'alert' },
                    ].map((n, i) => (
                      <div key={i} className="flex items-start gap-3 px-5 py-3.5 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition cursor-pointer">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0"
                          style={{ background: n.type === 'alert' ? 'rgba(218,54,51,0.15)' : n.type === 'cert' ? 'rgba(31,111,235,0.15)' : 'rgba(35,134,54,0.15)' }}>
                          {n.type === 'alert' ? <AlertOctagon size={16} /> : n.type === 'cert' ? <Medal size={16} /> : <UserPlus size={16} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-gray-700 leading-snug">{n.text}</p>
                          <p className="text-[11px] text-gray-700 mt-0.5">{n.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="flex items-center gap-2.5 pl-3 ml-1 border-l border-gray-200">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ background: `linear-gradient(135deg, ${BRAND.navy}, ${BRAND.navyLight})` }}>
                {user.name?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="hidden sm:block">
                <p className="text-[13px] font-semibold text-gray-800 leading-tight">{user.name}</p>
                <p className="text-[10px] text-gray-700 capitalize">{user.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
