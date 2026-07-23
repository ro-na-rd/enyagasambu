'use client';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Coins, Smartphone } from '@/lib/icons';

interface Package { id: number; coins: number; price_rwf: number; label: string; }
interface Transaction { id: number; amount: number; type: string; created_at: string; }

type PayStep = 'idle' | 'enter_phone' | 'waiting' | 'success' | 'failed';

export default function CoinsPage() {
  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();
  const [packages, setPackages] = useState<Package[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [promoCode, setPromoCode] = useState('');
  const [promoMsg, setPromoMsg] = useState('');
  const [applyingPromo, setApplyingPromo] = useState(false);

  // MoMo payment state
  const [selectedPkg, setSelectedPkg] = useState<Package | null>(null);
  const [payStep, setPayStep] = useState<PayStep>('idle');
  const [momoPhone, setMomoPhone] = useState('');
  const [momoMsg, setMomoMsg] = useState('');
  const [paying, setPaying] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  const loadBalance = () =>
    api.get('/coins/balance').then(({ data }) => setTransactions(data.transactions));

  useEffect(() => {
    api.get('/coins/packages').then(({ data }) => setPackages(data.packages));
    if (user) loadBalance();
  }, [user]);

  // Stop polling on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const openPayment = (pkg: Package) => {
    setSelectedPkg(pkg);
    setPayStep('enter_phone');
    setMomoPhone('');
    setMomoMsg('');
  };

  const cancelPayment = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setPayStep('idle');
    setSelectedPkg(null);
  };

  const handlePay = async () => {
    if (!momoPhone.trim()) { setMomoMsg('Enter your MTN phone number'); return; }
    if (!selectedPkg) return;
    setPaying(true); setMomoMsg('');

    try {
      const { data } = await api.post('/coins/momo/pay', {
        packageId: selectedPkg.id,
        phone: momoPhone.trim(),
      });

      setPayStep('waiting');
      setMomoMsg('Check your phone — approve the MoMo prompt.');

      // Poll every 5 seconds until MTN confirms
      pollRef.current = setInterval(async () => {
        try {
          const { data: status } = await api.get(`/coins/momo/status/${data.referenceId}`);

          if (status.status === 'successful') {
            clearInterval(pollRef.current!);
            setPayStep('success');
            setMomoMsg(`Payment confirmed! ${status.coinsAdded} coins added to your wallet.`);
            await refreshUser();
            loadBalance();
          } else if (status.status === 'failed') {
            clearInterval(pollRef.current!);
            setPayStep('failed');
            setMomoMsg(`${status.message || 'Payment failed or was cancelled.'}`);
          }
          // else still pending — keep polling
        } catch {
          // network hiccup — keep polling
        }
      }, 5000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setMomoMsg(`${msg || 'Failed to initiate payment'}`);
      setPayStep('idle');
    } finally {
      setPaying(false);
    }
  };

  const handlePromo = async () => {
    if (!promoCode.trim()) return;
    setApplyingPromo(true); setPromoMsg('');
    try {
      const { data } = await api.post('/auth/promo', { code: promoCode.trim() });
      setPromoMsg(`${data.message}`);
      setPromoCode('');
      await refreshUser();
      loadBalance();
    } catch (err: unknown) {
      const m = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setPromoMsg(`${m || 'Invalid code'}`);
    } finally { setApplyingPromo(false); }
  };

  if (loading) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Coins & Wallet</h1>
      <p className="text-gray-500 text-sm mb-6">Coins are used to post listings (400), unlock contacts (300), and boost listings (200).</p>

      {/* Balance */}
      <div className="text-white rounded-2xl p-6 mb-8 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #0f1e42 0%, #E85D04 100%)' }}>
        <div>
          <p className="text-orange-200 text-sm">Current Balance</p>
          <p className="text-4xl font-bold mt-1"><Coins size={28} /> {user?.coins ?? 0}</p>
        </div>
        <div className="text-right text-sm text-orange-200 space-y-0.5">
          <p>Post listing = 400 coins</p>
          <p>Unlock contact = 300 coins</p>
          <p>Boost listing = 200 coins</p>
        </div>
      </div>

      {/* Promo code */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-800 mb-3">Redeem Promo Code</h2>
        {promoMsg && <p className="text-sm mb-2">{promoMsg}</p>}
        <div className="flex gap-2">
          <input
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            placeholder="Enter promo code"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm uppercase tracking-widest"
          />
          <button onClick={handlePromo} disabled={applyingPromo || !promoCode.trim()} className="text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-60" style={{ background: '#0f1e42' }}>
            {applyingPromo ? '…' : 'Apply'}
          </button>
        </div>
      </div>

      {/* MoMo payment modal */}
      {selectedPkg && payStep !== 'idle' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              {payStep === 'success' ? 'Payment Successful' :
               payStep === 'failed'  ? 'Payment Failed' :
               payStep === 'waiting' ? 'Waiting for approval…' :
               `Buy ${selectedPkg.label}`}
            </h2>

            {payStep === 'enter_phone' && (
              <>
                <p className="text-sm text-gray-500 mb-4">
                  Amount: <strong>{selectedPkg.price_rwf.toLocaleString()} RWF</strong> via MTN MoMo
                </p>
                {momoMsg && <p className="text-red-600 text-sm mb-3">{momoMsg}</p>}
                <label className="block text-sm font-medium text-gray-700 mb-1">Your MTN phone number</label>
                <input
                  type="tel"
                  value={momoPhone}
                  onChange={(e) => setMomoPhone(e.target.value)}
                  placeholder="e.g. 0781234567 or +250781234567"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm mb-4"
                />
                <div className="flex gap-2">
                  <button onClick={handlePay} disabled={paying} className="flex-1 bg-yellow-400 text-gray-900 font-semibold py-2.5 rounded-lg hover:bg-yellow-300 disabled:opacity-60">
                    {paying ? 'Sending request…' : 'Pay with MoMo'}
                  </button>
                  <button onClick={cancelPayment} className="px-4 text-gray-500 text-sm hover:underline">Cancel</button>
                </div>
              </>
            )}

            {payStep === 'waiting' && (
              <>
                <p className="text-sm text-gray-600 mb-4">{momoMsg}</p>
                <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                  <div className="animate-bounce"><Smartphone size={28} /></div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Approve on your phone</p>
                    <p className="text-xs text-gray-500">A MoMo USSD prompt has been sent to <strong>{momoPhone}</strong></p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-400">Checking status every 5 seconds…</p>
                  <button onClick={cancelPayment} className="text-sm text-gray-400 hover:underline">Cancel</button>
                </div>
              </>
            )}

            {(payStep === 'success' || payStep === 'failed') && (
              <>
                <p className="text-sm text-gray-700 my-4">{momoMsg}</p>
                <button onClick={cancelPayment} className="w-full text-white font-semibold py-2.5 rounded-lg" style={{ background: '#0f1e42' }}>
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Packages */}
      <h2 className="text-lg font-semibold text-gray-800 mb-3">Top Up with MTN MoMo</h2>
      <div className="grid grid-cols-2 gap-3 mb-8">
        {packages.map((pkg) => (
          <button
            key={pkg.id}
            onClick={() => openPayment(pkg)}
            className="bg-white border-2 border-gray-200 hover:border-yellow-400 rounded-xl p-4 text-left transition group"
          >
            <p className="text-2xl font-bold" style={{ color: '#E85D04' }}><Coins size={20} /> {pkg.coins.toLocaleString()}</p>
            <p className="text-gray-800 font-semibold text-sm mt-1">{pkg.price_rwf.toLocaleString()} RWF</p>
            <p className="text-xs text-gray-400 mt-0.5">≈ {(pkg.price_rwf / pkg.coins).toFixed(1)} RWF/coin</p>
            <p className="text-xs text-yellow-600 mt-2 font-medium opacity-0 group-hover:opacity-100 transition">Pay via MoMo →</p>
          </button>
        ))}
      </div>

      {/* Transaction history */}
      <h2 className="text-lg font-semibold text-gray-800 mb-3">Recent Transactions</h2>
      {transactions.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-6">No transactions yet.</p>
      ) : (
        <div className="space-y-2">
          {transactions.map((t) => (
            <div key={t.id} className="bg-white rounded-xl shadow-sm flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-800 capitalize">{t.type.replace(/_/g, ' ')}</p>
                <p className="text-xs text-gray-400">{new Date(t.created_at).toLocaleDateString()}</p>
              </div>
              <span className={`text-sm font-bold ${t.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {t.amount > 0 ? '+' : ''}{t.amount}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
