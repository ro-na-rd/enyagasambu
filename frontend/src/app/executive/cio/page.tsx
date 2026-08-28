'use client';
import { useEffect, useState, useRef } from 'react';
import api from '@/lib/api';
import { Chart as ChartJS, registerables } from 'chart.js';
import {
  Users, Shield, Server, Package, DollarSign, Key, AlertTriangle,
  Activity, Sparkles, Calendar, Clock, Download, Globe, Monitor,
  Mail, Smartphone, Lock
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

interface SystemHealth {
  frontend: { available: boolean; latency?: number };
  backend: { available: boolean; latency?: number };
  database: { healthy: boolean; connectionPool?: number };
  storage: { usedPercent: number; totalGB: number; usedGB: number };
  minio: { available: boolean; bucketCount: number };
  socketio: { connected: boolean; clientCount: number };
  scheduler: { renewal: boolean; expiry: boolean; auction: boolean };
  emailService: { available: boolean; queueSize: number };
  smsService: { available: boolean; queueSize: number };
  mtnMomo: { available: boolean; lastPing: string };
}

interface SecurityMetrics {
  failedLoginsCount: number;
  suspiciousIPs: string[];
  rateLimiterEvents: number;
  alerts: { id: string; severity: string; message: string; timestamp: string }[];
  authActivity: { label: string; logins: number; failures: number }[];
}

interface CIOStats {
  totalUsers: number;
  totalStaff: number;
  failedLogins: number;
  totalPayments: number;
  failedPayments: number;
  totalOtps: number;
  apiErrors: { label: string; value: number }[];
  authActivity: { label: string; value: number }[];
  recentAuditLog: { timestamp: string; actor: string; action: string; module: string }[];
}

export default function CIODashboardPage() {
  const [stats, setStats] = useState<CIOStats | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [security, setSecurity] = useState<SecurityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const apiErrorsRef = useRef<HTMLCanvasElement>(null);
  const authRef = useRef<HTMLCanvasElement>(null);
  const apiErrorsInstance = useRef<ChartJS | null>(null);
  const authInstance = useRef<ChartJS | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (dateFrom) params.append('from', dateFrom);
    if (dateTo) params.append('to', dateTo);
    const qs = params.toString();

    Promise.all([
      api.get(`/executive/cio?${qs}`),
      api.get('/executive/cio/health'),
      api.get('/executive/alerts'),
    ])
      .then(([statsRes, healthRes, alertsRes]) => {
        setStats(statsRes.data);
        setSystemHealth(healthRes.data);
        setSecurity(alertsRes.data);
      })
      .finally(() => setLoading(false));
  }, [dateFrom, dateTo]);

  useEffect(() => {
    if (!stats) return;

    ChartJS.defaults.color = '#6e7781';
    ChartJS.defaults.font.family = "'Inter', sans-serif";
    ChartJS.defaults.font.size = 10;

    if (apiErrorsRef.current) {
      if (apiErrorsInstance.current) apiErrorsInstance.current.destroy();
      const ctx = apiErrorsRef.current.getContext('2d');
      if (ctx) {
        const chartData = stats.apiErrors || [];
        apiErrorsInstance.current = new ChartJS(ctx, {
          type: 'bar',
          data: {
            labels: chartData.length ? chartData.map(r => r.label) : ['No data'],
            datasets: [{
              label: 'Errors',
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

    if (authRef.current) {
      if (authInstance.current) authInstance.current.destroy();
      const ctx = authRef.current.getContext('2d');
      if (ctx) {
        const chartData = stats.authActivity || [];
        authInstance.current = new ChartJS(ctx, {
          type: 'line',
          data: {
            labels: chartData.length ? chartData.map(r => r.label) : ['No data'],
            datasets: [{
              label: 'Auth Events',
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

    return () => {
      apiErrorsInstance.current?.destroy();
      authInstance.current?.destroy();
    };
  }, [stats]);

  const handleExport = async () => {
    const params = new URLSearchParams();
    if (dateFrom) params.append('from', dateFrom);
    if (dateTo) params.append('to', dateTo);
    try {
      const res = await api.get(`/executive/cio/export?${params.toString()}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `cio-report-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {}
  };

  const statusIndicator = (active: boolean) => (
    <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: active ? '#2ea043' : '#f85149' }} />
  );

  const kpiCards = [
    { label: 'Total Users', value: stats?.totalUsers ?? 0, icon: <Users size={20} />, gradient: `linear-gradient(135deg, ${BRAND.navy}, #0f1e42)` },
    { label: 'Total Staff', value: stats?.totalStaff ?? 0, icon: <Shield size={20} />, gradient: `linear-gradient(135deg, ${BRAND.orange}, ${BRAND.orangeDark})` },
    { label: 'Failed Logins', value: stats?.failedLogins ?? 0, icon: <Key size={20} />, gradient: 'linear-gradient(135deg, #f85149, #da3633)' },
    { label: 'Total Payments', value: stats?.totalPayments ?? 0, icon: <DollarSign size={20} />, gradient: 'linear-gradient(135deg, #d29922, #b8860b)' },
    { label: 'Failed Payments', value: stats?.failedPayments ?? 0, icon: <AlertTriangle size={20} />, gradient: 'linear-gradient(135deg, #f97583, #f85149)' },
    { label: 'Total OTPs', value: stats?.totalOtps ?? 0, icon: <Lock size={20} />, gradient: 'linear-gradient(135deg, #7c3aed, #6d28d9)' },
  ];

  const healthCards = [
    { label: 'Frontend', available: systemHealth?.frontend.available, icon: <Globe size={16} />, detail: systemHealth?.frontend.latency ? `${systemHealth.frontend.latency}ms` : undefined },
    { label: 'Backend', available: systemHealth?.backend.available, icon: <Server size={16} />, detail: systemHealth?.backend.latency ? `${systemHealth.backend.latency}ms` : undefined },
    { label: 'Database', available: systemHealth?.database.healthy, icon: <Server size={16} />, detail: systemHealth?.database.connectionPool ? `Pool: ${systemHealth.database.connectionPool}` : undefined },
    { label: 'MinIO Storage', available: systemHealth?.minio.available, icon: <Package size={16} />, detail: systemHealth?.minio.bucketCount !== undefined ? `${systemHealth.minio.bucketCount} buckets` : undefined },
    { label: 'Socket.IO', available: systemHealth?.socketio.connected, icon: <Globe size={16} />, detail: systemHealth?.socketio.clientCount !== undefined ? `${systemHealth.socketio.clientCount} clients` : undefined },
    { label: 'Email Service', available: systemHealth?.emailService.available, icon: <Mail size={16} />, detail: systemHealth?.emailService.queueSize !== undefined ? `Queue: ${systemHealth.emailService.queueSize}` : undefined },
    { label: 'SMS Service', available: systemHealth?.smsService.available, icon: <Smartphone size={16} />, detail: systemHealth?.smsService.queueSize !== undefined ? `Queue: ${systemHealth.smsService.queueSize}` : undefined },
    { label: 'MTN MoMo', available: systemHealth?.mtnMomo.available, icon: <DollarSign size={16} /> },
  ];

  const schedulerStatus = [
    { label: 'Renewal', active: systemHealth?.scheduler.renewal },
    { label: 'Expiry', active: systemHealth?.scheduler.expiry },
    { label: 'Auction', active: systemHealth?.scheduler.auction },
  ];

  const storageUsed = systemHealth?.storage.usedPercent ?? 0;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 rounded-2xl" style={{ background: '#ffffff' }} />
        <div className="h-12 rounded-xl" style={{ background: '#ffffff' }} />
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
              <span className="text-xs font-bold tracking-widest uppercase" style={{ color: `${BRAND.orange}bb` }}>CIO Dashboard</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white mb-1 tracking-tight">Technology & Security</h1>
            <p className="text-sm text-white/40">System health, security monitoring, and audit insights.</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10">
            <Calendar size={14} className="text-white/50" />
            <span className="text-xs font-medium text-white/60">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-xl" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
          <Calendar size={14} style={{ color: BRAND.navy }} /> Date Range
        </span>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          className="text-xs px-3 py-1.5 rounded-lg border outline-none focus:ring-2" style={{ borderColor: 'rgba(0,0,0,0.1)' }} />
        <span className="text-xs text-gray-500 font-medium">to</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          className="text-xs px-3 py-1.5 rounded-lg border outline-none focus:ring-2" style={{ borderColor: 'rgba(0,0,0,0.1)' }} />
        <button onClick={handleExport}
          className="ml-auto flex items-center gap-1.5 text-[11px] font-bold px-4 py-2 rounded-lg text-white transition-all hover:opacity-90"
          style={{ background: BRAND.orange }}>
          <Download size={13} /> Export
        </button>
      </div>

      {/* System Health Section */}
      <div className="rounded-2xl p-6" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="flex items-center gap-2 mb-5">
          <Monitor size={16} style={{ color: BRAND.navy }} />
          <h2 className="text-sm font-bold text-gray-900">System Health</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {healthCards.map(card => (
            <div key={card.label}
              className="flex items-center gap-3 p-3 rounded-xl transition-all"
              style={{ background: '#f9fafb', border: '1px solid rgba(0,0,0,0.04)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${BRAND.navy}10`, color: BRAND.navy }}>
                {card.icon}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  {statusIndicator(card.available ?? false)}
                  <span className="text-[11px] font-bold text-gray-800 truncate">{card.label}</span>
                </div>
                {card.detail && <p className="text-[10px] text-gray-500 mt-0.5">{card.detail}</p>}
              </div>
            </div>
          ))}
        </div>

        {/* Storage Utilization */}
        <div className="p-3 rounded-xl mb-4" style={{ background: '#f9fafb', border: '1px solid rgba(0,0,0,0.04)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-gray-700">Storage Utilization</span>
            <span className="text-[10px] text-gray-500">
              {systemHealth?.storage.usedGB ?? 0}GB / {systemHealth?.storage.totalGB ?? 0}GB ({storageUsed}%)
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${storageUsed}%`, background: storageUsed > 80 ? '#f85149' : storageUsed > 60 ? '#d29922' : '#2ea043' }} />
          </div>
        </div>

        {/* Scheduler & Delivery Status */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl" style={{ background: '#f9fafb', border: '1px solid rgba(0,0,0,0.04)' }}>
            <div className="flex items-center gap-1.5 mb-2">
              <Activity size={12} style={{ color: BRAND.navy }} />
              <span className="text-[10px] font-bold text-gray-700 uppercase">Schedulers</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {schedulerStatus.map(s => (
                <span key={s.label} className="flex items-center gap-1 text-[10px] font-medium"
                  style={{ color: s.active ? '#2ea043' : '#f85149' }}>
                  {statusIndicator(s.active ?? false)} {s.label}
                </span>
              ))}
            </div>
          </div>
          <div className="p-3 rounded-xl" style={{ background: '#f9fafb', border: '1px solid rgba(0,0,0,0.04)' }}>
            <div className="flex items-center gap-1.5 mb-2">
              <Mail size={12} style={{ color: BRAND.navy }} />
              <span className="text-[10px] font-bold text-gray-700 uppercase">Email</span>
            </div>
            <div className="flex items-center gap-1.5">
              {statusIndicator(systemHealth?.emailService.available ?? false)}
              <span className="text-[10px] text-gray-600">
                Queue: {systemHealth?.emailService.queueSize ?? 0}
              </span>
            </div>
          </div>
          <div className="p-3 rounded-xl" style={{ background: '#f9fafb', border: '1px solid rgba(0,0,0,0.04)' }}>
            <div className="flex items-center gap-1.5 mb-2">
              <Smartphone size={12} style={{ color: BRAND.navy }} />
              <span className="text-[10px] font-bold text-gray-700 uppercase">SMS</span>
            </div>
            <div className="flex items-center gap-1.5">
              {statusIndicator(systemHealth?.smsService.available ?? false)}
              <span className="text-[10px] text-gray-600">
                Queue: {systemHealth?.smsService.queueSize ?? 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Security Monitoring Section */}
      <div className="rounded-2xl p-6" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="flex items-center gap-2 mb-5">
          <Shield size={16} style={{ color: '#f85149' }} />
          <h2 className="text-sm font-bold text-gray-900">Security Monitoring</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          <div className="p-4 rounded-xl" style={{ background: 'rgba(248,81,73,0.05)', border: '1px solid rgba(248,81,73,0.1)' }}>
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={14} style={{ color: '#f85149' }} />
              <span className="text-[10px] font-bold text-gray-700 uppercase">Failed Logins</span>
            </div>
            <p className="text-xl font-extrabold" style={{ color: '#f85149' }}>{security?.failedLoginsCount ?? stats?.failedLogins ?? 0}</p>
          </div>
          <div className="p-4 rounded-xl" style={{ background: 'rgba(210,153,34,0.05)', border: '1px solid rgba(210,153,34,0.1)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Activity size={14} style={{ color: '#d29922' }} />
              <span className="text-[10px] font-bold text-gray-700 uppercase">Rate-Limiter Events</span>
            </div>
            <p className="text-xl font-extrabold" style={{ color: '#d29922' }}>{security?.rateLimiterEvents ?? 0}</p>
          </div>
          <div className="p-4 rounded-xl" style={{ background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.1)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Lock size={14} style={{ color: '#7c3aed' }} />
              <span className="text-[10px] font-bold text-gray-700 uppercase">Security Alerts</span>
            </div>
            <p className="text-xl font-extrabold" style={{ color: '#7c3aed' }}>{security?.alerts?.length ?? 0}</p>
          </div>
        </div>

        {/* Suspicious IPs */}
        {security?.suspiciousIPs && security.suspiciousIPs.length > 0 && (
          <div className="p-4 rounded-xl mb-4" style={{ background: 'rgba(248,81,73,0.03)', border: '1px solid rgba(248,81,73,0.08)' }}>
            <div className="flex items-center gap-1.5 mb-2">
              <Globe size={12} style={{ color: '#f85149' }} />
              <span className="text-[10px] font-bold text-gray-700 uppercase">Suspicious IPs</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {security.suspiciousIPs.map((ip, i) => (
                <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded-md"
                  style={{ background: 'rgba(248,81,73,0.1)', color: '#f85149' }}>
                  {ip}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Security Alerts */}
        {security?.alerts && security.alerts.length > 0 && (
          <div className="mb-4">
            <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-2 block">Recent Alerts</span>
            <div className="space-y-1.5">
              {security.alerts.slice(0, 4).map(alert => (
                <div key={alert.id} className="flex items-start gap-2 p-2.5 rounded-lg"
                  style={{ background: alert.severity === 'critical' ? 'rgba(248,81,73,0.06)' : alert.severity === 'high' ? 'rgba(210,153,34,0.06)' : 'rgba(0,0,0,0.02)' }}>
                  <AlertTriangle size={12} className="mt-0.5 shrink-0"
                    style={{ color: alert.severity === 'critical' ? '#f85149' : alert.severity === 'high' ? '#d29922' : '#6e7781' }} />
                  <div className="min-w-0">
                    <p className="text-[11px] text-gray-800 font-medium">{alert.message}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{new Date(alert.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Auth Activity Chart (Security) */}
        {security?.authActivity && security.authActivity.length > 0 && (
          <div className="p-4 rounded-xl" style={{ background: '#f9fafb', border: '1px solid rgba(0,0,0,0.04)' }}>
            <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-3 block">Authentication Activity</span>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                    <th className="pb-2 text-[10px] font-semibold text-gray-600 uppercase">Period</th>
                    <th className="pb-2 text-[10px] font-semibold text-gray-600 uppercase">Logins</th>
                    <th className="pb-2 text-[10px] font-semibold text-gray-600 uppercase">Failures</th>
                  </tr>
                </thead>
                <tbody>
                  {security.authActivity.map((row, i) => (
                    <tr key={i} className="border-b last:border-0" style={{ borderColor: 'rgba(0,0,0,0.03)' }}>
                      <td className="py-2 text-[11px] text-gray-700 font-medium">{row.label}</td>
                      <td className="py-2 text-[11px] text-green-600 font-bold">{row.logins}</td>
                      <td className="py-2 text-[11px] font-bold" style={{ color: row.failures > 0 ? '#f85149' : '#6e7781' }}>{row.failures}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
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

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl p-6" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
          <div className="mb-6">
            <h2 className="text-sm font-bold text-gray-900">API Errors Over Time</h2>
            <p className="text-xs text-gray-600 mt-0.5">Error count by endpoint</p>
          </div>
          <div className="h-56"><canvas ref={apiErrorsRef} /></div>
        </div>
        <div className="rounded-2xl p-6" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
          <div className="mb-6">
            <h2 className="text-sm font-bold text-gray-900">Authentication Activity</h2>
            <p className="text-xs text-gray-600 mt-0.5">Login and auth events over time</p>
          </div>
          <div className="h-56"><canvas ref={authRef} /></div>
        </div>
      </div>

      {/* Recent Audit Log */}
      <div className="rounded-2xl p-6" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Recent Audit Log</h2>
            <p className="text-xs text-gray-600 mt-0.5">Latest system activity</p>
          </div>
          <a href="/executive/audit" className="text-[11px] font-bold px-3 py-1 rounded-lg transition"
            style={{ color: BRAND.orange, background: `${BRAND.orange}10` }}>View all</a>
        </div>
        {(!stats?.recentAuditLog || stats.recentAuditLog.length === 0) ? (
          <p className="text-sm text-gray-600 text-center py-8">No audit entries yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                  <th className="pb-3 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Time</th>
                  <th className="pb-3 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Actor</th>
                  <th className="pb-3 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                  <th className="pb-3 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Module</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentAuditLog.slice(0, 10).map((entry, i) => (
                  <tr key={i} className="border-b last:border-0" style={{ borderColor: 'rgba(0,0,0,0.03)' }}>
                    <td className="py-3 text-[12px] text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} className="text-gray-700" />
                        {new Date(entry.timestamp).toLocaleString()}
                      </div>
                    </td>
                    <td className="py-3 text-[12px] font-medium text-gray-800">{entry.actor}</td>
                    <td className="py-3 text-[12px] text-gray-600">{entry.action}</td>
                    <td className="py-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: `${BRAND.navy}15`, color: BRAND.navy }}>
                        {entry.module}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
