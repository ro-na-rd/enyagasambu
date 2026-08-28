'use client';
import { useState, useEffect, useCallback } from 'react';
import { useCurrency } from '@/context/CurrencyContext';
import api from '@/lib/api';
import { Loader2, Users, Store, CheckCircle, Clock, Coins, UserPlus, TrendingUp, BarChart3 } from '@/lib/icons';

const NAVY = '#0f1e42';
const ORG = '#E85D04';

interface Report {
  summary: {
    totalClients: number;
    activeListings: number;
    soldListings: number;
    pendingListings: number;
    totalCommission: number;
    commissionThisMonth: number;
    totalLeads: number;
  };
  byCategory: { category: string; category_type: string; count: number }[];
  byMonth: { label: string; count: number }[];
  recentClients: { id: number; name: string; phone: string | null; status: string; created_at: string }[];
  recentLeads: { id: number; buyer_name: string; listing_title: string; created_at: string }[];
}

export default function BrokerReportsPage() {
  const { format } = useCurrency();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/broker/reports');
      setReport(data);
    } catch {
      setError('Could not load your report. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchReport(); }, [fetchReport]);

  const s = report?.summary;
  const cards = [
    { label: 'Total Clients', value: String(s?.totalClients ?? 0), icon: <Users size={20} />, color: NAVY, bg: '#eef2ff' },
    { label: 'Active Listings', value: String(s?.activeListings ?? 0), icon: <Store size={20} />, color: '#059669', bg: '#ecfdf5' },
    { label: 'Sold Deals', value: String(s?.soldListings ?? 0), icon: <CheckCircle size={20} />, color: '#0f1e42', bg: '#f0f2f6' },
    { label: 'Leads', value: String(s?.totalLeads ?? 0), icon: <UserPlus size={20} />, color: '#2563eb', bg: '#eff6ff' },
    { label: 'Pending/Expired', value: String(s?.pendingListings ?? 0), icon: <Clock size={20} />, color: '#d97706', bg: '#fffbeb' },
    { label: 'Total Commission', value: format(s?.totalCommission ?? 0), icon: <Coins size={20} />, color: ORG, bg: '#fff7ed' },
  ];

  const maxMonth = Math.max(1, ...(report?.byMonth || []).map((m) => m.count));

  return (
    <div className="p-4 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Reports</h1>
      <p className="text-sm text-gray-500 mb-6">Performance summary of your business.</p>

      {error && (
        <div className="mb-4 flex items-center justify-between text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <span>{error}</span>
          <button onClick={fetchReport} className="font-semibold underline">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-3 py-24 text-gray-400">
          <Loader2 size={20} className="animate-spin" /> Loading report…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
            {cards.map((c) => (
              <div key={c.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: c.bg, color: c.color }}>{c.icon}</span>
                </div>
                <p className="text-2xl font-extrabold" style={{ color: c.color }}>{c.value}</p>
                <p className="text-[10px] text-gray-400 mt-1">{c.label}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Listings by category */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-800 text-sm">Listings by Category</h3>
                <BarChart3 size={16} className="text-gray-400" />
              </div>
              {report?.byCategory && report.byCategory.length > 0 ? (
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-50">
                    {report.byCategory.map((c) => {
                      const total = report.byCategory.reduce((a, b) => a + b.count, 0) || 1;
                      return (
                        <tr key={c.category}>
                          <td className="px-4 py-3 text-gray-700">{c.category}</td>
                          <td className="px-4 py-3 text-right w-40">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${(c.count / total) * 100}%`, background: `linear-gradient(to right, ${NAVY}, ${ORG})` }} />
                              </div>
                              <span className="text-xs font-semibold text-gray-600 w-5 text-right">{c.count}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-gray-400 text-center py-10">No listings yet.</p>
              )}
            </div>

            {/* Monthly trend */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800 text-sm">Listings Created (6 months)</h3>
                <TrendingUp size={16} className="text-gray-400" />
              </div>
              <div className="flex items-end gap-2 h-40 mb-2">
                {(report?.byMonth || []).map((m) => (
                  <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] font-semibold text-gray-600">{m.count}</span>
                    <div className="w-full rounded-md transition-all" style={{ height: `${Math.max((m.count / maxMonth) * 100, 4)}%`, background: `linear-gradient(to top, ${NAVY}, ${ORG})`, minHeight: 4 }} />
                    <span className="text-[9px] text-gray-400">{m.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent clients */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800 text-sm">Recent Clients</h3>
              </div>
              {report?.recentClients && report.recentClients.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-2.5">Name</th>
                      <th className="px-4 py-2.5">Phone</th>
                      <th className="px-4 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {report.recentClients.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-2.5 font-medium text-gray-900">{c.name}</td>
                        <td className="px-4 py-2.5 text-gray-500">{c.phone || '—'}</td>
                        <td className="px-4 py-2.5">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${c.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {c.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">No clients yet.</p>
              )}
            </div>

            {/* Recent leads */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800 text-sm">Recent Leads</h3>
              </div>
              {report?.recentLeads && report.recentLeads.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-2.5">Buyer</th>
                      <th className="px-4 py-2.5">Interest</th>
                      <th className="px-4 py-2.5">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {report.recentLeads.map((l) => (
                      <tr key={l.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-2.5 font-medium text-gray-900">{l.buyer_name}</td>
                        <td className="px-4 py-2.5 text-gray-500">{l.listing_title}</td>
                        <td className="px-4 py-2.5 text-gray-400 whitespace-nowrap">
                          {new Date(l.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">No leads yet.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
