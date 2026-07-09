'use client';
import { useState } from 'react';

const NAVY = '#0f1e42';
const ORG = '#E85D04';

const reports = [
  { id: 1, name: 'User Registration Report', type: 'Daily', desc: 'New user sign-ups per day', last: 'Today 08:00' },
  { id: 2, name: 'Listing Activity Report', type: 'Weekly', desc: 'Listings created, activated, expired', last: 'Mon 07:00' },
  { id: 3, name: 'Revenue Summary', type: 'Monthly', desc: 'Coins earned from fees and boosts', last: 'Jul 01' },
  { id: 4, name: 'Connects Report', type: 'Daily', desc: 'Phone number unlock activity', last: 'Today 08:00' },
  { id: 5, name: 'Referral Performance', type: 'Weekly', desc: 'Referral sign-ups and bonuses paid', last: 'Mon 07:00' },
];

export default function AdminReportsPage() {
  const [items] = useState(reports);

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Generate and view platform reports</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800">Available Reports</h2>
          </div>
          {items.map((r) => (
            <div key={r.id} className="px-5 py-4 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-800">{r.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{r.desc}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-medium text-gray-400 uppercase bg-gray-100 px-2 py-0.5 rounded-full">{r.type}</span>
                <button className="text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:opacity-90 transition" style={{ background: ORG }}>
                  Generate
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-4">Custom Report</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Report Type</label>
              <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:border-[#E85D04]">
                <option>Users</option>
                <option>Listings</option>
                <option>Revenue</option>
                <option>Connects</option>
                <option>Referrals</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">From</label>
                <input type="date" className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:border-[#E85D04]" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">To</label>
                <input type="date" className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:border-[#E85D04]" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Format</label>
              <div className="flex gap-3">
                <label className="flex items-center gap-1.5 text-sm text-gray-600"><input type="radio" name="format" defaultChecked /> PDF</label>
                <label className="flex items-center gap-1.5 text-sm text-gray-600"><input type="radio" name="format" /> CSV</label>
                <label className="flex items-center gap-1.5 text-sm text-gray-600"><input type="radio" name="format" /> Excel</label>
              </div>
            </div>
            <button className="w-full bg-[#E85D04] text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-[#c04a00] transition">
              Generate Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
