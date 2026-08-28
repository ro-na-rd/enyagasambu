'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import api from '@/lib/api';
import { Chart as ChartJS, registerables } from 'chart.js';
import {
  Package, Activity, AlertTriangle, Ban, Gavel, FileText,
  MessageCircle, Award, Handshake, Store, Sparkles, Calendar,
  Download, Filter, RefreshCw, AlertCircle, Info, CheckCircle,
  Clock, Shield, Users
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

interface COOStats {
  activeListings: number;
  expiringListings: number;
  soldListings: number;
  disabledListings: number;
  auctions: number;
  openReports: number;
  pendingSupport: number;
  pendingBrokerCerts: number;
  pendingAmbassadorCerts: number;
  pendingSupplierCerts: number;
  brokers: number;
  suppliers: number;
  listingsByStatus: { label: string; value: number }[];
  supportByCategory: { label: string; value: number }[];
  reportsByReason: { label: string; value: number }[];
  brokerActivity: { activeBrokers: number; newBrokers30d: number; brokerListings: number };
  supplierActivity: { activeSuppliers: number; newSuppliers30d: number; supplierListings: number };
  certificateProcessing: { brokerPending: number; ambassadorPending: number; supplierPending: number; brokerApproved: number; ambassadorApproved: number; supplierApproved: number };
  alerts: Alert[];
}

export default function COODashboardPage() {
  const [stats, setStats] = useState<COOStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 12);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [exporting, setExporting] = useState(false);

  const statusChartRef = useRef<HTMLCanvasElement>(null);
  const supportChartRef = useRef<HTMLCanvasElement>(null);
  const reportsChartRef = useRef<HTMLCanvasElement>(null);
  const statusInstance = useRef<ChartJS | null>(null);
  const supportInstance = useRef<ChartJS | null>(null);
  const reportsInstance = useRef<ChartJS | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    api.get('/executive/coo', { params: { startDate, endDate } })
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

    if (statusChartRef.current) {
      if (statusInstance.current) statusInstance.current.destroy();
      const ctx = statusChartRef.current.getContext('2d');
      if (ctx) {
        const chartData = stats.listingsByStatus || [];
        statusInstance.current = new ChartJS(ctx, {
          type: 'doughnut',
          data: {
            labels: chartData.length ? chartData.map(r => r.label) : ['No data'],
            datasets: [{
              data: chartData.length ? chartData.map(r => r.value) : [0],
              backgroundColor: ['#2ea043', '#d29922', '#f85149', '#6e7781', BRAND.navy],
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

    if (supportChartRef.current) {
      if (supportInstance.current) supportInstance.current.destroy();
      const ctx = supportChartRef.current.getContext('2d');
      if (ctx) {
        const chartData = stats.supportByCategory || [];
        supportInstance.current = new ChartJS(ctx, {
          type: 'bar',
          data: {
            labels: chartData.length ? chartData.map(r => r.label) : ['No data'],
            datasets: [{
              label: 'Tickets',
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

    if (reportsChartRef.current) {
      if (reportsInstance.current) reportsInstance.current.destroy();
      const ctx = reportsChartRef.current.getContext('2d');
      if (ctx) {
        const chartData = stats.reportsByReason || [];
        reportsInstance.current = new ChartJS(ctx, {
          type: 'bar',
          data: {
            labels: chartData.length ? chartData.map(r => r.label) : ['No data'],
            datasets: [{
              label: 'Reports',
              data: chartData.length ? chartData.map(r => r.value) : [0],
              backgroundColor: '#f85149',
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
      statusInstance.current?.destroy();
      supportInstance.current?.destroy();
      reportsInstance.current?.destroy();
    };
  }, [stats]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data } = await api.get('/executive/export', { params: { role: 'COO', startDate, endDate }, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `coo-report-${startDate}-${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch { /* empty */ } finally {
      setExporting(false);
    }
  };

  const pendingCerts = (stats?.certificateProcessing?.brokerPending ?? 0) + (stats?.certificateProcessing?.ambassadorPending ?? 0) + (stats?.certificateProcessing?.supplierPending ?? 0);

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
              <span className="text-xs font-bold tracking-widest uppercase" style={{ color: `${BRAND.orange}bb` }}>COO Dashboard</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white mb-1 tracking-tight">Operations & Listings</h1>
            <p className="text-sm text-white/40">Listing health, support tickets, reports, and operational alerts.</p>
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
          { label: 'Active Listings', value: stats?.activeListings ?? 0, icon: <Package size={20} />, gradient: `linear-gradient(135deg, ${BRAND.navy}, #0f1e42)` },
          { label: 'Expiring Listings', value: stats?.expiringListings ?? 0, icon: <AlertTriangle size={20} />, gradient: `linear-gradient(135deg, #d29922, #b8860b)` },
          { label: 'Sold Listings', value: stats?.soldListings ?? 0, icon: <Activity size={20} />, gradient: 'linear-gradient(135deg, #059669, #047857)' },
          { label: 'Disabled Listings', value: stats?.disabledListings ?? 0, icon: <Ban size={20} />, gradient: 'linear-gradient(135deg, #f85149, #da3633)' },
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

      {/* Listings by Status Cards */}
      <div className="rounded-2xl p-6" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="mb-5">
          <h2 className="text-sm font-bold text-gray-900">Listings by Status</h2>
          <p className="text-xs text-gray-600 mt-0.5">Current listing status breakdown</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Active', value: stats?.activeListings ?? 0, color: '#2ea043', bg: 'rgba(46,160,67,0.1)', icon: <Package size={16} /> },
            { label: 'Pending', value: stats?.expiringListings ?? 0, color: '#d29922', bg: 'rgba(210,153,34,0.1)', icon: <Clock size={16} /> },
            { label: 'Sold', value: stats?.soldListings ?? 0, color: '#58a6ff', bg: 'rgba(88,166,255,0.1)', icon: <CheckCircle size={16} /> },
            { label: 'Disabled', value: stats?.disabledListings ?? 0, color: '#f85149', bg: 'rgba(248,81,73,0.1)', icon: <Ban size={16} /> },
          ].map((card) => (
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

      {/* Secondary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {[
          { label: 'Auctions', value: stats?.auctions ?? 0, icon: <Gavel size={16} />, color: '#a371f7', bg: 'rgba(163,113,247,0.1)' },
          { label: 'Open Reports', value: stats?.openReports ?? 0, icon: <FileText size={16} />, color: '#f85149', bg: 'rgba(248,81,73,0.1)' },
          { label: 'Pending Support', value: stats?.pendingSupport ?? 0, icon: <MessageCircle size={16} />, color: '#d29922', bg: 'rgba(210,153,34,0.1)' },
          { label: 'Pending Certs', value: pendingCerts, icon: <Award size={16} />, color: '#58a6ff', bg: 'rgba(88,166,255,0.1)' },
          { label: 'Brokers', value: stats?.brokers ?? 0, icon: <Handshake size={16} />, color: '#2ea043', bg: 'rgba(46,160,67,0.1)' },
          { label: 'Suppliers', value: stats?.suppliers ?? 0, icon: <Store size={16} />, color: BRAND.orange, bg: `${BRAND.orange}15` },
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

      {/* Broker & Supplier Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Broker Activity */}
        <div className="rounded-2xl p-6" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-1">
              <Handshake size={16} style={{ color: '#2ea043' }} />
              <h2 className="text-sm font-bold text-gray-900">Broker Activity</h2>
            </div>
            <p className="text-xs text-gray-600">Broker engagement metrics</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-xl" style={{ background: 'rgba(46,160,67,0.06)' }}>
              <Users size={20} className="mx-auto mb-2" style={{ color: '#2ea043' }} />
              <p className="text-xl font-extrabold text-gray-900">{stats?.brokerActivity?.activeBrokers ?? 0}</p>
              <p className="text-[11px] text-gray-600 font-medium mt-1">Active Brokers</p>
            </div>
            <div className="text-center p-4 rounded-xl" style={{ background: 'rgba(88,166,255,0.06)' }}>
              <Activity size={20} className="mx-auto mb-2" style={{ color: '#58a6ff' }} />
              <p className="text-xl font-extrabold text-gray-900">{stats?.brokerActivity?.newBrokers30d ?? 0}</p>
              <p className="text-[11px] text-gray-600 font-medium mt-1">New (30d)</p>
            </div>
            <div className="text-center p-4 rounded-xl" style={{ background: `${BRAND.orange}06` }}>
              <Package size={20} className="mx-auto mb-2" style={{ color: BRAND.orange }} />
              <p className="text-xl font-extrabold text-gray-900">{stats?.brokerActivity?.brokerListings ?? 0}</p>
              <p className="text-[11px] text-gray-600 font-medium mt-1">Listings</p>
            </div>
          </div>
        </div>

        {/* Supplier Activity */}
        <div className="rounded-2xl p-6" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-1">
              <Store size={16} style={{ color: BRAND.orange }} />
              <h2 className="text-sm font-bold text-gray-900">Supplier Activity</h2>
            </div>
            <p className="text-xs text-gray-600">Supplier engagement metrics</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-xl" style={{ background: `${BRAND.orange}06` }}>
              <Users size={20} className="mx-auto mb-2" style={{ color: BRAND.orange }} />
              <p className="text-xl font-extrabold text-gray-900">{stats?.supplierActivity?.activeSuppliers ?? 0}</p>
              <p className="text-[11px] text-gray-600 font-medium mt-1">Active Suppliers</p>
            </div>
            <div className="text-center p-4 rounded-xl" style={{ background: 'rgba(88,166,255,0.06)' }}>
              <Activity size={20} className="mx-auto mb-2" style={{ color: '#58a6ff' }} />
              <p className="text-xl font-extrabold text-gray-900">{stats?.supplierActivity?.newSuppliers30d ?? 0}</p>
              <p className="text-[11px] text-gray-600 font-medium mt-1">New (30d)</p>
            </div>
            <div className="text-center p-4 rounded-xl" style={{ background: 'rgba(5,150,105,0.06)' }}>
              <Package size={20} className="mx-auto mb-2" style={{ color: '#059669' }} />
              <p className="text-xl font-extrabold text-gray-900">{stats?.supplierActivity?.supplierListings ?? 0}</p>
              <p className="text-[11px] text-gray-600 font-medium mt-1">Listings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Certificate Processing Status */}
      <div className="rounded-2xl p-6" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <Shield size={16} style={{ color: BRAND.navy }} />
            <h2 className="text-sm font-bold text-gray-900">Certificate Processing Status</h2>
          </div>
          <p className="text-xs text-gray-600">Pending and approved certificates across all roles</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: 'Broker Pending', value: stats?.certificateProcessing?.brokerPending ?? 0, color: '#d29922', bg: 'rgba(210,153,34,0.1)', icon: <Clock size={16} /> },
            { label: 'Ambassador Pending', value: stats?.certificateProcessing?.ambassadorPending ?? 0, color: '#d29922', bg: 'rgba(210,153,34,0.1)', icon: <Clock size={16} /> },
            { label: 'Supplier Pending', value: stats?.certificateProcessing?.supplierPending ?? 0, color: '#d29922', bg: 'rgba(210,153,34,0.1)', icon: <Clock size={16} /> },
            { label: 'Broker Approved', value: stats?.certificateProcessing?.brokerApproved ?? 0, color: '#2ea043', bg: 'rgba(46,160,67,0.1)', icon: <CheckCircle size={16} /> },
            { label: 'Ambassador Approved', value: stats?.certificateProcessing?.ambassadorApproved ?? 0, color: '#2ea043', bg: 'rgba(46,160,67,0.1)', icon: <CheckCircle size={16} /> },
            { label: 'Supplier Approved', value: stats?.certificateProcessing?.supplierApproved ?? 0, color: '#2ea043', bg: 'rgba(46,160,67,0.1)', icon: <CheckCircle size={16} /> },
          ].map((card) => (
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

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="rounded-2xl p-6" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
          <div className="mb-6">
            <h2 className="text-sm font-bold text-gray-900">Listings by Status</h2>
            <p className="text-xs text-gray-600 mt-0.5">Current listing breakdown</p>
          </div>
          <div className="h-56"><canvas ref={statusChartRef} /></div>
        </div>
        <div className="rounded-2xl p-6" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
          <div className="mb-6">
            <h2 className="text-sm font-bold text-gray-900">Support by Category</h2>
            <p className="text-xs text-gray-600 mt-0.5">Open tickets by type</p>
          </div>
          <div className="h-56"><canvas ref={supportChartRef} /></div>
        </div>
        <div className="rounded-2xl p-6" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
          <div className="mb-6">
            <h2 className="text-sm font-bold text-gray-900">Reports by Reason</h2>
            <p className="text-xs text-gray-600 mt-0.5">Report categories</p>
          </div>
          <div className="h-56"><canvas ref={reportsChartRef} /></div>
        </div>
      </div>

      {/* Operational Alerts */}
      <div className="rounded-2xl p-6" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={16} style={{ color: '#f85149' }} />
            <h2 className="text-sm font-bold text-gray-900">Operational Alerts</h2>
          </div>
          <p className="text-xs text-gray-600">Payment failures, high support tickets, and system alerts</p>
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
