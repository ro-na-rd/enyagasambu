'use client';
import { use, useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { ArrowLeft, Star, ChevronLeft, ChevronRight, Package, MapPin, Phone, Loader2, X, MessageCircle, Clock, CheckCircle, AlertCircle, RefreshCw, Heart, Send } from '@/lib/icons';

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

interface Comment {
  id: number;
  user_id: number;
  user_name: string;
  content: string;
  created_at: string;
}

const ORG = '#E85D04';
const NAVY = '#0f1e42';
const CONTACT_FEE = 300;

type ContactStep = 'idle' | 'enter_phone' | 'payment_pending' | 'otp_entry' | 'unlocked';

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, refreshUser } = useAuth();
  const { T } = useLanguage();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [activeImg, setActiveImg] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Contact access flow
  const [contactStep, setContactStep] = useState<ContactStep>('idle');
  const [phone, setPhone] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [working, setWorking] = useState(false);
  const [contactError, setContactError] = useState('');
  const [contactSuccess, setContactSuccess] = useState('');
  const [sellerPhone, setSellerPhone] = useState<string | null>(null);
  const [sellerName, setSellerName] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [boosting, setBoosting] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const otpTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Likes & Comments
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null);

  useEffect(() => {
    api.get(`/listings/${id}`)
      .then(({ data }) => {
        setListing(data.listing);
        if (data.listing.contactUnlocked) {
          setContactStep('unlocked');
          setSellerPhone(data.listing.sellerPhone);
        }
      })
      .catch((err) => setFetchError(err?.response?.data?.message || 'Listing not found'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!listing) return;
    api.get(`/likes/${id}`).then(({ data }) => {
      setLiked(data.liked);
      setLikeCount(data.count);
    }).catch(() => {});
    api.get(`/comments/${id}`).then(({ data }) => {
      setComments(data.comments);
    }).catch(() => {});
  }, [id, listing]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (otpTimerRef.current) clearInterval(otpTimerRef.current);
    };
  }, []);

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
          setContactStep('otp_entry');
          setContactSuccess('Payment successful! A verification code has been sent to your phone.');
          startOtpCountdown();
        } else if (data.status === 'confirmed') {
          if (pollRef.current) clearInterval(pollRef.current);
          setSellerPhone(data.sellerPhone);
          setSellerName(data.sellerName);
          setContactStep('unlocked');
        } else if (data.status === 'failed') {
          if (pollRef.current) clearInterval(pollRef.current);
          setContactError(data.message || 'Payment failed. Please try again.');
          setContactStep('enter_phone');
        }
      } catch {
        // Keep polling on transient errors
      }
    }, 5000);
  }, [startOtpCountdown]);

  const handleInitiatePayment = async () => {
    if (!phone.trim()) { setContactError('Please enter your phone number'); return; }
    setWorking(true); setContactError(''); setContactSuccess('');
    try {
      const { data } = await api.post('/contact-access/initiate', { listingId: parseInt(id), phone: phone.trim() });
      if (data.alreadyUnlocked) {
        setSellerPhone(data.sellerPhone);
        setSellerName(data.sellerName);
        setContactStep('unlocked');
      } else if (data.referenceId) {
        setReferenceId(data.referenceId);
        setContactStep('payment_pending');
        startPaymentPolling(data.referenceId);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setContactError(msg || 'Failed to initiate payment');
    } finally { setWorking(false); }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode.trim() || otpCode.length !== 6) { setContactError('Please enter the 6-digit code'); return; }
    setWorking(true); setContactError('');
    try {
      const { data } = await api.post('/contact-access/verify-otp', { referenceId, code: otpCode.trim() });
      setSellerPhone(data.sellerPhone);
      setSellerName(data.sellerName);
      setContactStep('unlocked');
      if (otpTimerRef.current) clearInterval(otpTimerRef.current);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setContactError(msg || 'Invalid verification code');
    } finally { setWorking(false); }
  };

  const handleResendOtp = async () => {
    setContactError(''); setContactSuccess('');
    try {
      await api.post('/contact-access/resend-otp', { referenceId });
      setContactSuccess('New verification code sent!');
      startOtpCountdown();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setContactError(msg || 'Failed to resend code');
    }
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

  const handleToggleLike = async () => {
    if (!user) return;
    try {
      const { data } = await api.post(`/likes/${id}/toggle`);
      setLiked(data.liked);
      setLikeCount(data.count);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg || 'Failed to update like');
    }
  };

  const handleAddComment = async () => {
    if (!user || !commentText.trim()) return;
    setCommentSubmitting(true);
    try {
      const { data } = await api.post(`/comments/${id}`, { content: commentText.trim() });
      setComments((prev) => [...prev, data.comment]);
      setCommentText('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg || 'Failed to add comment');
    } finally { setCommentSubmitting(false); }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!user) return;
    setDeletingCommentId(commentId);
    try {
      await api.delete(`/comments/${id}/${commentId}`);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg || 'Failed to delete comment');
    } finally { setDeletingCommentId(null); }
  };

  const resetContactFlow = () => {
    setContactStep('idle');
    setPhone('');
    setOtpCode('');
    setReferenceId('');
    setContactError('');
    setContactSuccess('');
    if (pollRef.current) clearInterval(pollRef.current);
    if (otpTimerRef.current) clearInterval(otpTimerRef.current);
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
  if (!listing) {
    if (fetchError) {
      return (
        <div className="max-w-6xl mx-auto px-4 py-20 text-center">
          <div className="text-6xl mb-4 text-gray-300 flex justify-center"><Package size={64} /></div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Listing Not Found</h2>
          <p className="text-gray-500 mb-6">{fetchError}</p>
          <Link href="/listings" className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-lg text-white" style={{ background: '#E85D04' }}>
            <ArrowLeft size={14} /> Browse Listings
          </Link>
        </div>
      );
    }
    return null;
  }

  const priceLabel = listing.price
    ? `${Number(listing.price).toLocaleString()} RWF${listing.price_type === 'per_day' ? '/day' : listing.price_type === 'per_month' ? '/mo' : ''}`
    : T.priceOnRequest;
  const isExpired = new Date(listing.expires_at) < new Date();
  const isOwner = user?.id === listing.seller_id;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link href="/listings" className="inline-flex items-center gap-1 text-sm font-medium hover:underline mb-6" style={{ color: ORG }}>
        <ArrowLeft size={16} />
        {T.backToListings}
      </Link>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Image Gallery - Left */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {listing.is_featured && (
              <div className="bg-gradient-to-r from-yellow-400 to-amber-500 text-gray-900 text-xs font-bold text-center py-2 tracking-wide flex items-center justify-center gap-1">
                <Star size={14} /> {T.featuredListing}
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
                      <ChevronLeft size={18} />
                    </button>
                  )}
                  {activeImg < listing.images.length - 1 && (
                    <button onClick={(e) => { e.stopPropagation(); setActiveImg(i => i + 1); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white transition">
                      <ChevronRight size={18} />
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
                  <span className="text-7xl opacity-30 block mb-3"><Package size={56} /></span>
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

          {/* Comments Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-4">Comments ({comments.length})</h2>

            {user ? (
              <div className="flex gap-3 mb-6">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !commentSubmitting && handleAddComment()}
                  placeholder="Add a comment..."
                  className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E85D04]/30 focus:border-[#E85D04] transition"
                />
                <button onClick={handleAddComment} disabled={commentSubmitting || !commentText.trim()}
                  className="px-4 py-2.5 rounded-xl text-white text-sm font-bold hover:shadow-lg transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
                  style={{ background: `linear-gradient(135deg, ${NAVY}, ${ORG})` }}>
                  {commentSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Post
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic mb-6">Sign in to leave a comment.</p>
            )}

            {comments.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No comments yet. Be the first!</p>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 group">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-gray-600">{comment.user_name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-800">{comment.user_name}</span>
                        <span className="text-xs text-gray-400">{new Date(comment.created_at).toLocaleDateString()}</span>
                        {user && (user.id === comment.user_id) && (
                          <button onClick={() => handleDeleteComment(comment.id)} disabled={deletingCommentId === comment.id}
                            className="text-xs text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition ml-auto">
                            {deletingCommentId === comment.id ? '...' : 'Delete'}
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 break-words">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
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

            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MapPin size={14} />
                {listing.location || 'Kigali'}
              </div>
              {user && (
                <button onClick={handleToggleLike}
                  className={`flex items-center gap-1.5 text-sm font-semibold transition ${liked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}>
                  <Heart size={16} className={liked ? 'fill-current' : ''} />
                  {likeCount > 0 && <span>{likeCount}</span>}
                </button>
              )}
              {!user && likeCount > 0 && (
                <span className="flex items-center gap-1.5 text-sm text-gray-400">
                  <Heart size={14} /> {likeCount}
                </span>
              )}
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
                    {boosting ? 'Boosting...' : <><Star size={14} /> Boost Listing (200 coins)</>}
                  </button>
                )}
                {listing.is_featured && (
                  <span className="block text-sm text-yellow-600 font-medium text-center py-2 flex items-center justify-center gap-1"><Star size={14} /> {T.featuredListing}</span>
                )}
              </div>
            )}

            {/* Connect Section — MoMo Payment */}
            {!isOwner && (
              <div className="mt-6 pt-5 border-t border-gray-100">
                {contactStep === 'unlocked' ? (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5 text-center">
                    <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                      <CheckCircle size={28} style={{ color: '#059669' }} />
                    </div>
                    <p className="text-sm font-bold text-gray-800 mb-1">Seller Contact Unlocked</p>
                    {sellerName && <p className="text-xs text-gray-500 mb-2">{sellerName}</p>}
                    <p className="text-2xl font-extrabold" style={{ color: NAVY }}>{sellerPhone || 'Not provided'}</p>
                    <div className="flex items-center justify-center gap-3 mt-4">
                      {sellerPhone && (
                        <a href={`tel:${sellerPhone}`}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold hover:shadow-lg transition"
                          style={{ background: `linear-gradient(135deg, ${NAVY}, #0f1e42)` }}>
                          <Phone size={16} /> Call
                        </a>
                      )}
                      {sellerPhone && (
                        <a href={`https://wa.me/${sellerPhone.replace(/^0/, '250')}`} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold hover:shadow-lg transition"
                          style={{ background: 'linear-gradient(135deg, #25d366, #128c7e)' }}>
                          <MessageCircle size={16} /> WhatsApp
                        </a>
                      )}
                    </div>
                    <button onClick={resetContactFlow}
                      className="text-xs text-gray-400 hover:text-gray-600 mt-3 underline">Unlock another contact</button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center text-xl">
                        <Phone size={24} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800">Get Seller Contact</p>
                        <p className="text-xs text-gray-500">One-time payment of {CONTACT_FEE} RWF</p>
                      </div>
                    </div>

                    {contactError && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3 flex items-start gap-2">
                        <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-red-700">{contactError}</p>
                      </div>
                    )}
                    {contactSuccess && (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-3 flex items-start gap-2">
                        <CheckCircle size={14} className="text-green-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-green-700">{contactSuccess}</p>
                      </div>
                    )}

                    {/* Step 1: Enter phone number */}
                    {contactStep === 'idle' && (
                      <div>
                        <p className="text-sm text-gray-600 mb-3">
                          Pay <strong className="text-orange-600">{CONTACT_FEE} RWF</strong> via MTN MoMo or Airtel Money to unlock the seller&apos;s phone number, WhatsApp, and call options.
                        </p>
                        <button onClick={() => setContactStep('enter_phone')}
                          disabled={isExpired}
                          className="w-full text-white font-bold py-3 rounded-xl text-sm hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          style={{ background: `linear-gradient(135deg, ${NAVY}, ${ORG})` }}>
                          <Phone size={16} />
                          Get Seller Contact
                        </button>
                      </div>
                    )}

                    {/* Step 2: Enter phone for MoMo payment */}
                    {contactStep === 'enter_phone' && (
                      <div>
                        <p className="text-sm font-semibold text-gray-800 mb-1">Enter your Mobile Money number</p>
                        <p className="text-xs text-gray-500 mb-3">A payment request of <strong className="text-orange-600">{CONTACT_FEE} RWF</strong> will be sent to this number.</p>
                        <div className="relative mb-3">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <Phone size={16} />
                          </div>
                          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                            placeholder="+250 7XX XXX XXX"
                            className="w-full border border-gray-300 rounded-xl pl-10 pr-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E85D04]/30 focus:border-[#E85D04] transition" />
                        </div>
                        <button onClick={handleInitiatePayment} disabled={working}
                          className="w-full text-white font-bold py-3 rounded-xl text-sm hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
                          style={{ background: `linear-gradient(135deg, ${NAVY}, ${ORG})` }}>
                          {working ? (
                            <><Loader2 size={16} className="animate-spin" /> Sending request...</>
                          ) : (
                            <>Pay {CONTACT_FEE} RWF</>
                          )}
                        </button>
                        <button onClick={resetContactFlow}
                          className="w-full text-gray-500 text-sm py-2 mt-1 hover:underline">Cancel</button>
                      </div>
                    )}

                    {/* Step 3: Payment pending — polling MoMo */}
                    {contactStep === 'payment_pending' && (
                      <div className="text-center py-4">
                        <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-3">
                          <Loader2 size={28} className="animate-spin" style={{ color: ORG }} />
                        </div>
                        <p className="text-sm font-bold text-gray-800 mb-1">Waiting for payment</p>
                        <p className="text-xs text-gray-500 mb-3">
                          A payment request of <strong>{CONTACT_FEE} RWF</strong> has been sent to <strong>{phone}</strong>.
                        </p>
                        <p className="text-xs text-gray-400">Please approve the payment on your phone by entering your Mobile Money PIN.</p>
                        <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-400">
                          <Clock size={12} />
                          <span>Checking payment status...</span>
                        </div>
                        <button onClick={() => { if (pollRef.current) clearInterval(pollRef.current); setContactStep('enter_phone'); setContactError(''); }}
                          className="text-gray-500 text-sm py-2 mt-3 hover:underline">Cancel</button>
                      </div>
                    )}

                    {/* Step 4: Enter OTP */}
                    {contactStep === 'otp_entry' && (
                      <div>
                        <p className="text-sm font-semibold text-gray-800 mb-1">Enter Verification Code</p>
                        <p className="text-xs text-gray-500 mb-3">Enter the 6-digit code sent to <strong>{phone}</strong>.</p>
                        <input type="text" value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="000000"
                          maxLength={6}
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
                        <button onClick={resetContactFlow}
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
            <X size={24} />
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
              <ChevronLeft size={24} />
            </button>
          )}
          {activeImg < listing.images.length - 1 && (
            <button onClick={(e) => { e.stopPropagation(); setActiveImg(i => i + 1); }}
              className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition">
              <ChevronRight size={24} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
