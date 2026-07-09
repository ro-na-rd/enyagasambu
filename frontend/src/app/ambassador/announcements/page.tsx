'use client';
import { useState } from 'react';

const NAVY = '#0f1e42';
const ORG = '#E85D04';

const announcements = [
  { title: 'Welcome to the Ambassador Program!', date: 'Today', desc: 'Start referring friends and earn coins for every successful referral. Your referral code is now active.', type: 'info' },
  { title: 'Double Coins Weekend', date: '2 days ago', desc: 'Earn double referral bonuses this weekend! Every successful referral will earn you 400 coins instead of 200.', type: 'promo' },
  { title: 'New Ambassador Features', date: '1 week ago', desc: 'Check out the new Ambassador Dashboard with real-time stats, activity tracking, and reward history.', type: 'update' },
];

export default function AmbassadorAnnouncementsPage() {
  const [items] = useState(announcements);

  const badgeColors: Record<string, string> = {
    info: 'bg-blue-50 text-blue-700',
    promo: 'bg-orange-50 text-orange-700',
    update: 'bg-green-50 text-green-700',
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
        <p className="text-sm text-gray-500 mt-1">Latest updates and news for ambassadors</p>
      </div>

      <div className="space-y-4">
        {items.map((a, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-base font-bold text-gray-900">{a.title}</h3>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeColors[a.type] || 'bg-gray-100 text-gray-600'}`}>
                {a.type}
              </span>
            </div>
            <p className="text-sm text-gray-600">{a.desc}</p>
            <p className="text-xs text-gray-400 mt-2">{a.date}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
