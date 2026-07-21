'use client';
import { useState } from 'react';

const NAVY = '#0f1e42';
const ORG = '#E85D04';

const initialClients = [
  { id: 1, name: 'Jean-Pierre Kagame', email: 'jp@example.com', phone: '+250 788 100 200', status: 'Active', deals: 3, joined: 'Jan 2026' },
  { id: 2, name: 'Alice Uwimana', email: 'alice@example.com', phone: '+250 788 300 400', status: 'Active', deals: 1, joined: 'Mar 2026' },
  { id: 3, name: 'Bob Mugisha', email: 'bob@example.com', phone: '+250 788 500 600', status: 'Inactive', deals: 0, joined: 'Feb 2026' },
  { id: 4, name: 'Claire Niyonzima', email: 'claire@example.com', phone: '+250 788 700 800', status: 'Active', deals: 5, joined: 'Nov 2025' },
];

export default function BrokerClientsPage() {
  const [clients] = useState(initialClients);
  const [search, setSearch] = useState('');

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Clients</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your client relationships.</p>
        </div>
        <button className="bg-[#E85D04] text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-[#c04a00] transition">
          + Add Client
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients..."
            className="w-full max-w-xs border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Deals</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3 text-gray-500">{c.email}</td>
                  <td className="px-4 py-3 text-gray-500">{c.phone}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${c.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{c.deals}</td>
                  <td className="px-4 py-3 text-gray-400">{c.joined}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
