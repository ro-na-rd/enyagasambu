'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Coins } from '@/lib/icons';

interface ReferralInfo {
  referralCode: string;
  totalReferrals: number;
  bonusPaid: number;
  bonusPerReferral: number;
}

export default function ReferralPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user) api.get('/referrals/me').then(({ data }) => setInfo(data));
  }, [user]);

  const referralLink = info ? `${window.location.origin}/register?ref=${info.referralCode}` : '';

  const copy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading || !info) return <div className="text-center py-24 text-gray-500">Loading…</div>;

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Refer & Earn</h1>
      <p className="text-gray-500 text-sm mb-8">Share NMO with friends and both of you earn bonus coins.</p>

      <div className="bg-[#FF6B00] text-white rounded-2xl p-6 mb-6 text-center">
        <p className="text-orange-200 text-sm">You earn per referral</p>
        <p className="text-5xl font-bold mt-1"><Coins size={40} /> {info.bonusPerReferral}</p>
        <p className="text-orange-200 text-sm mt-1">Your friend also gets {info.bonusPerReferral} coins</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
        <p className="text-sm font-medium text-gray-700 mb-2">Your referral code</p>
        <p className="text-3xl font-bold text-[#FF6B00] tracking-widest mb-4">{info.referralCode}</p>

        <p className="text-xs text-gray-500 mb-2">Or share this link:</p>
        <div className="flex gap-2">
          <input readOnly value={referralLink} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs bg-gray-50 text-gray-700" />
          <button onClick={copy} className="bg-[#FF6B00] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#e05d00] transition">
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-3xl font-bold text-gray-900">{info.totalReferrals}</p>
          <p className="text-xs text-gray-500 mt-1">Total friends referred</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-3xl font-bold text-[#FF6B00]"><Coins size={28} /> {info.bonusPaid * info.bonusPerReferral}</p>
          <p className="text-xs text-gray-500 mt-1">Total coins earned</p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
        <p className="font-semibold text-gray-800 mb-2">How it works</p>
        <ol className="space-y-1 list-decimal list-inside">
          <li>Share your referral link or code with a friend</li>
          <li>They register on NMO using your link</li>
          <li>Both of you instantly receive {info.bonusPerReferral} coins</li>
          <li>Your friend can start listing or connecting right away</li>
        </ol>
      </div>
    </div>
  );
}
