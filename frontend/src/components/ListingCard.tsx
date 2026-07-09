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

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden group border border-gray-100 hover:border-gray-200">
        {/* Image container */}
        <Link href={`/listings/${listing.id}`}>
          <div className="relative bg-gray-50" style={{ paddingTop: '75%' }}>
            {listing.is_featured && (
              <div className="absolute top-2 left-2 z-10 bg-yellow-400 text-gray-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                ⭐ Featured
              </div>
            )}

            {listing.primary_image && !imgError ? (
              <img
                src={listing.primary_image}
                alt={listing.title}
                onError={() => setImgError(true)}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-5xl opacity-30 block mb-1">📦</span>
                  <span className="text-[10px] text-gray-300 font-medium">No image</span>
                </div>
              </div>
            )}

            <div className="absolute bottom-2 left-2 z-10">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/90 text-gray-700 shadow-sm backdrop-blur-sm">
                {listing.category_name}
              </span>
            </div>

            <div className="absolute top-2 right-2 z-10">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm ${
                listing.listing_type === 'rent'
                  ? 'bg-blue-500 text-white'
                  : 'bg-[#E85D04] text-white'
              }`}>
                {listing.listing_type === 'rent' ? 'FOR RENT' : 'FOR SALE'}
              </span>
            </div>
          </div>
        </Link>

        {/* Info */}
        <Link href={`/listings/${listing.id}`}>
          <div className="p-3">
            <h3 className="text-sm font-semibold text-gray-900 truncate leading-snug mb-1">{listing.title}</h3>
            <p className="text-base font-bold" style={{ color: ORG }}>{priceLabel}</p>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {listing.location || 'Kigali'}
            </p>
          </div>
        </Link>

        {/* Connect button */}
        <div className="px-3 pb-3">
          <button
            onClick={handleConnectClick}
            className="w-full text-white text-xs font-bold py-2 rounded-lg transition-all duration-200 hover:shadow-md flex items-center justify-center gap-1.5"
            style={{ background: ORG }}
            onMouseEnter={e => (e.currentTarget.style.background = '#c04a00')}
            onMouseLeave={e => (e.currentTarget.style.background = ORG)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            Connect (300 coins)
          </button>
        </div>
      </div>

      {/* Connect Modal */}
      {showConnect && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4" onClick={closeConnect}>
          <div className="bg-white rounded-2xl w-full max-w-sm max-h-[80vh] overflow-y-auto p-6 relative shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={closeConnect} className="absolute top-4 right-5 text-2xl text-gray-400 hover:text-gray-700">&times;</button>

            <h3 className="font-bold text-lg mb-1" style={{ color: NAVY }}>📞 Connect with seller</h3>

            <div className="flex gap-3 mb-4 p-2 bg-gray-50 rounded-xl items-center">
              {listing.primary_image && !imgError ? (
                <img src={listing.primary_image} alt={listing.title} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
              ) : (
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">📦</span>
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{listing.title}</p>
                <p className="text-xs text-gray-500 truncate">{listing.seller_name}</p>
              </div>
            </div>

            <p className="text-xs text-gray-500 mb-4">
              Pay <strong>300 coins</strong> to unlock <strong>{listing.seller_name}</strong>&apos;s contact.
            </p>

            {step === 'unlocked' ? (
              <div>
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-3">
                  <p className="text-sm font-medium text-[#1a2b6d] mb-1">Seller&apos;s contact number</p>
                  <p className="text-2xl font-bold text-[#1a2b6d]">{sellerPhone || 'Not provided'}</p>
                </div>
                <div className="text-center mb-3">
                  <span className="text-sm font-semibold text-orange-600">
                    🔓 Unlocked for {formatTime(timeLeft)}
                  </span>
                </div>
                <button onClick={closeConnect} className="w-full text-white font-semibold py-2.5 rounded-lg text-sm hover:opacity-90" style={{ background: NAVY }}>Close</button>
              </div>
            ) : (
              <div>
                {connectError && <p className="text-red-600 text-sm mb-2">{connectError}</p>}
                <p className="text-sm font-semibold text-gray-800 mb-1">Enter your phone number</p>
                <p className="text-xs text-gray-500 mb-3">
                  Unlock the seller&apos;s contact for <strong>3 minutes</strong>.
                </p>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+250 7XX XXX XXX"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm mb-3 focus:outline-none focus:border-[#E85D04]"
                />
                <button onClick={handleUnlock} disabled={working} className="w-full text-white font-semibold py-2.5 rounded-lg text-sm hover:opacity-90 disabled:opacity-60" style={{ background: ORG }}>
                  {working ? 'Unlocking…' : '🔓 Unlock'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
