'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Server, Settings, BarChart3, DollarSign,
  FileText, CheckCircle, LogOut, Menu, X, ChevronRight, Users, User
} from '@/lib/icons';
import NotificationBell from '@/components/NotificationBell';
import { useUnreadCount } from '@/lib/useUnreadCount';

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
  roles: string[];
}

const getNavItems = (executiveRole?: string): NavItem[] => {
  const allItems: NavItem[] = [
    { href: '/executive/ceo', icon: <BarChart3 size={18} />, label: 'CEO Dashboard', roles: ['CEO'] },
    { href: '/executive/ceo/staff', icon: <Users size={18} />, label: 'Staff Management', roles: ['CEO'] },
    { href: '/executive/cio', icon: <Server size={18} />, label: 'CIO Dashboard', roles: ['CIO'] },
    { href: '/executive/coo', icon: <Settings size={18} />, label: 'COO Dashboard', roles: ['COO'] },
    { href: '/executive/cmo', icon: <DollarSign size={18} />, label: 'CMO Dashboard', roles: ['CMO'] },
    { href: '/executive/cfo', icon: <DollarSign size={18} />, label: 'CFO Dashboard', roles: ['CFO'] },
    { href: '/executive/audit', icon: <FileText size={18} />, label: 'Audit Log', roles: ['CEO', 'CIO', 'COO', 'CMO', 'CFO'] },
    { href: '/executive/approvals', icon: <CheckCircle size={18} />, label: 'Approvals', roles: ['CEO', 'CIO', 'COO', 'CMO', 'CFO'] },
    { href: '/executive/profile', icon: <User size={18} />, label: 'My Profile', roles: ['CEO', 'CIO', 'COO', 'CMO', 'CFO'] },
  ];
  if (!executiveRole) return allItems;
  return allItems.filter(item => item.roles.includes(executiveRole));
};

export default function ExecutiveLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { refresh: refreshNotifs } = useUnreadCount();

  const isLoginPage = pathname === '/executive/login';

  useEffect(() => {
    if (!loading && !user && !isLoginPage) router.replace('/login');
    if (!loading && user && !['admin', 'staff'].includes(user.role) && !isLoginPage) {
      router.replace('/login');
    }
  }, [user, loading, router, isLoginPage]);

  useEffect(() => {
    if (pathname === '/executive/approvals') refreshNotifs();
  }, [pathname, refreshNotifs]);

  useEffect(() => {
    if (loading || isLoginPage || !user?.executive_role) return;
    const roleHub: Record<string, string> = {
      CEO: '/executive/ceo',
      CIO: '/executive/cio',
      COO: '/executive/coo',
      CMO: '/executive/cmo',
      CFO: '/executive/cfo',
    };
    const path = pathname.split('/')[2];
    if (path && ['ceo', 'cio', 'coo', 'cmo', 'cfo'].includes(path)) {
      const allowed = roleHub[user.executive_role];
      if (allowed && !pathname.startsWith(allowed)) {
        router.replace(allowed);
      }
    }
  }, [loading, isLoginPage, user?.executive_role, pathname, router]);

  useEffect(() => {
    if (!user?.executive_role) return;
    fetch(`/api/executive/permissions/${user.executive_role}`)
      .then(res => res.json())
      .catch(() => {});
  }, [user?.executive_role]);

  const navItems = getNavItems(user?.executive_role);

  if (isLoginPage) return <>{children}</>;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#ffffff' }}>
        <div className="text-center">
          <img src="/assets/logo.png" alt="E-Nyagasambu" className="w-14 h-14 mx-auto mb-4 object-contain" />
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
          <img src="/assets/logo.png" alt="E-Nyagasambu" className="w-10 h-10 object-contain shrink-0" />
          <div className="min-w-0">
            <p className="font-bold text-[13px] text-white leading-tight tracking-tight">E-Nyagasambu</p>
            <p className="text-[9px] font-semibold tracking-[0.2em] uppercase" style={{ color: `${BRAND.orange}bb` }}>MIS Executive Panel</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto text-white/30 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {navItems.map(({ href, icon, label }) => {
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
              <p className="text-[10px] text-white/40 capitalize">{user.executive_role || user.role}</p>
            </div>
            <button onClick={() => { logout(); router.push('/login'); }}
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
              <span className="text-gray-700">Executive</span>
              <ChevronRight size={14} className="text-gray-700" />
              <span className="font-semibold text-gray-800">
                {pathname.split('/').pop()?.replace(/-/g, ' ') || ''}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />

            {/* Profile */}
            <div className="flex items-center gap-2.5 pl-3 ml-1 border-l border-gray-200">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ background: `linear-gradient(135deg, ${BRAND.navy}, ${BRAND.navyLight})` }}>
                {user.name?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="hidden sm:block">
                <p className="text-[13px] font-semibold text-gray-800 leading-tight">{user.name}</p>
                <p className="text-[10px] text-gray-700 capitalize">{user.executive_role || user.role}</p>
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
