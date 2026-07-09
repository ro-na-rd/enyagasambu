'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

const NAVY = '#0f1e42';
const ORG = '#E85D04';

export default function AmbassadorRewardsPage() {
  const [referral, setReferral] = useState<any>(null);

  useEffect(() => {
    api.get('/referrals/me').then(({ data }) => setReferral(data)).catch(() => {});
  }, []);

  const totalCoins = (referral?.bonusPaid ?? 0) * (referral?.bonusPerReferral ?? 200) + 100;

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Rewards & Earnings</h1>
        <p className="text-sm text-gray-500 mt-1">Track your coins and rewards earned through referrals</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Coins Earned', value: totalCoins, icon: '🪙', sub: 'Including welcome bonus', color: ORG },
          { label: 'Referral Bonus', value: (referral?.bonusPaid ?? 0) * (referral?.bonusPerReferral ?? 200), icon: '💰', sub: `${referral?.bonusPaid ?? 0} successful referrals`, color: '#059669' },
          { label: 'Welcome Bonus', value: 100, icon: '🎉', sub: 'Account registration', color: NAVY },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{s.icon}</span>
            </div>
            <p className="text-3xl font-extrabold" style={{ color: s.color }}>{s.value.toLocaleString()} 🪙</p>
            <p className="text-sm font-semibold text-gray-800 mt-1">{s.label}</p>
            <p className="text-xs text-gray-400">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-4">Reward History</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-3 border-b border-gray-50">
            <div className="flex items-center gap-3">
              <span className="text-xl">🎉</span>
              <div>
                <p className="text-sm font-medium text-gray-800">Welcome Bonus</p>
                <p className="text-xs text-gray-400">Account registration reward</p>
              </div>
            </div>
            <span className="text-sm font-bold text-green-600">+100 🪙</span>
          </div>
          {referral && referral.bonusPaid > 0 && (
            <div className="flex items-center justify-between py-3 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <span className="text-xl">🔗</span>
                <div>
                  <p className="text-sm font-medium text-gray-800">Referral Bonuses</p>
                  <p className="text-xs text-gray-400">{referral.bonusPaid} successful referral(s)</p>
                </div>
              </div>
              <span className="text-sm font-bold text-green-600">+{referral.bonusPaid * (referral.bonusPerReferral ?? 200)} 🪙</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
