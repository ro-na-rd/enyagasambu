'use client';
import { useState } from 'react';
import { Activity, Download, Calendar, Filter } from '@/lib/icons';

const BRAND = {
  navy: '#0f1e42',
  navyDark: '#0a1430',
  orange: '#E85D04',
  orangeDark: '#c44d00',
};

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
    <div className="p-4 lg:p-8 animate-fadeInUp">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${BRAND.orange}15` }}>
            <Activity size={18} style={{ color: BRAND.orange }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Reports</h1>
            <p className="text-sm text-gray-600 mt-0.5">Generate and view platform reports</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
          <div className="px-5 py-4 border-b border-gray-200">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Available Reports</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {items.map((r) => (
              <div key={r.id} className="px-5 py-4 hover:bg-gray-50 transition flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{r.name}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{r.desc}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full capitalize"
                    style={{ background: `${BRAND.navy}60`, color: '#6e7781' }}>{r.type}</span>
                  <button className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition flex items-center gap-1"
                    style={{ background: BRAND.orange }}>
                    <Download size={12} /> Generate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl p-6" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Custom Report</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Report Type</label>
              <select className="border rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                style={{ background: '#f6f8fa', borderColor: '#d0d7de', color: '#1a1a1a' }}>
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
                <input type="date" className="border rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                  style={{ background: '#f6f8fa', borderColor: '#d0d7de', color: '#1a1a1a', colorScheme: 'light' }} />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">To</label>
                <input type="date" className="border rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                  style={{ background: '#f6f8fa', borderColor: '#d0d7de', color: '#1a1a1a', colorScheme: 'light' }} />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Format</label>
              <div className="flex gap-3">
                {['PDF', 'CSV', 'Excel'].map((f) => (
                  <label key={f} className="flex items-center gap-1.5 text-sm" style={{ color: '#6e7781' }}>
                    <input type="radio" name="format" defaultChecked={f === 'PDF'} className="accent-orange-500" /> {f}
                  </label>
                ))}
              </div>
            </div>
            <button className="w-full text-white text-sm font-semibold py-2.5 rounded-lg transition"
              style={{ background: `linear-gradient(135deg, ${BRAND.orange}, ${BRAND.orangeDark})` }}>
              Generate Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
