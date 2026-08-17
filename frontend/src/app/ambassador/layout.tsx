'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, LogOut, Menu, User, Link as LinkIcon, FileText, Gift, Award, Megaphone, TrendingUp, Settings, HelpCircle, Bell } from '@/lib/icons';
import NotificationBell from '@/components/NotificationBell';
import { useUnreadCount } from '@/lib/useUnreadCount';

const NAVY = '#0f1e42';
const ORG = '#E85D04';

const menuIcons: Record<string, React.FC<{ size?: number }>> = {
  dashboard: LayoutDashboard,
  profile: User,
  referrals: LinkIcon,
  activities: FileText,
  rewards: Gift,
  certificate: Award,
  announcements: Megaphone,
  reports: TrendingUp,
  settings: Settings,
  help: HelpCircle,
  notifications: Bell,
};

const menuItems = [
  { href: '/ambassador',            iconKey: 'dashboard', label: 'Dashboard' },
  { href: '/ambassador/profile',    iconKey: 'profile', label: 'My Profile' },
  { href: '/ambassador/referrals',  iconKey: 'referrals', label: 'My Referrals' },
  { href: '/ambassador/activities', iconKey: 'activities', label: 'My Activities' },
  { href: '/ambassador/rewards',    iconKey: 'rewards', label: 'Rewards & Earnings' },
  { href: '/ambassador/certificate', iconKey: 'certificate', label: 'My Certificate' },
  { href: '/ambassador/announcements', iconKey: 'announcements', label: 'Announcements' },
  { href: '/ambassador/reports',    iconKey: 'reports', label: 'Reports' },
  { href: '/ambassador/notifications', iconKey: 'notifications', label: 'Notifications' },
  { href: '/ambassador/settings',   iconKey: 'settings', label: 'Settings' },
  { href: '/ambassador/help',       iconKey: 'help', label: 'Help & Support' },
];

export default function AmbassadorLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const { count: notifCount, refresh: refreshNotifs } = useUnreadCount();

  const isLoginPage = pathname === '/ambassador/login' || pathname === '/ambassador/register';

  useEffect(() => {
    if (!loading && !user && !isLoginPage) router.replace('/login');
    if (!loading && user && user.role !== 'ambassador' && !isLoginPage) router.replace('/login');
  }, [user, loading, router, isLoginPage]);

  useEffect(() => {
    const close = () => setProfileOpen(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  useEffect(() => {
    if (pathname === '/ambassador/notifications') refreshNotifs();
  }, [pathname, refreshNotifs]);

  if (isLoginPage) return <>{children}</>;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8f9fc' }}>
        <div className="text-center">
          <img src="/assets/logo.png" alt="E-Nyagasambu" className="w-14 h-14 mx-auto mb-4 object-contain" />
          <p className="text-gray-500 text-sm animate-pulse">Loading ambassador dashboard…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const initials = user.name?.split(' ').map((p: string) => p[0]).join('').toUpperCase().slice(0, 2) || 'A';

  return (
    <div className="h-screen overflow-hidden flex" style={{ background: '#f0f2f6' }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar - always fixed on desktop */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>


        {/* User summary */}
        <div className="px-4 py-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm" style={{ background: NAVY }}>
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
              <p className="text-[10px] text-gray-500">Ambassador</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {menuItems.map(({ href, iconKey, label }) => {
            const active = pathname === href;
            const Icon = menuIcons[iconKey];
            const dynamicBadge = href === '/ambassador/notifications' && notifCount > 0 ? String(notifCount) : null;
            return (
              <Link key={href} href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                  active
                    ? 'font-semibold' + ' bg-orange-50 text-[#E85D04]'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}>
                <Icon size={18} />
                <span className="flex-1 truncate">{label}</span>
                {dynamicBadge && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-4 text-center" style={{ background: `${ORG}18`, color: ORG }}>
                    {dynamicBadge}
                  </span>
                )}
                {active && <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: ORG }} />}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-3 border-t border-gray-100">
          <button onClick={() => { logout(); router.push('/ambassador/login'); }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 transition w-full">
            <LogOut size={18} />
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
              <Menu size={20} />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-400">
              <span className="text-gray-900 font-medium capitalize">
                {pathname === '/ambassador' ? 'Dashboard' : pathname.split('/').pop()?.replace(/-/g, ' ') || ''}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell />
            <div className="relative pl-2 ml-1 border-l border-gray-200">
              <button onClick={(e) => { e.stopPropagation(); setProfileOpen(!profileOpen); }}
                className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-2 py-1 transition">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: NAVY }}>
                  {initials}
                </div>
                <div className="hidden sm:block text-left text-sm">
                  <p className="font-semibold text-gray-800 leading-tight -mb-0.5">{user.name?.split(' ')[0]}</p>
                  <p className="text-[10px] text-gray-400">Ambassador</p>
                </div>
              </button>
              {profileOpen && (
                <div className="fixed right-4 top-16 w-[calc(100vw-32px)] max-w-[320px] z-50 bg-white rounded-xl shadow-lg border border-gray-100 py-2 lg:absolute lg:right-0 lg:top-full lg:mt-1 lg:w-48 lg:max-w-none" onClick={(e) => e.stopPropagation()}>
                  <Link href="/ambassador/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">My Profile</Link>
                  <Link href="/ambassador/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Settings</Link>
                  <hr className="my-1 border-gray-100" />
                  <button onClick={() => { logout(); router.push('/ambassador/login'); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
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
