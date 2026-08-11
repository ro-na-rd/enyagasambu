'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, User, BadgeCheck, Users, Home, CreditCard, DollarSign, FileText,
  MessageCircle, TrendingUp, Bell, Settings, HelpCircle, LogOut, Menu, X, Award,
} from '@/lib/icons';
import NotificationBell from '@/components/NotificationBell';
import { useUnreadCount } from '@/lib/useUnreadCount';

const NAVY = '#0f1e42';
const ORG = '#E85D04';

interface NavItem {
  href: string;
  iconKey: keyof typeof menuIcons;
  label: string;
  badge?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

interface Conversation {
  key: string;
  name: string;
  lastMessage: string;
  lastAt: string;
  unread: number;
}

const menuIcons = {
  dashboard: LayoutDashboard,
  profile: User,
  certificate: BadgeCheck,
  clients: Users,
  listings: Home,
  transactions: CreditCard,
  commissions: DollarSign,
  leads: FileText,
  messages: MessageCircle,
  reports: TrendingUp,
  notifications: Bell,
  settings: Settings,
  help: HelpCircle,
};

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { href: '/broker', iconKey: 'dashboard', label: 'Dashboard' },
      { href: '/broker/profile', iconKey: 'profile', label: 'My Profile' },
    ],
  },
  {
    title: 'Verification',
    items: [
      { href: '/broker/certificate', iconKey: 'certificate', label: 'My Certificate', badge: 'Paid' },
    ],
  },
  {
    title: 'Portfolio',
    items: [
      { href: '/broker/clients', iconKey: 'clients', label: 'My Clients' },
      { href: '/broker/listings', iconKey: 'listings', label: 'Properties / Listings' },
    ],
  },
  {
    title: 'Finance',
    items: [
      { href: '/broker/transactions', iconKey: 'transactions', label: 'Transactions' },
      { href: '/broker/commissions', iconKey: 'commissions', label: 'Commission & Earnings' },
    ],
  },
  {
    title: 'Engagement',
    items: [
      { href: '/broker/leads', iconKey: 'leads', label: 'Leads' },
      { href: '/broker/messages', iconKey: 'messages', label: 'Messages' },
    ],
  },
  {
    title: 'Insights',
    items: [
      { href: '/broker/reports', iconKey: 'reports', label: 'Reports' },
    ],
  },
  {
    title: 'Account',
    items: [
      { href: '/broker/notifications', iconKey: 'notifications', label: 'Notifications' },
      { href: '/broker/settings', iconKey: 'settings', label: 'Settings' },
      { href: '/broker/help', iconKey: 'help', label: 'Help & Support' },
    ],
  },
];

export default function BrokerLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [msgOpen, setMsgOpen] = useState(false);

  const [msgConvs, setMsgConvs] = useState<Conversation[]>([]);

  const { count: notifCount, refresh: refreshNotifs } = useUnreadCount();

  useEffect(() => {
    if (!user) return;
    let active = true;
    const load = () => {
      api.get('/broker/messages/conversations')
        .then(({ data }) => { if (active) setMsgConvs(data.conversations || []); })
        .catch(() => {});
    };
    load();
    const t = setInterval(load, 30000);
    return () => { active = false; clearInterval(t); };
  }, [user]);

  const unreadMsgs = msgConvs.reduce((sum, c) => sum + (c.unread || 0), 0);

  useEffect(() => {
    if (!user) return;
    if (pathname === '/broker/messages') {
      api.get('/broker/messages/conversations')
        .then(({ data }) => setMsgConvs(data.conversations || []))
        .catch(() => {});
    }
    if (pathname === '/broker/notifications') {
      refreshNotifs();
    }
  }, [pathname, user, refreshNotifs]);

  const convTime = (iso: string) => {
    try {
      const d = new Date(iso);
      const now = new Date();
      const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
      if (diff === 0) return 'Today';
      if (diff === 1) return 'Yesterday';
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    } catch { return ''; }
  };

  const isLoginPage = pathname === '/broker/login' || pathname === '/broker/register';

  useEffect(() => {
    if (!loading && !user && !isLoginPage) router.replace('/login');
    if (!loading && user && user.role !== 'broker' && !isLoginPage) router.replace('/login');
  }, [user, loading, router, isLoginPage]);

  useEffect(() => {
    const close = () => { setProfileOpen(false); setMsgOpen(false); };
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  if (isLoginPage) return <>{children}</>;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8f9fc' }}>
        <div className="text-center">
          <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden shadow-lg"><img src="/logo.jpg" alt="E-Nyagasambu" className="w-full h-full object-cover" /></div>
          <p className="text-gray-500 text-sm animate-pulse">Loading broker dashboard…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const initials = user.name?.split(' ').map((p: string) => p[0]).join('').toUpperCase().slice(0, 2) || 'B';

  const isActive = (href: string) => {
    if (href === '/broker') return pathname === '/broker';
    return pathname?.startsWith(href);
  };

  const pageTitle = pathname === '/broker'
    ? 'Dashboard'
    : (pathname.split('/').pop()?.replace(/-/g, ' ') || '');

  return (
    <div className="h-screen overflow-hidden flex" style={{ background: '#f0f2f6' }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar - always fixed on desktop */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Brand */}
        <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-end">
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        {/* User summary */}
        <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm" style={{ background: NAVY }}>
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
              <p className="text-[10px] text-gray-500 flex items-center gap-1">
                <Award size={11} style={{ color: ORG }} /> Broker
              </p>
            </div>
          </div>
        </div>

        {/* Navigation - grouped by section */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
          {NAV_GROUPS.map(group => (
            <div key={group.title}>
              <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">{group.title}</p>
              <div className="space-y-0.5">
                {group.items.map(({ href, iconKey, label, badge }) => {
                  const active = isActive(href);
                  const Icon = menuIcons[iconKey];
                  const dynamicBadge = href === '/broker/messages' && unreadMsgs > 0
                    ? String(unreadMsgs)
                    : href === '/broker/notifications' && notifCount > 0
                      ? String(notifCount)
                      : badge;
                  return (
                    <Link key={href} href={href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                        active
                          ? 'font-semibold bg-orange-50 text-[#E85D04]'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}>
                      <Icon size={18} />
                      <span className="flex-1 truncate">{label}</span>
                      {dynamicBadge && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-4 text-center" style={{ background: `${ORG}18`, color: ORG }}>
                          {dynamicBadge}
                        </span>
                      )}
                      {active && <span className="w-1.5 h-1.5 rounded-full" style={{ background: ORG }} />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-3 border-t border-gray-100">
          <button onClick={() => { logout(); router.push('/broker/login'); }}
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
              <span className="text-gray-900 font-medium capitalize">{pageTitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell />

            {/* Messages Dropdown */}
            <div className="relative">
              <button onClick={(e) => { e.stopPropagation(); setProfileOpen(false); setMsgOpen(!msgOpen); }}
                className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition" title="Messages">
                <MessageCircle size={20} />
                {unreadMsgs > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-orange-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{unreadMsgs}</span>
                )}
              </button>
              {msgOpen && (
                <div className="fixed right-4 top-16 w-[calc(100vw-32px)] max-w-[320px] z-50 bg-white rounded-xl shadow-lg border border-gray-100 lg:absolute lg:right-0 lg:top-full lg:mt-1 lg:w-80 lg:max-w-none" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <span className="text-sm font-bold text-gray-800">Messages</span>
                    <span className="text-xs text-gray-400">{unreadMsgs} unread</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {msgConvs.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-8">No conversations yet</p>
                    ) : msgConvs.map((c) => (
                      <Link key={c.key} href="/broker/messages" className="flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition">
                        <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-[#E85D04] font-bold text-xs shrink-0">
                          {(c.name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{c.name}</p>
                          <p className="text-xs text-gray-600 truncate">{c.lastMessage}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{convTime(c.lastAt)}</p>
                        </div>
                        {c.unread > 0 && (
                          <span className="min-w-4 h-4 px-1 bg-[#E85D04] text-white text-[9px] font-bold rounded-full flex items-center justify-center shrink-0">{c.unread}</span>
                        )}
                      </Link>
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
