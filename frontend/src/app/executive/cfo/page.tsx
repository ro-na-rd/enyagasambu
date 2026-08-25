'use client';
import { useEffect, useState, useRef } from 'react';
import api from '@/lib/api';
import { Chart as ChartJS, registerables } from 'chart.js';
import {
  DollarSign, Package, Link, CreditCard, TrendingUp, Heart,
  AlertTriangle, Ban, RefreshCw, Clock, CheckCircle, Sparkles, Calendar
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
  revenueByMonth: { label: string; value: number }[];
  revenueByType: { label: string; value: number }[];
}

export default function CFODashboardPage() {
  const [stats, setStats] = useState<CFOStats | null>(null);
  const [loading, setLoading] = useState(true);
  const monthChartRef = useRef<HTMLCanvasElement>(null);
  const typeChartRef = useRef<HTMLCanvasElement>(null);
  const monthInstance = useRef<ChartJS | null>(null);
  const typeInstance = useRef<ChartJS | null>(null);

  useEffect(() => {
    api.get('/executive/cfo')
      .then(({ data }) => setStats(data))
      .finally(() => setLoading(false));
  }, []);

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

    return () => {
      monthInstance.current?.destroy();
      typeInstance.current?.destroy();
    };
  }, [stats]);

  const kpiCards = [
    { label: 'Total Revenue', value: (stats?.totalRevenue ?? 0).toLocaleString(), icon: <DollarSign size={20} />, gradient: `linear-gradient(135deg, ${BRAND.navy}, #0f1e42)` },
    { label: 'Listing Fees', value: (stats?.listingFees ?? 0).toLocaleString(), icon: <Package size={20} />, gradient: `linear-gradient(135deg, ${BRAND.orange}, ${BRAND.orangeDark})` },
    { label: 'Connect Fees', value: (stats?.connectFees ?? 0).toLocaleString(), icon: <Link size={20} />, gradient: 'linear-gradient(135deg, #059669, #047857)' },
    { label: 'Subscriptions', value: (stats?.subscriptionRevenue ?? 0).toLocaleString(), icon: <CreditCard size={20} />, gradient: 'linear-gradient(135deg, #7c3aed, #6d28d9)' },
    { label: 'Boost Revenue', value: (stats?.boostRevenue ?? 0).toLocaleString(), icon: <TrendingUp size={16} />, color: '#58a6ff', bg: 'rgba(88,166,255,0.1)' },
    { label: 'Donations', value: (stats?.donations ?? 0).toLocaleString(), icon: <Heart size={16} />, color: '#f85149', bg: 'rgba(248,81,73,0.1)' },
    { label: 'Total Payments', value: stats?.totalPayments ?? 0, icon: <CheckCircle size={16} />, color: '#2ea043', bg: 'rgba(46,160,67,0.1)' },
    { label: 'Failed Payments', value: stats?.failedPayments ?? 0, icon: <AlertTriangle size={16} />, color: '#f85149', bg: 'rgba(248,81,73,0.1)' },
    { label: 'Refunded', value: stats?.refunded ?? 0, icon: <RefreshCw size={16} />, color: '#d29922', bg: 'rgba(210,153,34,0.1)' },
    { label: 'Pending Payments', value: stats?.pendingPayments ?? 0, icon: <Clock size={16} />, color: '#a371f7', bg: 'rgba(163,113,247,0.1)' },
    { label: 'Active Subscriptions', value: stats?.activeSubscriptions ?? 0, icon: <CreditCard size={16} />, color: BRAND.navyLight, bg: `${BRAND.navy}15` },
    { label: 'Pending Approvals', value: stats?.pendingApprovals ?? 0, icon: <Ban size={16} />, color: '#6e7781', bg: 'rgba(110,119,129,0.1)' },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 rounded-2xl" style={{ background: '#ffffff' }} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 rounded-2xl" style={{ background: '#ffffff' }} />)}
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="h-64 rounded-2xl" style={{ background: '#ffffff' }} />
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
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.slice(0, 4).map((card) => (
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
        {kpiCards.slice(4).map((card) => (
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

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
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
      </div>
    </div>
  );
}
