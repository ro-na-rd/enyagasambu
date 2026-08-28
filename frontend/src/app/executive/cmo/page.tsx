'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import api from '@/lib/api';
import { Chart as ChartJS, registerables } from 'chart.js';
import {
  Users, UserPlus, Package, Heart, Award, Handshake, ThumbsUp,
  MessageCircle, Gavel, Ticket, Sparkles, Calendar, Download,
  Filter, RefreshCw, AlertTriangle, AlertCircle, Info, TrendingUp,
  Search, Eye, Coins, CreditCard, Megaphone, Activity,
  CheckCircle, DollarSign, MousePointerClick, Clock
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

interface Alert {
  id: string;
  type: 'payment' | 'support' | 'report' | 'system';
  message: string;
  severity: 'low' | 'medium' | 'high';
  createdAt: string;
}

interface CMOStats {
  totalUsers: number;
  newUsersMonth: number;
  activeListings: number;
  referrals: number;
  ambassadors: number;
  brokers: number;
  likes: number;
  comments: number;
  auctionBids: number;
  activePromos: number;
  userGrowth: { label: string; value: number }[];
  engagementByCategory: { label: string; value: number }[];
  referralTrend: { label: string; value: number }[];
  userRetention: { newUsers: number; returningUsers: number; retentionRate: number };
  searchActivity: { totalSearches: number; uniqueSearchers: number; topCategories: { label: string; value: number }[] };
  subscriptionConversions: { freeToStandard: number; standardToPremium: number; totalConverted: number };
  coinConversions: { totalPurchases: number; totalRevenue: number; averagePerUser: number };
  announcementPerformance: { totalSent: number; openRate: number; clickRate: number };
  contentPageViews: { totalViews: number; uniqueViewers: number; averageTimeOnPage: number };
  alerts: Alert[];
}

export default function CMODashboardPage() {
  const [stats, setStats] = useState<CMOStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 12);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [exporting, setExporting] = useState(false);

  const growthChartRef = useRef<HTMLCanvasElement>(null);
  const engagementChartRef = useRef<HTMLCanvasElement>(null);
  const referralChartRef = useRef<HTMLCanvasElement>(null);
  const growthInstance = useRef<ChartJS | null>(null);
  const engagementInstance = useRef<ChartJS | null>(null);
  const referralInstance = useRef<ChartJS | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    api.get('/executive/cmo', { params: { startDate, endDate } })
      .then(({ data }) => setStats(data))
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!stats) return;

    ChartJS.defaults.color = '#6e7781';
    ChartJS.defaults.font.family = "'Inter', sans-serif";
    ChartJS.defaults.font.size = 10;

    if (growthChartRef.current) {
      if (growthInstance.current) growthInstance.current.destroy();
      const ctx = growthChartRef.current.getContext('2d');
      if (ctx) {
        const chartData = stats.userGrowth || [];
        growthInstance.current = new ChartJS(ctx, {
          type: 'line',
          data: {
            labels: chartData.length ? chartData.map(r => r.label) : ['No data'],
            datasets: [{
              label: 'Users',
              data: chartData.length ? chartData.map(r => r.value) : [0],
              borderColor: BRAND.navy,
              backgroundColor: `${BRAND.navy}20`,
              fill: true,
              tension: 0.4,
              pointRadius: 3,
              pointBackgroundColor: BRAND.navy,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { border: { display: false }, grid: { display: false }, ticks: { font: { size: 9 } } },
              y: { display: false, border: { display: false }, grid: { display: false } },
            },
          },
        });
      }
    }

    if (engagementChartRef.current) {
      if (engagementInstance.current) engagementInstance.current.destroy();
      const ctx = engagementChartRef.current.getContext('2d');
      if (ctx) {
        const chartData = stats.engagementByCategory || [];
        engagementInstance.current = new ChartJS(ctx, {
          type: 'bar',
          data: {
            labels: chartData.length ? chartData.map(r => r.label) : ['No data'],
            datasets: [{
              label: 'Engagement',
              data: chartData.length ? chartData.map(r => r.value) : [0],
              backgroundColor: BRAND.orange,
              borderRadius: 6,
              maxBarThickness: 24,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { border: { display: false }, grid: { display: false }, ticks: { font: { size: 9 } } },
              y: { display: false, border: { display: false }, grid: { display: false } },
            },
          },
        });
      }
    }

    if (referralChartRef.current) {
      if (referralInstance.current) referralInstance.current.destroy();
      const ctx = referralChartRef.current.getContext('2d');
      if (ctx) {
        const chartData = stats.referralTrend || [];
        referralInstance.current = new ChartJS(ctx, {
          type: 'bar',
          data: {
            labels: chartData.length ? chartData.map(r => r.label) : ['No data'],
            datasets: [{
              label: 'Referrals',
              data: chartData.length ? chartData.map(r => r.value) : [0],
              backgroundColor: '#7c3aed',
              borderRadius: 6,
              maxBarThickness: 24,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { border: { display: false }, grid: { display: false }, ticks: { font: { size: 9 } } },
              y: { display: false, border: { display: false }, grid: { display: false } },
            },
          },
        });
      }
    }

    return () => {
      growthInstance.current?.destroy();
      engagementInstance.current?.destroy();
      referralInstance.current?.destroy();
    };
  }, [stats]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data } = await api.get('/executive/export', { params: { role: 'CMO', startDate, endDate }, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `cmo-report-${startDate}-${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch { /* empty */ } finally {
      setExporting(false);
    }
  };

  const alertSeverityStyles: Record<string, { bg: string; border: string; icon: React.ReactNode }> = {
    high: { bg: 'rgba(248,81,73,0.06)', border: 'rgba(248,81,73,0.2)', icon: <AlertTriangle size={14} style={{ color: '#f85149' }} /> },
    medium: { bg: 'rgba(210,153,34,0.06)', border: 'rgba(210,153,34,0.2)', icon: <AlertCircle size={14} style={{ color: '#d29922' }} /> },
    low: { bg: 'rgba(88,166,255,0.06)', border: 'rgba(88,166,255,0.2)', icon: <Info size={14} style={{ color: '#58a6ff' }} /> },
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 rounded-2xl" style={{ background: '#ffffff' }} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 rounded-2xl" style={{ background: '#ffffff' }} />)}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-20 rounded-xl" style={{ background: '#ffffff' }} />)}
        </div>
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="h-64 rounded-2xl" style={{ background: '#ffffff' }} />
          <div className="h-64 rounded-2xl" style={{ background: '#ffffff' }} />
          <div className="h-64 rounded-2xl" style={{ background: '#ffffff' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px] animate-fadeInUp">

      {/* Welcome Banner with Date Range & Export */}
      <div className="relative overflow-hidden rounded-2xl p-6 lg:p-8"
        style={{ background: `linear-gradient(135deg, ${BRAND.navyDark} 0%, ${BRAND.navy} 50%, #1a2d5a 100%)` }}>
        <div className="absolute top-0 right-0 w-72 h-72 opacity-15"
          style={{ background: `radial-gradient(circle, ${BRAND.orange}, transparent 70%)`, transform: 'translate(30%, -30%)' }} />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={18} style={{ color: BRAND.orange }} />
              <span className="text-xs font-bold tracking-widest uppercase" style={{ color: `${BRAND.orange}bb` }}>CMO Dashboard</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white mb-1 tracking-tight">Marketing & Growth</h1>
            <p className="text-sm text-white/40">User growth, engagement, conversions, and referral metrics.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10">
              <Calendar size={14} className="text-white/50" />
              <span className="text-xs font-medium text-white/60">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
        {/* Date Range Filter */}
        <div className="relative z-10 mt-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 backdrop-blur-sm">
            <Filter size={14} className="text-white/50" />
            <span className="text-xs font-medium text-white/60">Date Range:</span>
          </div>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white/10 backdrop-blur-sm text-xs font-medium text-white/80 border border-white/10 focus:outline-none focus:border-white/30 transition-colors"
          />
          <span className="text-white/30 text-xs">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white/10 backdrop-blur-sm text-xs font-medium text-white/80 border border-white/10 focus:outline-none focus:border-white/30 transition-colors"
          />
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
            style={{ background: BRAND.orange, color: '#fff' }}
          >
            <RefreshCw size={12} /> Apply
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 disabled:opacity-50"
            style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
          >
            <Download size={12} /> {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: stats?.totalUsers ?? 0, icon: <Users size={20} />, gradient: `linear-gradient(135deg, ${BRAND.navy}, #0f1e42)` },
          { label: 'New Users (Month)', value: stats?.newUsersMonth ?? 0, icon: <UserPlus size={20} />, gradient: `linear-gradient(135deg, ${BRAND.orange}, ${BRAND.orangeDark})` },
          { label: 'Active Listings', value: stats?.activeListings ?? 0, icon: <Package size={20} />, gradient: 'linear-gradient(135deg, #059669, #047857)' },
          { label: 'Referrals', value: stats?.referrals ?? 0, icon: <Heart size={20} />, gradient: 'linear-gradient(135deg, #7c3aed, #6d28d9)' },
        ].map((card) => (
          <div key={card.label}
            className="group relative overflow-hidden rounded-2xl p-5 text-white hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
            style={{ background: card.gradient }}>
            <div className="absolute top-0 right-0 w-24 h-24 opacity-10" style={{ background: 'radial-gradient(circle, white, transparent 70%)', transform: 'translate(30%, -30%)' }} />
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/15 backdrop-blur-sm mb-4">
                {card.icon}
              </div>
              <p className="text-2xl lg:text-3xl font-extrabold tracking-tight">{card.value}</p>
              <p className="text-xs font-medium text-white/60 mt-1">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* User Retention Metrics */}
      <div className="rounded-2xl p-6" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <Users size={16} style={{ color: BRAND.navy }} />
            <h2 className="text-sm font-bold text-gray-900">User Retention Metrics</h2>
          </div>
          <p className="text-xs text-gray-600">New vs returning user breakdown</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-xl" style={{ background: `${BRAND.navy}08` }}>
            <UserPlus size={20} className="mx-auto mb-2" style={{ color: BRAND.navy }} />
            <p className="text-xl font-extrabold text-gray-900">{stats?.userRetention?.newUsers ?? 0}</p>
            <p className="text-[11px] text-gray-600 font-medium mt-1">New Users</p>
          </div>
          <div className="text-center p-4 rounded-xl" style={{ background: 'rgba(46,160,67,0.06)' }}>
            <Activity size={20} className="mx-auto mb-2" style={{ color: '#2ea043' }} />
            <p className="text-xl font-extrabold text-gray-900">{stats?.userRetention?.returningUsers ?? 0}</p>
            <p className="text-[11px] text-gray-600 font-medium mt-1">Returning Users</p>
          </div>
          <div className="text-center p-4 rounded-xl" style={{ background: `${BRAND.orange}06` }}>
            <TrendingUp size={20} className="mx-auto mb-2" style={{ color: BRAND.orange }} />
            <p className="text-xl font-extrabold text-gray-900">{stats?.userRetention?.retentionRate ?? 0}%</p>
            <p className="text-[11px] text-gray-600 font-medium mt-1">Retention Rate</p>
          </div>
        </div>
      </div>

      {/* Secondary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {[
          { label: 'Ambassadors', value: stats?.ambassadors ?? 0, icon: <Award size={16} />, color: '#a371f7', bg: 'rgba(163,113,247,0.1)' },
          { label: 'Brokers', value: stats?.brokers ?? 0, icon: <Handshake size={16} />, color: '#58a6ff', bg: 'rgba(88,166,255,0.1)' },
          { label: 'Likes', value: stats?.likes ?? 0, icon: <ThumbsUp size={16} />, color: '#f85149', bg: 'rgba(248,81,73,0.1)' },
          { label: 'Comments', value: stats?.comments ?? 0, icon: <MessageCircle size={16} />, color: '#2ea043', bg: 'rgba(46,160,67,0.1)' },
          { label: 'Auction Bids', value: stats?.auctionBids ?? 0, icon: <Gavel size={16} />, color: '#d29922', bg: 'rgba(210,153,34,0.1)' },
          { label: 'Active Promos', value: stats?.activePromos ?? 0, icon: <Ticket size={16} />, color: BRAND.orange, bg: `${BRAND.orange}15` },
        ].map((card) => (
          <div key={card.label}
            className="flex items-center gap-3 p-4 rounded-xl transition-all"
            style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: card.bg, color: card.color }}>
              {card.icon}
            </div>
            <div className="min-w-0">
              <p className="text-lg font-extrabold text-gray-900">{card.value}</p>
              <p className="text-[11px] text-gray-600 font-medium">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Category Activity */}
      <div className="rounded-2xl p-6" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <Search size={16} style={{ color: BRAND.navy }} />
            <h2 className="text-sm font-bold text-gray-900">Search & Category Activity</h2>
          </div>
          <p className="text-xs text-gray-600">User search behavior and top categories</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-xl" style={{ background: `${BRAND.navy}08` }}>
            <Search size={20} className="mx-auto mb-2" style={{ color: BRAND.navy }} />
            <p className="text-xl font-extrabold text-gray-900">{stats?.searchActivity?.totalSearches ?? 0}</p>
            <p className="text-[11px] text-gray-600 font-medium mt-1">Total Searches</p>
          </div>
          <div className="text-center p-4 rounded-xl" style={{ background: 'rgba(46,160,67,0.06)' }}>
            <Users size={20} className="mx-auto mb-2" style={{ color: '#2ea043' }} />
            <p className="text-xl font-extrabold text-gray-900">{stats?.searchActivity?.uniqueSearchers ?? 0}</p>
            <p className="text-[11px] text-gray-600 font-medium mt-1">Unique Searchers</p>
          </div>
          <div className="col-span-2 lg:col-span-1">
            <p className="text-xs font-bold text-gray-700 mb-2">Top Categories</p>
            <div className="space-y-2">
              {(stats?.searchActivity?.topCategories ?? []).slice(0, 4).map((cat, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">{cat.label}</span>
                  <span className="font-bold text-gray-900">{cat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Subscription & Coin Conversions */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Subscription Conversions */}
        <div className="rounded-2xl p-6" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard size={16} style={{ color: '#7c3aed' }} />
              <h2 className="text-sm font-bold text-gray-900">Subscription Conversions</h2>
            </div>
            <p className="text-xs text-gray-600">Upgrade conversion metrics</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-xl" style={{ background: 'rgba(124,58,237,0.06)' }}>
              <TrendingUp size={20} className="mx-auto mb-2" style={{ color: '#7c3aed' }} />
              <p className="text-xl font-extrabold text-gray-900">{stats?.subscriptionConversions?.freeToStandard ?? 0}</p>
              <p className="text-[11px] text-gray-600 font-medium mt-1">Free to Standard</p>
            </div>
            <div className="text-center p-4 rounded-xl" style={{ background: `${BRAND.orange}06` }}>
              <TrendingUp size={20} className="mx-auto mb-2" style={{ color: BRAND.orange }} />
              <p className="text-xl font-extrabold text-gray-900">{stats?.subscriptionConversions?.standardToPremium ?? 0}</p>
              <p className="text-[11px] text-gray-600 font-medium mt-1">Standard to Premium</p>
            </div>
            <div className="text-center p-4 rounded-xl" style={{ background: 'rgba(46,160,67,0.06)' }}>
              <CheckCircle size={20} className="mx-auto mb-2" style={{ color: '#2ea043' }} />
              <p className="text-xl font-extrabold text-gray-900">{stats?.subscriptionConversions?.totalConverted ?? 0}</p>
              <p className="text-[11px] text-gray-600 font-medium mt-1">Total Converted</p>
            </div>
          </div>
        </div>

        {/* Coin Purchase Conversions */}
        <div className="rounded-2xl p-6" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-1">
              <Coins size={16} style={{ color: BRAND.orange }} />
              <h2 className="text-sm font-bold text-gray-900">Coin-Purchase Conversions</h2>
            </div>
            <p className="text-xs text-gray-600">Virtual coin economy conversions</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-xl" style={{ background: `${BRAND.orange}06` }}>
              <Coins size={20} className="mx-auto mb-2" style={{ color: BRAND.orange }} />
              <p className="text-xl font-extrabold text-gray-900">{(stats?.coinConversions?.totalPurchases ?? 0).toLocaleString()}</p>
              <p className="text-[11px] text-gray-600 font-medium mt-1">Total Purchases</p>
            </div>
            <div className="text-center p-4 rounded-xl" style={{ background: `${BRAND.navy}08` }}>
              <DollarSign size={20} className="mx-auto mb-2" style={{ color: BRAND.navy }} />
              <p className="text-xl font-extrabold text-gray-900">RWF {(stats?.coinConversions?.totalRevenue ?? 0).toLocaleString()}</p>
              <p className="text-[11px] text-gray-600 font-medium mt-1">Revenue</p>
            </div>
            <div className="text-center p-4 rounded-xl" style={{ background: 'rgba(46,160,67,0.06)' }}>
              <Activity size={20} className="mx-auto mb-2" style={{ color: '#2ea043' }} />
              <p className="text-xl font-extrabold text-gray-900">{(stats?.coinConversions?.averagePerUser ?? 0).toFixed(1)}</p>
              <p className="text-[11px] text-gray-600 font-medium mt-1">Avg per User</p>
            </div>
          </div>
        </div>
      </div>

      {/* Announcement Performance & Content Page Views */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Announcement Performance */}
        <div className="rounded-2xl p-6" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-1">
              <Megaphone size={16} style={{ color: BRAND.navy }} />
              <h2 className="text-sm font-bold text-gray-900">Announcement Performance</h2>
            </div>
            <p className="text-xs text-gray-600">Announcement delivery and engagement</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-xl" style={{ background: `${BRAND.navy}08` }}>
              <Megaphone size={20} className="mx-auto mb-2" style={{ color: BRAND.navy }} />
              <p className="text-xl font-extrabold text-gray-900">{stats?.announcementPerformance?.totalSent ?? 0}</p>
              <p className="text-[11px] text-gray-600 font-medium mt-1">Total Sent</p>
            </div>
            <div className="text-center p-4 rounded-xl" style={{ background: 'rgba(46,160,67,0.06)' }}>
              <Eye size={20} className="mx-auto mb-2" style={{ color: '#2ea043' }} />
              <p className="text-xl font-extrabold text-gray-900">{stats?.announcementPerformance?.openRate ?? 0}%</p>
              <p className="text-[11px] text-gray-600 font-medium mt-1">Open Rate</p>
            </div>
            <div className="text-center p-4 rounded-xl" style={{ background: `${BRAND.orange}06` }}>
              <MousePointerClick size={20} className="mx-auto mb-2" style={{ color: BRAND.orange }} />
              <p className="text-xl font-extrabold text-gray-900">{stats?.announcementPerformance?.clickRate ?? 0}%</p>
              <p className="text-[11px] text-gray-600 font-medium mt-1">Click Rate</p>
            </div>
          </div>
        </div>

        {/* Content Page Views */}
        <div className="rounded-2xl p-6" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-1">
              <Eye size={16} style={{ color: '#7c3aed' }} />
              <h2 className="text-sm font-bold text-gray-900">Content Page Views</h2>
            </div>
            <p className="text-xs text-gray-600">Content engagement metrics</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-xl" style={{ background: 'rgba(124,58,237,0.06)' }}>
              <Eye size={20} className="mx-auto mb-2" style={{ color: '#7c3aed' }} />
              <p className="text-xl font-extrabold text-gray-900">{(stats?.contentPageViews?.totalViews ?? 0).toLocaleString()}</p>
              <p className="text-[11px] text-gray-600 font-medium mt-1">Total Views</p>
            </div>
            <div className="text-center p-4 rounded-xl" style={{ background: `${BRAND.navy}08` }}>
              <Users size={20} className="mx-auto mb-2" style={{ color: BRAND.navy }} />
              <p className="text-xl font-extrabold text-gray-900">{(stats?.contentPageViews?.uniqueViewers ?? 0).toLocaleString()}</p>
              <p className="text-[11px] text-gray-600 font-medium mt-1">Unique Viewers</p>
            </div>
            <div className="text-center p-4 rounded-xl" style={{ background: `${BRAND.orange}06` }}>
              <Clock size={20} className="mx-auto mb-2" style={{ color: BRAND.orange }} />
              <p className="text-xl font-extrabold text-gray-900">{stats?.contentPageViews?.averageTimeOnPage ?? 0}s</p>
              <p className="text-[11px] text-gray-600 font-medium mt-1">Avg Time on Page</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="rounded-2xl p-6" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
          <div className="mb-6">
            <h2 className="text-sm font-bold text-gray-900">User Growth</h2>
            <p className="text-xs text-gray-600 mt-0.5">New user registrations</p>
          </div>
          <div className="h-56"><canvas ref={growthChartRef} /></div>
        </div>
        <div className="rounded-2xl p-6" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
          <div className="mb-6">
            <h2 className="text-sm font-bold text-gray-900">Engagement by Category</h2>
            <p className="text-xs text-gray-600 mt-0.5">Likes and comments per category</p>
          </div>
          <div className="h-56"><canvas ref={engagementChartRef} /></div>
        </div>
        <div className="rounded-2xl p-6" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
          <div className="mb-6">
            <h2 className="text-sm font-bold text-gray-900">Referral Trend</h2>
            <p className="text-xs text-gray-600 mt-0.5">Referrals over time</p>
          </div>
          <div className="h-56"><canvas ref={referralChartRef} /></div>
        </div>
      </div>

      {/* Alerts */}
      <div className="rounded-2xl p-6" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={16} style={{ color: '#f85149' }} />
            <h2 className="text-sm font-bold text-gray-900">Marketing Alerts</h2>
          </div>
          <p className="text-xs text-gray-600">System alerts and engagement notifications</p>
        </div>
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {(stats?.alerts ?? []).length === 0 && (
            <div className="text-center py-8 text-gray-400 text-xs">No alerts at this time</div>
          )}
          {(stats?.alerts ?? []).map((alert) => {
            const styles = alertSeverityStyles[alert.severity] || alertSeverityStyles.low;
            return (
              <div key={alert.id}
                className="flex items-start gap-3 p-3 rounded-xl transition-all"
                style={{ background: styles.bg, border: `1px solid ${styles.border}` }}>
                <div className="mt-0.5 shrink-0">{styles.icon}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-gray-800 leading-relaxed">{alert.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
                      style={{ background: styles.border, color: styles.border.replace('0.2', '1') }}>
                      {alert.severity}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {new Date(alert.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
