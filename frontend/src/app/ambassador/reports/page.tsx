'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Coins, TrendingUp, Users, FileText } from '@/lib/icons';
import Link from 'next/link';

const NAVY = '#0f1e42';
const ORG = '#E85D04';

export default function AmbassadorReportsPage() {
  const [referral, setReferral] = useState<{ totalReferrals?: number; bonusPaid?: number; bonusPerReferral?: number } | null>(null);
  const [recruitStats, setRecruitStats] = useState<{ total: number; suppliers: number; vendors: number; onboarded: number } | null>(null);
  const [campaignStats, setCampaignStats] = useState<{ total: number; active: number; completed: number; totalActions: number } | null>(null);

  useEffect(() => {
    Promise.all([
      api.get('/referrals/me').catch(() => ({ data: {} })),
      api.get('/ambassador/recruitments/stats').catch(() => ({ data: null })),
      api.get('/ambassador/campaigns/stats').catch(() => ({ data: null })),
    ])
      .then(([r, rec, camp]) => {
        setReferral(r.data);
        setRecruitStats(rec.data);
        setCampaignStats(camp.data);
      });
  }, []);

  const reports = [
    { name: 'Referral Summary', desc: 'Overview of all referrals made', data: `${referral?.totalReferrals ?? 0} total, ${referral?.bonusPaid ?? 0} successful`, color: NAVY, href: '/ambassador/referrals' },
    { name: 'Earnings Report', desc: 'Coins earned through referrals', data: `${((referral?.bonusPaid ?? 0) * (referral?.bonusPerReferral ?? 200)).toLocaleString()} RWF`, color: ORG, href: '/ambassador/rewards' },
    { name: 'Recruitment Report', desc: 'Suppliers and vendors recruited', data: recruitStats ? `${recruitStats.total} total, ${recruitStats.onboarded} onboarded` : 'No data yet', color: '#059669', href: '/ambassador/recruitments' },
    { name: 'Campaign Report', desc: 'Awareness campaigns conducted', data: campaignStats ? `${campaignStats.total} total, ${campaignStats.completed} completed` : 'No data yet', color: '#7c3aed', href: '/ambassador/campaigns' },
  ];

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500 mt-1">View your ambassador performance reports</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        {reports.map((r, i) => (
          <Link key={i} href={r.href}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition group">
            <h3 className="text-sm font-bold text-gray-800 mb-1 group-hover:text-[#E85D04] transition">{r.name}</h3>
            <p className="text-xs text-gray-400 mb-3">{r.desc}</p>
            <p className="text-lg font-extrabold" style={{ color: r.color }}>{r.data}</p>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-3">Activity Log</h2>
        <p className="text-sm text-gray-500 mb-4">Complete history of your ambassador actions</p>
        <Link href="/ambassador/activities"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#E85D04] hover:text-[#c04a00] transition">
          <FileText size={16} /> View all activities →
        </Link>
      </div>
    </div>
  );
}
