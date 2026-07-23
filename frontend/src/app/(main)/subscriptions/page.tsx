'use client';
import { useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { CheckCircle, X, Coins, Star } from '@/lib/icons';

interface Plan { id: string; name: string; coins: number; listing_duration_days: number; max_active_listings: number; can_feature: boolean; }
interface Sub { plan: string; listing_duration_days: number; max_active_listings: number; can_feature: boolean; expires_at?: string; }

export default function SubscriptionsPage() {
  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [current, setCurrent] = useState<Sub | null>(null);
  const [subscribing, setSubscribing] = useState('');
  const [msg, setMsg] = useState<ReactNode>('');

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    api.get('/subscriptions/plans').then(({ data }) => setPlans(data.plans));
    if (user) api.get('/subscriptions/me').then(({ data }) => setCurrent(data.subscription));
  }, [user]);

  const handleSubscribe = async (planId: string) => {
    setSubscribing(planId); setMsg('');
    try {
      const { data } = await api.post('/subscriptions/subscribe', { plan: planId });
      setMsg(<><CheckCircle size={16} className="inline" /> {data.message}</>);
      await refreshUser();
      const { data: sub } = await api.get('/subscriptions/me');
      setCurrent(sub.subscription);
    } catch (err: unknown) {
      const m = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setMsg(<><X size={16} className="inline" /> {m || 'Failed'}</>);
    } finally { setSubscribing(''); }
  };

  if (loading) return null;

  const planColors: Record<string, string> = {
    free: 'border-gray-200',
    standard: 'border-[#E85D04]',
    premium: 'border-yellow-400',
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Seller Plans</h1>
      <p className="text-gray-500 text-sm mb-2">Upgrade to list more items, keep them active longer, and get featured.</p>
      {user && <p className="text-sm text-[#E85D04] mb-6">Your current balance: <Coins size={14} className="inline" /> {user.coins}</p>}

      {current && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 text-sm">
          <p className="font-semibold text-[#0f1e42]">Current plan: <span className="capitalize">{current.plan}</span></p>
          {current.expires_at && <p className="text-orange-500 text-xs mt-0.5">Valid until {new Date(current.expires_at).toLocaleDateString()}</p>}
        </div>
      )}

      {msg && <div className="text-sm mb-5 px-4 py-3 bg-gray-50 rounded-lg">{msg}</div>}

      <div className="grid sm:grid-cols-3 gap-5">
        {plans.map((plan) => (
          <div key={plan.id} className={`bg-white border-2 rounded-2xl p-5 flex flex-col ${planColors[plan.id] || 'border-gray-200'} ${plan.id === 'premium' ? 'shadow-md' : ''}`}>
            {plan.id === 'premium' && (
              <div className="bg-yellow-400 text-gray-900 text-xs font-bold text-center py-1 rounded-lg mb-3">BEST VALUE</div>
            )}
            <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
            <p className="text-2xl font-bold text-[#E85D04] mt-1">
              {plan.coins === 0 ? 'Free' : <><Coins size={20} /> {plan.coins}</>}
              {plan.coins > 0 && <span className="text-sm font-normal text-gray-500"> / month</span>}
            </p>

            <ul className="mt-4 space-y-2 flex-1 text-sm text-gray-600">
              <li>✓ {plan.listing_duration_days} days per listing</li>
              <li>✓ Up to {plan.max_active_listings === 100 ? 'unlimited' : plan.max_active_listings} active listings</li>
              <li className={plan.can_feature ? 'text-gray-800 font-medium' : 'text-gray-400 line-through'}>
                ✓ Can feature listings (<Star size={12} className="inline" /> boost)
              </li>
            </ul>

            {plan.id === 'free' ? (
              <div className="mt-5 text-center text-xs text-gray-400 py-2">Default plan</div>
            ) : current?.plan === plan.id ? (
              <div className="mt-5 text-center text-sm text-[#E85D04] font-semibold py-2">✓ Active</div>
            ) : (
              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={!!subscribing}
                className={`mt-5 w-full font-semibold py-2.5 rounded-lg text-sm transition disabled:opacity-60 ${plan.id === 'premium' ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-300' : 'bg-[#E85D04] text-white hover:bg-[#e05d00]'}`}
              >
                {subscribing === plan.id ? 'Processing…' : `Subscribe (${plan.coins} coins)`}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
