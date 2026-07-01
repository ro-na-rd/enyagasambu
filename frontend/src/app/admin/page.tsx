'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';

interface Stats {
  totalUsers: number;
  activeListings: number;
  totalListings: number;
  totalUnlocks: number;
  coinsEarned: number;
  coinsFromListings: number;
  coinsFromBoosts: number;
}

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentUsers, setRecentUsers] = useState<{ id: number; name: string; email: string; coins: number; created_at: string }[]>([]);
  const [recentListings, setRecentListings] = useState<{ id: number; title: string; status: string; seller_name: string; created_at: string }[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) router.push('/admin/login');
      else if (user.role !== 'admin') router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      api.get('/admin/stats')
        .then(({ data }) => { setStats(data.stats); setRecentUsers(data.recentUsers); setRecentListings(data.recentListings); })
        .finally(() => setFetching(false));
    }
  }, [user]);

  if (loading || fetching) return <div className="text-center py-24 text-gray-500">Loading…</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
      <p className="text-gray-500 text-sm mb-8">Overview of NMO platform activity</p>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Total Users', value: stats?.totalUsers ?? 0, icon: '👤', color: 'bg-blue-50 text-blue-700' },
          { label: 'Active Listings', value: stats?.activeListings ?? 0, icon: '📋', color: 'bg-orange-50 text-[#FF6B00]' },
          { label: 'Total Connects', value: stats?.totalUnlocks ?? 0, icon: '📞', color: 'bg-purple-50 text-purple-700' },
          { label: 'Revenue (coins)', value: (stats?.coinsEarned ?? 0) + (stats?.coinsFromListings ?? 0) + (stats?.coinsFromBoosts ?? 0), icon: '🪙', color: 'bg-yellow-50 text-yellow-700' },
        ].map((card) => (
          <div key={card.label} className={`rounded-xl p-5 ${card.color} bg-opacity-60`}>
            <p className="text-3xl">{card.icon}</p>
            <p className="text-2xl font-bold mt-2">{card.value.toLocaleString()}</p>
            <p className="text-sm mt-0.5 opacity-80">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Revenue breakdown */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-8">
        <h2 className="font-semibold text-gray-800 mb-4">Revenue Breakdown (coins collected)</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xl font-bold text-[#FF6B00]">{stats?.coinsFromListings ?? 0}</p>
            <p className="text-xs text-gray-500 mt-1">Listing Fees (400 each)</p>
          </div>
          <div>
            <p className="text-xl font-bold text-[#FF6B00]">{stats?.coinsEarned ?? 0}</p>
            <p className="text-xs text-gray-500 mt-1">Connect Fees (300 each)</p>
          </div>
          <div>
            <p className="text-xl font-bold text-[#FF6B00]">{stats?.coinsFromBoosts ?? 0}</p>
            <p className="text-xs text-gray-500 mt-1">Boost Fees (200 each)</p>
          </div>
        </div>
      </div>

      {/* Admin navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        {[
          { href: '/admin/users', label: 'Manage Users', icon: '👥' },
          { href: '/admin/listings', label: 'Manage Listings', icon: '🏪' },
          { href: '/admin/promos', label: 'Promo Codes', icon: '🎟️' },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:shadow transition" style={{ borderColor: undefined }} onMouseEnter={e => (e.currentTarget.style.borderColor = '#FF6B00')} onMouseLeave={e => (e.currentTarget.style.borderColor = '')}>
            <p className="text-2xl mb-1">{item.icon}</p>
            <p className="text-sm font-medium text-gray-700">{item.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {/* Recent users */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-3">Recent Users</h2>
          <div className="space-y-2">
            {recentUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-gray-800">{u.name}</p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </div>
                <span className="font-medium" style={{ color: '#FF6B00' }}>🪙 {u.coins}</span>
              </div>
            ))}
          </div>
          <Link href="/admin/users" className="text-xs hover:underline mt-3 inline-block" style={{ color: '#FF6B00' }}>View all users →</Link>
        </div>

        {/* Recent listings */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-3">Recent Listings</h2>
          <div className="space-y-2">
            {recentListings.map((l) => (
              <div key={l.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-gray-800 truncate max-w-[180px]">{l.title}</p>
                  <p className="text-xs text-gray-400">by {l.seller_name}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${l.status === 'active' ? 'bg-orange-100 text-[#FF6B00]' : 'bg-gray-100 text-gray-600'}`}>{l.status}</span>
              </div>
            ))}
          </div>
          <Link href="/admin/listings" className="text-xs hover:underline mt-3 inline-block" style={{ color: '#FF6B00' }}>View all listings →</Link>
        </div>
      </div>
    </div>
  );
}
