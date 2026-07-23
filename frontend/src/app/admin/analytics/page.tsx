'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Users, Package, Coins, BarChart3, TrendingUp, Activity } from '@/lib/icons';

const NAVY = '#0f1e42';
const ORG = '#E85D04';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const currentMonth = new Date().getMonth();

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    api.get('/admin/stats').then(({ data }) => setStats(data.stats)).catch(() => {});
  }, []);

  const totalRevenue = stats ? Number(stats.coinsEarned) + Number(stats.coinsFromListings) + Number(stats.coinsFromBoosts) : 0;

  const data = [
    { label: 'Users', values: [12, 19, 15, 22, 28, 30, 35, 42, 48, 55, 60, stats?.totalUsers || 65], icon: <Users size={20} /> },
    { label: 'Listings', values: [5, 8, 12, 15, 18, 20, 22, 25, 28, 30, 32, stats?.totalListings || 35], icon: <Package size={20} /> },
    { label: 'Revenue', values: [100, 200, 180, 300, 450, 500, 550, 600, 700, 750, 800, totalRevenue || 900], icon: <Coins size={20} /> },
  ];

  const maxVal = (arr: number[]) => Math.max(...arr, 1);

  return (
    <div className="p-4 lg:p-8 animate-fadeInUp">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${ORG}15` }}>
            <BarChart3 size={18} style={{ color: ORG }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
            <p className="text-sm text-gray-600 mt-0.5">Platform growth and performance trends</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Users', value: stats?.totalUsers ?? '-', icon: <Users size={24} />, change: '+12%', gradient: `linear-gradient(135deg, ${NAVY}, #0f1e42)` },
          { label: 'Total Listings', value: stats?.totalListings ?? '-', icon: <Package size={24} />, change: '+8%', gradient: `linear-gradient(135deg, ${ORG}, ${ORG}dd)` },
          { label: 'Coin Revenue', value: totalRevenue.toLocaleString(), icon: <Coins size={24} />, change: '+15%', gradient: 'linear-gradient(135deg, #059669, #047857)' },
        ].map((item) => (
          <div key={item.label} className="relative overflow-hidden rounded-xl p-5 text-white"
            style={{ background: item.gradient }}>
            <div className="absolute top-0 right-0 w-20 h-20 opacity-10" style={{ background: 'radial-gradient(circle, white, transparent 70%)', transform: 'translate(30%, -30%)' }} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-white/15 backdrop-blur-sm">
                  {item.icon}
                </div>
                <span className="text-xs font-semibold text-white/70 bg-white/15 px-2 py-0.5 rounded-full">{item.change}</span>
              </div>
              <p className="text-2xl font-extrabold">{item.value}</p>
              <p className="text-xs text-white/60 mt-1">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl p-6" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp size={18} style={{ color: ORG }} />
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Yearly Trends</h2>
        </div>
        <div className="space-y-8">
          {data.map((series) => {
            const max = maxVal(series.values);
            return (
              <div key={series.label}>
                <div className="flex justify-between text-sm mb-3">
                  <span className="font-semibold text-gray-700">{series.label}</span>
                  <span className="text-gray-600">{series.values[series.values.length - 1]} total</span>
                </div>
                <div className="flex items-end gap-1.5 h-24">
                  {series.values.map((v, i) => {
                    const h = (v / max) * 100;
                    const isCurrent = i === currentMonth;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 group/bar">
                        <div className="relative w-full rounded-t transition-all duration-200 group-hover/bar:opacity-90 cursor-pointer"
                          style={{
                            height: `${Math.max(h, 3)}%`,
                            background: isCurrent
                              ? `linear-gradient(to top, ${ORG}, ${ORG}88)`
                              : `linear-gradient(to top, ${NAVY}, #0f1e42)`,
                            opacity: isCurrent ? 1 : 0.5,
                            minHeight: 4,
                            boxShadow: isCurrent ? `0 0 12px ${ORG}44` : 'none',
                          }}
                          title={`${months[i]}: ${v}`}>
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-lg text-white text-[9px] font-bold opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap"
                            style={{ background: '#f6f8fa' }}>
                            {v.toLocaleString()}
                          </div>
                        </div>
                        {i % 3 === 0 && <span className="text-[8px] text-gray-600">{months[i]}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
