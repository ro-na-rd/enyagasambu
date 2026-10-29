'use client';
import AppImage from '@/components/AppImage';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { formatRWF } from '@/lib/currencies';
import CategoryFieldsInput, { findMissingRequiredField, type CategoryField } from '@/components/CategoryFieldsInput';
import {
  Gavel, Clock, CheckCircle, Smartphone, Sparkles, ArrowLeft, Image as ImageIcon,
} from '@/lib/icons';

interface CreateForm {
  title: string;
  description: string;
  category_id: string;
  starting_price: string;
  minimum_increment: string;
  reserve_price: string;
  currency: string;
  location: string;
}

interface Category { id: number; name: string; slug: string; type: string; fields: CategoryField[]; }

const ORG = '#E85D04';
const NAVY = '#0f1e42';

const CURRENCIES = ['RWF', 'USD', 'EUR', 'GBP', 'KES', 'TZS', 'UGX', 'ZAR', 'XAF', 'CHF', 'CAD', 'AUD'];

export default function CreateAuctionPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [durationPrices, setDurationPrices] = useState<Record<number, number>>({ 3: 500, 7: 1000, 30: 3500 });
  const [durationDays, setDurationDays] = useState(7);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [sellerPhone, setSellerPhone] = useState('');
  const [attributes, setAttributes] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'form' | 'pay' | 'waiting' | 'otp' | 'success'>('form');
  const [referenceId, setReferenceId] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [otpResendCooldown, setOtpResendCooldown] = useState(0);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<CreateForm>({
    defaultValues: { currency: 'RWF', minimum_increment: '500' },
  });

  const selectedCategoryId = watch('category_id');
  const selectedCategory = categories.find((c) => String(c.id) === selectedCategoryId);
  const categoryFields = selectedCategory?.fields || [];
  const durationOptions = Object.keys(durationPrices).map(Number).sort((a, b) => a - b);

  const durationLabel = (days: number) => {
    if (days === 365) return '1 year';
    if (days % 30 === 0 && days >= 60) return `${days / 30} months`;
    return `${days} day${days === 1 ? '' : 's'}`;
  };

  useEffect(() => {
    setAttributes({});
  }, [selectedCategoryId]);

  useEffect(() => {
    api.get('/categories').then(({ data }) => {
      const productCats = (data.categories || []).filter((c: Category) => c.type === 'product');
      setCategories(productCats);
    }).catch(() => {});
    api.get('/settings').then(({ data }) => {
      const prices: Record<number, number> = {};
      Object.entries(data.settings || {}).forEach(([key, value]) => {
        if (key.startsWith('listing_duration_')) {
          const days = parseInt(key.replace('listing_duration_', '').replace('_days', ''));
          prices[days] = parseInt(value as string);
        }
      });
      if (Object.keys(prices).length > 0) {
        setDurationPrices(prices);
        const options = Object.keys(prices).map(Number).sort((a, b) => a - b);
        setDurationDays(options.includes(7) ? 7 : options[0]);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    return () => { previews.forEach((p) => URL.revokeObjectURL(p)); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 6);
    setImages(files);
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p));
      return urls;
    });
  };

  const onSubmit = async (data: CreateForm) => {
    if (!sellerName.trim() || !sellerPhone.trim()) {
      setError('Please provide your name and phone number.');
      return;
    }
    const digits = sellerPhone.trim().replace(/\D/g, '');
    if (digits.length < 10) { setError('Please enter the full phone number (at least 10 digits)'); return; }
    const missing = findMissingRequiredField(categoryFields, attributes);
    if (missing) { setError(`${missing.label} is required`); return; }
    const start = Number(data.starting_price);
    if (!Number.isFinite(start) || start <= 0) { setError('Starting price must be greater than zero.'); return; }
    const inc = Number(data.minimum_increment);
    if (!Number.isFinite(inc) || inc <= 0) { setError('Minimum bid increment must be positive.'); return; }
    if (data.reserve_price.trim() !== '' && (Number.isNaN(Number(data.reserve_price)) || Number(data.reserve_price) < 0)) {
      setError('Reserve price must be zero or greater.'); return;
    }

    setError('');
    const form = new FormData();
    form.append('title', data.title.trim());
    form.append('description', data.description.trim());
    form.append('category_id', data.category_id);
    form.append('starting_price', data.starting_price);
    form.append('minimum_increment', data.minimum_increment);
    form.append('currency', data.currency);
    form.append('location', data.location.trim() || 'Kigali');
    form.append('attributes', JSON.stringify(attributes));
    form.append('guest_name', sellerName.trim());
    form.append('guest_phone', sellerPhone.trim());
    form.append('duration_days', String(durationDays));
    form.append('provider', 'mtn');
    if (data.reserve_price.trim() !== '') form.append('reserve_price', data.reserve_price);
    images.forEach((f) => form.append('images', f));

    try {
      const { data: res } = await api.post('/auctions/initiate', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setReferenceId(res.referenceId);
      setStep('pay');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to initiate payment.');
    }
  };

  const confirmPayment = useCallback(async () => {
    try {
      const { data: res } = await api.post('/auctions/confirm', { referenceId });
      if (res.status === 'payment_verified') {
        try {
          await api.post('/auctions/payment-otp/send', { referenceId });
          setStep('otp');
        } catch (err: unknown) {
          const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
          setError(msg || 'Payment was received, but we could not send the verification code. Please try again.');
          setStep('pay');
        }
        return res;
      } else if (res.status === 'failed') {
        setError(res.message || 'Payment failed. Please try again.');
        setStep('form');
      }
      return res;
    } catch {
      return null;
    }
  }, [referenceId]);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollInFlightRef = useRef(false);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const pollPayment = useCallback(async () => {
    // A slow payment-status request must not overlap the next interval tick.
    if (pollInFlightRef.current) return;
    pollInFlightRef.current = true;
    try {
      const res = await confirmPayment();
      if (res?.status === 'failed' || res?.status === 'payment_verified') {
        stopPolling();
      }
    } finally {
      pollInFlightRef.current = false;
    }
  }, [confirmPayment, stopPolling]);

  const handlePaid = () => {
    // Ignore repeated clicks while the same payment is already being checked.
    if (pollRef.current) return;
    setStep('waiting');
    pollRef.current = setInterval(() => { void pollPayment(); }, 3000);
    void pollPayment();
  };

  useEffect(() => {
    return () => { stopPolling(); };
  }, [stopPolling]);

  useEffect(() => {
    if (otpResendCooldown <= 0) return;
    const timer = setTimeout(() => setOtpResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpResendCooldown]);

  const handleVerifyOtp = async () => {
    setPublishing(true);
    setOtpError('');
    try {
      const { data: res } = await api.post('/auctions/payment-otp/verify', { referenceId, code: otpCode });
      if (res.auctionId) {
        setStep('success');
        setTimeout(() => router.push(`/auction/${res.auctionId}`), 2500);
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
      await api.post('/auctions/payment-otp/resend', { referenceId });
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
            <Smartphone size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Complete Payment</h2>
          <p className="text-gray-500 text-sm">
            Pay {formatRWF(durationPrices[durationDays])} via MTN MoMo to publish your auction for {durationDays} days.
          </p>
          <div className="bg-orange-50 rounded-lg px-4 py-3 text-sm text-gray-700">
            <p className="font-medium">Phone: {sellerPhone}</p>
            <p className="text-xs text-gray-500 mt-1">You will receive a payment request on your MoMo account.</p>
          </div>
          <button
            onClick={handlePaid}
            className="w-full bg-[#E85D04] text-white font-semibold py-3 rounded-lg hover:bg-[#e05d00] transition"
          >
            I Have Paid
          </button>
          <p className="text-xs text-gray-400">After paying, click the button above to confirm.</p>
        </div>
      </div>
    );
  }

  if (step === 'waiting') {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-2xl shadow p-8 space-y-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <Clock size={32} className="animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Confirming Payment...</h2>
          <p className="text-gray-500 text-sm">Please wait while we verify your MoMo payment.</p>
        </div>
      </div>
    );
  }

  if (step === 'otp') {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-2xl shadow p-8 space-y-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle size={32} />
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
            {publishing ? 'Publishing...' : 'Verify & Publish'}
          </button>

          <button
            onClick={handleResendOtp}
            disabled={otpResendCooldown > 0}
            className="text-sm text-[#E85D04] hover:underline disabled:opacity-50"
          >
            {otpResendCooldown > 0 ? `Resend in ${otpResendCooldown}s` : 'Resend Code'}
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
            <Sparkles size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Auction Published!</h2>
          <p className="text-green-600 font-medium flex items-center justify-center gap-1"><CheckCircle size={16} /> Payment verified</p>
          <p className="text-green-600 font-medium flex items-center justify-center gap-1"><Gavel size={16} /> Your auction is live and open for bidding.</p>
          <p className="text-gray-500 text-sm">Redirecting you to your auction...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link href="/auction" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-[#E85D04] transition mb-5">
        <ArrowLeft size={15} /> Back to auctions
      </Link>

      <div className="rounded-2xl p-5 mb-5" style={{ background: `linear-gradient(135deg, ${NAVY}, ${ORG})` }}>
        <div className="flex items-center gap-3 text-white">
          <Gavel size={28} />
          <div>
            <h1 className="text-xl font-bold">Submit an item for auction</h1>
            <p className="text-white/80 text-xs mt-0.5">No account needed! Choose a duration and pay via MoMo.</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl shadow p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product title *</label>
          <input
            {...register('title', { required: 'Title is required' })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
            placeholder="e.g. Vintage Rolex Datejust 1987"
          />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            {...register('description')}
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
            placeholder="Describe the item, its condition, history, and what makes it special..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select
              {...register('category_id', { required: 'Select a category' })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
            >
              <option value="">Select...</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.category_id && <p className="text-red-500 text-xs mt-1">{errors.category_id.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              {...register('location')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
              placeholder="e.g. Kicukiro, Kigali"
            />
          </div>
        </div>

        {categoryFields.length > 0 && (
          <CategoryFieldsInput
            fields={categoryFields}
            values={attributes}
            onChange={setAttributes}
            heading={`${selectedCategory?.name} details`}
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Starting price *</label>
            <input
              type="number"
              min="1"
              {...register('starting_price', { required: 'Starting price is required' })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
              placeholder="10000"
            />
            {errors.starting_price && <p className="text-red-500 text-xs mt-1">{errors.starting_price.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min. increment *</label>
            <input
              type="number"
              min="1"
              {...register('minimum_increment', { required: 'Increment is required' })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
              placeholder="500"
            />
            {errors.minimum_increment && <p className="text-red-500 text-xs mt-1">{errors.minimum_increment.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <select
              {...register('currency')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
            >
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reserve price <span className="text-gray-400 font-normal">(optional — minimum you will accept)</span>
          </label>
          <input
            type="number"
            min="0"
            {...register('reserve_price')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
            placeholder="e.g. 50000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Auction time limit *</label>
          <select
            value={durationDays}
            onChange={(e) => setDurationDays(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E85D04] focus:border-[#E85D04] bg-white"
          >
            {durationOptions.map((d) => (
              <option key={d} value={d}>
                {durationLabel(d)} - {formatRWF(durationPrices[d])}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-gray-400 mt-1">The auction starts immediately and runs for the selected duration.</p>
        </div>

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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Photos (up to 6)</label>
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
                  <AppImage src={url} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
          {previews.length === 0 && (
            <p className="text-[11px] text-gray-400 mt-1.5 inline-flex items-center gap-1">
              <ImageIcon size={12} /> Optional, but auctions with photos get more bids.
            </p>
          )}
        </div>

        <div className="bg-orange-50 rounded-lg px-4 py-3 text-xs text-gray-600 flex items-start gap-2">
          <Clock size={14} className="mt-0.5 shrink-0" style={{ color: ORG }} />
          <span>Auctions require a small fee to publish. Once live, bidders compete in real time and the highest bidder at closing wins.</span>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full inline-flex items-center justify-center gap-2 bg-[#E85D04] text-white font-semibold py-3 rounded-lg hover:bg-[#e05d00] transition disabled:opacity-60"
        >
          <Gavel size={16} />
          {isSubmitting ? 'Processing...' : `Pay & Publish (${formatRWF(durationPrices[durationDays])})`}
        </button>
      </form>
    </div>
  );
}
