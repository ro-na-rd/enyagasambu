'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';
import { User, Link as LinkIcon, FileText, Gift, Award, Megaphone, BarChart3, Settings, HelpCircle, Users, Check, Clock, Coins, Sparkles } from '@/lib/icons';

const NAVY = '#0f1e42';
const ORG = '#E85D04';

const ambassadorRoles = [
  { href: '/ambassador/profile',    icon: <User size={20} />,  label: 'My Profile',        desc: 'Manage your account information and contact details', color: '#0f1e42' },
  { href: '/ambassador/referrals',  icon: <LinkIcon size={20} />,  label: 'My Referrals',      desc: 'Refer users to the platform and earn coins', color: '#059669' },
  { href: '/ambassador/activities', icon: <FileText size={20} />,  label: 'My Activities',     desc: 'Track your actions, events, and achievements', color: '#d97706' },
  { href: '/ambassador/rewards',    icon: <Gift size={20} />,  label: 'Rewards & Earnings', desc: 'View your coins, bonuses, and reward history', color: '#E85D04' },
  { href: '/ambassador/certificate',icon: <Award size={20} />,  label: 'My Certificate',    desc: 'Get your official ambassador certificate', color: '#7c3aed' },
  { href: '/ambassador/announcements',icon: <Megaphone size={20} />,label: 'Announcements',     desc: 'Stay updated with latest news and program updates', color: '#0891b2' },
  { href: '/ambassador/reports',    icon: <BarChart3 size={20} />,  label: 'Reports',           desc: 'View your performance reports and analytics', color: '#be123c' },
  { href: '/ambassador/settings',   icon: <Settings size={20} />,  label: 'Settings',          desc: 'Configure your notification preferences', color: '#4b5563' },
  { href: '/ambassador/help',       icon: <HelpCircle size={20} />,  label: 'Help & Support',    desc: 'FAQs, guides, and contact support team', color: '#1d4ed8' },
];

const certStatusConfig: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string; action: string; href: string }> = {
  none:      { label: 'Not Requested', icon: <Award size={20} />, color: '#6b7280', bg: '#f3f4f6', action: 'Pay 2,000 RWF', href: '/ambassador/certificate' },
  pending:   { label: 'Payment Pending', icon: <Clock size={20} />, color: '#d97706', bg: '#fffbeb', action: 'Complete Payment', href: '/ambassador/certificate' },
  paid:      { label: 'Payment Confirmed', icon: <Check size={20} />, color: '#059669', bg: '#ecfdf5', action: 'View Certificate', href: '/ambassador/certificate' },
  generated: { label: 'Certificate Ready', icon: <Sparkles size={20} />, color: '#0f1e42', bg: '#eef2ff', action: 'View Certificate', href: '/ambassador/certificate' },
};

export default function AmbassadorDashboardPage() {
  const { user } = useAuth();
  const [referral, setReferral] = useState<any>(null);
  const [cert, setCert] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/referrals/me'),
      api.get('/ambassador/certificate'),
    ])
      .then(([refData, certData]) => {
        setReferral(refData.data);
        setCert(certData.data.certificate);
      })
      .finally(() => setLoading(false));
  }, []);

  const certStatus = cert?.status || 'none';
  const certCfg = certStatusConfig[certStatus] || certStatusConfig.none;

  const stats = [
    { label: 'Total Referrals', value: referral?.totalReferrals ?? 0, icon: <Users size={24} />, color: NAVY, bg: '#eef2ff' },
    { label: 'Successful', value: referral?.bonusPaid ?? 0, icon: <Check size={24} />, color: '#059669', bg: '#ecfdf5' },
    { label: 'Pending', value: (referral?.totalReferrals ?? 0) - (referral?.bonusPaid ?? 0), icon: <Clock size={24} />, color: '#d97706', bg: '#fffbeb' },
    { label: 'Rewards Earned', value: ((referral?.bonusPaid ?? 0) * (referral?.bonusPerReferral ?? 200)).toLocaleString(), icon: <Coins size={24} />, color: ORG, bg: '#fff7ed' },
  ];

  const activities = [
    { action: 'You joined the Ambassador Program', time: 'Just now', icon: <Sparkles size={16} /> },
    ...(referral && referral.totalReferrals > 0
      ? [{ action: `${referral.totalReferrals} referral(s) made`, time: 'Today', icon: <LinkIcon size={16} /> }]
      : []),
  ];

  return (
    <div className="p-4 lg:p-8">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Ambassador Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome back, <strong>{user?.name}</strong> — manage your ambassador roles below.</p>
      </div>

      {/* Ambassador Roles - matching sidebar menu */}
      <div className="mb-8">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-4">Your Ambassador Roles</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {ambassadorRoles.map((role) => (
            <Link key={role.href} href={role.href}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition group flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${role.color}15`, color: role.color }}>
                {role.icon}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 group-hover:text-[#E85D04] transition">{role.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{role.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3">
              <span style={{ color: s.color }}>{s.icon}</span>
              <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-full">{s.label}</span>
            </div>
            <p className="text-3xl font-extrabold" style={{ color: s.color }}>{typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</p>
          </div>
        ))}
      </div>

      {/* Referral code + certificate + activities */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Referral code card */}
        <div className="lg:col-span-1 space-y-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-3">Your Referral Code</h2>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-center">
              {loading ? (
                <p className="text-gray-400 text-sm">Loading...</p>
              ) : (
                <>
                  <code className="text-2xl font-extrabold tracking-[0.2em] select-all" style={{ color: NAVY }}>
                    {referral?.referralCode || '------'}
                  </code>
                  <p className="text-xs text-gray-400 mt-2 mb-4">Share this code with friends to earn {referral?.bonusPerReferral ?? 200} coins each!</p>
                  <button
                    onClick={() => {
                      const link = `${window.location.origin}/register?ref=${referral?.referralCode || ''}`;
                      navigator.clipboard.writeText(link);
                      alert('Referral link copied!');
                    }}
                    className="w-full bg-[#E85D04] text-white text-sm font-bold py-2.5 rounded-lg hover:bg-[#c04a00] transition flex items-center justify-center gap-2">
                    <FileText size={16} /> Copy Referral Link
                  </button>
                </>
              )}
            </div>
          </div>
          {/* Certificate status card */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-3">My Certificate</h2>
            <Link href="/ambassador/certificate" className="block bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition group">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: certCfg.bg, color: certCfg.color }}>{certCfg.icon}</div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-[#E85D04] transition">{certCfg.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {certStatus === 'none' && 'Pay 2,000 RWF to get your official certificate'}
                    {certStatus === 'pending' && 'Waiting for payment confirmation'}
                    {certStatus === 'paid' && 'Payment confirmed — awaiting admin generation'}
                    {certStatus === 'generated' && `Certificate: ${cert?.cert_no || ''}`}
                  </p>
                </div>
              </div>
              {certStatus === 'generated' && cert?.cert_no && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-gray-400">Issued: {cert?.issued_date ? new Date(cert.issued_date).toLocaleDateString('en-GB') : '-'}</span>
                  <span className="font-mono font-bold" style={{ color: ORG }}>{cert.cert_no}</span>
                </div>
              )}
            </Link>
          </div>
        </div>

        {/* Activity timeline */}
        <div className="lg:col-span-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-3">Recent Activities</h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            {activities.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No activities yet</p>
            ) : (
              <div className="space-y-4">
                {activities.map((a, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: '#f0f2f9', color: '#0f1e42' }}>{a.icon}</div>
                      {i < activities.length - 1 && <div className="w-0.5 flex-1 bg-gray-100 mt-1" />}
                    </div>
                    <div>
                      <p className="text-sm text-gray-700">{a.action}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Link href="/ambassador/activities"
            className="block mt-3 text-xs font-semibold text-center py-2 rounded-lg border border-gray-200 text-gray-500 hover:text-[#E85D04] hover:border-[#E85D04] transition">
            View all activities →
          </Link>
        </div>

        {/* Referral performance chart */}
        <div className="lg:col-span-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-3">Referral Performance</h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            {referral ? (
              <div className="flex items-end gap-4 h-28">
                {[
                  { label: 'Total', value: referral.totalReferrals, color: NAVY },
                  { label: 'Successful', value: referral.bonusPaid, color: '#059669' },
                  { label: 'Pending', value: referral.totalReferrals - referral.bonusPaid, color: '#d97706' },
                ].map((bar) => {
                  const max = Math.max(referral.totalReferrals, 1);
                  return (
                    <div key={bar.label} className="flex-1 flex flex-col items-center gap-2">
                      <span className="text-xs font-semibold text-gray-700">{bar.value}</span>
                      <div className="w-full rounded-lg transition-all" style={{ height: `${(bar.value / max) * 100}%`, background: bar.color, minHeight: 4 }} />
                      <span className="text-[10px] text-gray-400 text-center">{bar.label}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-6">No referral data yet</p>
            )}
          </div>
          <Link href="/ambassador/reports"
            className="block mt-3 text-xs font-semibold text-center py-2 rounded-lg border border-gray-200 text-gray-500 hover:text-[#E85D04] hover:border-[#E85D04] transition">
            View detailed reports →
          </Link>
        </div>
      </div>
    </div>
  );
}
