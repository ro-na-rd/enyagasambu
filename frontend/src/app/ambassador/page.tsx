'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCurrency } from '@/context/CurrencyContext';
import api from '@/lib/api';
import Link from 'next/link';
import { FileText, Award, Users, Check, Clock, Coins, Sparkles, Mail, Phone, MapPin, Share2, UserPlus, Megaphone, Target, Shield } from '@/lib/icons';

const NAVY = '#0f1e42';
const ORG = '#E85D04';

const certStatusConfig: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string; action: string; href: string }> = {
  none:      { label: 'Not Requested', icon: <Award size={20} />, color: '#6b7280', bg: '#f3f4f6', action: 'Pay 2,000 RWF', href: '/ambassador/certificate' },
  pending:   { label: 'Payment Pending', icon: <Clock size={20} />, color: '#d97706', bg: '#fffbeb', action: 'Complete Payment', href: '/ambassador/certificate' },
  paid:      { label: 'Payment Confirmed', icon: <Check size={20} />, color: '#059669', bg: '#ecfdf5', action: 'View Certificate', href: '/ambassador/certificate' },
  generated: { label: 'Certificate Ready', icon: <Sparkles size={20} />, color: '#0f1e42', bg: '#eef2ff', action: 'View Certificate', href: '/ambassador/certificate' },
};

export default function AmbassadorDashboardPage() {
  const { format } = useCurrency();
  const { user } = useAuth();
  const [referral, setReferral] = useState<{ totalReferrals?: number; bonusPaid?: number; bonusPerReferral?: number; referralCode?: string } | null>(null);
  const [cert, setCert] = useState<{ cert_no?: string; status?: string; issued_date?: string } | null>(null);
  const [recruitStats, setRecruitStats] = useState<{ total: number; suppliers: number; vendors: number; onboarded: number } | null>(null);
  const [campaignStats, setCampaignStats] = useState<{ total: number; active: number; completed: number } | null>(null);
  const [promoStats, setPromoStats] = useState<{ totalShares: number } | null>(null);
  const [onboardProgress, setOnboardProgress] = useState<{ total: number; completed: number; percentage: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/referrals/me').catch(() => ({ data: {} })),
      api.get('/ambassador/certificate').catch(() => ({ data: {} })),
      api.get('/ambassador/recruitments/stats').catch(() => ({ data: null })),
      api.get('/ambassador/campaigns/stats').catch(() => ({ data: null })),
      api.get('/ambassador/promotions/stats').catch(() => ({ data: null })),
      api.get('/ambassador/onboarding/progress').catch(() => ({ data: null })),
    ])
      .then(([refData, certData, rec, camp, promo, onboard]) => {
        setReferral(refData.data);
        setCert(certData.data.certificate);
        setRecruitStats(rec.data);
        setCampaignStats(camp.data);
        setPromoStats(promo.data);
        setOnboardProgress(onboard.data);
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

  const quickLinks = [
    { label: 'Promotions', desc: `${promoStats?.totalShares ?? 0} shares`, icon: <Share2 size={20} />, href: '/ambassador/promotions', color: '#7c3aed', bg: '#f5f3ff' },
    { label: 'Recruitments', desc: `${recruitStats?.total ?? 0} recruited`, icon: <UserPlus size={20} />, href: '/ambassador/recruitments', color: '#059669', bg: '#ecfdf5' },
    { label: 'Campaigns', desc: `${campaignStats?.active ?? 0} active`, icon: <Megaphone size={20} />, href: '/ambassador/campaigns', color: '#2563eb', bg: '#eff6ff' },
    { label: 'Onboarding', desc: `${onboardProgress?.percentage ?? 0}% done`, icon: <Target size={20} />, href: '/ambassador/onboarding', color: '#d97706', bg: '#fffbeb' },
    { label: 'Policies', desc: 'Code of conduct', icon: <Shield size={20} />, href: '/ambassador/policies', color: '#dc2626', bg: '#fef2f2' },
  ];

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Ambassador Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome back, <strong>{user?.name}</strong></p>
      </div>

      <div className="mb-8">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#E85D04] to-[#ff8a3d] flex items-center justify-center text-white font-bold text-2xl">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{user?.name}</h2>
                <p className="text-gray-500 mt-1">Brand Ambassador • {user?.email}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              {user?.phone && (
                <div className="flex items-center gap-2">
                  <Phone size={16} style={{ color: ORG }} />
                  <span>{user.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Mail size={16} style={{ color: ORG }} />
                <span>{user?.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} style={{ color: ORG }} />
                <span>Kigali, Rwanda</span>
              </div>
            </div>
          </div>
        </div>
      </div>

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

      <div className="mb-8">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {quickLinks.map((ql) => (
            <Link key={ql.label} href={ql.href}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition group text-center">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: ql.bg, color: ql.color }}>
                {ql.icon}
              </div>
              <p className="text-sm font-semibold text-gray-800 group-hover:text-[#E85D04] transition">{ql.label}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{ql.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
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
                  <p className="text-xs text-gray-400 mt-2 mb-4">Share this code with ambassadors to earn {format(referral?.bonusPerReferral ?? 200)} when they get certified!</p>
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
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-3">My Certificate</h2>
            <Link href="/ambassador/certificate" className="block bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition group">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: certCfg.bg, color: certCfg.color }}>{certCfg.icon}</div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-[#E85D04] transition">{certCfg.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {certStatus === 'none' && `Pay ${format(2000)} to get your official certificate`}
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

        <div className="lg:col-span-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-3">Onboarding Progress</h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-3">
            {onboardProgress ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-800">{onboardProgress.completed}/{onboardProgress.total} tasks</span>
                  <span className="text-sm font-bold" style={{ color: NAVY }}>{onboardProgress.percentage}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${onboardProgress.percentage}%`, background: `linear-gradient(90deg, ${ORG}, #ff8a3d)` }} />
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">No onboarding data</p>
            )}
          </div>
          <Link href="/ambassador/onboarding"
            className="block text-xs font-semibold text-center py-2 rounded-lg border border-gray-200 text-gray-500 hover:text-[#E85D04] hover:border-[#E85D04] transition">
            View onboarding →
          </Link>
        </div>

        <div className="lg:col-span-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-3">Referral Performance</h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            {referral ? (
              <div className="flex items-end gap-4 h-28">
                {[
                  { label: 'Total', value: referral.totalReferrals ?? 0, color: NAVY },
                  { label: 'Successful', value: referral.bonusPaid ?? 0, color: '#059669' },
                  { label: 'Pending', value: (referral.totalReferrals ?? 0) - (referral.bonusPaid ?? 0), color: '#d97706' },
                ].map((bar) => {
                  const max = Math.max(referral.totalReferrals ?? 0, 1);
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
