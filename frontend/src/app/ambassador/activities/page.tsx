'use client';
import { useState } from 'react';
import { Sparkles, FileText, User, Coins } from '@/lib/icons';

const NAVY = '#0f1e42';
const ORG = '#E85D04';

const allActivities = [
  { action: 'You joined the Ambassador Program', time: '2 minutes ago', icon: <Sparkles size={16} />, type: 'achievement' },
  { action: 'Referral code copied to clipboard', time: '1 hour ago', icon: <FileText size={16} />, type: 'action' },
  { action: 'Profile updated successfully', time: '3 hours ago', icon: <User size={16} />, type: 'action' },
  { action: 'Welcome bonus received: 100', time: '1 day ago', icon: <Coins size={16} />, type: 'reward' },
];

export default function AmbassadorActivitiesPage() {
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? allActivities : allActivities.filter((a) => a.type === filter);

  return (
    <div className="p-4 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Activities</h1>
          <p className="text-sm text-gray-500 mt-1">Your recent actions and events</p>
        </div>
        <div className="flex gap-1">
          {['all', 'action', 'reward', 'achievement'].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${filter === f ? 'bg-[#E85D04] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No activities found</p>
        ) : (
          <div className="space-y-5">
            {filtered.map((a, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: '#f0f2f9', color: '#0f1e42' }}>{a.icon}</div>
                  {i < filtered.length - 1 && <div className="w-0.5 flex-1 bg-gray-100 mt-1" />}
                </div>
                <div className="pb-5">
                  <p className="text-sm font-medium text-gray-800">{a.action}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
