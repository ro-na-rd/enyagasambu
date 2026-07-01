'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
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

export default function CreateListingPage() {
  const { user, loading, refreshUser } = useAuth();
  const { T } = useLanguage();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateForm>({
    defaultValues: { listing_type: 'sell' },
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'staff';

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    api.get('/listings/categories').then(({ data }) => setCategories(data.categories));
  }, []);

  const onSubmit = async (data: CreateForm) => {
    if (!isAdmin && (user?.coins ?? 0) < 400) {
      setError('You need at least 400 coins to post a listing. Top up your wallet first.');
      return;
    }
    setError('');
    const form = new FormData();
    Object.entries(data).forEach(([k, v]) => form.append(k, v));
    form.append('price_type', 'fixed');
    images.forEach((f) => form.append('images', f));
    try {
      const { data: res } = await api.post('/listings', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      await refreshUser();
      router.push(`/listings/${res.listingId}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to create listing.');
    }
  };

  if (loading) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{T.postAListingTitle}</h1>
      <p className="text-gray-500 text-sm mb-6">
        {isAdmin ? (
          <span className="text-[#1a2b6d] font-semibold">✅ Admin — posting is free. Listing stays active for 3 days.</span>
        ) : (
          <>
            Costs <strong>400 coins</strong>. Your listing stays active for <strong>3 days</strong>.
            {user && <span className="ml-2 text-[#FF6B00]">You have {user.coins} coins.</span>}
          </>
        )}
      </p>

      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl shadow p-6 space-y-5">
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{T.photos}</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setImages(Array.from(e.target.files || []).slice(0, 6))}
            className="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-orange-50 file:text-[#FF6B00] file:font-medium hover:file:bg-orange-100"
          />
          {images.length > 0 && <p className="text-xs text-gray-500 mt-1">{images.length} photo{images.length > 1 ? 's' : ''} selected</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#FF6B00] text-white font-semibold py-3 rounded-lg hover:bg-[#e05d00] transition disabled:opacity-60"
        >
          {isSubmitting ? T.posting : isAdmin ? T.postAListingTitle : T.postListingCoins}
        </button>
      </form>
    </div>
  );
}
