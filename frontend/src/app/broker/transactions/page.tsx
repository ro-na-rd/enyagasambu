'use client';
import { useState } from 'react';

const initialTransactions = [
  { id: '#T1024', client: 'Jean-Pierre Kagame', property: '3-Bedroom House Kacyiru', amount: 'RWF 85,000', status: 'Completed', date: '15 Jun 2026' },
  { id: '#T1023', client: 'Claire Niyonzima', property: 'Toyota Hilux 2020', amount: 'RWF 28,000', status: 'Completed', date: '1 Jun 2026' },
  { id: '#T1022', client: 'Alice Uwimana', property: 'Commercial Plot Gishushu', amount: 'RWF 120,000', status: 'Pending', date: '10 Jun 2026' },
  { id: '#T1021', client: 'Bob Mugisha', property: '2-Bedroom Nyarutarama', amount: 'RWF 55,000', status: 'In Progress', date: '20 May 2026' },
  { id: '#T1020', client: 'Jean-Pierre Kagame', property: 'Office Space Kigali Heights', amount: 'RWF 200,000', status: 'Pending', date: '5 May 2026' },
];

const statusColors: Record<string, string> = {
  Completed: 'bg-green-50 text-green-700',
  Pending: 'bg-yellow-50 text-yellow-700',
  'In Progress': 'bg-blue-50 text-blue-700',
};

export default function BrokerTransactionsPage() {
  const [txns] = useState(initialTransactions);

  return (
    <div className="p-4 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Transactions</h1>
      <p className="text-sm text-gray-500 mb-6">View all your property transactions.</p>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
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
              {txns.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{t.id}</td>
                  <td className="px-4 py-3 text-gray-700">{t.client}</td>
                  <td className="px-4 py-3 text-gray-500">{t.property}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{t.amount}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusColors[t.status]}`}>{t.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{t.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
