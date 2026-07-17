'use client';
import { use, useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

interface ListingDetail {
  id: number;
  title: string;
  description: string;
  price: number | null;
  price_type: string;
  location: string;
  listing_type: string;
  category_name: string;
  seller_name: string;
  seller_id: number;
  status: string;
  is_featured: boolean;
  expires_at: string;
  created_at: string;
  images: { id: number; image_url: string; is_primary: boolean }[];
  contactUnlocked: boolean;
  sellerPhone: string | null;
}

const ORG = '#E85D04';
const NAVY = '#1B2A5E';

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, refreshUser } = useAuth();
  const { T } = useLanguage();
  const router = useRouter();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const [step, setStep] = useState<'idle' | 'enter_phone' | 'unlocked'>('idle');
  const [phone, setPhone] = useState('');
  const [working, setWorking] = useState(false);
  const [connectError, setConnectError] = useState('');
  const [sellerPhone, setSellerPhone] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [boosting, setBoosting] = useState(false);

  useEffect(() => {
    api.get(`/listings/${id}`)
      .then(({ data }) => {
        setListing(data.listing);
        if (data.listing.contactUnlocked) {
          setStep('unlocked');
          setSellerPhone(data.listing.sellerPhone);
        }
      })
      .catch(() => router.push('/listings'))
      .finally(() => setLoading(false));
  }, [id, router]);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

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
      const { data } = await api.post('/unlock/direct', { listing_id: id, phone: phone.trim() });
      setSellerPhone(data.sellerPhone);
      setStep('unlocked');
      startTimer(data.expiresAt);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setConnectError(msg || 'Failed to unlock contact');
    } finally { setWorking(false); }
  };

  const handleBoost = async () => {
    setBoosting(true);
    try {
      await api.post(`/listings/${id}/boost`);
      setListing((prev) => prev ? { ...prev, is_featured: true } : prev);
      await refreshUser();
      alert('Listing boosted for 7 days!');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg || 'Failed to boost listing');
    } finally { setBoosting(false); }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-gray-100 rounded w-1/4" />
          <div className="h-96 bg-gray-100 rounded-2xl" />
          <div className="space-y-3">
            <div className="h-6 bg-gray-100 rounded w-3/4" />
            <div className="h-4 bg-gray-100 rounded w-1/2" />
            <div className="h-4 bg-gray-100 rounded w-1/3" />
          </div>
        </div>
      </div>
    );
  }
  if (!listing) return null;

  const priceLabel = listing.price
    ? `${Number(listing.price).toLocaleString()} RWF${listing.price_type === 'per_day' ? '/day' : listing.price_type === 'per_month' ? '/mo' : ''}`
    : T.priceOnRequest;
  const isExpired = new Date(listing.expires_at) < new Date();
  const isOwner = user?.id === listing.seller_id;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link href="/listings" className="inline-flex items-center gap-1 text-sm font-medium hover:underline mb-6" style={{ color: ORG }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        {T.backToListings}
      </Link>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Image Gallery - Left */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {listing.is_featured && (
              <div className="bg-gradient-to-r from-yellow-400 to-amber-500 text-gray-900 text-xs font-bold text-center py-2 tracking-wide">
                ⭐ {T.featuredListing}
              </div>
            )}

            {listing.images.length > 0 ? (
              <>
                <div
                  className="relative bg-gray-100 cursor-pointer overflow-hidden"
                  style={{ paddingTop: '75%' }}
                  onClick={() => setLightboxOpen(true)}
                >
                  <img
                    src={listing.images[activeImg]?.image_url}
                    alt={listing.title}
                    className="absolute inset-0 w-full h-full object-contain hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm">
                    {activeImg + 1} / {listing.images.length}
                  </div>
                  {activeImg > 0 && (
                    <button onClick={(e) => { e.stopPropagation(); setActiveImg(i => i - 1); }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white transition">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
                    </button>
                  )}
                  {activeImg < listing.images.length - 1 && (
                    <button onClick={(e) => { e.stopPropagation(); setActiveImg(i => i + 1); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white transition">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                    </button>
                  )}
                </div>

                {listing.images.length > 1 && (
                  <div className="flex gap-2 p-3 overflow-x-auto bg-gray-50 border-t border-gray-100">
                    {listing.images.map((img, i) => (
                      <button key={img.id} onClick={() => setActiveImg(i)}
                        className={`h-16 w-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                          activeImg === i
                            ? 'border-[#E85D04] shadow-md scale-105'
                            : 'border-transparent opacity-60 hover:opacity-100'
                        }`}>
                        <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center" style={{ height: 400 }}>
                <div className="text-center">
                  <span className="text-7xl opacity-30 block mb-3">📦</span>
                  <span className="text-sm text-gray-400 font-medium">No images available</span>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-3">{T.descriptionLabel}</h2>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
              {listing.description || 'No description provided.'}
            </p>
          </div>
        </div>

        {/* Info - Right */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:sticky lg:top-24">
            <div className="flex items-start justify-between gap-3 mb-3">
              <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full tracking-wider ${
                listing.listing_type === 'rent' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-[#E85D04]'
              }`}>
                {listing.listing_type === 'rent' ? T.forRent : T.forSale}
              </span>
              {isExpired && <span className="bg-red-100 text-red-700 text-xs font-semibold px-3 py-1 rounded-full shrink-0">Expired</span>}
            </div>

            <h1 className="text-xl font-bold text-gray-900 leading-tight">{listing.title}</h1>

            <p className="text-2xl font-extrabold mt-3" style={{ color: ORG }}>{priceLabel}</p>

            <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {listing.location || 'Kigali'}
            </div>

            {/* Quick info grid */}
            <div className="grid grid-cols-2 gap-3 mt-5 p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{T.categoryLabel}</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">{listing.category_name}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{T.sellerLabel}</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">{listing.seller_name}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Status</p>
                <p className="text-sm font-semibold text-green-600 mt-0.5">{listing.status}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Posted</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">{new Date(listing.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Owner actions */}
            {isOwner && (
              <div className="mt-6 pt-5 border-t border-gray-100">
                <p className="text-sm text-gray-500 italic mb-3">{T.thisIsYourListing}</p>
                {!listing.is_featured && (
                  <button onClick={handleBoost} disabled={boosting}
                    className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 text-gray-900 font-bold px-4 py-2.5 rounded-xl text-sm hover:shadow-lg transition disabled:opacity-60 flex items-center justify-center gap-2">
                    {boosting ? 'Boosting...' : '⭐ Boost Listing (200 coins)'}
                  </button>
                )}
                {listing.is_featured && (
                  <span className="block text-sm text-yellow-600 font-medium text-center py-2">⭐ {T.featuredListing}</span>
                )}
              </div>
            )}

            {/* Connect Section */}
            {!isOwner && (
              <div className="mt-6 pt-5 border-t border-gray-100">
                {step === 'unlocked' ? (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5 text-center">
                    <div className="text-4xl mb-3">🎉</div>
                    <p className="text-xs font-medium text-gray-600 mb-1">Seller's contact number</p>
                    <p className="text-2xl font-extrabold" style={{ color: NAVY }}>{sellerPhone || 'Not provided'}</p>
                    <div className="mt-3 inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm">
                      <span className="text-lg">🔓</span>
                      <span className="text-sm font-bold" style={{ color: ORG }}>{formatTime(timeLeft)}</span>
                      <span className="text-xs text-gray-400">remaining</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-3">Contact the seller to complete your transaction</p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center text-xl">📞</div>
                      <div>
                        <p className="text-sm font-bold text-gray-800">Interested in this listing?</p>
                        <p className="text-xs text-gray-500">Connect with the seller</p>
                      </div>
                    </div>

                    {connectError && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3">
                        <p className="text-xs text-red-700">{connectError}</p>
                      </div>
                    )}

                    {step === 'idle' ? (
                      <div>
                        <p className="text-sm text-gray-600 mb-3">
                          Enter your phone number to unlock the seller's contact for <strong>3 minutes</strong>.
                        </p>
                        <button onClick={() => setStep('enter_phone')}
                          disabled={isExpired}
                          className="w-full text-white font-bold py-3 rounded-xl text-sm hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          style={{ background: `linear-gradient(135deg, ${NAVY}, ${ORG})` }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                          </svg>
                          {T.connectSeller}
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-semibold text-gray-800 mb-1">Enter your phone number</p>
                        <p className="text-xs text-gray-500 mb-3">Unlock the seller's contact for <strong className="text-orange-600">3 minutes</strong>.</p>
                        <div className="relative mb-3">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                            </svg>
                          </div>
                          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                            placeholder="+250 7XX XXX XXX"
                            className="w-full border border-gray-300 rounded-xl pl-10 pr-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E85D04]/30 focus:border-[#E85D04] transition" />
                        </div>
                        <button onClick={handleUnlock} disabled={working}
                          className="w-full text-white font-bold py-3 rounded-xl text-sm hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
                          style={{ background: `linear-gradient(135deg, ${NAVY}, ${ORG})` }}>
                          {working ? (
                            <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Unlocking...</>
                          ) : (
                            '🔓 Unlock Contact'
                          )}
                        </button>
                        <button onClick={() => { setStep('idle'); setPhone(''); setConnectError(''); }}
                          className="w-full text-gray-500 text-sm py-2 mt-1 hover:underline">Cancel</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && listing.images.length > 0 && (
        <div className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center" onClick={() => setLightboxOpen(false)}>
          <button onClick={() => setLightboxOpen(false)}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition z-10">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-4 py-2 rounded-full">
            {activeImg + 1} / {listing.images.length}
          </div>
          <img
            src={listing.images[activeImg]?.image_url}
            alt={listing.title}
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {activeImg > 0 && (
            <button onClick={(e) => { e.stopPropagation(); setActiveImg(i => i - 1); }}
              className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
          )}
          {activeImg < listing.images.length - 1 && (
            <button onClick={(e) => { e.stopPropagation(); setActiveImg(i => i + 1); }}
              className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
