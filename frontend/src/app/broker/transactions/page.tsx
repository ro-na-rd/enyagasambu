'use client';
import { useState } from 'react';
import { CreditCard, Search } from '@/lib/icons';

const NAVY = '#0f1e42';
const ORG = '#E85D04';

const initialTransactions = [
  { id: '#T1024', client: 'Jean-Pierre Kagame', property: '3-Bedroom House Kacyiru', amount: 'RWF 85,000', status: 'Completed', date: '15 Jun 2026' },
  { id: '#T1023', client: 'Claire Niyonzima', property: 'Toyota Hilux 2020', amount: 'RWF 28,000', status: 'Completed', date: '1 Jun 2026' },
  { id: '#T1022', client: 'Alice Uwimana', property: 'Commercial Plot Gishushu', amount: 'RWF 120,000', status: 'Pending', date: '10 Jun 2026' },
  { id: '#T1021', client: 'Bob Mugisha', property: '2-Bedroom Nyarutarama', amount: 'RWF 55,000', status: 'In Progress', date: '20 May 2026' },
  { id: '#T1020', client: 'Jean-Pierre Kagame', property: 'Office Space Kigali Heights', amount: 'RWF 200,000', status: 'Pending', date: '5 May 2026' },
];

const statusColors: Record<string, string> = {
  Completed: 'bg-green-50 text-green-700 border-green-200',
  Pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
};

const stats = [
  { label: 'Total Transactions', value: '5', color: NAVY },
  { label: 'Total Volume', value: 'RWF 488,000', color: ORG },
  { label: 'Completed', value: '2', color: '#059669' },
  { label: 'Pending', value: '3', color: '#d97706' },
];

export default function BrokerTransactionsPage() {
  const [txns] = useState(initialTransactions);
  const [search, setSearch] = useState('');

  const filtered = txns.filter((t) =>
    t.id.toLowerCase().includes(search.toLowerCase()) ||
    t.client.toLowerCase().includes(search.toLowerCase()) ||
    t.property.toLowerCase().includes(search.toLowerCase())
  );

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
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3.5 font-mono text-xs font-semibold" style={{ color: NAVY }}>{t.id}</td>
                  <td className="px-4 py-3.5 text-gray-700">{t.client}</td>
                  <td className="px-4 py-3.5 text-gray-500">{t.property}</td>
                  <td className="px-4 py-3.5 font-bold" style={{ color: NAVY }}>{t.amount}</td>
                  <td className="px-4 py-3.5">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${statusColors[t.status]}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-gray-400 text-xs">{t.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
