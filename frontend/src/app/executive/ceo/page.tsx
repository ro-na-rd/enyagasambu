'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import api from '@/lib/api';
import { Chart as ChartJS, registerables } from 'chart.js';
import {
  DollarSign, Users, Package, Activity, Handshake, Award, FileText,
  CheckCircle, Sparkles, Calendar, Download, AlertTriangle, AlertCircle,
  Coins, Ticket, Tag, TrendingUp, Shield, Info, Gavel,
  ShoppingCart, Heart, RefreshCw, Filter
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

interface CEOStats {
  totalRevenue: number;
  totalUsers: number;
  activeListings: number;
  activeUsers30d: number;
  brokers: number;
  ambassadors: number;
  suppliers: number;
  openReports: number;
  pendingSupport: number;
  revenueByMonth: { label: string; value: number }[];
  userGrowth: { label: string; value: number }[];
  listingsByCategory: { label: string; value: number }[];
  listingsByType: { sale: number; rent: number; auction: number };
  subscriptions: { free: number; standard: number; premium: number };
  coins: { totalSold: number; totalUsed: number; revenue: number };
  alerts: { id: string; type: 'payment' | 'support' | 'report' | 'system'; message: string; severity: 'low' | 'medium' | 'high'; createdAt: string }[];
  reports: { id: string; listingTitle: string; reporterName: string; reason: string; status: string; createdAt: string }[];
}

export default function CEODashboardPage() {
  const [stats, setStats] = useState<CEOStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 12);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [exporting, setExporting] = useState(false);

  const revenueChartRef = useRef<HTMLCanvasElement>(null);
  const userChartRef = useRef<HTMLCanvasElement>(null);
  const categoryChartRef = useRef<HTMLCanvasElement>(null);
  const revenueInstance = useRef<ChartJS | null>(null);
  const userInstance = useRef<ChartJS | null>(null);
  const categoryInstance = useRef<ChartJS | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    api.get('/executive/ceo', { params: { startDate, endDate } })
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

    if (revenueChartRef.current) {
      if (revenueInstance.current) revenueInstance.current.destroy();
      const ctx = revenueChartRef.current.getContext('2d');
      if (ctx) {
        const chartData = stats.revenueByMonth || [];
        revenueInstance.current = new ChartJS(ctx, {
          type: 'bar',
          data: {
            labels: chartData.length ? chartData.map(r => r.label) : ['No data'],
            datasets: [{
              label: 'Revenue',
              data: chartData.length ? chartData.map(r => r.value) : [0],
              backgroundColor: (context: { chart: { ctx: CanvasRenderingContext2D } }) => {
                const g = context.chart.ctx.createLinearGradient(0, 0, 0, 200);
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
            plugins: { legend: { display: false } },
            scales: {
              x: { border: { display: false }, grid: { display: false }, ticks: { font: { size: 9 } } },
              y: { display: false, border: { display: false }, grid: { display: false } },
            },
          },
        });
      }
    }

    if (userChartRef.current) {
      if (userInstance.current) userInstance.current.destroy();
      const ctx = userChartRef.current.getContext('2d');
      if (ctx) {
        const chartData = stats.userGrowth || [];
        userInstance.current = new ChartJS(ctx, {
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

    if (categoryChartRef.current) {
      if (categoryInstance.current) categoryInstance.current.destroy();
      const ctx = categoryChartRef.current.getContext('2d');
      if (ctx) {
        const chartData = stats.listingsByCategory || [];
        categoryInstance.current = new ChartJS(ctx, {
          type: 'doughnut',
          data: {
            labels: chartData.length ? chartData.map(r => r.label) : ['No data'],
            datasets: [{
              data: chartData.length ? chartData.map(r => r.value) : [0],
              backgroundColor: [BRAND.navy, BRAND.orange, '#059669', '#7c3aed', '#d29922', '#f85149', '#58a6ff'],
              borderWidth: 0,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 12, font: { size: 10 } } } },
          },
        });
      }
    }

    return () => {
      revenueInstance.current?.destroy();
      userInstance.current?.destroy();
      categoryInstance.current?.destroy();
    };
  }, [stats]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data } = await api.get('/executive/export', { params: { role: 'ceo', startDate, endDate }, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ceo-report-${startDate}-${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch { /* empty */ } finally {
      setExporting(false);
    }
  };

  const kpiCards = [
    { label: 'Total Revenue', value: `RWF ${(stats?.totalRevenue ?? 0).toLocaleString()}`, icon: <DollarSign size={20} />, gradient: `linear-gradient(135deg, ${BRAND.navy}, #0f1e42)` },
    { label: 'Total Users', value: stats?.totalUsers ?? 0, icon: <Users size={20} />, gradient: `linear-gradient(135deg, ${BRAND.orange}, ${BRAND.orangeDark})` },
    { label: 'Active Users (30d)', value: stats?.activeUsers30d ?? 0, icon: <Activity size={20} />, gradient: 'linear-gradient(135deg, #7c3aed, #6d28d9)' },
    { label: 'Active Listings', value: stats?.activeListings ?? 0, icon: <Package size={20} />, gradient: 'linear-gradient(135deg, #059669, #047857)' },
  ];

  const secondaryCards = [
    { label: 'Brokers', value: stats?.brokers ?? 0, icon: <Handshake size={16} />, color: '#58a6ff', bg: 'rgba(88,166,255,0.1)' },
    { label: 'Ambassadors', value: stats?.ambassadors ?? 0, icon: <Award size={16} />, color: '#a371f7', bg: 'rgba(163,113,247,0.1)' },
    { label: 'Suppliers', value: stats?.suppliers ?? 0, icon: <Package size={16} />, color: '#d29922', bg: 'rgba(210,153,34,0.1)' },
    { label: 'Open Reports', value: stats?.openReports ?? 0, icon: <FileText size={16} />, color: '#f85149', bg: 'rgba(248,81,73,0.1)' },
    { label: 'Pending Support', value: stats?.pendingSupport ?? 0, icon: <CheckCircle size={16} />, color: '#2ea043', bg: 'rgba(46,160,67,0.1)' },
  ];

  const listingTypeCards = [
    { label: 'Sale', value: stats?.listingsByType?.sale ?? 0, icon: <ShoppingCart size={16} />, color: BRAND.orange, bg: `${BRAND.orange}15` },
    { label: 'Rent', value: stats?.listingsByType?.rent ?? 0, icon: <Tag size={16} />, color: '#059669', bg: 'rgba(5,150,105,0.1)' },
    { label: 'Auction', value: stats?.listingsByType?.auction ?? 0, icon: <Gavel size={16} />, color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
  ];

  const subscriptionCards = [
    { label: 'Free', value: stats?.subscriptions?.free ?? 0, icon: <Info size={16} />, color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
    { label: 'Standard', value: stats?.subscriptions?.standard ?? 0, icon: <TrendingUp size={16} />, color: BRAND.navy, bg: `${BRAND.navy}12` },
    { label: 'Premium', value: stats?.subscriptions?.premium ?? 0, icon: <Shield size={16} />, color: BRAND.orange, bg: `${BRAND.orange}15` },
  ];

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
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 rounded-2xl" style={{ background: '#ffffff' }} />)}
        </div>
        <div className="grid grid-cols-3 lg:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-20 rounded-xl" style={{ background: '#ffffff' }} />)}
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

      {/* Welcome Banner with Date Range & Export */}
      <div className="relative overflow-hidden rounded-2xl p-6 lg:p-8"
        style={{ background: `linear-gradient(135deg, ${BRAND.navyDark} 0%, ${BRAND.navy} 50%, #1a2d5a 100%)` }}>
        <div className="absolute top-0 right-0 w-72 h-72 opacity-15"
          style={{ background: `radial-gradient(circle, ${BRAND.orange}, transparent 70%)`, transform: 'translate(30%, -30%)' }} />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={18} style={{ color: BRAND.orange }} />
              <span className="text-xs font-bold tracking-widest uppercase" style={{ color: `${BRAND.orange}bb` }}>CEO Dashboard</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white mb-1 tracking-tight">Executive Overview</h1>
            <p className="text-sm text-white/40">High-level metrics for E-Nyagasambu.</p>
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
        {kpiCards.map((card) => (
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

      {/* Secondary KPI Cards */}
      <div className="grid grid-cols-3 lg:grid-cols-5 gap-3">
        {secondaryCards.map((card) => (
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

      {/* Listings by Type Breakdown */}
      <div className="rounded-2xl p-6" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="mb-5">
          <h2 className="text-sm font-bold text-gray-900">Listings by Type</h2>
          <p className="text-xs text-gray-600 mt-0.5">Breakdown of listings by listing type</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {listingTypeCards.map((card) => (
            <div key={card.label}
              className="flex items-center gap-3 p-4 rounded-xl transition-all"
              style={{ background: card.bg, border: `1px solid ${card.color}20` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${card.color}15`, color: card.color }}>
                {card.icon}
              </div>
              <div className="min-w-0">
                <p className="text-xl font-extrabold" style={{ color: card.color }}>{card.value}</p>
                <p className="text-xs font-medium" style={{ color: `${card.color}cc` }}>{card.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subscription Performance & Coins Summary */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Subscriptions */}
        <div className="rounded-2xl p-6" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-1">
              <Ticket size={16} style={{ color: BRAND.navy }} />
              <h2 className="text-sm font-bold text-gray-900">Subscription Performance</h2>
            </div>
            <p className="text-xs text-gray-600">Distribution of user subscription tiers</p>
          </div>
          <div className="space-y-3">
            {subscriptionCards.map((card) => {
              const total = (stats?.subscriptions?.free ?? 0) + (stats?.subscriptions?.standard ?? 0) + (stats?.subscriptions?.premium ?? 0);
              const pct = total > 0 ? ((card.value / total) * 100).toFixed(1) : '0';
              return (
                <div key={card.label} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: card.bg, color: card.color }}>
                    {card.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-gray-800">{card.label}</span>
                      <span className="text-xs font-bold" style={{ color: card.color }}>{card.value} ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: card.color }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Coin Sales & Usage */}
        <div className="rounded-2xl p-6" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-1">
              <Coins size={16} style={{ color: BRAND.orange }} />
              <h2 className="text-sm font-bold text-gray-900">Coin Sales & Usage</h2>
            </div>
            <p className="text-xs text-gray-600">Virtual coin economy summary</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-xl" style={{ background: `${BRAND.orange}08` }}>
              <DollarSign size={20} className="mx-auto mb-2" style={{ color: BRAND.orange }} />
              <p className="text-xl font-extrabold text-gray-900">{(stats?.coins?.totalSold ?? 0).toLocaleString()}</p>
              <p className="text-[11px] text-gray-600 font-medium mt-1">Coins Sold</p>
            </div>
            <div className="text-center p-4 rounded-xl" style={{ background: `${BRAND.navy}08` }}>
              <Activity size={20} className="mx-auto mb-2" style={{ color: BRAND.navy }} />
              <p className="text-xl font-extrabold text-gray-900">{(stats?.coins?.totalUsed ?? 0).toLocaleString()}</p>
              <p className="text-[11px] text-gray-600 font-medium mt-1">Coins Used</p>
            </div>
            <div className="text-center p-4 rounded-xl" style={{ background: 'rgba(5,150,105,0.06)' }}>
              <TrendingUp size={20} className="mx-auto mb-2" style={{ color: '#059669' }} />
              <p className="text-xl font-extrabold text-gray-900">RWF {(stats?.coins?.revenue ?? 0).toLocaleString()}</p>
              <p className="text-[11px] text-gray-600 font-medium mt-1">Coin Revenue</p>
            </div>
          </div>
          {/* Usage bar */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-gray-700">Usage Rate</span>
              <span className="text-[11px] font-bold text-gray-500">
                {((stats?.coins?.totalSold ?? 0) > 0
                  ? (((stats?.coins?.totalUsed ?? 0) / (stats?.coins?.totalSold ?? 1)) * 100).toFixed(1)
                  : '0')}%
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${((stats?.coins?.totalSold ?? 0) > 0
                    ? ((stats?.coins?.totalUsed ?? 0) / (stats?.coins?.totalSold ?? 1)) * 100
                    : 0)}%`,
                  background: `linear-gradient(90deg, ${BRAND.orange}, ${BRAND.orangeLight})`
                }} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl p-6" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
          <div className="mb-6">
            <h2 className="text-sm font-bold text-gray-900">Revenue Overview</h2>
            <p className="text-xs text-gray-600 mt-0.5">Monthly revenue trends</p>
          </div>
          <div className="h-56"><canvas ref={revenueChartRef} /></div>
        </div>
        <div className="rounded-2xl p-6" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
          <div className="mb-6">
            <h2 className="text-sm font-bold text-gray-900">User Growth</h2>
            <p className="text-xs text-gray-600 mt-0.5">New users over time</p>
          </div>
          <div className="h-56"><canvas ref={userChartRef} /></div>
        </div>
      </div>

      {/* Listings by Category */}
      <div className="rounded-2xl p-6" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="mb-6">
          <h2 className="text-sm font-bold text-gray-900">Listings by Category</h2>
          <p className="text-xs text-gray-600 mt-0.5">Distribution of active listings</p>
        </div>
        <div className="h-64"><canvas ref={categoryChartRef} /></div>
      </div>

      {/* Alerts & Reports */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* System Alerts */}
        <div className="rounded-2xl p-6" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={16} style={{ color: '#f85149' }} />
              <h2 className="text-sm font-bold text-gray-900">System Alerts</h2>
            </div>
            <p className="text-xs text-gray-600">Payment failures, high support tickets, and reported listings</p>
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

        {/* Listing Reports */}
        <div className="rounded-2xl p-6" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-1">
              <Heart size={16} style={{ color: '#f85149' }} />
              <h2 className="text-sm font-bold text-gray-900">Listing Reports</h2>
            </div>
            <p className="text-xs text-gray-600">Recent reports submitted by users on platform listings</p>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {(stats?.reports ?? []).length === 0 && (
              <div className="text-center py-8 text-gray-400 text-xs">No reports found</div>
            )}
            {(stats?.reports ?? []).map((report) => (
              <div key={report.id}
                className="p-3 rounded-xl transition-all"
                style={{ background: 'rgba(248,81,73,0.03)', border: '1px solid rgba(248,81,73,0.1)' }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-gray-900 truncate">{report.listingTitle}</p>
                    <p className="text-[11px] text-gray-600 mt-1">{report.reason}</p>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded shrink-0"
                    style={{
                      background: report.status === 'pending' ? 'rgba(210,153,34,0.1)' : 'rgba(46,160,67,0.1)',
                      color: report.status === 'pending' ? '#d29922' : '#2ea043'
                    }}>
                    {report.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] text-gray-500">by {report.reporterName}</span>
                  <span className="text-[10px] text-gray-400">-</span>
                  <span className="text-[10px] text-gray-500">
                    {new Date(report.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
