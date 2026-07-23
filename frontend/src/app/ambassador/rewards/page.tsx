'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Coins, Sparkles } from '@/lib/icons';

const NAVY = '#0f1e42';
const ORG = '#E85D04';

export default function AmbassadorRewardsPage() {
  const [referral, setReferral] = useState<{ totalReferrals?: number; bonusPaid?: number; bonusPerReferral?: number } | null>(null);

  useEffect(() => {
    api.get('/referrals/me').then(({ data }) => setReferral(data)).catch(() => {});
  }, []);

  const totalEarned = (referral?.bonusPaid ?? 0) * (referral?.bonusPerReferral ?? 200);

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Rewards & Earnings</h1>
        <p className="text-sm text-gray-500 mt-1">Track your RWF earnings from ambassador referrals</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-8">
        {[
          { label: 'Total Earned', value: totalEarned + ' RWF', icon: <Coins size={24} />, sub: 'From certificate referrals', color: ORG },
          { label: 'Referral Bonus', value: (referral?.bonusPaid ?? 0) * (referral?.bonusPerReferral ?? 200) + ' RWF', icon: <Coins size={24} />, sub: `${referral?.bonusPaid ?? 0} successful referral(s)`, color: '#059669' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-2">
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <p className="text-3xl font-extrabold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-sm font-semibold text-gray-800 mt-1">{s.label}</p>
            <p className="text-xs text-gray-400">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-4">Reward History</h2>
        <div className="space-y-3">
          {referral && referral.bonusPaid > 0 && (
            <div className="flex items-center justify-between py-3 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <span style={{ color: '#059669' }}><Coins size={20} /></span>
                <div>
                  <p className="text-sm font-medium text-gray-800">Referral Bonuses</p>
                  <p className="text-xs text-gray-400">{referral.bonusPaid} successful referral(s) paid for certificate</p>
                </div>
              </div>
              <span className="text-sm font-bold text-green-600">+{referral.bonusPaid * (referral.bonusPerReferral ?? 200)} RWF</span>
            </div>
          )}
          {(!referral || referral.bonusPaid === 0) && (
            <p className="text-sm text-gray-400 text-center py-4">No referral earnings yet. Share your code with ambassadors!</p>
          )}
        </div>
      </div>
    </div>
  );
}
