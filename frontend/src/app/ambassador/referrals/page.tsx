'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Users, Check, Clock, Coins, Link, Copy, Sparkles } from '@/lib/icons';

const NAVY = '#0f1e42';
const ORG = '#E85D04';

export default function AmbassadorReferralsPage() {
  const [referral, setReferral] = useState<{ referralCode: string; totalReferrals: number; totalEarned: number; rewards: { code: string; amount: number; used: boolean; createdAt: string }[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get('/referrals/me')
      .then(({ data }) => setReferral(data))
      .finally(() => setLoading(false));
  }, []);

  const copyLink = () => {
    const link = window.location.origin + '/register?ref=' + (referral?.referralCode || '');
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-8 animate-fadeInUp">
        <div className="text-center py-16">
          <div className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center text-white font-bold" style={{ background: NAVY }}>E</div>
          <p className="text-gray-400 text-sm animate-pulse">Loading your referrals...</p>
        </div>
      </div>
    );
  }

  if (!referral) {
    return (
      <div className="p-4 lg:p-8 animate-fadeInUp">
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
          <p className="text-gray-400">Could not load referral data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 animate-fadeInUp">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg, ' + NAVY + ', ' + ORG + ')' }}>
          <Link size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Referrals</h1>
          <p className="text-sm text-gray-500">Track your referral activity and earnings</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Referrals', value: referral.totalReferrals, icon: 'users' },
            { label: 'Successful', value: referral.bonusPaid, icon: 'check' },
            { label: 'Pending', value: referral.totalReferrals - referral.bonusPaid, icon: 'clock' },
            { label: 'Bonus/Referral', value: referral.bonusPerReferral + ' RWF', icon: 'coins' },
          ].map((s) => {
            const IconComp = s.icon === 'users' ? Users : s.icon === 'check' ? Check : s.icon === 'clock' ? Clock : Coins;
            const color = s.label === 'Total Referrals' ? NAVY : s.label === 'Successful' ? '#059669' : s.label === 'Pending' ? '#d97706' : ORG;
            return (
              <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition group">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition" style={{ background: color + '15', color: color }}>
                    <IconComp size={22} />
                  </div>
                </div>
                <p className="text-2xl font-extrabold" style={{ color: color }}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-1">
            <div className="rounded-xl p-6" style={{ background: 'linear-gradient(135deg, ' + NAVY + '08, ' + ORG + '08)' }}>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={16} style={{ color: ORG }} />
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800">Your Referral Code</h2>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex-1 w-full">
                  <div className="text-center sm:text-left">
                    <code className="text-3xl font-extrabold tracking-[0.15em] select-all" style={{ color: NAVY }}>
                      {referral.referralCode}
                    </code>
                    <p className="text-xs text-gray-400 mt-2">Share this code with ambassadors to earn {referral.bonusPerReferral} RWF when they pay for their certificate!</p>
                  </div>
                </div>
                <button onClick={copyLink}
                  className="w-full sm:w-auto flex items-center gap-2 text-white font-bold px-6 py-3 rounded-xl transition-all hover:shadow-lg"
                  style={{ background: 'linear-gradient(135deg, ' + NAVY + ', ' + ORG + ')' }}>
                  {copied ? <><Check size={18} /> Copied!</> : <><Copy size={18} /> Copy Link</>}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-4">Referral Performance</h2>
          <div className="flex items-end gap-6 h-32">
            {[
              { label: 'Total', value: referral.totalReferrals, color: NAVY },
              { label: 'Successful', value: referral.bonusPaid, color: '#059669' },
              { label: 'Pending', value: Math.max(referral.totalReferrals - referral.bonusPaid, 0), color: '#d97706' },
            ].map((bar) => {
              const max = Math.max(referral.totalReferrals, 1);
              const heightPct = (bar.value / max) * 100;
              return (
                <div key={bar.label} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs font-bold text-gray-700">{bar.value}</span>
                  <div className="w-full rounded-xl transition-all duration-500"
                    style={{
                      height: Math.max(heightPct, 4) + '%',
                      background: 'linear-gradient(to top, ' + bar.color + ', ' + bar.color + 'dd)',
                      minHeight: 8,
                      boxShadow: '0 4px 12px ' + bar.color + '33',
                    }} />
                  <span className="text-[10px] font-medium text-gray-400">{bar.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
