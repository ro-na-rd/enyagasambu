'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

const NAVY = '#0f1e42';
const ORG = '#E85D04';

export default function AmbassadorReferralsPage() {
  const [referral, setReferral] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/referrals/me')
      .then(({ data }) => setReferral(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Referrals</h1>
        <p className="text-sm text-gray-500 mt-1">Track your referral activity and earnings</p>
      </div>

      {loading ? (
        <p className="text-gray-400 text-center py-12">Loading...</p>
      ) : referral ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Referrals', value: referral.totalReferrals, icon: '👥', color: NAVY },
              { label: 'Successful', value: referral.bonusPaid, icon: '✅', color: '#059669' },
              { label: 'Pending', value: referral.totalReferrals - referral.bonusPaid, icon: '⏳', color: '#d97706' },
              { label: 'Bonus Per Referral', value: `${referral.bonusPerReferral} 🪙`, icon: '💰', color: ORG },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <p className="text-2xl mb-2">{s.icon}</p>
                <p className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-4">Your Referral Code</h2>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <code className="text-xl font-extrabold tracking-[0.2em] bg-gray-50 rounded-lg px-4 py-2.5 select-all" style={{ color: NAVY }}>
                {referral.referralCode}
              </code>
              <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/register?ref=${referral.referralCode}`); alert('Copied!'); }}
                className="bg-[#E85D04] text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-[#c04a00] transition">
                Copy Link
              </button>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-gray-400 text-center py-12">Could not load referral data</p>
      )}
    </div>
  );
}
