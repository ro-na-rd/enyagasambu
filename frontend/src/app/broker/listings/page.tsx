'use client';
import { useState } from 'react';

const NAVY = '#0f1e42';
const ORG = '#E85D04';

const initialListings = [
  { id: 1, title: '3-Bedroom House in Kacyiru', type: 'House', price: 'RWF 85,000', status: 'Active', client: 'Jean-Pierre Kagame', date: '15 Jun 2026' },
  { id: 2, title: 'Commercial Plot - Gishushu', type: 'Land', price: 'RWF 120,000', status: 'Pending', client: 'Alice Uwimana', date: '10 Jun 2026' },
  { id: 3, title: 'Toyota Hilux 2020', type: 'Vehicle', price: 'RWF 28,000', status: 'Sold', client: 'Claire Niyonzima', date: '1 Jun 2026' },
  { id: 4, title: '2-Bedroom Apartment - Nyarutarama', type: 'Apartment', price: 'RWF 55,000', status: 'Active', client: 'Bob Mugisha', date: '20 May 2026' },
  { id: 5, title: 'Office Space - Kigali Heights', type: 'Commercial', price: 'RWF 200,000', status: 'Active', client: 'Jean-Pierre Kagame', date: '5 May 2026' },
];

export default function BrokerListingsPage() {
  const [listings] = useState(initialListings);
  const [search, setSearch] = useState('');

  const filtered = listings.filter((l) =>
    l.title.toLowerCase().includes(search.toLowerCase()) ||
    l.client.toLowerCase().includes(search.toLowerCase())
  );

  const statusColor: Record<string, string> = {
    Active: 'bg-green-50 text-green-700',
    Pending: 'bg-yellow-50 text-yellow-700',
    Sold: 'bg-blue-50 text-blue-700',
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Properties/Listings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your property listings.</p>
        </div>
        <button className="bg-[#E85D04] text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-[#c04a00] transition">
          + New Listing
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search listings..."
            className="w-full max-w-xs border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium text-gray-900">{l.title}</td>
                  <td className="px-4 py-3 text-gray-500">{l.type}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{l.price}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusColor[l.status]}`}>{l.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{l.client}</td>
                  <td className="px-4 py-3 text-gray-400">{l.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
