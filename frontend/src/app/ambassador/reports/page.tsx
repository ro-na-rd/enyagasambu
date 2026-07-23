'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Coins } from '@/lib/icons';

const NAVY = '#0f1e42';
const ORG = '#E85D04';

export default function AmbassadorReportsPage() {
  const [referral, setReferral] = useState<{ totalReferrals?: number; bonusPaid?: number; bonusPerReferral?: number } | null>(null);

  useEffect(() => {
    api.get('/referrals/me').then(({ data }) => setReferral(data)).catch(() => {});
  }, []);

  const reports = [
    { name: 'Referral Summary', desc: 'Overview of all referrals made', data: `${referral?.totalReferrals ?? 0} total, ${referral?.bonusPaid ?? 0} successful` },
    { name: 'Earnings Report', desc: 'Coins earned through referrals', data: `${((referral?.bonusPaid ?? 0) * (referral?.bonusPerReferral ?? 200)).toLocaleString()}` },
    { name: 'Activity Log', desc: 'Complete history of your actions', data: 'View in Activities page' },
  ];

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500 mt-1">View your ambassador performance reports</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {reports.map((r, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-800 mb-1">{r.name}</h3>
            <p className="text-xs text-gray-400 mb-3">{r.desc}</p>
            <p className="text-lg font-extrabold" style={{ color: NAVY }}>{r.data}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
