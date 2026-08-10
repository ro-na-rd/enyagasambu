'use client';
import { useState, useEffect } from 'react';
import { CreditCard, Search } from '@/lib/icons';
import api from '@/lib/api';

const NAVY = '#0f1e42';
const ORG = '#E85D04';

interface Transaction {
  id: string;
  type: string;
  client: string;
  property: string;
  amount: number;
  status: string;
  date: string;
}

interface TxStats {
  total: number;
  volume: number;
  completed: number;
  pending: number;
}

const fmtRWF = (n: number) => 'RWF ' + Number(n || 0).toLocaleString('en-US');

const statusColors: Record<string, string> = {
  Completed: 'bg-green-50 text-green-700 border-green-200',
  Pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
  Refunded: 'bg-gray-100 text-gray-600 border-gray-200',
  Failed: 'bg-red-50 text-red-700 border-red-200',
};

const fmtDate = (d: string) => {
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function BrokerTransactionsPage() {
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [statsData, setStatsData] = useState<TxStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/broker/transactions').then(({ data }) => {
      setTxns(data.transactions || []);
      setStatsData(data.stats || null);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = txns.filter((t) =>
    t.id.toLowerCase().includes(search.toLowerCase()) ||
    t.client.toLowerCase().includes(search.toLowerCase()) ||
    t.property.toLowerCase().includes(search.toLowerCase())
  );

  const stats = [
    { label: 'Total Transactions', value: String(statsData?.total ?? 0), color: NAVY },
    { label: 'Total Volume', value: fmtRWF(statsData?.volume ?? 0), color: ORG },
    { label: 'Completed', value: String(statsData?.completed ?? 0), color: '#059669' },
    { label: 'Pending', value: String(statsData?.pending ?? 0), color: '#d97706' },
  ];

  return (
    <div className="p-4 lg:p-8 animate-fadeInUp">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm" style={{ background: `linear-gradient(135deg, ${NAVY}, ${ORG})` }}>
          <CreditCard size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-sm text-gray-500">View all your property transactions</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className="text-xl font-extrabold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search transactions..."
              className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3">Transaction ID</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Property</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">Loading transactions...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">No transactions found.</td></tr>
              ) : filtered.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3.5 font-mono text-xs font-semibold" style={{ color: NAVY }}>{t.id}</td>
                  <td className="px-4 py-3.5 text-gray-700">{t.client}</td>
                  <td className="px-4 py-3.5 text-gray-500">{t.property}</td>
                  <td className="px-4 py-3.5 font-bold" style={{ color: NAVY }}>{fmtRWF(t.amount)}</td>
                  <td className="px-4 py-3.5">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${statusColors[t.status] || statusColors.Pending}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-gray-400 text-xs">{fmtDate(t.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
