'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import api from '@/lib/api';
import { Chart as ChartJS, registerables } from 'chart.js';
import {
  DollarSign, Package, Link, CreditCard, TrendingUp, Heart,
  AlertTriangle, Ban, RefreshCw, Clock, CheckCircle, Sparkles, Calendar,
  Download, Filter, AlertCircle, Info, Coins
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

interface CFOStats {
  totalRevenue: number;
  listingFees: number;
  connectFees: number;
  subscriptionRevenue: number;
  boostRevenue: number;
  donations: number;
  totalPayments: number;
  failedPayments: number;
  refunded: number;
  pendingPayments: number;
  activeSubscriptions: number;
  pendingApprovals: number;
  successfulPayments: number;
  revenueByMonth: { label: string; value: number }[];
  revenueByType: { label: string; value: number }[];
  paymentsByStatus: { label: string; value: number }[];
  recentRefunds: { id: number; amount_rwf: number; status: string; created_at: string }[];
  alerts: { id: string; type: 'payment' | 'support' | 'report' | 'system'; message: string; severity: 'low' | 'medium' | 'high'; createdAt: string }[];
}

export default function CFODashboardPage() {
  const [stats, setStats] = useState<CFOStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 12);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [exporting, setExporting] = useState(false);

  const monthChartRef = useRef<HTMLCanvasElement>(null);
  const typeChartRef = useRef<HTMLCanvasElement>(null);
  const statusChartRef = useRef<HTMLCanvasElement>(null);
  const monthInstance = useRef<ChartJS | null>(null);
  const typeInstance = useRef<ChartJS | null>(null);
  const statusInstance = useRef<ChartJS | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    api.get('/executive/cfo', { params: { startDate, endDate } })
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

    if (monthChartRef.current) {
      if (monthInstance.current) monthInstance.current.destroy();
      const ctx = monthChartRef.current.getContext('2d');
      if (ctx) {
        const chartData = stats.revenueByMonth || [];
        monthInstance.current = new ChartJS(ctx, {
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

    if (typeChartRef.current) {
      if (typeInstance.current) typeInstance.current.destroy();
      const ctx = typeChartRef.current.getContext('2d');
      if (ctx) {
        const chartData = stats.revenueByType || [];
        typeInstance.current = new ChartJS(ctx, {
          type: 'doughnut',
          data: {
            labels: chartData.length ? chartData.map(r => r.label) : ['No data'],
            datasets: [{
              data: chartData.length ? chartData.map(r => r.value) : [0],
              backgroundColor: [BRAND.navy, BRAND.orange, '#059669', '#7c3aed', '#d29922', '#f85149'],
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

    if (statusChartRef.current) {
      if (statusInstance.current) statusInstance.current.destroy();
      const ctx = statusChartRef.current.getContext('2d');
      if (ctx) {
        const chartData = stats.paymentsByStatus || [];
        statusInstance.current = new ChartJS(ctx, {
          type: 'doughnut',
          data: {
            labels: chartData.length ? chartData.map(r => r.label) : ['No data'],
            datasets: [{
              data: chartData.length ? chartData.map(r => r.value) : [0],
              backgroundColor: ['#2ea043', '#d29922', '#f85149', '#58a6ff', '#a371f7'],
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
      monthInstance.current?.destroy();
      typeInstance.current?.destroy();
      statusInstance.current?.destroy();
    };
  }, [stats]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data } = await api.get('/executive/export', { params: { role: 'cfo', startDate, endDate }, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `cfo-report-${startDate}-${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch { /* empty */ } finally {
      setExporting(false);
    }
  };

  const kpiCards = [
    { label: 'Total Revenue', value: (stats?.totalRevenue ?? 0).toLocaleString(), icon: <DollarSign size={20} />, gradient: `linear-gradient(135deg, ${BRAND.navy}, #0f1e42)` },
    { label: 'Listing Fees', value: (stats?.listingFees ?? 0).toLocaleString(), icon: <Package size={20} />, gradient: `linear-gradient(135deg, ${BRAND.orange}, ${BRAND.orangeDark})` },
    { label: 'Connect Fees', value: (stats?.connectFees ?? 0).toLocaleString(), icon: <Link size={20} />, gradient: 'linear-gradient(135deg, #059669, #047857)' },
    { label: 'Subscriptions', value: (stats?.subscriptionRevenue ?? 0).toLocaleString(), icon: <CreditCard size={20} />, gradient: 'linear-gradient(135deg, #7c3aed, #6d28d9)' },
  ];

  const secondaryCards = [
    { label: 'Boost Revenue', value: (stats?.boostRevenue ?? 0).toLocaleString(), icon: <TrendingUp size={16} />, color: '#58a6ff', bg: 'rgba(88,166,255,0.1)' },
    { label: 'Donations', value: (stats?.donations ?? 0).toLocaleString(), icon: <Heart size={16} />, color: '#f85149', bg: 'rgba(248,81,73,0.1)' },
    { label: 'Successful Payments', value: stats?.successfulPayments ?? 0, icon: <CheckCircle size={16} />, color: '#2ea043', bg: 'rgba(46,160,67,0.1)' },
    { label: 'Failed Payments', value: stats?.failedPayments ?? 0, icon: <AlertTriangle size={16} />, color: '#f85149', bg: 'rgba(248,81,73,0.1)' },
    { label: 'Refunded', value: stats?.refunded ?? 0, icon: <RefreshCw size={16} />, color: '#d29922', bg: 'rgba(210,153,34,0.1)' },
    { label: 'Pending Payments', value: stats?.pendingPayments ?? 0, icon: <Clock size={16} />, color: '#a371f7', bg: 'rgba(163,113,247,0.1)' },
    { label: 'Active Subscriptions', value: stats?.activeSubscriptions ?? 0, icon: <CreditCard size={16} />, color: BRAND.navyLight, bg: `${BRAND.navy}15` },
    { label: 'Pending Approvals', value: stats?.pendingApprovals ?? 0, icon: <Ban size={16} />, color: '#6e7781', bg: 'rgba(110,119,129,0.1)' },
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-20 rounded-xl" style={{ background: '#ffffff' }} />)}
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
              <span className="text-xs font-bold tracking-widest uppercase" style={{ color: `${BRAND.orange}bb` }}>CFO Dashboard</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white mb-1 tracking-tight">Finance & Revenue</h1>
            <p className="text-sm text-white/40">Revenue streams, payments, and financial health.</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10">
            <Calendar size={14} className="text-white/50" />
            <span className="text-xs font-medium text-white/60">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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

      {/* Charts Row: Revenue by Month, Revenue by Type, Payment Status */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="rounded-2xl p-6" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
          <div className="mb-6">
            <h2 className="text-sm font-bold text-gray-900">Revenue by Month</h2>
            <p className="text-xs text-gray-600 mt-0.5">Monthly revenue trends</p>
          </div>
          <div className="h-56"><canvas ref={monthChartRef} /></div>
        </div>
        <div className="rounded-2xl p-6" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
          <div className="mb-6">
            <h2 className="text-sm font-bold text-gray-900">Revenue by Type</h2>
            <p className="text-xs text-gray-600 mt-0.5">Revenue stream breakdown</p>
          </div>
          <div className="h-56"><canvas ref={typeChartRef} /></div>
        </div>
        <div className="rounded-2xl p-6" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
          <div className="mb-6">
            <h2 className="text-sm font-bold text-gray-900">Payment Status</h2>
            <p className="text-xs text-gray-600 mt-0.5">Payments by status</p>
          </div>
          <div className="h-56"><canvas ref={statusChartRef} /></div>
        </div>
      </div>

      {/* Revenue Breakdown Table */}
      <div className="rounded-2xl p-6" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="mb-5">
          <h2 className="text-sm font-bold text-gray-900">Revenue Breakdown</h2>
          <p className="text-xs text-gray-600 mt-0.5">Detailed revenue by category</p>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Listing Fees', value: stats?.listingFees ?? 0, color: BRAND.navy },
            { label: 'Connect Fees', value: stats?.connectFees ?? 0, color: BRAND.orange },
            { label: 'Subscription Revenue', value: stats?.subscriptionRevenue ?? 0, color: '#7c3aed' },
            { label: 'Boost Revenue', value: stats?.boostRevenue ?? 0, color: '#58a6ff' },
            { label: 'Donations', value: stats?.donations ?? 0, color: '#f85149' },
          ].map((item) => {
            const total = stats?.totalRevenue ?? 1;
            const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
            return (
              <div key={item.label} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: item.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-gray-800">{item.label}</span>
                    <span className="text-xs font-bold" style={{ color: item.color }}>
                      RWF {item.value.toLocaleString()} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: item.color }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Refunds & Financial Alerts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Refunds */}
        <div className="rounded-2xl p-6" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-1">
              <RefreshCw size={16} style={{ color: '#d29922' }} />
              <h2 className="text-sm font-bold text-gray-900">Recent Refunds</h2>
            </div>
            <p className="text-xs text-gray-600">Latest refunded transactions</p>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {(stats?.recentRefunds ?? []).length === 0 && (
              <div className="text-center py-8 text-gray-400 text-xs">No recent refunds</div>
            )}
            {(stats?.recentRefunds ?? []).map((refund) => (
              <div key={refund.id}
                className="flex items-center justify-between p-3 rounded-xl transition-all"
                style={{ background: 'rgba(210,153,34,0.04)', border: '1px solid rgba(210,153,34,0.1)' }}>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-gray-800">Refund #{refund.id}</p>
                  <span className="text-[10px] text-gray-500">
                    {new Date(refund.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-extrabold" style={{ color: '#d29922' }}>
                    RWF {refund.amount_rwf.toLocaleString()}
                  </p>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
                    style={{ background: 'rgba(210,153,34,0.1)', color: '#d29922' }}>
                    {refund.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Alerts */}
        <div className="rounded-2xl p-6" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={16} style={{ color: '#f85149' }} />
              <h2 className="text-sm font-bold text-gray-900">Financial Alerts</h2>
            </div>
            <p className="text-xs text-gray-600">Payment failures and financial anomalies</p>
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

      {/* Coins & Subscriptions Summary */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Coin Revenue */}
        <div className="rounded-2xl p-6" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-1">
              <Coins size={16} style={{ color: BRAND.orange }} />
              <h2 className="text-sm font-bold text-gray-900">Coin System Overview</h2>
            </div>
            <p className="text-xs text-gray-600">Virtual coin economy financial impact</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 rounded-xl" style={{ background: `${BRAND.orange}08` }}>
              <DollarSign size={20} className="mx-auto mb-2" style={{ color: BRAND.orange }} />
              <p className="text-xl font-extrabold text-gray-900">
                RWF {(stats?.totalRevenue ?? 0).toLocaleString()}
              </p>
              <p className="text-[11px] text-gray-600 font-medium mt-1">Total Revenue</p>
            </div>
            <div className="text-center p-4 rounded-xl" style={{ background: `${BRAND.navy}08` }}>
              <CreditCard size={20} className="mx-auto mb-2" style={{ color: BRAND.navy }} />
              <p className="text-xl font-extrabold text-gray-900">
                {stats?.activeSubscriptions ?? 0}
              </p>
              <p className="text-[11px] text-gray-600 font-medium mt-1">Active Subscriptions</p>
            </div>
          </div>
        </div>

        {/* Subscription Tiers */}
        <div className="rounded-2xl p-6" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard size={16} style={{ color: BRAND.navy }} />
              <h2 className="text-sm font-bold text-gray-900">Payment Health</h2>
            </div>
            <p className="text-xs text-gray-600">Payment processing overview</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl" style={{ background: 'rgba(46,160,67,0.06)', border: '1px solid rgba(46,160,67,0.1)' }}>
              <CheckCircle size={16} className="mb-2" style={{ color: '#2ea043' }} />
              <p className="text-xl font-extrabold text-gray-900">{stats?.successfulPayments ?? 0}</p>
              <p className="text-[11px] text-gray-600 font-medium mt-1">Successful</p>
            </div>
            <div className="p-4 rounded-xl" style={{ background: 'rgba(248,81,73,0.06)', border: '1px solid rgba(248,81,73,0.1)' }}>
              <AlertTriangle size={16} className="mb-2" style={{ color: '#f85149' }} />
              <p className="text-xl font-extrabold text-gray-900">{stats?.failedPayments ?? 0}</p>
              <p className="text-[11px] text-gray-600 font-medium mt-1">Failed</p>
            </div>
            <div className="p-4 rounded-xl" style={{ background: 'rgba(210,153,34,0.06)', border: '1px solid rgba(210,153,34,0.1)' }}>
              <RefreshCw size={16} className="mb-2" style={{ color: '#d29922' }} />
              <p className="text-xl font-extrabold text-gray-900">{stats?.refunded ?? 0}</p>
              <p className="text-[11px] text-gray-600 font-medium mt-1">Refunded</p>
            </div>
            <div className="p-4 rounded-xl" style={{ background: 'rgba(163,113,247,0.06)', border: '1px solid rgba(163,113,247,0.1)' }}>
              <Clock size={16} className="mb-2" style={{ color: '#a371f7' }} />
              <p className="text-xl font-extrabold text-gray-900">{stats?.pendingPayments ?? 0}</p>
              <p className="text-[11px] text-gray-600 font-medium mt-1">Pending</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
