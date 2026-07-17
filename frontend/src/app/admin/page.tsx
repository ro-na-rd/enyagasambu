'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';

const NAVY = '#0f1e42';
const ORG = '#E85D04';

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
  const [participants, setParticipants] = useState<any>(null);
  const [chart, setChart] = useState<{ label: string; value: number }[]>([]);
  const [period, setPeriod] = useState('monthly');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/admin/stats'),
      api.get(`/admin/participants?period=${period}`),
      api.get(`/admin/revenue-chart?period=${period}`),
    ]).then(([s, p, c]) => {
      setStats(s.data.stats);
      setRecentUsers(s.data.recentUsers);
      setRecentListings(s.data.recentListings);
      setParticipants(p.data);
      setChart(c.data.chart || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [period]);

  const cards = [
    { label: 'Total Users', value: stats?.totalUsers ?? 0, icon: '👥', color: NAVY, bg: '#eef2ff', link: '/admin/users' },
    { label: 'Active Listings', value: stats?.activeListings ?? 0, icon: '📋', color: ORG, bg: '#fff7ed', link: '/admin/listings' },
    { label: 'Total Revenue', value: ((stats?.coinsEarned ?? 0) + (stats?.coinsFromListings ?? 0) + (stats?.coinsFromBoosts ?? 0)).toLocaleString(), icon: '🪙', color: '#059669', bg: '#ecfdf5', link: '/admin/reports' },
    { label: 'Connects Made', value: stats?.totalUnlocks ?? 0, icon: '📞', color: '#7c3aed', bg: '#f5f3ff', link: '/admin/reports' },
    { label: 'Brokers', value: stats?.totalBrokers ?? 0, icon: '🤝', color: '#0ea5e9', bg: '#f0f9ff', link: '/admin/users?role=broker' },
    { label: 'Sellers', value: stats?.totalSellers ?? 0, icon: '🏪', color: '#d97706', bg: '#fffbeb', link: '/admin/users?role=seller' },
    { label: 'Ambassadors', value: stats?.totalAmbassadors ?? 0, icon: '🎖️', color: '#0891b2', bg: '#ecfeff', link: '/admin/users?role=ambassador' },
    { label: 'Disabled Items', value: stats?.disabledListings ?? 0, icon: '🚫', color: '#dc2626', bg: '#fef2f2', link: '/admin/listings?status=disabled' },
    { label: 'Pending Broker Certs', value: stats?.pendingBrokerCerts ?? 0, icon: '📜', color: '#d97706', bg: '#fffbeb', link: '/admin/broker-certificates' },
    { label: 'Pending Ambassador Certs', value: stats?.pendingAmbassadorCerts ?? 0, icon: '🎖️', color: '#0891b2', bg: '#ecfeff', link: '/admin/certificates' },
  ];

  return (
    <div className="p-4 lg:p-8">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Full platform control &mdash; manage users, listings, participants</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <Link key={card.label} href={card.link}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition block">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{card.icon}</span>
              <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-full">{card.label}</span>
            </div>
            <p className="text-3xl font-extrabold" style={{ color: card.color }}>
              {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
            </p>
          </Link>
        ))}
      </div>

      {/* Pending Certificate Requests */}
      {(stats?.pendingBrokerCerts ?? 0) > 0 || (stats?.pendingAmbassadorCerts ?? 0) > 0 ? (
        <div className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-3">Pending Certificate Requests</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/admin/broker-certificates" className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition block">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-2xl">📜</div>
                <div>
                  <p className="text-sm font-bold text-gray-800">Broker Certificates</p>
                  <p className="text-xs text-gray-400 mt-0.5">Pending: <span className="text-amber-600 font-bold">{stats?.pendingBrokerCerts}</span></p>
                </div>
              </div>
            </Link>
            <Link href="/admin/certificates" className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition block">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-2xl">🎖️</div>
                <div>
                  <p className="text-sm font-bold text-gray-800">Ambassador Certificates</p>
                  <p className="text-xs text-gray-400 mt-0.5">Pending: <span className="text-amber-600 font-bold">{stats?.pendingAmbassadorCerts}</span></p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      ) : null}

      {/* Participants Overview + Revenue Chart */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Participants */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800">Market Participants</h2>
            <select value={period} onChange={(e) => setPeriod(e.target.value)}
              className="border border-gray-200 rounded-lg px-2 py-1 text-xs">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="all">All Time</option>
            </select>
          </div>
          {participants ? (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Buyers', value: participants.buyers, icon: '👤', color: NAVY },
                { label: 'Sellers', value: participants.sellers, icon: '🏪', color: '#d97706' },
                { label: 'Brokers', value: participants.brokers, icon: '🤝', color: '#0ea5e9' },
                { label: 'Ambassadors', value: participants.ambassadors, icon: '🎖️', color: '#0891b2' },
                { label: 'Active Listings', value: participants.totalActiveListings, icon: '📋', color: ORG },
                { label: 'Completed Deals', value: participants.completedDeals, icon: '✅', color: '#059669' },
              ].map((p) => (
                <div key={p.label} className="text-center p-3 rounded-lg bg-gray-50">
                  <div className="text-xl mb-1">{p.icon}</div>
                  <p className="text-lg font-extrabold" style={{ color: p.color }}>{p.value}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{p.label}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">Loading...</p>
          )}
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-4">
            Revenue Trend ({period})
          </h2>
          <div className="flex items-end gap-2 h-40 mb-2">
            {chart.map((point, i) => {
              const max = Math.max(...chart.map(p => p.value), 1);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] text-gray-400 font-semibold">{point.value}</span>
                  <div className="w-full rounded-md transition-all"
                    style={{ height: `${(point.value / max) * 100}%`, background: `linear-gradient(to top, ${NAVY}, ${ORG})`, minHeight: 4 }} />
                  <span className="text-[8px] text-gray-400 text-center truncate w-full">{point.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Link href="/admin/listings" className="text-xs font-semibold px-4 py-2 rounded-lg text-white transition hover:opacity-90" style={{ background: NAVY }}>
          🏠 Manage Listings
        </Link>
        <Link href="/admin/users" className="text-xs font-semibold px-4 py-2 rounded-lg text-white transition hover:opacity-90" style={{ background: ORG }}>
          👥 Manage Users
        </Link>
        <Link href="/admin/categories" className="text-xs font-semibold px-4 py-2 rounded-lg text-white transition hover:opacity-90" style={{ background: '#059669' }}>
          📂 Categories
        </Link>
        <Link href="/admin/promos" className="text-xs font-semibold px-4 py-2 rounded-lg text-white transition hover:opacity-90" style={{ background: '#7c3aed' }}>
          🎟️ Promo Codes
        </Link>
      </div>

      {/* Recent Activities */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800">Recent Users</h2>
            <Link href="/admin/users" className="text-xs font-semibold hover:underline" style={{ color: ORG }}>View all →</Link>
          </div>
          {recentUsers.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No users yet</p>
          ) : (
            <div className="space-y-2">
              {recentUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-b-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: NAVY }}>
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{u.name}</p>
                      <p className="text-xs text-gray-400">{u.email} &middot; {u.role}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#fff7ed', color: ORG }}>
                    🪙 {u.coins}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800">Recent Listings</h2>
            <Link href="/admin/listings" className="text-xs font-semibold hover:underline" style={{ color: ORG }}>View all →</Link>
          </div>
          {recentListings.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No listings yet</p>
          ) : (
            <div className="space-y-2">
              {recentListings.map((l) => (
                <div key={l.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-b-0">
                  <div>
                    <p className="text-sm font-semibold text-gray-800 truncate max-w-[200px]">{l.title}</p>
                    <p className="text-xs text-gray-400">by {l.seller_name}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    l.status === 'active' ? 'bg-green-50 text-green-700' :
                    l.status === 'disabled' ? 'bg-red-50 text-red-600' :
                    'bg-gray-100 text-gray-500'
                  }`}>{l.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
