'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import api from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';
import { Heart, Phone, CreditCard, CheckCircle, Loader2, Sparkles, Shield, Smartphone } from '@/lib/icons';

const NAVY = '#0f1e42';
const ORG = '#E85D04';

const PRESETS = [1000, 2000, 5000, 10000, 25000, 50000];

type Step = 'form' | 'pay' | 'waiting' | 'otp' | 'success';

interface RecentDonor {
  donor_name: string;
  amount_rwf: number;
  method: string;
  message: string | null;
  created_at: string;
}

export default function DonatePage() {
  const { T } = useLanguage();
  const [step, setStep] = useState<Step>('form');
  const [method, setMethod] = useState<'momo' | 'card'>('momo');
  const [provider, setProvider] = useState<'mtn' | 'airtel'>('mtn');
  const [amount, setAmount] = useState<number>(5000);
  const [customAmount, setCustomAmount] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [referenceId, setReferenceId] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpResendCooldown, setOtpResendCooldown] = useState(0);
  const [donationId, setDonationId] = useState<number | null>(null);

  const [recent, setRecent] = useState<RecentDonor[]>([]);

  const effectiveAmount = customAmount ? parseInt(customAmount) : amount;

  const loadPublic = useCallback(() => {
    api.get('/donations').then(({ data }) => {
      setRecent(data.recent || []);
    }).catch(() => {});
  }, []);

  useEffect(() => { loadPublic(); }, [loadPublic]);

  useEffect(() => {
    if (otpResendCooldown <= 0) return;
    const timer = setTimeout(() => setOtpResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpResendCooldown]);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const validateBase = () => {
    if (!name.trim()) return 'Please enter your name.';
    if (!effectiveAmount || isNaN(effectiveAmount) || effectiveAmount < 100) {
      return 'Please enter a donation amount of at least 100 RWF.';
    }
    return '';
  };

  const handleInitiateMomo = async () => {
    const baseErr = validateBase();
    if (baseErr) { setError(baseErr); return; }
    const digits = phone.trim().replace(/\D/g, '');
    if (digits.length < 10) { setError('Please enter the full phone number (at least 10 digits).'); return; }
    setError('');
    setSubmitting(true);
    try {
      const { data } = await api.post('/donations/initiate', {
        donor_name: name.trim(),
        donor_phone: phone.trim(),
        donor_email: email.trim() || undefined,
        amount: effectiveAmount,
        provider,
        message: message.trim() || undefined,
      });
      setReferenceId(data.referenceId);
      setStep('pay');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to initiate donation.');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmPayment = useCallback(async () => {
    try {
      const { data } = await api.get(`/donations/${referenceId}/status`);
      if (data.status === 'verified') {
        setStep('otp');
        return data;
      } else if (data.status === 'confirmed') {
        setDonationId(data.donationId);
        setStep('success');
        loadPublic();
        return data;
      } else if (data.status === 'failed') {
        setError(data.message || 'Payment failed. Please try again.');
        setStep('form');
      }
      return data;
    } catch {
      return null;
    }
  }, [referenceId, loadPublic]);

  const handlePaid = () => {
    setStep('waiting');
    pollRef.current = setInterval(async () => {
      const res = await confirmPayment();
      if (res?.status === 'verified' || res?.status === 'confirmed' || res?.status === 'failed') {
        if (pollRef.current) clearInterval(pollRef.current);
      }
    }, 3000);
  };

  const handleVerifyOtp = async () => {
    setSubmitting(true);
    setOtpError('');
    try {
      const { data } = await api.post('/donations/verify-otp', { referenceId, code: otpCode });
      setDonationId(data.donationId);
      setStep('success');
      loadPublic();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setOtpError(msg || 'Invalid verification code.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      await api.post('/donations/resend-otp', { referenceId });
      setOtpResendCooldown(60);
      setOtpError('');
    } catch {
      setOtpError('Failed to resend code. Try again.');
    }
  };

  const handleCard = async () => {
    const baseErr = validateBase();
    if (baseErr) { setError(baseErr); return; }
    if (cardNumber.replace(/\s+/g, '').length < 12) { setError('Please enter a valid card number.'); return; }
    if (!cardName.trim()) { setError('Please enter the name on the card.'); return; }
    if (!cardExpiry.trim() || !cardCvv.trim()) { setError('Please enter the card expiry and CVV.'); return; }
    setError('');
    setSubmitting(true);
    try {
      const { data } = await api.post('/donations/card', {
        donor_name: name.trim(),
        donor_phone: phone.trim(),
        donor_email: email.trim() || undefined,
        amount: effectiveAmount,
        card_number: cardNumber,
        card_name: cardName,
        card_expiry: cardExpiry,
        card_cvv: cardCvv,
        message: message.trim() || undefined,
      });
      setDonationId(data.donationId);
      setStep('success');
      loadPublic();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to process card donation.');
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setStep('form');
    setReferenceId('');
    setOtpCode('');
    setError('');
    setDonationId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #1a2d5a 60%, ${ORG}cc 130%)` }}>
        <div className="max-w-5xl mx-auto px-4 py-14 sm:py-20 text-center relative z-10">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center text-white"
            style={{ background: `linear-gradient(135deg, ${ORG}, #FF8A3D)`, boxShadow: `0 10px 40px ${ORG}66` }}>
            <Heart size={32} />
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white">{T.donateTitle}</h1>
          <p className="text-white/75 mt-4 max-w-2xl mx-auto text-sm sm:text-base">{T.donateSubtitle}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 sm:py-14 grid lg:grid-cols-[1fr_340px] gap-8 items-start">
        {/* ── Donation form ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          {error && (
            <div className="mb-5 rounded-xl px-4 py-3 text-sm text-red-700" style={{ background: '#fef2f2' }}>
              {error}
            </div>
          )}

          {step === 'form' && (
            <>
              <h2 className="text-xl font-bold text-gray-900">{T.donationAmount}</h2>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => { setAmount(p); setCustomAmount(''); }}
                    className={`py-2.5 rounded-xl text-sm font-semibold transition border-2 ${
                      amount === p && !customAmount ? 'text-white border-transparent' : 'border-gray-200 text-gray-700 hover:border-[#E85D04]'
                    }`}
                    style={amount === p && !customAmount ? { background: ORG } : {}}
                  >
                    {p.toLocaleString()}
                  </button>
                ))}
              </div>
              <div className="mt-3">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Custom amount</label>
                <input
                  type="number"
                  min={100}
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="e.g. 15000"
                  className="mt-1 w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#E85D04]"
                />
              </div>

              <div className="mt-5 grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{T.donorName} *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#E85D04]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{T.donorEmail}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#E85D04]"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{T.donationMessage}</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={2}
                  className="mt-1 w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#E85D04]"
                />
              </div>

              {/* Method toggle */}
              <h3 className="mt-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">{T.paymentMethod}</h3>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMethod('momo')}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border-2 transition ${
                    method === 'momo' ? 'text-white border-transparent' : 'border-gray-200 text-gray-700 hover:border-[#E85D04]'
                  }`}
                  style={method === 'momo' ? { background: ORG } : {}}
                >
                  <Smartphone size={16} /> {T.mobileMoney}
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('card')}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border-2 transition ${
                    method === 'card' ? 'text-white border-transparent' : 'border-gray-200 text-gray-700 hover:border-[#E85D04]'
                  }`}
                  style={method === 'card' ? { background: ORG } : {}}
                >
                  <CreditCard size={16} /> {T.bankCard}
                </button>
              </div>

              {method === 'momo' ? (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{T.donorPhone} *</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 0788123456"
                      className="mt-1 w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#E85D04]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Provider</label>
                    <div className="mt-1 grid grid-cols-2 gap-2">
                      {(['mtn', 'airtel'] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setProvider(p)}
                          className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition ${
                            provider === p ? 'text-white border-transparent' : 'border-gray-200 text-gray-700 hover:border-[#E85D04]'
                          }`}
                          style={provider === p ? { background: NAVY } : {}}
                        >
                          {p === 'mtn' ? 'MTN MoMo' : 'Airtel Money'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={handleInitiateMomo}
                    disabled={submitting}
                    className="w-full text-white font-bold py-3.5 rounded-xl transition hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                    style={{ background: ORG }}
                  >
                    {submitting ? <Loader2 size={18} className="animate-spin" /> : <Heart size={18} />}
                    {T.donateNow} — {effectiveAmount.toLocaleString()} RWF
                  </button>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{T.cardNumber} *</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value.replace(/[^\d\s]/g, ''))}
                      placeholder="4242 4242 4242 4242"
                      className="mt-1 w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#E85D04]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{T.cardName} *</label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="mt-1 w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#E85D04]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{T.cardExpiry} *</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="12/28"
                        className="mt-1 w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#E85D04]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{T.cardCvv} *</label>
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                        placeholder="123"
                        className="mt-1 w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#E85D04]"
                      />
                    </div>
                  </div>
                  <p className="flex items-center gap-2 text-xs text-gray-500">
                    <Shield size={14} className="shrink-0" style={{ color: ORG }} />
                    Payments are processed securely. Card details are never stored.
                  </p>
                  <button
                    onClick={handleCard}
                    disabled={submitting}
                    className="w-full text-white font-bold py-3.5 rounded-xl transition hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                    style={{ background: ORG }}
                  >
                    {submitting ? <Loader2 size={18} className="animate-spin" /> : <Heart size={18} />}
                    {T.donateNow} — {effectiveAmount.toLocaleString()} RWF
                  </button>
                </div>
              )}
            </>
          )}

          {step === 'pay' && (
            <div className="text-center py-8 space-y-6">
              <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{ background: '#dcfce7' }}>
                <Phone size={30} className="text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Complete Your Donation</h2>
              <div className="bg-orange-50 rounded-xl px-4 py-3 text-sm text-gray-700">
                <p className="font-medium">{T.donorPhone}: {phone}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {effectiveAmount.toLocaleString()} RWF via {provider === 'mtn' ? 'MTN MoMo' : 'Airtel Money'} — approve the prompt on your phone.
                </p>
              </div>
              <button
                onClick={handlePaid}
                className="w-full text-white font-bold py-3.5 rounded-xl transition hover:opacity-90"
                style={{ background: ORG }}
              >
                I&apos;ve Completed the Payment
              </button>
              <p className="text-xs text-gray-400">After paying, tap the button above to confirm.</p>
            </div>
          )}

          {step === 'waiting' && (
            <div className="text-center py-16 space-y-6">
              <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center animate-pulse" style={{ background: '#dbeafe' }}>
                <Loader2 size={30} className="text-blue-600 animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Confirming Your Payment</h2>
              <p className="text-gray-500 text-sm">Please wait while we verify your payment…</p>
            </div>
          )}

          {step === 'otp' && (
            <div className="text-center py-8 space-y-6">
              <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{ background: '#dcfce7' }}>
                <CheckCircle size={30} className="text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Verify Your Phone</h2>
              <p className="text-gray-500 text-sm">
                Enter the 6-digit code sent to <strong>{phone}</strong> as SMS
              </p>

              {otpError && <p className="text-red-500 text-sm">{otpError}</p>}

              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center text-2xl tracking-[0.5em] font-mono border border-gray-300 rounded-lg px-3 py-3 focus:outline-none focus:border-[#E85D04]"
                placeholder="000000"
              />

              <button
                onClick={handleVerifyOtp}
                disabled={otpCode.length !== 6 || submitting}
                className="w-full text-white font-bold py-3.5 rounded-xl transition hover:opacity-90 disabled:opacity-60"
                style={{ background: ORG }}
              >
                {submitting ? <Loader2 size={18} className="inline animate-spin" /> : 'Verify & Complete'}
              </button>

              <button
                onClick={handleResendOtp}
                disabled={otpResendCooldown > 0}
                className="text-sm font-semibold hover:underline disabled:opacity-50"
                style={{ color: ORG }}
              >
                {otpResendCooldown > 0 ? `Resend in ${otpResendCooldown}s` : 'Resend code'}
              </button>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-12 space-y-6">
              <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center" style={{ background: '#dcfce7' }}>
                <Sparkles size={40} className="text-green-600" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900">{T.thankYou}</h2>
              <p className="text-gray-500 text-sm max-w-sm mx-auto">
                Your donation of <strong>{effectiveAmount.toLocaleString()} RWF</strong> has been received
                {donationId ? ` (Ref #${donationId})` : ''}. It will appear in the supporter list below shortly.
              </p>
              <button
                onClick={reset}
                className="px-6 py-3 text-white font-bold rounded-xl transition hover:opacity-90"
                style={{ background: ORG }}
              >
                Make Another Donation
              </button>
            </div>
          )}
        </div>

        {/* ── Recent supporters ── */}
        <aside className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="flex items-center gap-2 font-bold text-gray-900">
            <Heart size={18} style={{ color: ORG }} /> {T.recentDonors}
          </h3>
          <div className="mt-4 space-y-3">
            {recent.length === 0 && (
              <p className="text-sm text-gray-400">No donations yet — be the first to support!</p>
            )}
            {recent.map((d, i) => (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                  style={{ background: `linear-gradient(135deg, ${NAVY}, ${ORG})` }}>
                  {d.donor_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{d.donor_name}</p>
                  {d.message && <p className="text-xs text-gray-500 truncate">{d.message}</p>}
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {new Date(d.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-sm font-bold whitespace-nowrap" style={{ color: ORG }}>
                  {d.amount_rwf.toLocaleString()} RWF
                </span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
