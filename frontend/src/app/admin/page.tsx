'use client';
import { useEffect, useState, useRef } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { Chart as ChartJS, registerables } from 'chart.js';
import {
  Users, Package, Coins, Phone, Handshake, Store, Award, Ban,
  LayoutDashboard, Folder, Ticket, CheckCircle, User,
  ArrowUpRight, ChevronRight, Calendar, Sparkles, AlertTriangle
} from '@/lib/icons';

ChartJS.register(...registerables);

const BRAND = {
  navy: '#0f1e42',
  navyLight: '#1a2d5a',
  navyDark: '#0a1430',
  orange: '#E85D04',
  orangeLight: '#FF8A3D',
  orangeDark: '#c44d00',
};

interface Stats {
  totalUsers: number; totalSellers: number; totalBrokers: number; totalAmbassadors: number;
  activeListings: number; disabledListings: number; totalListings: number; totalUnlocks: number;
  coinsEarned: number; coinsFromListings: number; coinsFromBoosts: number;
  pendingBrokerCerts: number; pendingAmbassadorCerts: number;
}
interface RecentUser { id: number; name: string; email: string; coins: number; role: string; created_at: string; }
interface RecentListing { id: number; title: string; status: string; seller_name: string; created_at: string; }

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentListings, setRecentListings] = useState<RecentListing[]>([]);
  const [participants, setParticipants] = useState<Record<string, number> | null>(null);
  const [period, setPeriod] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<ChartJS | null>(null);

  useEffect(() => {setLoading(true);
    api.get('/admin/stats')
      .then((s) => {
        setStats(s.data.stats);
        setRecentUsers(s.data.recentUsers);
        setRecentListings(s.data.recentListings);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api.get(`/admin/participants?period=${period}`)
      .then((p) => setParticipants(p.data));
  }, [period]);

  // Chart.js - Revenue chart
  useEffect(() => {
    if (!chartRef.current) return;

    api.get(`/admin/revenue-chart?period=${period}`)
      .then(({ data }) => {
        if (chartInstance.current) {
          chartInstance.current.destroy();
        }

        const chartData = data.chart || [];
        const labels = chartData.map((r: { label: string }) => r.label);
        const values = chartData.map((r: { value: number }) => r.value || 0);

        const ctx = chartRef.current?.getContext('2d');
        if (!ctx) return;

        ChartJS.defaults.color = '#6e7781';
        ChartJS.defaults.font.family = "'Inter', sans-serif";
        ChartJS.defaults.font.size = 10;

        chartInstance.current = new ChartJS(ctx, {
          type: 'bar',
          data: {
            labels: labels.length ? labels : ['No data'],
            datasets: [{
              label: 'Revenue',
              data: values.length ? values : [0],
              backgroundColor: (ctx: { chart: { ctx: CanvasRenderingContext2D } }) => {
                const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 200);
                g.addColorStop(0, BRAND.orange);
                g.addColorStop(1, BRAND.orangeDark);
                return g;
              },
              borderRadius: 6,
              maxBarThickness: 24,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
            },
            scales: {
              x: {
                border: { display: false },
                grid: { display: false },
                ticks: { color: '#484f58', font: { size: 9 } },
              },
              y: {
                display: false,
                border: { display: false },
                grid: { display: false },
              },
            },
          },
        });
      })
      .catch(() => {
        // Silently handle — chart just won't render
      });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [stats, period]);

  const totalRevenue = (stats?.coinsEarned ?? 0) + (stats?.coinsFromListings ?? 0) + (stats?.coinsFromBoosts ?? 0);
  const pendingCerts = (stats?.pendingBrokerCerts ?? 0) + (stats?.pendingAmbassadorCerts ?? 0);

  const primaryCards = [
    { label: 'Total Users', value: stats?.totalUsers ?? 0, icon: <Users size={20} />, gradient: `linear-gradient(135deg, ${BRAND.navy}, #0f1e42)`, link: '/admin/users', change: '+12%' },
    { label: 'Active Listings', value: stats?.activeListings ?? 0, icon: <Package size={20} />, gradient: `linear-gradient(135deg, ${BRAND.orange}, ${BRAND.orangeDark})`, link: '/admin/listings', change: '+8%' },
    { label: 'Revenue (coins)', value: totalRevenue.toLocaleString(), icon: <Coins size={20} />, gradient: 'linear-gradient(135deg, #059669, #047857)', link: '/admin/reports', change: '+24%' },
    { label: 'Connects', value: stats?.totalUnlocks ?? 0, icon: <Phone size={20} />, gradient: 'linear-gradient(135deg, #7c3aed, #6d28d9)', link: '/admin/reports', change: '+15%' },
  ];

  const secondaryCards = [
    { label: 'Sellers', value: stats?.totalSellers ?? 0, icon: <Store size={16} />, color: '#d29922', bg: 'rgba(210,153,34,0.1)', link: '/admin/users?role=seller' },
    { label: 'Brokers', value: stats?.totalBrokers ?? 0, icon: <Handshake size={16} />, color: '#58a6ff', bg: 'rgba(88,166,255,0.1)', link: '/admin/users?role=broker' },
    { label: 'Ambassadors', value: stats?.totalAmbassadors ?? 0, icon: <Award size={16} />, color: '#a371f7', bg: 'rgba(163,113,247,0.1)', link: '/admin/users?role=ambassador' },
    { label: 'Disabled', value: stats?.disabledListings ?? 0, icon: <Ban size={16} />, color: '#f85149', bg: 'rgba(248,81,73,0.1)', link: '/admin/listings?status=disabled' },
  ];

  const quickActions = [
    { label: 'Manage Users', icon: <Users size={16} />, href: '/admin/users', color: BRAND.navy },
    { label: 'Manage Listings', icon: <Package size={16} />, href: '/admin/listings', color: BRAND.orange },
    { label: 'Categories', icon: <Folder size={16} />, href: '/admin/categories', color: '#2ea043' },
    { label: 'Promo Codes', icon: <Ticket size={16} />, href: '/admin/promos', color: '#a371f7' },
    { label: 'Settings', icon: <LayoutDashboard size={16} />, href: '/admin/settings', color: '#6e7781' },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 rounded-2xl" style={{ background: '#ffffff' }} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 rounded-2xl" style={{ background: '#ffffff' }} />)}
        </div>
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="h-64 rounded-2xl lg:col-span-2" style={{ background: '#ffffff' }} />
          <div className="h-64 rounded-2xl" style={{ background: '#ffffff' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px] animate-fadeInUp">

      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl p-6 lg:p-8"
        style={{ background: `linear-gradient(135deg, ${BRAND.navyDark} 0%, ${BRAND.navy} 50%, #1a2d5a 100%)` }}>
        <div className="absolute top-0 right-0 w-72 h-72 opacity-15"
          style={{ background: `radial-gradient(circle, ${BRAND.orange}, transparent 70%)`, transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-1/3 w-96 h-32 opacity-8"
          style={{ background: `linear-gradient(90deg, transparent, ${BRAND.orange}, transparent)` }} />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={18} style={{ color: BRAND.orange }} />
              <span className="text-xs font-bold tracking-widest uppercase" style={{ color: `${BRAND.orange}bb` }}>Admin Dashboard</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white mb-1 tracking-tight">Welcome back, Admin</h1>
            <p className="text-sm text-white/40">Here&apos;s what&apos;s happening with E-Nyagasambu today.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 border-gray-200">
              <Calendar size={14} className="text-white/30" />
              <span className="text-xs font-medium text-white/50">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Certificates Alert */}
      {pendingCerts > 0 && (
        <Link href="/admin/certificates"
          className="flex items-center gap-4 p-4 rounded-2xl border transition-all hover:shadow-lg"
          style={{ background: 'linear-gradient(135deg, rgba(210,153,34,0.1), rgba(210,153,34,0.05))', borderColor: 'rgba(210,153,34,0.3)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(210,153,34,0.15)' }}>
            <AlertTriangle size={20} style={{ color: '#d29922' }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-400">{pendingCerts} pending certificate request{pendingCerts > 1 ? 's' : ''}</p>
            <p className="text-xs text-amber-500/70">
              {stats?.pendingBrokerCerts ?? 0} broker, {stats?.pendingAmbassadorCerts ?? 0} ambassador — click to review
            </p>
          </div>
          <ChevronRight size={18} className="text-amber-500/50" />
        </Link>
      )}

      {/* Primary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {primaryCards.map((card) => (
          <Link key={card.label} href={card.link}
            className="group relative overflow-hidden rounded-2xl p-5 text-white hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
            style={{ background: card.gradient }}>
            <div className="absolute top-0 right-0 w-24 h-24 opacity-10" style={{ background: 'radial-gradient(circle, white, transparent 70%)', transform: 'translate(30%, -30%)' }} />
            <div className="absolute bottom-0 left-0 w-full h-1/2 opacity-5" style={{ background: 'linear-gradient(to top, white, transparent)' }} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/15 backdrop-blur-sm">
                  {card.icon}
                </div>
                <ArrowUpRight size={16} className="text-white/30 group-hover:text-white/70 transition-colors" />
              </div>
              <p className="text-2xl lg:text-3xl font-extrabold tracking-tight">{card.value}</p>
              <p className="text-xs font-medium text-white/60 mt-1">{card.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {secondaryCards.map((card) => (
          <Link key={card.label} href={card.link}
            className="flex items-center gap-3 p-4 rounded-xl transition-all group"
            style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: card.bg, color: card.color }}>
              {card.icon}
            </div>
            <div className="min-w-0">
              <p className="text-lg font-extrabold text-gray-900">{card.value}</p>
              <p className="text-[11px] text-gray-600 font-medium">{card.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Revenue Chart - 2 cols */}
        <div className="lg:col-span-2 rounded-2xl p-6"
          style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Revenue Overview</h2>
              <p className="text-xs text-gray-600 mt-0.5">Monthly revenue trends</p>
            </div>
            <select value={period} onChange={(e) => setPeriod(e.target.value)}
              className="border rounded-xl px-3 py-1.5 text-xs font-medium text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              style={{ background: '#f6f8fa', borderColor: '#d0d7de' }}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="all">All Time</option>
            </select>
          </div>
          <div className="h-56">
            <canvas ref={chartRef} />
          </div>
        </div>

        {/* Market Participants */}
        <div className="rounded-2xl p-6"
          style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Participants</h2>
              <p className="text-xs text-gray-600 mt-0.5">Market activity overview</p>
            </div>
          </div>
          {participants ? (
            <div className="space-y-3">
              {[
                { label: 'Buyers', value: participants.buyers || 0, icon: <User size={14} />, color: BRAND.navyLight, pct: Math.round(((participants.buyers || 0) / Math.max((participants.buyers || 0) + (participants.sellers || 0) + (participants.brokers || 0), 1)) * 100) },
                { label: 'Sellers', value: participants.sellers || 0, icon: <Store size={14} />, color: '#d29922', pct: Math.round(((participants.sellers || 0) / Math.max((participants.buyers || 0) + (participants.sellers || 0) + (participants.brokers || 0), 1)) * 100) },
                { label: 'Brokers', value: participants.brokers || 0, icon: <Handshake size={14} />, color: '#58a6ff', pct: Math.round(((participants.brokers || 0) / Math.max((participants.buyers || 0) + (participants.sellers || 0) + (participants.brokers || 0), 1)) * 100) },
                { label: 'Ambassadors', value: participants.ambassadors || 0, icon: <Award size={14} />, color: '#a371f7', pct: 0 },
                { label: 'Active Listings', value: participants.totalActiveListings || 0, icon: <Package size={14} />, color: BRAND.orange, pct: 0 },
                { label: 'Completed Deals', value: participants.completedDeals || 0, icon: <CheckCircle size={14} />, color: '#2ea043', pct: 0 },
              ].map((p) => (
                <div key={p.label} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${p.color}15`, color: p.color }}>
                    {p.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-medium text-gray-500">{p.label}</span>
                      <span className="text-[13px] font-extrabold text-gray-900">{p.value}</span>
                    </div>
                    {p.pct > 0 && (
                      <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ background: '#f6f8fa' }}>
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${p.pct}%`, background: p.color }} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-600 text-sm">Loading...</div>
          )}
        </div>
      </div>

      {/* Quick Actions + Recent Activity */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Quick Actions */}
        <div className="rounded-2xl p-6"
          style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
          <h2 className="text-sm font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {quickActions.map((action) => (
              <Link key={action.label} href={action.href}
                className="flex items-center gap-3 p-3 rounded-xl transition-all group hover:bg-gray-50">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${action.color}15`, color: action.color }}>
                  {action.icon}
                </div>
                <span className="text-[13px] font-medium text-gray-700 group-hover:text-white">{action.label}</span>
                <ChevronRight size={14} className="ml-auto text-gray-700 group-hover:text-gray-500 transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Users */}
        <div className="rounded-2xl p-6"
          style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900">Recent Users</h2>
            <Link href="/admin/users"
              className="text-[11px] font-bold px-3 py-1 rounded-lg transition"
              style={{ color: BRAND.orange, background: `${BRAND.orange}10` }}>View all</Link>
          </div>
          {recentUsers.length === 0 ? (
            <p className="text-sm text-gray-600 text-center py-8">No users yet</p>
          ) : (
            <div className="space-y-1">
              {recentUsers.slice(0, 5).map((u) => (
                <div key={u.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ background: `linear-gradient(135deg, ${BRAND.navy}, ${BRAND.navyLight})` }}>
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-gray-800 truncate">{u.name}</p>
                    <p className="text-[10px] text-gray-600 truncate">{u.email}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                    style={{ background: `${BRAND.orange}15`, color: BRAND.orange }}>
                    {u.coins}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Listings */}
        <div className="rounded-2xl p-6"
          style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900">Recent Listings</h2>
            <Link href="/admin/listings"
              className="text-[11px] font-bold px-3 py-1 rounded-lg transition"
              style={{ color: BRAND.orange, background: `${BRAND.orange}10` }}>View all</Link>
          </div>
          {recentListings.length === 0 ? (
            <p className="text-sm text-gray-600 text-center py-8">No listings yet</p>
          ) : (
            <div className="space-y-1">
              {recentListings.slice(0, 5).map((l) => (
                <div key={l.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      background: l.status === 'active' ? 'rgba(46,160,67,0.15)' :
                                  l.status === 'disabled' ? 'rgba(248,81,73,0.15)' : 'rgba(139,148,158,0.15)',
                      color: l.status === 'active' ? '#2ea043' :
                             l.status === 'disabled' ? '#f85149' : '#6e7781'
                    }}>
                    <Package size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-gray-800 truncate">{l.title}</p>
                    <p className="text-[10px] text-gray-600">by {l.seller_name}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 capitalize"
                    style={{
                      background: l.status === 'active' ? 'rgba(46,160,67,0.15)' :
                                  l.status === 'disabled' ? 'rgba(248,81,73,0.15)' : 'rgba(139,148,158,0.15)',
                      color: l.status === 'active' ? '#2ea043' :
                             l.status === 'disabled' ? '#f85149' : '#6e7781'
                    }}>{l.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
