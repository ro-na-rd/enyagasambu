'use client';
import AppImage from '@/components/AppImage';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { formatRWF } from '@/lib/currencies';
import CategoryFieldsInput, { findMissingRequiredField, type CategoryField } from '@/components/CategoryFieldsInput';
import RwandaPropertyLocation, { isPropertyCategory } from '@/components/RwandaPropertyLocation';
import { Smartphone, Clock, CheckCircle, Sparkles } from '@/lib/icons';
import { normalizeRwandaPhone, isValidRwandaPhone } from '@/lib/phone';

interface CreateForm {
  title: string;
  description: string;
  category_id: string;
  listing_type: 'sell' | 'rent';
  price: string;
  currency: string;
  location: string;
}

interface Category { id: number; name: string; slug: string; type: string; fields: CategoryField[]; }

export default function CreateListingPage() {
  const { T } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [durationPrices, setDurationPrices] = useState<Record<number, number>>({ 3: 500, 7: 1000, 30: 3500, 60: 6500, 90: 9000, 180: 17000, 365: 32000 });
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [sellerPhone, setSellerPhone] = useState('');
  const [postingFree, setPostingFree] = useState(false);
  const [durationDays, setDurationDays] = useState(3);
  const [wizardStep, setWizardStep] = useState<'basic' | 'pricing' | 'seller' | 'review'>('basic');
  const [step, setStep] = useState<'form' | 'pay' | 'waiting' | 'otp' | 'success' | 'failed'>('form');
  const [referenceId, setReferenceId] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [otpResendCooldown, setOtpResendCooldown] = useState(0);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'failed'>('idle');
  const [submitError, setSubmitError] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [negotiable, setNegotiable] = useState(false);
  const [attributes, setAttributes] = useState<Record<string, string>>({});
  const [descSections, setDescSections] = useState<Record<string, string>>({});
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<CreateForm>({
    defaultValues: { listing_type: 'sell', currency: 'RWF' },
  });

  const selectedCategoryId = watch('category_id');
  const selectedCategory = categories.find((c) => String(c.id) === selectedCategoryId);
  const categoryFields = selectedCategory?.fields || [];
  const listingType = watch('listing_type');
  const formTitle = watch('title');
  const formPrice = watch('price');
  const formLocation = watch('location');
  const durationOptions = Object.keys(durationPrices).map(Number).sort((a, b) => a - b);
  const isSupplier = user?.role === 'supplier';
  const isExecutive = Boolean(user?.executive_role);
  const canPostForFree = postingFree || isSupplier || isExecutive;

  const durationLabel = (days: number) => {
    if (days === 365) return '1 year';
    if (days % 30 === 0 && days >= 60) return `${days / 30} months`;
    return `${days} days`;
  };

  const descFields = (() => {
    const type = selectedCategory?.type;
    if (type === 'rental_property') {
      return [
        { key: 'overview', label: 'Overview *', placeholder: 'A short summary of the property...', multiline: true },
      ];
    }
    if (type === 'rental_vehicle') {
      return [
        { key: 'overview', label: 'Overview *', placeholder: 'A short summary of the vehicle...', multiline: true },
      ];
    }
    if (type === 'service') {
      return [
        { key: 'overview', label: 'Overview *', placeholder: 'A short summary of the service...', multiline: true },
      ];
    }
    return [
      { key: 'overview', label: 'Overview *', placeholder: 'A short summary of the item...', multiline: true },
    ];
  })();

  const assembleDescription = () => {
    const parts: string[] = [];
    for (const f of descFields) {
      const val = (descSections[f.key] || '').trim();
      if (!val) continue;
      parts.push(`${f.label}:\n${val}`);
    }
    return parts.join('\n\n');
  };

  useEffect(() => {
    setAttributes({});
    setDescSections({});
  }, [selectedCategoryId]);

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
        setDurationDays(Object.keys(prices).map(Number).sort((a, b) => a - b)[0]);
      }
    }).catch(() => { });
  }, []);

  const didPrefillContact = useRef(false);

  useEffect(() => {
    if (!user) return;
    if (didPrefillContact.current) return;
    didPrefillContact.current = true;
    setSellerName((current) => current || user?.name || '');
    setSellerPhone((current) => current || normalizeRwandaPhone(user?.phone || ''));
  }, [user]);

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 6);
    setImages(files);
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
  };

  const onSubmitFree = async (data: CreateForm) => {
    if (!sellerName.trim() || !sellerPhone.trim()) {
      setError(isSupplier ? 'Provide the phone number buyers should use to contact your business.' : 'Please provide your name and phone number.');
      return;
    }
    if (!isValidRwandaPhone(sellerPhone)) { setError('Please enter a valid Rwanda phone number (e.g. 0788123456)'); return; }
    const missing = findMissingRequiredField(categoryFields, attributes);
    if (missing) { setError(`${missing.label} is required`); return; }
    if (isPropertyCategory(selectedCategory) && !data.location?.trim()) {
      setError('Select the Rwanda address for this property.');
      return;
    }
    setError('');
    data.description = assembleDescription();
    setSubmitError('');
    setIsPosting(true);
    const form = new FormData();
    Object.entries(data).forEach(([k, v]) => form.append(k, v));
    form.append('attributes', JSON.stringify(attributes));
    form.append('price_type', negotiable ? 'negotiable' : 'fixed');
    form.append('guest_name', sellerName.trim());
    form.append('guest_phone', normalizeRwandaPhone(sellerPhone));
    form.append('phone', normalizeRwandaPhone(sellerPhone));
    images.forEach((f) => form.append('images', f));
    try {
      await api.post('/listings', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSubmitStatus('success');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setSubmitError(msg || 'Failed to create listing.');
      setSubmitStatus('failed');
    } finally {
      setIsPosting(false);
    }
  };

  const onSubmitPaid = async (data: CreateForm) => {
    if (!sellerName.trim() || !sellerPhone.trim()) {
      setError('Please provide your name and phone number.');
      return;
    }
    if (!isValidRwandaPhone(sellerPhone)) { setError('Please enter a valid Rwanda phone number (e.g. 0788123456)'); return; }
    const missing = findMissingRequiredField(categoryFields, attributes);
    if (missing) { setError(`${missing.label} is required`); return; }
    setError('');
    data.description = assembleDescription();
    const form = new FormData();
    Object.entries(data).forEach(([k, v]) => form.append(k, v));
    form.append('attributes', JSON.stringify(attributes));
    form.append('price_type', negotiable ? 'negotiable' : 'fixed');
    form.append('guest_name', sellerName.trim());
    form.append('guest_phone', normalizeRwandaPhone(sellerPhone));
    form.append('phone', normalizeRwandaPhone(sellerPhone));
    form.append('duration_days', String(durationDays));
    form.append('provider', 'mtn');
    images.forEach((f) => form.append('images', f));
    setIsPosting(true);
    try {
      const { data: res } = await api.post('/listings/initiate', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setReferenceId(res.referenceId);
      setStep('pay');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to initiate payment.');
    } finally {
      setIsPosting(false);
    }
  };

  const confirmPayment = useCallback(async () => {
    try {
      const { data: res } = await api.post('/listings/confirm', { referenceId });
      if (res.status === 'payment_verified') {
        setStep('otp');
        await api.post('/listings/payment-otp/send', { referenceId });
        return res;
      } else if (res.listingId) {
        router.push(`/listings/${res.listingId}`);
      } else if (res.status === 'failed') {
        setError(res.message || 'The payment was not completed.');
        setStep('failed');
      }
      return res;
    } catch {
      return null;
    }
  }, [referenceId, router]);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handlePaid = () => {
    setStep('waiting');
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts += 1;
      const res = await confirmPayment();
      if (res?.listingId || res?.status === 'failed' || res?.status === 'payment_verified') {
        if (pollRef.current) clearInterval(pollRef.current);
      }
      if (attempts >= 30) {
        if (pollRef.current) clearInterval(pollRef.current);
        setError('We could not confirm the payment after 90 seconds. Check your phone and try again.');
        setStep('failed');
      }
    }, 3000);
  };

  const retryPayment = () => {
    setError('');
    handleSubmit(onSubmitPaid)();
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-8 text-center">
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-8 text-center">
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-8 text-center">
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-8 text-center">
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

  if (step === 'failed') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-8 text-center">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl space-y-5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-2xl">!</div>
          <h2 className="text-xl font-bold text-gray-900">Payment was not completed</h2>
          <p className="text-sm text-gray-600">{error || 'We could not confirm the Mobile Money payment. You have not been charged by this page. Check your phone, then try again.'}</p>
          <div className="rounded-lg bg-orange-50 px-4 py-3 text-left text-sm text-gray-700">
            <p className="font-semibold">Before trying again</p>
            <p className="mt-1 text-xs">Make sure your phone is available, approve the Mobile Money prompt, and enter your PIN only on your phone.</p>
          </div>
          <button onClick={retryPayment} className="w-full rounded-lg bg-[#E85D04] py-3 font-semibold text-white transition hover:bg-[#e05d00]">Try payment again</button>
          <button onClick={() => { setError(''); setStep('form'); }} className="w-full py-2 text-sm font-semibold text-gray-600 hover:text-gray-900">Edit listing details</button>
        </div>
      </div>
    );
  }

  if (submitStatus === 'loading') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-8 text-center">
        <div className="bg-white rounded-2xl shadow p-8 space-y-6 w-full max-w-md">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <span className="text-3xl"><Clock size={32} className="animate-spin" /></span>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Posting your listing…</h2>
          <p className="text-gray-500 text-sm">Please wait while we publish your listing.</p>
        </div>
      </div>
    );
  }

  if (submitStatus === 'failed') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-8 text-center">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl space-y-5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-2xl">!</div>
          <h2 className="text-xl font-bold text-gray-900">Posting failed</h2>
          <p className="text-sm text-gray-600">{submitError || 'We could not publish your listing. Please check your details and try again.'}</p>
          <button onClick={() => { setSubmitStatus('idle'); setSubmitError(''); }} className="w-full rounded-lg bg-[#E85D04] py-3 font-semibold text-white transition hover:bg-[#e05d00]">Try again</button>
          <button onClick={() => { setSubmitStatus('idle'); setSubmitError(''); }} className="w-full py-2 text-sm font-semibold text-gray-600 hover:text-gray-900">Edit listing details</button>
        </div>
      </div>
    );
  }

  if (submitStatus === 'success') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-8 text-center">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl space-y-5">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-3xl"><Sparkles size={32} /></span>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Listing posted successfully!</h2>
          <p className="text-gray-500 text-sm">Your listing is now live. Continue to view your posted products.</p>
          <button onClick={() => router.push(isSupplier ? '/supplier/listings' : '/my-listings')} className="w-full rounded-lg bg-[#E85D04] py-3 font-semibold text-white transition hover:bg-[#e05d00]">Continue</button>
        </div>
      </div>
    );
  }

  const wizardSteps = [
    { id: 'basic', label: 'What you are posting' },
    { id: 'pricing', label: 'Price & Location' },
    { id: 'seller', label: 'Your Contact & Photos' },
    { id: 'review', label: 'Review & Post' },
  ] as const;

  const wizardProgress = (wizardSteps.findIndex((s) => s.id === wizardStep) + 1) / wizardSteps.length;

  const goNext = () => {
    const idx = wizardSteps.findIndex((s) => s.id === wizardStep);
    if (idx < wizardSteps.length - 1) setWizardStep(wizardSteps[idx + 1].id);
  };

  const goPrev = () => {
    const idx = wizardSteps.findIndex((s) => s.id === wizardStep);
    if (idx > 0) setWizardStep(wizardSteps[idx - 1].id);
  };

  const canAdvance = () => {
    // Only category, type, and title are strictly required by the backend.
    // Description, price, and location can be left empty depending on category.
    if (!selectedCategoryId || !listingType || !formTitle?.trim()) return false;
    return true;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {wizardStep !== 'review' && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Step {wizardSteps.findIndex((s) => s.id === wizardStep) + 1} of {wizardSteps.length}
            </span>
            <span className="text-xs font-semibold text-[#E85D04]">
              {wizardSteps.find((s) => s.id === wizardStep)?.label}
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#E85D04] transition-all duration-300"
              style={{ width: `${wizardProgress * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}

      {/* ── Step 1: Basic Info ── */}
      {wizardStep === 'basic' && (
        <form onSubmit={handleSubmit(canPostForFree ? onSubmitFree : onSubmitPaid)} className="bg-white rounded-2xl shadow p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{T.category} *</label>
            <select
              {...register('category_id', { required: 'Select a category' })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
            >
              <option value="">Select a category first…</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.category_id && <p className="text-red-500 text-xs mt-1">{errors.category_id.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{T.titleField} *</label>
            <input
              {...register('title', { required: 'Title is required' })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
              placeholder="e.g. iPhone 13 Pro Max – Like New"
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">{T.descriptionField}</label>
            <textarea
              value={descSections.overview || ''}
              onChange={(e) => setDescSections((p) => ({ ...p, overview: e.target.value }))}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
              placeholder={descFields[0]?.placeholder || 'A short summary of the item...'}
            />
          </div>

          {categoryFields.length > 0 && (
            <CategoryFieldsInput
              fields={categoryFields}
              values={attributes}
              onChange={setAttributes}
              heading={`${selectedCategory?.name} details`}
            />
          )}

          <div className="flex justify-between mt-6">
            <button type="button" disabled={!canAdvance()} onClick={goNext} className="px-4 py-2.5 bg-[#E85D04] text-white rounded-lg font-semibold disabled:opacity-50">
              Continue →
            </button>
          </div>
        </form>
      )}

      {/* ── Step 2: Pricing & Location ── */}
      {wizardStep === 'pricing' && (
        <form onSubmit={handleSubmit(canPostForFree ? onSubmitFree : onSubmitPaid)} className="bg-white rounded-2xl shadow p-6 space-y-5">
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

          {isPropertyCategory(selectedCategory) ? (
            <RwandaPropertyLocation
              value={watch('location') || ''}
              onChange={(location) => setValue('location', location, { shouldDirty: true })}
              required
            />
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{T.locationField}</label>
              <input
                {...register('location')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                placeholder="e.g. Kicukiro, Kigali"
              />
            </div>
          )}

          {!canPostForFree && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Listing Duration *</label>
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
            </div>
          )}

          <div className="flex justify-between mt-6">
            <button type="button" onClick={goPrev} className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-50">
              ← Back
            </button>
            <button type="button" disabled={!canAdvance()} onClick={goNext} className="px-4 py-2.5 bg-[#E85D04] text-white rounded-lg font-semibold disabled:opacity-50">
              Continue →
            </button>
          </div>
        </form>
      )}

      {/* ── Step 3: Seller & Photos ── */}
      {wizardStep === 'seller' && (
        <form onSubmit={handleSubmit(canPostForFree ? onSubmitFree : onSubmitPaid)} className="bg-white rounded-2xl shadow p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{isSupplier ? 'Business Name *' : 'Your Name *'}</label>
              <input
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                placeholder={isSupplier ? 'Your business name' : 'e.g. Jean Paul'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{isSupplier ? 'Business Contact Phone *' : 'Phone Number *'}</label>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={sellerPhone}
                onChange={(e) => setSellerPhone(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                placeholder="e.g. 0788123456"
              />
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
                    <AppImage src={url} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between mt-6">
            <button type="button" onClick={goPrev} className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-50">
              ← Back
            </button>
            <button type="button" disabled={!canAdvance()} onClick={goNext} className="px-4 py-2.5 bg-[#E85D04] text-white rounded-lg font-semibold disabled:opacity-50">
              Review & Post →
            </button>
          </div>
        </form>
      )}

      {/* ── Step 4: Review ── */}
      {wizardStep === 'review' && (
        <div className="bg-white rounded-2xl shadow p-6 space-y-5">
          <h2 className="text-lg font-bold text-gray-900">Review your listing</h2>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 font-medium">Category</p>
              <p className="text-gray-900">{selectedCategory?.name || '—'}</p>
            </div>
            <div>
              <p className="text-gray-500 font-medium">Type</p>
              <p className="text-gray-900">{watch('listing_type') === 'sell' ? T.forSale : T.forRent}</p>
            </div>
            <div>
              <p className="text-gray-500 font-medium">Title</p>
              <p className="text-gray-900 truncate">{watch('title') || '—'}</p>
            </div>
            <div>
              <p className="text-gray-500 font-medium">Price</p>
              <p className="text-gray-900">{watch('price') ? formatRWF(Number(watch('price'))) + ' ' + watch('currency') : '—'}</p>
            </div>
            <div>
              <p className="text-gray-500 font-medium">Location</p>
              <p className="text-gray-900">{watch('location') || '—'}</p>
            </div>
            <div>
              <p className="text-gray-500 font-medium">Seller</p>
              <p className="text-gray-900">{sellerName || '—'}</p>
            </div>
            <div>
              <p className="text-gray-500 font-medium">Phone</p>
              <p className="text-gray-900">{sellerPhone || '—'}</p>
            </div>
            <div>
              <p className="text-gray-500 font-medium">Photos</p>
              <p className="text-gray-900">{previews.length} uploaded</p>
            </div>
          </div>

          {descSections.overview && (
            <div>
              <p className="text-gray-500 font-medium mb-1">Overview</p>
              <p className="text-gray-700 text-sm">{descSections.overview}</p>
            </div>
          )}

          <div className="flex justify-between mt-8">
            <button type="button" onClick={goPrev} className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-50">
              ← Back
            </button>
            <button
              type="button"
              onClick={() => {
                handleSubmit(canPostForFree ? onSubmitFree : onSubmitPaid)();
              }}
              disabled={isPosting}
              className="w-full bg-[#E85D04] text-white font-semibold py-3 rounded-lg hover:bg-[#e05d00] transition disabled:opacity-60"
            >
              {isSupplier ? 'Post Listing' : canPostForFree ? 'Post Listing (Free)' : `Pay & Post (${formatRWF(durationPrices[durationDays])})`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
