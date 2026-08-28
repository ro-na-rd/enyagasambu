'use client';
import { useState, useEffect, useCallback } from 'react';
import { useCurrency } from '@/context/CurrencyContext';
import api from '@/lib/api';
import { Loader2, Coins, DollarSign, TrendingUp, CheckCircle, FileText } from '@/lib/icons';

const NAVY = '#0f1e42';
const ORG = '#E85D04';

interface Entry {
  id: number;
  amount_rwf: number;
  created_at: string;
  listing_id: number;
  title: string;
  price: string | null;
  currency: string;
  client_name: string | null;
  category_name: string | null;
}

interface Summary {
  totalCommission: number;
  commissionThisMonth: number;
  commissionThisQuarter: number;
  closedDeals: number;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

export default function BrokerCommissionsPage() {
  const { format } = useCurrency();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/broker/commissions');
      setSummary(data.summary);
      setEntries(data.entries || []);
    } catch {
      setError('Could not load your commissions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData(); }, [fetchData]);

  const cards = [
    { label: 'Total Earned', value: format(summary?.totalCommission ?? 0), icon: <Coins size={20} />, color: NAVY, bg: '#eef2ff' },
    { label: 'This Month', value: format(summary?.commissionThisMonth ?? 0), icon: <DollarSign size={20} />, color: ORG, bg: '#fff7ed' },
    { label: 'This Quarter', value: format(summary?.commissionThisQuarter ?? 0), icon: <TrendingUp size={20} />, color: '#059669', bg: '#ecfdf5' },
    { label: 'Closed Deals', value: String(summary?.closedDeals ?? 0), icon: <CheckCircle size={20} />, color: '#0f1e42', bg: '#f0f2f6' },
  ];

  return (
    <div className="p-4 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Commission & Earnings</h1>
      <p className="text-sm text-gray-500 mb-6">Track your commissions and earnings.</p>

      {error && (
        <div className="mb-4 flex items-center justify-between text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <span>{error}</span>
          <button onClick={fetchData} className="font-semibold underline">Retry</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: s.bg, color: s.color }}>{s.icon}</span>
            </div>
            <p className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 text-sm">Commission History</h3>
          <span className="text-[10px] text-gray-400 font-medium bg-gray-100 px-2.5 py-1 rounded-full">{entries.length} entry{entries.length === 1 ? '' : 'ies'}</span>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-16 text-gray-400">
              <Loader2 size={20} className="animate-spin" /> Loading commissions…
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <FileText size={36} className="mb-3" />
              <p className="text-sm">No commissions yet. Commissions are earned when a client deal closes.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Listing</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Sale Price</th>
                  <th className="px-4 py-3">Commission</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entries.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-900">{e.title}</td>
                    <td className="px-4 py-3 text-gray-500">{e.client_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{e.category_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{e.price ? format(Number(e.price)) : '—'}</td>
                    <td className="px-4 py-3 font-semibold text-green-700 whitespace-nowrap">+ {format(e.amount_rwf)}</td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{formatDate(e.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
