'use client';
import { useState } from 'react';

const initialLeads = [
  { id: 1, name: 'David Habimana', email: 'david@example.com', phone: '+250 788 111 222', interest: '3-Bedroom House', status: 'New', date: 'Today' },
  { id: 2, name: 'Eva Uwase', email: 'eva@example.com', phone: '+250 788 333 444', interest: 'Commercial Plot', status: 'Contacted', date: 'Yesterday' },
  { id: 3, name: 'Frank Niyonshuti', email: 'frank@example.com', phone: '+250 788 555 666', interest: 'Apartment Rental', status: 'New', date: '2 days ago' },
  { id: 4, name: 'Grace Mukamana', email: 'grace@example.com', phone: '+250 788 777 888', interest: 'Office Space', status: 'Qualified', date: '3 days ago' },
];

const statusColors: Record<string, string> = {
  New: 'bg-blue-50 text-blue-700',
  Contacted: 'bg-yellow-50 text-yellow-700',
  Qualified: 'bg-green-50 text-green-700',
};

export default function BrokerLeadsPage() {
  const [leads] = useState(initialLeads);

  return (
    <div className="p-4 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Leads</h1>
      <p className="text-sm text-gray-500 mb-6">Manage your property inquiries and leads.</p>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Interest</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leads.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium text-gray-900">{l.name}</td>
                  <td className="px-4 py-3 text-gray-500">{l.email}</td>
                  <td className="px-4 py-3 text-gray-500">{l.phone}</td>
                  <td className="px-4 py-3 text-gray-700">{l.interest}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusColors[l.status]}`}>{l.status}</span>
                  </td>
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
