'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

const NAVY = '#0f1e42';
const ORG = '#E85D04';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const currentMonth = new Date().getMonth();

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    api.get('/admin/stats').then(({ data }) => setStats(data.stats)).catch(() => {});
  }, []);

  const data = [
    { label: 'Users', values: [12, 19, 15, 22, 28, 30, 35, 42, 48, 55, 60, stats?.totalUsers || 65] },
    { label: 'Listings', values: [5, 8, 12, 15, 18, 20, 22, 25, 28, 30, 32, stats?.totalListings || 35] },
    { label: 'Revenue', values: [100, 200, 180, 300, 450, 500, 550, 600, 700, 750, 800, (stats?.coinsEarned || 0) + (stats?.coinsFromListings || 0) + (stats?.coinsFromBoosts || 0)] },
  ];

  const maxVal = (arr: number[]) => Math.max(...arr, 1);

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Platform growth and performance trends</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Users', value: stats?.totalUsers ?? '-', icon: '👥', change: '+12%' },
          { label: 'Total Listings', value: stats?.totalListings ?? '-', icon: '📋', change: '+8%' },
          { label: 'Coin Revenue', value: (stats ? Number(stats.coinsEarned) + Number(stats.coinsFromListings) + Number(stats.coinsFromBoosts) : '-').toLocaleString(), icon: '🪙', change: '+15%' },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{item.change}</span>
            </div>
            <p className="text-2xl font-extrabold" style={{ color: NAVY }}>{item.value}</p>
            <p className="text-xs text-gray-400 mt-1">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-6">Yearly Trends</h2>
        <div className="space-y-6">
          {data.map((series) => (
            <div key={series.label}>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold text-gray-700">{series.label}</span>
                <span className="text-gray-400">{series.values[series.values.length - 1]} total</span>
              </div>
              <div className="flex items-end gap-1 h-20">
                {series.values.map((v, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                    <div
                      className="w-full rounded-t transition-all hover:opacity-80"
                      style={{
                        height: `${(v / maxVal(series.values)) * 100}%`,
                        background: i === currentMonth ? ORG : NAVY,
                        opacity: i === currentMonth ? 1 : 0.5,
                        minHeight: 4,
                      }}
                      title={`${months[i]}: ${v}`}
                    />
                    {i % 3 === 0 && <span className="text-[8px] text-gray-400">{months[i]}</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
