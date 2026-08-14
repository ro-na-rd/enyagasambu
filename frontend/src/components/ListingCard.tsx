'use client';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useEffect, useState, useRef, useCallback } from 'react';
import api from '@/lib/api';
import { Star, Package, MapPin, Phone, X, CheckCircle, Loader2, Clock, Check, AlertCircle, RefreshCw } from '@/lib/icons';
import StarRating from '@/components/StarRating';

interface Listing {
  id: number;
  title: string;
  price: number | null;
  price_type: string;
  currency?: string;
  location: string;
  listing_type: string;
  status?: string;
  category_name: string;
  seller_name: string;
  primary_image: string | null;
  is_featured?: boolean;
  created_at: string;
}

const ORG = '#E85D04';
const NAVY = '#0f1e42';
const ACCESS_FEE = 300;

type ConnectStep = 'idle' | 'enter_phone' | 'payment_pending' | 'otp_entry' | 'unlocked';

export default function ListingCard({ listing }: { listing: Listing }) {
  const { T } = useLanguage();
  const { format } = useCurrency();
  const [showConnect, setShowConnect] = useState(false);
  const [step, setStep] = useState<ConnectStep>('idle');
  const [phone, setPhone] = useState('');
  const [working, setWorking] = useState(false);
  const [connectError, setConnectError] = useState('');
  const [connectSuccess, setConnectSuccess] = useState('');
  const [sellerPhone, setSellerPhone] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [unlockType, setUnlockType] = useState<'temporary' | 'permanent'>('temporary');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const otpTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [referenceId, setReferenceId] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
      if (otpTimerRef.current) clearInterval(otpTimerRef.current);
    };
  }, []);

  const currency = listing.currency || 'RWF';
  const isSold = listing.status === 'sold' || listing.status === 'expired';
  const priceLabel = listing.price != null
    ? `${format(listing.price)}${listing.price_type === 'per_day' ? '/day' : listing.price_type === 'per_month' ? '/mo' : ''}`
    : T.priceOnRequest;

  const handleConnectClick = () => {
    setShowConnect(true);
    setStep('enter_phone');
    setConnectError('');
    setConnectSuccess('');
  };

  const closeConnect = () => {
    setShowConnect(false);
    setStep('idle');
    setPhone('');
    setOtpCode('');
    setReferenceId('');
    setConnectError('');
    setConnectSuccess('');
    setSellerPhone(null);
    if (timerRef.current) clearInterval(timerRef.current);
    if (pollRef.current) clearInterval(pollRef.current);
    if (otpTimerRef.current) clearInterval(otpTimerRef.current);
    setTimeLeft(0);
    setOtpCountdown(0);
  };

  const startTimer = (expiresAt: string) => {
    const expiry = new Date(expiresAt).getTime();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((expiry - now) / 1000));
      setTimeLeft(diff);
      if (diff <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        setStep('idle');
        setSellerPhone(null);
      }
    }, 1000);
  };

  const startOtpCountdown = useCallback(() => {
    setOtpCountdown(120);
    if (otpTimerRef.current) clearInterval(otpTimerRef.current);
    otpTimerRef.current = setInterval(() => {
      setOtpCountdown((prev) => {
        if (prev <= 1) {
          if (otpTimerRef.current) clearInterval(otpTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const startPaymentPolling = useCallback((refId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await api.get(`/contact-access/status/${refId}`);
        if (data.status === 'verified') {
          if (pollRef.current) clearInterval(pollRef.current);
          setStep('otp_entry');
          setConnectSuccess('Payment successful! A verification code has been sent to your phone.');
          startOtpCountdown();
        } else if (data.status === 'confirmed') {
          if (pollRef.current) clearInterval(pollRef.current);
          setSellerPhone(data.sellerPhone);
          setStep('unlocked');
          setUnlockType('permanent');
        } else if (data.status === 'failed') {
          if (pollRef.current) clearInterval(pollRef.current);
          setConnectError(data.message || 'Payment failed. Please try again.');
          setStep('enter_phone');
        }
      } catch {
        // Keep polling on transient errors
      }
    }, 5000);
  }, [startOtpCountdown]);

  const handleProceedToMethod = () => {
    if (!phone.trim()) { setConnectError('Please enter your phone number'); return; }
    const digits = phone.trim().replace(/\D/g, '');
    if (digits.length < 10) { setConnectError('Please enter the full phone number (at least 10 digits)'); return; }
    setConnectError('');
    setConnectSuccess('');
    handleMomoInitiate();
  };

  const handleMomoInitiate = async () => {
    setWorking(true); setConnectError(''); setConnectSuccess('');
    try {
      const { data } = await api.post('/contact-access/initiate', { listingId: listing.id, phone: phone.trim() });
      if (data.alreadyUnlocked) {
        setSellerPhone(data.sellerPhone);
        setStep('unlocked');
        setUnlockType('permanent');
      } else if (data.referenceId) {
        setReferenceId(data.referenceId);
        setStep('payment_pending');
        startPaymentPolling(data.referenceId);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setConnectError(msg || 'Failed to initiate payment');
    } finally { setWorking(false); }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode.trim() || otpCode.length !== 6) { setConnectError('Please enter the 6-digit code'); return; }
    setWorking(true); setConnectError('');
    try {
      const { data } = await api.post('/contact-access/verify-otp', { referenceId, code: otpCode.trim() });
      setSellerPhone(data.sellerPhone);
      setStep('unlocked');
      setUnlockType('permanent');
      if (otpTimerRef.current) clearInterval(otpTimerRef.current);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setConnectError(msg || 'Invalid verification code');
    } finally { setWorking(false); }
  };

  const handleResendOtp = async () => {
    setConnectError(''); setConnectSuccess('');
    try {
      await api.post('/contact-access/resend-otp', { referenceId });
      setConnectSuccess('New verification code sent!');
      startOtpCountdown();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setConnectError(msg || 'Failed to resend code');
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000) return (price / 1000000).toFixed(1) + 'M';
    if (price >= 1000) return (price / 1000).toFixed(0) + 'K';
    return price.toString();
  };

  const formatPriceFull = (price: number) => {
    return format(price);
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group border border-gray-100 hover:border-orange-200 hover:-translate-y-0.5">
        <Link href={`/listings/${listing.id}`}>
          <div className="relative bg-gray-100 overflow-hidden" style={{ paddingTop: '80%' }}>
            {listing.is_featured && (
              <div className="absolute top-3 left-3 z-10">
                <span className="bg-gradient-to-r from-yellow-400 to-amber-500 text-gray-900 text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
                  <Star size={12} /> Featured
                </span>
              </div>
            )}

            {listing.primary_image && !imgError ? (
              <img
                src={listing.primary_image}
                alt={listing.title}
                onError={() => setImgError(true)}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                <div className="text-center">
                  <Package size={48} className="opacity-40 block mb-2" />
                  <span className="text-[11px] text-gray-400 font-medium">No image</span>
                </div>
              </div>
            )}

            {isSold && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40">
                <img
                  src="/assets/sold.png"
                  alt="Sold"
                  className="w-4/5 h-4/5 object-contain"
                />
              </div>
            )}

            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent" />

            <div className="absolute bottom-3 left-3 z-10">
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-white/95 text-gray-700 shadow-sm backdrop-blur-sm">
                {listing.category_name}
              </span>
            </div>

            <div className="absolute top-3 right-3 z-10">
              <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-lg tracking-wider ${
                listing.listing_type === 'rent'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gradient-to-r from-[#E85D04] to-orange-500 text-white'
              }`}>
                {listing.listing_type === 'rent' ? 'FOR RENT' : 'FOR SALE'}
              </span>
            </div>

            {listing.price != null && (
              <div className="absolute bottom-3 right-3 z-10">
                <span className="text-xs font-extrabold text-white drop-shadow-lg">
                  {formatPriceFull(listing.price)}
                </span>
              </div>
            )}
          </div>
        </Link>

        <div className="p-4">
          <Link href={`/listings/${listing.id}`}>
            <h3 className="text-sm font-bold text-gray-900 truncate leading-snug mb-1.5 group-hover:text-[#E85D04] transition-colors">
              {listing.title}
            </h3>
          </Link>

          <p className="text-base sm:text-lg font-extrabold truncate" style={{ color: ORG }} title={priceLabel}>
            {priceLabel}
          </p>

          <div className="mt-2">
            <StarRating listingId={listing.id} />
          </div>

          <div className="flex items-center justify-between gap-2 mt-2.5">
            <p className="text-xs text-gray-400 flex items-center gap-1.5 min-w-0">
              <MapPin size={12} className="shrink-0" />
              <span className="truncate">{listing.location || 'Kigali'}</span>
            </p>
            <p className="text-[10px] text-gray-400 font-medium truncate shrink-0 max-w-[45%]">
              {listing.seller_name}
            </p>
          </div>

          <div className="mt-3.5">
            <button
              onClick={handleConnectClick}
              disabled={isSold}
              className="w-full text-white text-xs font-bold py-2.5 rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{ background: isSold ? '#9ca3af' : `linear-gradient(135deg, ${NAVY}, ${ORG})` }}
            >
              <Phone size={14} strokeWidth={2.5} />
              {isSold ? 'Sold Out' : 'Connect with Seller'}
            </button>
          </div>
        </div>
      </div>

      {showConnect && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={closeConnect}>
          <div className="bg-white rounded-2xl w-full max-w-sm max-h-[85vh] overflow-y-auto p-6 relative shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <button onClick={closeConnect} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors">
              <X size={16} strokeWidth={2.5} />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center shrink-0"><Phone size={24} /></div>
              <div>
                <h3 className="font-bold text-base" style={{ color: NAVY }}>Connect with seller</h3>
                <p className="text-xs text-gray-400">Connect with the seller directly</p>
              </div>
            </div>

            <div className="flex gap-3 mb-4 p-3 bg-gray-50 rounded-xl items-center">
              {listing.primary_image && !imgError ? (
                <img src={listing.primary_image} alt={listing.title} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
              ) : (
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Package size={24} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 truncate">{listing.title}</p>
                <p className="text-xs text-gray-500">{listing.seller_name}</p>
                <p className="text-xs font-bold mt-0.5" style={{ color: ORG }}>{priceLabel}</p>
              </div>
            </div>

            {step === 'unlocked' ? (
              <div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5 mb-3 text-center">
                  <CheckCircle size={32} className="mb-2 mx-auto" style={{ color: '#16a34a' }} />
                  <p className="text-xs font-medium text-gray-600 mb-1">Seller&apos;s contact number</p>
                  <p className="text-2xl font-extrabold" style={{ color: NAVY }}>{sellerPhone || 'Not provided'}</p>
                  {unlockType === 'temporary' ? (
                    <div className="mt-3 inline-flex items-center gap-1.5 bg-white rounded-full px-3 py-1 shadow-sm">
                      <Clock size={14} />
                      <span className="text-xs font-bold text-orange-600">
                        {formatTime(timeLeft)}
                      </span>
                    </div>
                  ) : (
                    <div className="mt-3 inline-flex items-center gap-1.5 bg-green-100 rounded-full px-3 py-1 shadow-sm">
                      <Check size={14} style={{ color: '#16a34a' }} />
                      <span className="text-xs font-bold text-green-700">Permanent unlock</span>
                    </div>
                  )}
                </div>
                <button onClick={closeConnect} className="w-full text-white font-semibold py-3 rounded-xl text-sm hover:opacity-90 transition" style={{ background: NAVY }}>
                  Done
                </button>
              </div>
            ) : step === 'enter_phone' ? (
              <div>
                {connectError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3 flex items-start gap-2">
                    <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-red-700">{connectError}</p>
                  </div>
                )}
                <p className="text-sm font-semibold text-gray-800 mb-1">Enter your phone number</p>
                <p className="text-xs text-gray-500 mb-3">
                  A one-time payment of {formatPriceFull(ACCESS_FEE)} (MTN MoMo) will be sent to this number to unlock the seller&apos;s contact permanently.
                </p>
                <div className="relative mb-3">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Phone size={16} />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !working && handleProceedToMethod()}
                    placeholder="+250 7XX XXX XXX"
                    className="w-full border border-gray-300 rounded-xl pl-10 pr-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E85D04]/30 focus:border-[#E85D04] transition"
                  />
                </div>
                <button
                  onClick={handleProceedToMethod}
                  disabled={working}
                  className="w-full text-white font-bold py-3 rounded-xl text-sm hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ background: `linear-gradient(135deg, ${NAVY}, ${ORG})` }}
                >
                  {working ? (
                    <><Loader2 size={16} className="animate-spin" /> Sending request...</>
                  ) : (
                    <>Pay {formatPriceFull(ACCESS_FEE)} & Unlock</>
                  )}
                </button>
              </div>
            ) : step === 'payment_pending' ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-3">
                  <Loader2 size={28} className="animate-spin" style={{ color: ORG }} />
                </div>
                <p className="text-sm font-bold text-gray-800 mb-1">Waiting for payment</p>
                <p className="text-xs text-gray-500 mb-3">
                  A payment request of <strong>{formatPriceFull(ACCESS_FEE)}</strong> has been sent to <strong>{phone}</strong>.
                </p>
                <p className="text-xs text-gray-400">Please approve the payment on your phone by entering your Mobile Money PIN.</p>
                <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-400">
                  <Clock size={12} />
                  <span>Checking payment status...</span>
                </div>
                <button onClick={() => { if (pollRef.current) clearInterval(pollRef.current); setStep('enter_phone'); setConnectError(''); }}
                  className="text-gray-500 text-sm py-2 mt-3 hover:underline">Cancel</button>
              </div>
            ) : step === 'otp_entry' ? (
              <div>
                {connectError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3 flex items-start gap-2">
                    <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-red-700">{connectError}</p>
                  </div>
                )}
                {connectSuccess && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-3 flex items-start gap-2">
                    <CheckCircle size={14} className="text-green-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-green-700">{connectSuccess}</p>
                  </div>
                )}
                <p className="text-sm font-semibold text-gray-800 mb-1">Verify Your Phone</p>
                <p className="text-xs text-gray-500 mb-3">Enter the 6-digit code sent to <strong>{phone}</strong> as SMS</p>
                <input type="text" value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000" maxLength={6}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-[#E85D04]/30 focus:border-[#E85D04] transition"
                  style={{ letterSpacing: '0.3em' }} />
                <button onClick={handleVerifyOtp} disabled={working || otpCode.length !== 6}
                  className="w-full text-white font-bold py-3 rounded-xl text-sm hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition mt-3"
                  style={{ background: `linear-gradient(135deg, ${NAVY}, ${ORG})` }}>
                  {working ? (
                    <><Loader2 size={16} className="animate-spin" /> Verifying...</>
                  ) : (
                    <>Verify & Unlock</>
                  )}
                </button>
                <div className="flex items-center justify-center gap-4 mt-3">
                  {otpCountdown > 0 ? (
                    <span className="text-xs text-gray-400">Resend code in {Math.floor(otpCountdown / 60)}:{(otpCountdown % 60).toString().padStart(2, '0')}</span>
                  ) : (
                    <button onClick={handleResendOtp} className="text-xs font-semibold hover:underline flex items-center gap-1" style={{ color: ORG }}>
                      <RefreshCw size={12} /> Resend code
                    </button>
                  )}
                </div>
                <button onClick={() => { if (pollRef.current) clearInterval(pollRef.current); setStep('enter_phone'); setConnectError(''); }}
                  className="w-full text-gray-500 text-sm py-2 mt-1 hover:underline">Cancel</button>
              </div>
            ) : (
              <div>
                {connectError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3 flex items-start gap-2">
                    <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-red-700">{connectError}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
