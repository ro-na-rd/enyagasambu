'use client';
import { use, useEffect, useState } from 'react';
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

type ConnectStep = 'idle' | 'enter_phone' | 'enter_otp' | 'done';

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, refreshUser } = useAuth();
  const { T } = useLanguage();
  const router = useRouter();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);

  // Connect flow state
  const [step, setStep] = useState<ConnectStep>('idle');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [working, setWorking] = useState(false);
  const [connectError, setConnectError] = useState('');
  const [boosting, setBoosting] = useState(false);

  useEffect(() => {
    api.get(`/listings/${id}`)
      .then(({ data }) => {
        setListing(data.listing);
        if (data.listing.contactUnlocked) setStep('done');
      })
      .catch(() => router.push('/listings'))
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleSendOtp = async () => {
    if (!user) { router.push('/login'); return; }
    if (!phone.trim()) { setConnectError('Please enter your phone number'); return; }
    setWorking(true); setConnectError('');
    try {
      await api.post('/otp/send', { listing_id: id, phone: phone.trim() });
      setStep('enter_otp');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if ((err as { response?: { data?: { alreadyUnlocked?: boolean; sellerPhone?: string } } })?.response?.data?.alreadyUnlocked) {
        const phone = (err as { response?: { data?: { sellerPhone?: string } } })?.response?.data?.sellerPhone;
        setListing((prev) => prev ? { ...prev, contactUnlocked: true, sellerPhone: phone || null } : prev);
        setStep('done');
      } else {
        setConnectError(msg || 'Failed to send OTP');
      }
    } finally { setWorking(false); }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) { setConnectError('Please enter the OTP code'); return; }
    setWorking(true); setConnectError('');
    try {
      const { data } = await api.post('/otp/verify', { listing_id: id, phone: phone.trim(), code: otp.trim() });
      setListing((prev) => prev ? { ...prev, contactUnlocked: true, sellerPhone: data.sellerPhone } : prev);
      setStep('done');
      await refreshUser();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setConnectError(msg || 'Verification failed');
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

  if (loading) return <div className="text-center py-24 text-gray-500">Loading…</div>;
  if (!listing) return null;

  const priceLabel = listing.price
    ? `${Number(listing.price).toLocaleString()} RWF${listing.price_type === 'per_day' ? '/day' : listing.price_type === 'per_month' ? '/mo' : ''}`
    : T.priceOnRequest;
  const isExpired = new Date(listing.expires_at) < new Date();
  const isOwner = user?.id === listing.seller_id;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <Link href="/listings" className="text-[#FF6B00] text-sm hover:underline mb-4 inline-block">{T.backToListings}</Link>

      <div className="bg-white rounded-2xl shadow overflow-hidden">
        {listing.is_featured && (
          <div className="bg-yellow-400 text-gray-900 text-xs font-bold text-center py-1.5 tracking-wide">
            ⭐ {T.featuredListing}
          </div>
        )}

        {listing.images.length > 0 ? (
          <div>
            <div className="h-72 sm:h-96 bg-gray-100 overflow-hidden">
              <img src={listing.images[activeImg]?.image_url} alt={listing.title} className="w-full h-full object-contain" />
            </div>
            {listing.images.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto">
                {listing.images.map((img, i) => (
                  <button key={img.id} onClick={() => setActiveImg(i)} className={`h-16 w-16 rounded overflow-hidden border-2 shrink-0 ${activeImg === i ? 'border-[#FF6B00]' : 'border-transparent'}`}>
                    <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="h-56 bg-gray-100 flex items-center justify-center text-6xl opacity-30">📦</div>
        )}

        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${listing.listing_type === 'rent' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-[#FF6B00]'}`}>
                {listing.listing_type === 'rent' ? T.forRent : T.forSale}
              </span>
              <h1 className="text-2xl font-bold text-gray-900 mt-2">{listing.title}</h1>
              <p className="text-[#FF6B00] font-bold text-xl mt-1">{priceLabel}</p>
            </div>
            {isExpired && <span className="bg-red-100 text-red-700 text-xs font-semibold px-3 py-1 rounded-full shrink-0">Expired</span>}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5 text-sm text-gray-600">
            <div><span className="font-medium text-gray-800">{T.categoryLabel}:</span> {listing.category_name}</div>
            <div><span className="font-medium text-gray-800">{T.locationLabel}:</span> {listing.location || 'Kigali'}</div>
            <div><span className="font-medium text-gray-800">{T.sellerLabel}:</span> {listing.seller_name}</div>
          </div>

          {listing.description && (
            <div className="mt-5">
              <h2 className="font-semibold text-gray-800 mb-2">{T.descriptionLabel}</h2>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{listing.description}</p>
            </div>
          )}

          {/* Owner actions */}
          {isOwner && (
            <div className="mt-6 border-t pt-5 flex flex-wrap gap-3">
              <p className="w-full text-sm text-gray-500 italic">{T.thisIsYourListing}</p>
              {!listing.is_featured && (
                <button
                  onClick={handleBoost}
                  disabled={boosting}
                  className="bg-yellow-400 text-gray-900 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-yellow-300 transition disabled:opacity-60"
                >
                  {boosting ? T.boosting : T.boostListingBtn}
                </button>
              )}
              {listing.is_featured && <span className="text-sm text-yellow-600 font-medium">⭐ {T.featuredListing}</span>}
            </div>
          )}

          {/* Contact section */}
          {!isOwner && (
            <div className="mt-6 border-t pt-5">
              {step === 'done' ? (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <p className="text-sm font-medium text-[#1a2b6d] mb-1">{T.sellerContactNum}</p>
                  <p className="text-2xl font-bold text-[#1a2b6d]">{listing.sellerPhone || T.notProvided}</p>
                  <p className="text-xs text-orange-500 mt-1">{T.contactNow}</p>
                </div>
              ) : step === 'idle' ? (
                <div>
                  <p className="text-sm text-gray-600 mb-3">
                    Verify your phone number and pay <strong>300 coins</strong> to unlock the seller&apos;s contact.
                    {user && <span className="ml-1 text-[#FF6B00]">(You have {user.coins} coins)</span>}
                  </p>
                  {connectError && <p className="text-red-600 text-sm mb-2">{connectError}</p>}
                  <button
                    onClick={() => { if (!user) router.push('/login'); else setStep('enter_phone'); }}
                    disabled={isExpired}
                    className="bg-[#FF6B00] text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-[#e05d00] transition disabled:opacity-60"
                  >
                    {T.connectSeller}
                  </button>
                  {!user && <p className="text-xs text-gray-500 mt-2"><Link href="/login" className="text-[#FF6B00] underline">{T.signIn}</Link> to connect.</p>}
                </div>
              ) : step === 'enter_phone' ? (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm font-semibold text-gray-800 mb-1">{T.enterPhoneLabel}</p>
                  <p className="text-xs text-gray-500 mb-3">{T.sendOtpDesc}</p>
                  {connectError && <p className="text-red-600 text-sm mb-2">{connectError}</p>}
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+250 7XX XXX XXX"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm mb-3 focus:outline-none "
                  />
                  <div className="flex gap-2">
                    <button onClick={handleSendOtp} disabled={working} className="bg-[#FF6B00] text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-[#e05d00] disabled:opacity-60">
                      {working ? T.sending : T.sendOtp}
                    </button>
                    <button onClick={() => setStep('idle')} className="text-gray-500 text-sm hover:underline px-2">{T.cancel}</button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm font-semibold text-gray-800 mb-1">{T.enterOtpLabel}</p>
                  <p className="text-xs text-gray-500 mb-3">A 6-digit code was sent to <strong>{phone}</strong>. Entering it will deduct <strong>300 coins</strong>.</p>
                  {connectError && <p className="text-red-600 text-sm mb-2">{connectError}</p>}
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="6-digit code"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm mb-3 tracking-widest text-center text-lg focus:outline-none "
                  />
                  <div className="flex gap-2">
                    <button onClick={handleVerifyOtp} disabled={working || otp.length < 6} className="bg-[#FF6B00] text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-[#e05d00] disabled:opacity-60">
                      {working ? T.verifying : T.verifyConnect}
                    </button>
                    <button onClick={() => { setStep('enter_phone'); setOtp(''); setConnectError(''); }} className="text-gray-500 text-sm hover:underline px-2">
                      {T.resend}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
