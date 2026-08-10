'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { FileText, Smartphone, Package } from '@/lib/icons';
import { useLanguage } from '@/context/LanguageContext';

interface Listing {
  id: number;
  title: string;
  description: string;
  price: number | null;
  price_type: string;
  currency?: string;
  listing_type: string;
  location: string;
  status: string;
  is_featured: boolean;
  expires_at: string;
  created_at: string;
  category_name: string;
  category_id: number;
  primary_image: string | null;
}

interface Category { id: number; name: string; slug: string; }

const ORG = '#E85D04';
const NAVY = '#0f1e42';

export default function MyListingsPage() {
  const { T } = useLanguage();
  const [step, setStep] = useState<'phone' | 'otp' | 'listings'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [token, setToken] = useState('');
  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [editListing, setEditListing] = useState<Listing | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', price: '', currency: 'RWF', location: '', category_id: '', negotiable: false });
  const [editImages, setEditImages] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const [repostInfo, setRepostInfo] = useState<{ listingId: number; referenceId: string } | null>(null);
  const [repostStep, setRepostStep] = useState<'idle' | 'pay' | 'waiting'>('idle');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const authHeaders = useCallback(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  useEffect(() => {
    const stored = localStorage.getItem('phone_seller_token');
    if (stored) {
      api.get('/listings/phone-access/listings', { headers: { Authorization: `Bearer ${stored}` } })
        .then(({ data }) => {
          setToken(stored);
          setListings(data.listings);
          setStep('listings');
          return api.get('/listings/categories');
        })
        .then(({ data }) => setCategories(data.categories))
        .catch(() => { localStorage.removeItem('phone_seller_token'); setToken(''); });
    }
  }, []);

  const handleRequestOtp = async () => {
    if (!phone.trim()) { setError(T.mlErrPhone); return; }
    const digits = phone.trim().replace(/\D/g, '');
    if (digits.length < 10) { setError(T.mlErrPhoneDigits); return; }
    setError(''); setLoading(true);
    try {
      await api.post('/listings/phone-access/request', { phone: phone.trim() });
      setStep('otp');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || T.mlErrSendOtp);
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (!code.trim()) { setError(T.mlErrOtp); return; }
    setError(''); setLoading(true);
    try {
      const { data } = await api.post('/listings/phone-access/verify', { phone: phone.trim(), code: code.trim() });
      setToken(data.token);
      setListings(data.listings);
      localStorage.setItem('phone_seller_token', data.token);
      const catRes = await api.get('/listings/categories');
      setCategories(catRes.data.categories);
      setStep('listings');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || T.mlErrInvalidCode);
    } finally { setLoading(false); }
  };

  const openEdit = (l: Listing) => {
    setEditListing(l);
    setEditForm({
      title: l.title,
      description: l.description || '',
      price: l.price != null ? String(l.price) : '',
      currency: l.currency || 'RWF',
      location: l.location || '',
      category_id: String(l.category_id),
      negotiable: l.price_type === 'negotiable',
    });
    setEditImages([]);
  };

  const handleUpdate = async () => {
    if (!editListing) return;
    if (!editForm.negotiable && !editForm.price.trim()) {
      setError(T.mlErrPriceRequired);
      return;
    }
    setSaving(true); setError('');
    try {
      const form = new FormData();
      form.append('title', editForm.title);
      form.append('description', editForm.description);
      form.append('price', editForm.price);
      form.append('price_type', editForm.negotiable ? 'negotiable' : 'fixed');
      form.append('currency', editForm.currency);
      form.append('location', editForm.location);
      form.append('category_id', editForm.category_id);
      editImages.forEach(f => form.append('images', f));
      await api.put(`/listings/phone-access/${editListing.id}`, form, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      const { data } = await api.get('/listings/phone-access/listings', authHeaders());
      setListings(data.listings);
      setEditListing(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || T.mlErrUpdate);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/listings/phone-access/${id}`, authHeaders());
      setListings(prev => prev.filter(l => l.id !== id));
      setConfirmDelete(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || T.mlErrDelete);
    }
  };

  const REPOST_COST = 400;

  const handleRepost = async (id: number) => {
    setError('');
    try {
      const { data } = await api.post(`/listings/phone-access/${id}/repost`, {}, authHeaders());
      setRepostInfo({ listingId: id, referenceId: data.referenceId });
      setRepostStep('pay');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || T.mlErrRepost);
    }
  };

  const handleRepostPaid = () => {
    if (!repostInfo) return;
    const { listingId, referenceId } = repostInfo;
    setRepostStep('waiting');
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await api.get(`/listings/phone-access/repost-check/${referenceId}`, authHeaders());
        if (data.status === 'successful') {
          if (pollRef.current) clearInterval(pollRef.current);
          setListings(prev => prev.map(l => l.id === listingId ? { ...l, status: 'active', expires_at: data.expires_at } : l));
          setRepostStep('idle');
          setRepostInfo(null);
        } else if (data.status === 'failed') {
          if (pollRef.current) clearInterval(pollRef.current);
          setError(data.message || T.mlErrPayment);
          setRepostStep('idle');
          setRepostInfo(null);
        }
      } catch {
        if (pollRef.current) clearInterval(pollRef.current);
        setError(T.mlErrCheckPayment);
        setRepostStep('idle');
        setRepostInfo(null);
      }
    }, 3000);
  };

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  if (step === 'phone') {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <div className="bg-white rounded-2xl shadow p-8 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#FFF3E8' }}>
            <FileText size={32} />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">{T.mlTitle}</h1>
          <p className="text-gray-500 text-sm mb-6">{T.mlPhonePrompt}</p>
          {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder={T.mlPhonePlaceholder}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-orange-300"
            onKeyDown={e => e.key === 'Enter' && handleRequestOtp()}
          />
          <button
            onClick={handleRequestOtp}
            disabled={loading}
            className="w-full text-white font-semibold py-3 rounded-xl text-sm transition disabled:opacity-60"
            style={{ background: NAVY }}
          >
            {loading ? T.mlSending : T.mlSendOtp}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'otp') {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <div className="bg-white rounded-2xl shadow p-8 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#E8F5E9' }}>
            <Smartphone size={32} />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">{T.mlVerifyTitle}</h1>
          <p className="text-gray-500 text-sm mb-1">{T.mlOtpPrompt}</p>
          <p className="font-semibold text-gray-900 text-sm mb-6">{phone}</p>
          {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="000000"
            maxLength={6}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-center text-2xl tracking-[0.3em] font-mono mb-4 focus:outline-none focus:ring-2 focus:ring-orange-300"
            onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()}
          />
          <button
            onClick={handleVerifyOtp}
            disabled={loading}
            className="w-full text-white font-semibold py-3 rounded-xl text-sm transition disabled:opacity-60"
            style={{ background: NAVY }}
          >
            {loading ? T.mlVerifying : T.mlVerifyBtn}
          </button>
          <button
            onClick={() => { setStep('phone'); setCode(''); setError(''); }}
            className="w-full text-gray-500 text-sm py-2 mt-2 hover:underline"
          >
            {T.mlChangePhone}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{T.mlTitle}</h1>
          <p className="text-sm text-gray-500">{phone} &middot; {T.mlListingCount(listings.length)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/listings/create" className="text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition" style={{ background: ORG }}>
            {T.mlNewListing}
          </Link>
          <button
            onClick={() => { setStep('phone'); setToken(''); setListings([]); setPhone(''); setCode(''); localStorage.removeItem('phone_seller_token'); }}
            className="text-gray-600 text-sm font-medium px-4 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
          >
            {T.mlSwitchAccount}
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}

      {listings.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-5xl mb-4"><FileText size={48} /></p>
          <p className="font-medium">{T.mlNoListings}</p>
          <Link href="/listings/create" className="mt-3 inline-block text-sm font-medium hover:underline" style={{ color: ORG }}>{T.mlPostFirst}</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map(l => {
            const expired = new Date(l.expires_at) < new Date();
            const statusColor = expired ? 'bg-red-100 text-red-700'
              : l.status === 'active' ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-600';
            return (
              <div key={l.id} className="bg-white rounded-xl shadow-sm flex flex-wrap items-center gap-4 p-4">
                <Link href={`/listings/${l.id}`} className="h-16 w-16 rounded-lg bg-gray-100 overflow-hidden shrink-0 block">
                  {l.primary_image
                    ? <img src={l.primary_image} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><Package size={24} className="opacity-30" /></div>
                  }
                </Link>
                <div className="flex-1 basis-48 min-w-0">
                  <Link href={`/listings/${l.id}`} className="font-semibold text-gray-900 truncate block hover:underline" style={{ color: NAVY }}>{l.title}</Link>
                  <p className="text-xs text-gray-500">{l.category_name} &middot; {l.location || 'Kigali'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor}`}>
                      {expired ? T.expired : l.status === 'active' ? T.active : l.status}
                    </span>
                    {l.price != null && (
                      <span className="text-xs font-bold" style={{ color: ORG }}>{Number(l.price).toLocaleString()} {l.currency || 'RWF'}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(l)} className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition" title={T.mlEdit}>
                    {T.mlEdit}
                  </button>
                  {(expired || l.status !== 'active') && (
                    <button onClick={() => handleRepost(l.id)} className="text-xs font-medium px-3 py-1.5 rounded-lg text-white transition" style={{ background: ORG }} title={T.mlRepost}>
                      {T.mlRepost}
                    </button>
                  )}
                  {confirmDelete === l.id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleDelete(l.id)} className="text-xs font-medium px-2 py-1.5 rounded-lg bg-red-600 text-white">{T.mlYes}</button>
                      <button onClick={() => setConfirmDelete(null)} className="text-xs font-medium px-2 py-1.5 rounded-lg border border-gray-200">{T.mlNo}</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDelete(l.id)} className="text-xs font-medium px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition" title={T.mlDelete}>
                      {T.mlDelete}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {repostStep !== 'idle' && repostInfo && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-8 relative text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">{T.mlRepostTitle}</h2>
            {repostStep === 'pay' && (
              <>
                <p className="text-gray-500 text-sm mb-4">
                  {T.mlRepostPay(REPOST_COST)}
                </p>
                <div className="bg-orange-50 rounded-lg px-4 py-3 text-sm text-gray-700 mb-4">
                  <p className="font-medium">{phone}</p>
                  <p className="text-xs text-gray-500 mt-1">{T.mlPaymentRequestSent}</p>
                </div>
                <button onClick={handleRepostPaid} className="w-full bg-[#E85D04] text-white font-semibold py-3 rounded-lg hover:bg-[#e05d00] transition text-sm">
                  {T.iHavePaid}
                </button>
                <button onClick={() => { setRepostStep('idle'); setRepostInfo(null); if (pollRef.current) clearInterval(pollRef.current); }} className="w-full text-gray-500 text-sm py-2 mt-2 hover:underline">
                  {T.cancel}
                </button>
              </>
            )}
            {repostStep === 'waiting' && (
              <div className="py-6">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-[#E85D04] rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-600 text-sm">{T.mlWaiting}</p>
                <p className="text-gray-400 text-xs mt-2">{T.mlCheckPhone}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {editListing && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4" onClick={() => setEditListing(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6 relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setEditListing(null)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 text-sm">&times;</button>
            <h2 className="text-lg font-bold text-gray-900 mb-4">{T.mlEditTitle}</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{T.titleField} *</label>
                <input value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{T.descriptionField}</label>
                <textarea value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                  rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{T.categoryLabel} *</label>
                  <select value={editForm.category_id} onChange={e => setEditForm(p => ({ ...p, category_id: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none">
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{T.priceLabel} {!editForm.negotiable && <span className="text-red-500">*</span>}</label>
                  <input type="number" value={editForm.price} onChange={e => setEditForm(p => ({ ...p, price: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none" placeholder={editForm.negotiable ? T.leaveBlankIfNegotiable : T.mlEnterPrice} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{T.currencyLabel}</label>
                  <select value={editForm.currency} onChange={e => setEditForm(p => ({ ...p, currency: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none">
                    {['RWF', 'USD', 'EUR', 'GBP', 'KES', 'TZS', 'UGX', 'ZAR', 'XAF', 'CHF', 'CAD', 'AUD'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <div className="mt-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">{T.priceType}</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => setEditForm(p => ({ ...p, negotiable: false }))}
                        className={`border rounded-lg px-3 py-2 text-xs font-medium transition ${!editForm.negotiable ? 'border-[#E85D04] bg-orange-50 text-[#E85D04]' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                        {T.notNegotiable}
                      </button>
                      <button type="button" onClick={() => setEditForm(p => ({ ...p, negotiable: true }))}
                        className={`border rounded-lg px-3 py-2 text-xs font-medium transition ${editForm.negotiable ? 'border-[#E85D04] bg-orange-50 text-[#E85D04]' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                        {T.negotiable}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{T.locationLabel}</label>
                <input value={editForm.location} onChange={e => setEditForm(p => ({ ...p, location: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{T.mlReplacePhotos}</label>
                <input type="file" accept="image/*" multiple onChange={e => setEditImages(Array.from(e.target.files || []).slice(0, 6))}
                  className="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-orange-50 file:text-[#E85D04] file:font-medium" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditListing(null)} className="flex-1 text-gray-600 font-medium py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm">
                {T.cancel}
              </button>
              <button onClick={handleUpdate} disabled={saving || !editForm.title.trim()}
                className="flex-1 text-white font-semibold py-2.5 rounded-lg text-sm transition disabled:opacity-60"
                style={{ background: NAVY }}>
                {saving ? T.mlSavingChanges : T.mlSaveChanges}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
