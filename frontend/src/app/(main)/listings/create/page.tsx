'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import api from '@/lib/api';

interface CreateForm {
  title: string;
  description: string;
  category_id: string;
  listing_type: 'sell' | 'rent';
  price: string;
  location: string;
}

interface Category { id: number; name: string; slug: string; type: string; }

const DURATION_PRICES: Record<number, number> = { 3: 500, 7: 1000, 30: 3500 };

export default function CreateListingPage() {
  const { T } = useLanguage();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [sellerPhone, setSellerPhone] = useState('');
  const [postingFree, setPostingFree] = useState(false);
  const [durationDays, setDurationDays] = useState(3);
  const [step, setStep] = useState<'form' | 'pay' | 'waiting'>('form');
  const [referenceId, setReferenceId] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateForm>({
    defaultValues: { listing_type: 'sell' },
  });

  useEffect(() => {
    api.get('/listings/categories').then(({ data }) => setCategories(data.categories));
    api.get('/settings').then(({ data }) => {
      setPostingFree(data.settings?.posting_free === 'true');
    }).catch(() => {});
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
    setError('');
    const form = new FormData();
    Object.entries(data).forEach(([k, v]) => form.append(k, v));
    form.append('price_type', 'fixed');
    form.append('guest_name', sellerName.trim());
    form.append('guest_phone', sellerPhone.trim());
    images.forEach((f) => form.append('images', f));
    try {
      const { data: res } = await api.post('/listings', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      router.push(`/listings/${res.listingId}`);
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
    setError('');
    const form = new FormData();
    Object.entries(data).forEach(([k, v]) => form.append(k, v));
    form.append('price_type', 'fixed');
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
      if (res.listingId) {
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
      if (res?.listingId || res?.status === 'failed') {
        if (pollRef.current) clearInterval(pollRef.current);
      }
    }, 3000);
  };

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  if (step === 'pay') {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-2xl shadow p-8 space-y-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-3xl">📱</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Complete Payment</h2>
          <p className="text-gray-500 text-sm">
            Pay <span className="font-semibold text-gray-900">{DURATION_PRICES[durationDays].toLocaleString()} RWF</span> via MTN MoMo
            to activate your listing for <span className="font-semibold">{durationDays} days</span>.
          </p>
          <div className="bg-orange-50 rounded-lg px-4 py-3 text-sm text-gray-700">
            <p className="font-medium">Phone: {sellerPhone}</p>
            <p className="text-xs text-gray-500 mt-1">You will receive a payment request on your MoMo account.</p>
          </div>
          <button
            onClick={handlePaid}
            className="w-full bg-[#FF6B00] text-white font-semibold py-3 rounded-lg hover:bg-[#e05d00] transition"
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
            <span className="text-3xl">⏳</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Confirming Payment...</h2>
          <p className="text-gray-500 text-sm">Please wait while we verify your MoMo payment.</p>
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

        <div className="grid grid-cols-2 gap-4">
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{T.priceRWF}</label>
          <input
            type="number"
            {...register('price')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
            placeholder={T.leaveBlankIfNegotiable}
          />
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
                  className={`border rounded-lg px-3 py-3 text-sm font-medium transition ${
                    durationDays === d
                      ? 'border-[#FF6B00] bg-orange-50 text-[#FF6B00]'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div>{d} days</div>
                  <div className="text-xs mt-1 opacity-80">{DURATION_PRICES[d].toLocaleString()} RWF</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="grid grid-cols-2 gap-4">
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
            className="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-orange-50 file:text-[#FF6B00] file:font-medium hover:file:bg-orange-100"
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
          disabled={isSubmitting}
          className="w-full bg-[#FF6B00] text-white font-semibold py-3 rounded-lg hover:bg-[#e05d00] transition disabled:opacity-60"
        >
          {isSubmitting ? 'Processing...' : postingFree ? 'Post Listing (Free)' : `Pay & Post (${DURATION_PRICES[durationDays].toLocaleString()} RWF)`}
        </button>
      </form>
    </div>
  );
}
