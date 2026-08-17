'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useCurrency } from '@/context/CurrencyContext';
import api from '@/lib/api';
import { Smartphone, Clock, CheckCircle, Sparkles } from '@/lib/icons';

interface CreateForm {
  title: string;
  description: string;
  category_id: string;
  listing_type: 'sell' | 'rent';
  price: string;
  currency: string;
  location: string;
}

interface Category { id: number; name: string; slug: string; type: string; }

export default function CreateListingPage() {
  const { T } = useLanguage();
  const { format } = useCurrency();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [durationPrices, setDurationPrices] = useState<Record<number, number>>({ 3: 500, 7: 1000, 30: 3500 });
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [sellerPhone, setSellerPhone] = useState('');
  const [postingFree, setPostingFree] = useState(false);
  const [durationDays, setDurationDays] = useState(3);
  const [step, setStep] = useState<'form' | 'pay' | 'waiting' | 'otp' | 'success'>('form');
  const [referenceId, setReferenceId] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [otpResendCooldown, setOtpResendCooldown] = useState(0);
  const [postSuccess, setPostSuccess] = useState(false);
  const [negotiable, setNegotiable] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateForm>({
    defaultValues: { listing_type: 'sell', currency: 'RWF' },
  });

  useEffect(() => {
    api.get('/listings/categories').then(({ data }) => setCategories(data.categories));
    api.get('/settings').then(({ data }) => {
      setPostingFree(data.settings?.posting_free === 'true');
      const prices: Record<number, number> = {};
      Object.entries(data.settings).forEach(([key, value]) => {
        if (key.startsWith('listing_duration_')) {
          const days = parseInt(key.replace('listing_duration_', '').replace('_days', ''));
          prices[days] = parseInt(value as string);
        }
      });
      if (Object.keys(prices).length > 0) {
        setDurationPrices(prices);
      }
    }).catch(() => { });
  }, []);

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 6);
    setImages(files);
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
  };

  const onSubmitFree = async (data: CreateForm) => {
    if (!sellerName.trim() || !sellerPhone.trim()) {
      setError('Please provide your name and phone number.');
      return;
    }
    const digits = sellerPhone.trim().replace(/\D/g, '');
    if (digits.length < 10) { setError('Please enter the full phone number (at least 10 digits)'); return; }
    setError('');
    const form = new FormData();
    Object.entries(data).forEach(([k, v]) => form.append(k, v));
    form.append('price_type', negotiable ? 'negotiable' : 'fixed');
    form.append('guest_name', sellerName.trim());
    form.append('guest_phone', sellerPhone.trim());
    images.forEach((f) => form.append('images', f));
    try {
      const { data: res } = await api.post('/listings', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPostSuccess(true);
      setTimeout(() => {
        window.location.href = `/listings/${res.listingId}`;
      }, 2000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to create listing.');
    }
  };

  const onSubmitPaid = async (data: CreateForm) => {
    if (!sellerName.trim() || !sellerPhone.trim()) {
      setError('Please provide your name and phone number.');
      return;
    }
    const digits = sellerPhone.trim().replace(/\D/g, '');
    if (digits.length < 10) { setError('Please enter the full phone number (at least 10 digits)'); return; }
    setError('');
    const form = new FormData();
    Object.entries(data).forEach(([k, v]) => form.append(k, v));
    form.append('price_type', negotiable ? 'negotiable' : 'fixed');
    form.append('guest_name', sellerName.trim());
    form.append('guest_phone', sellerPhone.trim());
    form.append('duration_days', String(durationDays));
    form.append('provider', 'mtn');
    images.forEach((f) => form.append('images', f));
    try {
      const { data: res } = await api.post('/listings/initiate', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setReferenceId(res.referenceId);
      setStep('pay');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to initiate payment.');
    }
  };

  const confirmPayment = useCallback(async () => {
    try {
      const { data: res } = await api.post('/listings/confirm', { referenceId });
      if (res.status === 'payment_verified') {
        setStep('otp');
        await api.post('/listings/payment-otp/send', { referenceId });
        setOtpSent(true);
        return res;
      } else if (res.listingId) {
        router.push(`/listings/${res.listingId}`);
      } else if (res.status === 'failed') {
        setError(res.message || 'Payment failed. Please try again.');
        setStep('form');
      }
      return res;
    } catch {
      return null;
    }
  }, [referenceId, router]);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handlePaid = () => {
    setStep('waiting');
    pollRef.current = setInterval(async () => {
      const res = await confirmPayment();
      if (res?.listingId || res?.status === 'failed' || res?.status === 'payment_verified') {
        if (pollRef.current) clearInterval(pollRef.current);
      }
    }, 3000);
  };

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  useEffect(() => {
    if (otpResendCooldown <= 0) return;
    const timer = setTimeout(() => setOtpResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpResendCooldown]);

  const handleVerifyOtp = async () => {
    setPublishing(true);
    setOtpError('');
    try {
      const { data: res } = await api.post('/listings/payment-otp/verify', {
        referenceId,
        code: otpCode,
      });
      if (res.listingId) {
        setStep('success');
        setTimeout(() => router.push(`/listings/${res.listingId}`), 2500);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setOtpError(msg || 'Invalid verification code.');
    } finally {
      setPublishing(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      await api.post('/listings/payment-otp/resend', { referenceId });
      setOtpResendCooldown(60);
      setOtpError('');
    } catch {
      setOtpError('Failed to resend code. Try again.');
    }
  };

  if (step === 'pay') {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-2xl shadow p-8 space-y-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-3xl"><Smartphone size={32} /></span>
          </div>
          <h2 className="text-xl font-bold text-gray-900">{T.completePayment}</h2>
          <p className="text-gray-500 text-sm">
            {T.payViaMomo(durationPrices[durationDays], durationDays)}
          </p>
          <div className="bg-orange-50 rounded-lg px-4 py-3 text-sm text-gray-700">
            <p className="font-medium">{T.phoneLabel}: {sellerPhone}</p>
            <p className="text-xs text-gray-500 mt-1">{T.paymentRequestSent}</p>
          </div>
          <button
            onClick={handlePaid}
            className="w-full bg-[#E85D04] text-white font-semibold py-3 rounded-lg hover:bg-[#e05d00] transition"
          >
            {T.iHavePaid}
          </button>
          <p className="text-xs text-gray-400">{T.afterPayingConfirm}</p>
        </div>
      </div>
    );
  }

  if (step === 'waiting') {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-2xl shadow p-8 space-y-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <span className="text-3xl"><Clock size={32} className="animate-spin" /></span>
          </div>
          <h2 className="text-xl font-bold text-gray-900">{T.confirmingPayment}</h2>
          <p className="text-gray-500 text-sm">{T.confirmingPaymentDesc}</p>
        </div>
      </div>
    );
  }

  if (step === 'otp') {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-2xl shadow p-8 space-y-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-3xl"><CheckCircle size={32} /></span>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Verify Your Phone</h2>
          <p className="text-gray-500 text-sm">
            Enter the 6-digit code sent to <strong>{sellerPhone}</strong> as SMS
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
            disabled={otpCode.length !== 6 || publishing}
            className="w-full bg-[#E85D04] text-white font-semibold py-3 rounded-lg hover:bg-[#e05d00] transition disabled:opacity-60"
          >
            {publishing ? T.publishing : T.verifyAndPublish}
          </button>

          <button
            onClick={handleResendOtp}
            disabled={otpResendCooldown > 0}
            className="text-sm text-[#E85D04] hover:underline disabled:opacity-50"
          >
            {otpResendCooldown > 0 ? T.resendIn(otpResendCooldown) : T.resendCode}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-2xl shadow p-8 space-y-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-3xl"><Sparkles size={32} /></span>
          </div>
          <h2 className="text-xl font-bold text-gray-900">{T.paymentVerified}</h2>
          <p className="text-green-600 font-medium flex items-center justify-center gap-1"><CheckCircle size={16} /> {T.otpVerified}</p>
          <p className="text-green-600 font-medium flex items-center justify-center gap-1"><Sparkles size={16} /> {T.postPublishedSuccess}</p>
          <p className="text-gray-500 text-sm">{T.redirectingToListing}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{T.postAListingTitle}</h1>
      <p className="text-gray-500 text-sm mb-6">
        {postingFree ? (
          <span className="text-green-700 font-semibold">Posting is currently FREE! No account needed.</span>
        ) : (
          <span className="text-green-700 font-semibold">No account needed! Choose a duration and pay via MoMo.</span>
        )}
      </p>

      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}

      {postSuccess && (
        <div className="bg-green-50 text-green-700 text-sm rounded-lg px-4 py-3 mb-4 flex items-center gap-2">
          <CheckCircle size={16} />
          <span>Listing posted successfully! Redirecting...</span>
        </div>
      )}

      <form onSubmit={handleSubmit(postingFree ? onSubmitFree : onSubmitPaid)} className="bg-white rounded-2xl shadow p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{T.titleField} *</label>
          <input
            {...register('title', { required: 'Title is required' })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
            placeholder="e.g. iPhone 13 Pro Max – Like New"
          />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{T.descriptionField}</label>
          <textarea
            {...register('description')}
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
            placeholder="Describe the item or service..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{T.category} *</label>
            <select
              {...register('category_id', { required: 'Select a category' })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
            >
              <option value="">Select…</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.category_id && <p className="text-red-500 text-xs mt-1">{errors.category_id.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{T.type} *</label>
            <select
              {...register('listing_type')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
            >
              <option value="sell">{T.forSale}</option>
              <option value="rent">{T.forRent}</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{T.priceLabel} {!negotiable && <span className="text-red-500">*</span>}</label>
            <input
              type="number"
              {...register('price', { validate: v => (!negotiable && !v ? 'Price is required when not negotiable' : undefined) })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
              placeholder={negotiable ? T.leaveBlankIfNegotiable : 'Enter price'}
            />
            {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{T.currencyLabel}</label>
            <select
              {...register('currency')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
            >
              {['RWF', 'USD', 'EUR', 'GBP', 'KES', 'TZS', 'UGX', 'ZAR', 'XAF', 'CHF', 'CAD', 'AUD'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">{T.priceType}</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setNegotiable(false)}
              className={`border rounded-lg px-3 py-2.5 text-sm font-medium transition ${!negotiable ? 'border-[#E85D04] bg-orange-50 text-[#E85D04]' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
            >
              {T.notNegotiable}
            </button>
            <button
              type="button"
              onClick={() => setNegotiable(true)}
              className={`border rounded-lg px-3 py-2.5 text-sm font-medium transition ${negotiable ? 'border-[#E85D04] bg-orange-50 text-[#E85D04]' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
            >
              {T.negotiable}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{T.locationField}</label>
          <input
            {...register('location')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
            placeholder="e.g. Kicukiro, Kigali"
          />
        </div>

        {!postingFree && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Listing Duration *</label>
            <div className="grid grid-cols-3 gap-3">
              {([3, 7, 30] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDurationDays(d)}
                  className={`border rounded-lg px-3 py-3 text-sm font-medium transition ${durationDays === d
                    ? 'border-[#E85D04] bg-orange-50 text-[#E85D04]'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                >
                  <div>{d} days</div>
                  <div className="text-xs mt-1 opacity-80">{format(durationPrices[d])}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>
              <input
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                placeholder="e.g. Jean Paul"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
              <input
                value={sellerPhone}
                onChange={(e) => setSellerPhone(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                placeholder="e.g. 0788123456"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{T.photos} (up to 6)</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImages}
            className="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-orange-50 file:text-[#E85D04] file:font-medium hover:file:bg-orange-100"
          />
          {previews.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {previews.map((url, i) => (
                <div key={i} className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                  <img src={url} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || postSuccess}
          className="w-full bg-[#E85D04] text-white font-semibold py-3 rounded-lg hover:bg-[#e05d00] transition disabled:opacity-60"
        >
          {postSuccess ? 'Posted!' : isSubmitting ? 'Processing...' : postingFree ? 'Post Listing (Free)' : `Pay & Post (${format(durationPrices[durationDays])})`}
        </button>
      </form>
    </div>
  );
}
