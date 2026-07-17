'use client';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useEffect, useState, useRef } from 'react';
import api from '@/lib/api';

interface Listing {
  id: number;
  title: string;
  price: number | null;
  price_type: string;
  location: string;
  listing_type: string;
  category_name: string;
  seller_name: string;
  primary_image: string | null;
  is_featured?: boolean;
  created_at: string;
}

const ORG = '#E85D04';
const NAVY = '#1B2A5E';

export default function ListingCard({ listing }: { listing: Listing }) {
  const { T } = useLanguage();
  const [showConnect, setShowConnect] = useState(false);
  const [step, setStep] = useState<'idle' | 'enter_phone' | 'unlocked'>('idle');
  const [phone, setPhone] = useState('');
  const [working, setWorking] = useState(false);
  const [connectError, setConnectError] = useState('');
  const [sellerPhone, setSellerPhone] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const priceLabel = listing.price != null
    ? `${Number(listing.price).toLocaleString()} RWF${listing.price_type === 'per_day' ? '/day' : listing.price_type === 'per_month' ? '/mo' : ''}`
    : T.priceOnRequest;

  const handleConnectClick = () => {
    setShowConnect(true);
    setStep('enter_phone');
    setConnectError('');
  };

  const closeConnect = () => {
    setShowConnect(false);
    setStep('idle');
    setPhone('');
    setConnectError('');
    setSellerPhone(null);
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(0);
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

  const handleUnlock = async () => {
    if (!phone.trim()) { setConnectError('Please enter your phone number'); return; }
    setWorking(true); setConnectError('');
    try {
      const { data } = await api.post('/unlock/direct', { listing_id: listing.id, phone: phone.trim() });
      setSellerPhone(data.sellerPhone);
      setStep('unlocked');
      startTimer(data.expiresAt);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setConnectError(msg || 'Failed to unlock contact');
    } finally { setWorking(false); }
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

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group border border-gray-100 hover:border-orange-200 hover:-translate-y-0.5">
        <Link href={`/listings/${listing.id}`}>
          <div className="relative bg-gray-100 overflow-hidden" style={{ paddingTop: '80%' }}>
            {listing.is_featured && (
              <div className="absolute top-3 left-3 z-10">
                <span className="bg-gradient-to-r from-yellow-400 to-amber-500 text-gray-900 text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
                  ⭐ Featured
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
                  <span className="text-6xl opacity-40 block mb-2">📦</span>
                  <span className="text-[11px] text-gray-400 font-medium">No image</span>
                </div>
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
                  {formatPrice(listing.price)} RWF
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

          <p className="text-lg font-extrabold" style={{ color: ORG }}>
            {priceLabel}
          </p>

          <div className="flex items-center justify-between mt-2.5">
            <p className="text-xs text-gray-400 flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {listing.location || 'Kigali'}
            </p>
            <p className="text-[10px] text-gray-400 font-medium">
              {listing.seller_name}
            </p>
          </div>

          <div className="mt-3.5">
            <button
              onClick={handleConnectClick}
              className="w-full text-white text-xs font-bold py-2.5 rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
              style={{ background: `linear-gradient(135deg, ${NAVY}, ${ORG})` }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              Connect with Seller (300 coins)
            </button>
          </div>
        </div>
      </div>

      {showConnect && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={closeConnect}>
          <div className="bg-white rounded-2xl w-full max-w-sm max-h-[85vh] overflow-y-auto p-6 relative shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <button onClick={closeConnect} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center text-2xl shrink-0">📞</div>
              <div>
                <h3 className="font-bold text-base" style={{ color: NAVY }}>Connect with seller</h3>
                <p className="text-xs text-gray-400">Pay 300 coins to unlock contact</p>
              </div>
            </div>

            <div className="flex gap-3 mb-4 p-3 bg-gray-50 rounded-xl items-center">
              {listing.primary_image && !imgError ? (
                <img src={listing.primary_image} alt={listing.title} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
              ) : (
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">📦</span>
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
                  <div className="text-3xl mb-2">🎉</div>
                  <p className="text-xs font-medium text-gray-600 mb-1">Seller's contact number</p>
                  <p className="text-2xl font-extrabold" style={{ color: NAVY }}>{sellerPhone || 'Not provided'}</p>
                  <div className="mt-3 inline-flex items-center gap-1.5 bg-white rounded-full px-3 py-1 shadow-sm">
                    <span className="text-sm">🔓</span>
                    <span className="text-xs font-bold text-orange-600">
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                </div>
                <button onClick={closeConnect} className="w-full text-white font-semibold py-3 rounded-xl text-sm hover:opacity-90 transition" style={{ background: NAVY }}>
                  Done
                </button>
              </div>
            ) : (
              <div>
                {connectError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3">
                    <p className="text-xs text-red-700">{connectError}</p>
                  </div>
                )}
                <p className="text-sm font-semibold text-gray-800 mb-1">Enter your phone number</p>
                <p className="text-xs text-gray-500 mb-3">
                  We'll unlock the seller's contact for <strong className="text-orange-600">3 minutes</strong>.
                </p>
                <div className="relative mb-3">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+250 7XX XXX XXX"
                    className="w-full border border-gray-300 rounded-xl pl-10 pr-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E85D04]/30 focus:border-[#E85D04] transition"
                  />
                </div>
                <button
                  onClick={handleUnlock}
                  disabled={working}
                  className="w-full text-white font-bold py-3 rounded-xl text-sm hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ background: `linear-gradient(135deg, ${NAVY}, ${ORG})` }}
                >
                  {working ? (
                    <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Unlocking…</>
                  ) : (
                    <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0"/></svg> 🔓 Unlock Contact</>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
