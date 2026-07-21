'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { Users, Store, User, FileText, Phone, Coins, Ticket, Plus } from '@/lib/icons';

interface Stats {
  totalUsers: number;
  activeListings: number;
  totalListings: number;
  totalUnlocks: number;
  coinsEarned: number;
  coinsFromListings: number;
  coinsFromBoosts: number;
}

export default function StaffDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentUsers, setRecentUsers] = useState<{ id: number; name: string; email: string; coins: number; created_at: string }[]>([]);
  const [recentListings, setRecentListings] = useState<{ id: number; title: string; status: string; seller_name: string; created_at: string }[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) router.push('/login');
      else if (user.role !== 'admin' && user.role !== 'staff') router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'staff') {
      api.get('/admin/stats')
        .then(({ data }) => {
          setStats(data.stats);
          setRecentUsers(data.recentUsers);
          setRecentListings(data.recentListings);
        })
        .finally(() => setFetching(false));
    }
  }, [user]);

  if (loading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f5f6fa' }}>
        <div className="text-center">
          <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center text-white font-black text-xl"
            style={{ background: '#1a2b6d' }}>E</div>
          <p className="text-gray-500 text-sm">Loading Staff Dashboard…</p>
        </div>
      </div>
    );
  }

  const totalRevenue = (stats?.coinsEarned ?? 0) + (stats?.coinsFromListings ?? 0) + (stats?.coinsFromBoosts ?? 0);

  return (
    <div style={{ background: '#f5f6fa', minHeight: '100vh' }}>

      {/* ── Staff Header Banner ── */}
      <div className="text-white px-6 py-8"
        style={{ background: 'linear-gradient(135deg, #1a2b6d 0%, #FF6B00 100%)' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase opacity-70 mb-1">E-Nyagasambu</p>
            <h1 className="text-3xl font-extrabold">Staff Dashboard</h1>
            <p className="opacity-75 text-sm mt-1">Welcome back, <strong>{user?.name}</strong> — NMO Platform Overview</p>
          </div>
          <div className="flex gap-3">
            <Link href="/staff/users"
              className="bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-2 rounded-lg transition border border-white/30">
              <Users size={16} /> Manage Users
            </Link>
            <Link href="/staff/listings"
              className="bg-white text-sm font-bold px-4 py-2 rounded-lg transition"
              style={{ color: '#1a2b6d' }}>
              <Store size={16} /> Manage Listings
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Users',    value: stats?.totalUsers ?? 0,     icon: <User />, bg: '#1a2b6d', light: '#e8ecf8' },
            { label: 'Active Listings',value: stats?.activeListings ?? 0, icon: <FileText />, bg: '#FF6B00', light: '#fff3ec' },
            { label: 'Total Connects', value: stats?.totalUnlocks ?? 0,   icon: <Phone />, bg: '#7c3aed', light: '#f5f0ff' },
            { label: 'Coins Revenue',  value: totalRevenue,               icon: <Coins />, bg: '#059669', light: '#ecfdf5' },
          ].map((card) => (
            <div key={card.label} className="rounded-2xl p-5 shadow-sm border border-gray-100"
              style={{ background: card.light }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-3"
                style={{ background: card.bg + '22' }}>
                {card.icon}
              </div>
              <p className="text-2xl font-extrabold" style={{ color: card.bg }}>{card.value.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">{card.label}</p>
            </div>
          ))}
        </div>

        {/* ── Revenue Breakdown ── */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100">
          <h2 className="font-bold text-base mb-5" style={{ color: '#1a2b6d' }}>
            Revenue Breakdown (coins collected)
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Listing Fees (400 ea)', value: stats?.coinsFromListings ?? 0 },
              { label: 'Connect Fees (300 ea)', value: stats?.coinsEarned ?? 0 },
              { label: 'Boost Fees (200 ea)',   value: stats?.coinsFromBoosts ?? 0 },
            ].map(({ label, value }) => (
              <div key={label} className="text-center p-4 rounded-xl" style={{ background: '#f5f6fa' }}>
                <p className="text-2xl font-extrabold" style={{ color: '#FF6B00' }}>{value.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Quick Actions ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { href: '/staff/users',    label: 'Manage Users',    icon: <Users size={24} /> },
            { href: '/staff/listings', label: 'Manage Listings', icon: <Store size={24} /> },
            { href: '/staff/promos',   label: 'Promo Codes',     icon: <Ticket size={24} /> },
            { href: '/listings/create',label: 'Post Listing',    icon: <Plus size={24} /> },
          ].map((item) => (
            <Link key={item.href} href={item.href}
              className="bg-white border-2 border-gray-100 rounded-2xl p-5 text-center hover:shadow-md transition group"
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#FF6B00')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '')}>
              <p className="text-2xl mb-2">{item.icon}</p>
              <p className="text-sm font-semibold text-gray-700 group-hover:text-gray-900">{item.label}</p>
            </Link>
          ))}
        </div>

        {/* ── Recent Activity ── */}
        <div className="grid sm:grid-cols-2 gap-6">

          {/* Recent Users */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-base" style={{ color: '#1a2b6d' }}>Recent Users</h2>
              <Link href="/staff/users" className="text-xs font-semibold hover:underline" style={{ color: '#FF6B00' }}>View all →</Link>
            </div>
            <div className="space-y-3">
              {recentUsers.length === 0 && <p className="text-sm text-gray-400">No users yet.</p>}
              {recentUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ background: '#1a2b6d' }}>
                      {u.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{u.name}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: '#fff3ec', color: '#FF6B00' }}>
                    <Coins size={12} /> {u.coins}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Listings */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-base" style={{ color: '#1a2b6d' }}>Recent Listings</h2>
              <Link href="/staff/listings" className="text-xs font-semibold hover:underline" style={{ color: '#FF6B00' }}>View all →</Link>
            </div>
            <div className="space-y-3">
              {recentListings.length === 0 && <p className="text-sm text-gray-400">No listings yet.</p>}
              {recentListings.map((l) => (
                <div key={l.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-800 truncate max-w-[180px]">{l.title}</p>
                    <p className="text-xs text-gray-400">by {l.seller_name}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    l.status === 'active'
                      ? 'bg-orange-50 text-[#FF6B00]'
                      : 'bg-gray-100 text-gray-500'
                  }`}>{l.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Staff Note ── */}
        <div className="mt-6 p-4 rounded-2xl border text-sm" style={{ background: '#e8ecf8', borderColor: '#1a2b6d22', color: '#1a2b6d' }}>
          <strong>Staff Portal</strong> — You have full platform access. Changes made here affect all users on the E-Nyagasambu marketplace.
        </div>
      </div>
    </div>
  );
}
