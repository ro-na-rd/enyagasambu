'use client';
import AppImage from '@/components/AppImage';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import {
  Package, CheckCircle, Eye, Coins, TrendingUp, MapPin,
  ChevronLeft, ChevronRight, List, Download, Filter, Plus, Clock,
} from '@/lib/icons';

const NAVY = '#0f1e42';
const ORG = '#E85D04';

interface RecentListing {
  id: number;
  title: string;
  price: number | null;
  currency: string;
  location: string;
  status: string;
  views: number;
  expires_at: string;
  created_at: string;
  category_name: string;
  primary_image: string | null;
}

interface Stats {
  total: number;
  active: number;
  expired: number;
  sold: number;
  views: number;
  coins: number;
}

function Sparkline({ points, color }: { points: number[]; color: string }) {
  const w = 90;
  const h = 28;
  const max = Math.max(...points, 1);
  const min = Math.min(...points);
  const range = max - min || 1;
  const coords = points.map((p, i) => ({
    x: (i / (points.length - 1)) * w,
    y: h - ((p - min) / range) * (h - 4) - 2,
  }));
  const line = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0" aria-hidden="true">
      <polyline points={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function statusBadge(l: RecentListing) {
  const expired = l.expires_at && new Date(l.expires_at) < new Date();
  if (expired || l.status === 'expired') return { text: 'Expired', bg: '#feeceb', fg: '#d32f2f' };
  if (l.status === 'sold') return { text: 'Sold', bg: '#edf7ed', fg: '#1a6b3a' };
  if (l.status === 'active') return { text: 'Active', bg: '#edf7ed', fg: '#1a6b3a' };
  return { text: l.status, bg: '#f1f5f9', fg: '#64748b' };
}

export default function AccountDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, expired: 0, sold: 0, views: 0, coins: 0 });
  const [recent, setRecent] = useState<RecentListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    api.get('/auth/me/summary')
      .then(({ data }) => {
        setStats(data.stats || { total: 0, active: 0, expired: 0, sold: 0, views: 0, coins: 0 });
        setRecent(data.recentListings || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = statusFilter === 'all' ? recent : recent.filter((l) => {
    const expired = l.expires_at && new Date(l.expires_at) < new Date();
    if (statusFilter === 'expired') return expired || l.status === 'expired';
    return l.status === statusFilter;
  });

  const cards = [
    {
      label: 'My Listings',
      value: stats.total,
      icon: <Package size={20} />,
      iconBg: '#e8f0fe',
      iconFg: '#1e3a8a',
      delta: `${stats.active} active now`,
      up: true,
      spark: [3, 5, 4, 6, 8, stats.total],
      sparkColor: '#1e3a8a',
    },
    {
      label: 'Active Listings',
      value: stats.active,
      icon: <CheckCircle size={20} />,
      iconBg: '#edf7ed',
      iconFg: '#1a6b3a',
      delta: `${stats.expired} expired`,
      up: true,
      spark: [2, 4, 3, 5, 6, stats.active],
      sparkColor: '#22c55e',
    },
    {
      label: 'Total Views',
      value: stats.views,
      icon: <Eye size={20} />,
      iconBg: '#fff4e5',
      iconFg: '#b45309',
      delta: 'across all listings',
      up: true,
      spark: [10, 18, 15, 24, 30, stats.views],
      sparkColor: '#f59e0b',
    },
    {
      label: 'Coins Balance',
      value: stats.coins,
      icon: <Coins size={20} />,
      iconBg: '#f3e8ff',
      iconFg: '#7c3aed',
      delta: `${stats.sold} sold`,
      up: true,
      spark: [5, 8, 7, 10, 9, stats.coins],
      sparkColor: '#7c3aed',
    },
  ];

  return (
    <div className="p-4 lg:p-8" style={{ background: '#f0f2f6' }}>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold" style={{ color: NAVY }}>Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Overview of your marketplace operations</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 outline-none cursor-pointer"
        >
          <option value="all">All Listings</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="sold">Sold</option>
        </select>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-400 text-sm border border-gray-100 animate-pulse">
          Loading dashboard…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            {cards.map((c) => (
              <div key={c.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: c.iconBg, color: c.iconFg }}>
                    {c.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-500">{c.label}</p>
                    <p className="text-2xl font-extrabold text-gray-900 leading-tight">{c.value.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-end justify-between mt-4 gap-2">
                  <p className="flex items-center gap-1 text-xs font-semibold" style={{ color: c.up ? '#1a6b3a' : '#d32f2f' }}>
                    <TrendingUp size={14} />
                    {c.delta}
                  </p>
                  <Sparkline points={c.spark} color={c.sparkColor} />
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 lg:px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <List size={16} /> Recent Listings
              </h2>
              <div className="flex items-center gap-2">
                <Link href="/my-listings" className="flex items-center gap-1.5 text-xs font-semibold border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition text-gray-600">
                  <Filter size={13} /> View All
                </Link>
                <Link href="/listings/create" className="flex items-center gap-1.5 text-xs font-bold text-white rounded-lg px-3 py-1.5 hover:opacity-90 transition" style={{ background: ORG }}>
                  <Plus size={13} /> New Listing
                </Link>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-gray-100 bg-gray-50/60">
                    <th className="px-4 lg:px-6 py-3 font-semibold">Listing ID</th>
                    <th className="px-4 py-3 font-semibold">Title</th>
                    <th className="px-4 py-3 font-semibold">Location</th>
                    <th className="px-4 py-3 font-semibold">Price</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Created</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                        <Download size={24} className="mx-auto mb-2 opacity-30" />
                        <p className="font-medium">No listings yet</p>
                        <Link href="/listings/create" className="text-xs font-semibold hover:underline" style={{ color: ORG }}>
                          Post your first listing
                        </Link>
                      </td>
                    </tr>
                  ) : filtered.map((l) => {
                    const badge = statusBadge(l);
                    return (
                      <tr key={l.id} className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/60 transition">
                        <td className="px-4 lg:px-6 py-3 font-semibold whitespace-nowrap" style={{ color: '#1e3a8a' }}>
                          LST-{l.id}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0 block">
                              {l.primary_image
                                ? <AppImage src={l.primary_image} alt={l.title} className="w-full h-full object-cover" />
                                : <span className="w-full h-full flex items-center justify-center"><Package size={16} className="opacity-30" /></span>}
                            </span>
                            <span className="min-w-0">
                              <span className="block font-semibold text-gray-800 truncate max-w-52">{l.title}</span>
                              <span className="block text-xs text-gray-400">{l.category_name} · {l.views} views</span>
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1"><MapPin size={13} /> {l.location || 'Kigali'}</span>
                        </td>
                        <td className="px-4 py-3 font-bold whitespace-nowrap" style={{ color: ORG }}>
                          {l.price != null ? `${Number(l.price).toLocaleString()} ${l.currency || 'RWF'}` : 'Negotiable'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide" style={{ background: badge.bg, color: badge.fg }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: badge.fg }} />
                            {badge.text}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                          {new Date(l.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          <span className="block text-[10px] text-gray-400">
                            <Clock size={10} className="inline mr-0.5" />
                            {new Date(l.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Link href={`/listings/${l.id}`} className="text-xs font-bold" style={{ color: NAVY }}>
                            View →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-4 lg:px-6 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                Showing 1 to {filtered.length} of {stats.total} entries
              </p>
              <div className="flex items-center gap-1">
                <button className="p-1.5 rounded-lg border border-gray-200 text-gray-400 cursor-not-allowed" aria-label="Previous">
                  <ChevronLeft size={15} />
                </button>
                <span className="w-7 h-7 flex items-center justify-center text-xs font-bold text-white rounded-lg" style={{ background: NAVY }}>1</span>
                <button className="p-1.5 rounded-lg border border-gray-200 text-gray-400 cursor-not-allowed" aria-label="Next">
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <Link href="/listings/create" className="text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:opacity-90 transition" style={{ background: `linear-gradient(135deg, ${NAVY}, ${ORG})` }}>
              + Post a new listing
            </Link>
            <Link href="/coins" className="text-sm font-semibold px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition">
              Buy coins — {user?.coins ?? stats.coins} available
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
