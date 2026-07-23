'use client';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useEffect, useState, useRef } from 'react';
import api from '@/lib/api';
import { Star, Package, MapPin, Phone, X, Lock, Unlock, CheckCircle } from '@/lib/icons';

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
const NAVY = '#0f1e42';

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
              <MapPin size={12} />
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
              <Phone size={14} strokeWidth={2.5} />
              Connect with Seller (300 coins)
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
                <p className="text-xs text-gray-400">Pay 300 coins to unlock contact</p>
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
                  <p className="text-xs font-medium text-gray-600 mb-1">Seller's contact number</p>
                  <p className="text-2xl font-extrabold" style={{ color: NAVY }}>{sellerPhone || 'Not provided'}</p>
                  <div className="mt-3 inline-flex items-center gap-1.5 bg-white rounded-full px-3 py-1 shadow-sm">
                    <Unlock size={14} />
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
                    <Phone size={16} />
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
                    <><Lock size={16} strokeWidth={2.5} /> Unlock Contact</>
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
