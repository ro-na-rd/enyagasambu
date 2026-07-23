'use client';
import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { FileText, Smartphone, Package } from '@/lib/icons';

interface Listing {
  id: number;
  title: string;
  description: string;
  price: number | null;
  price_type: string;
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
  const [step, setStep] = useState<'phone' | 'otp' | 'listings'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [token, setToken] = useState('');
  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [editListing, setEditListing] = useState<Listing | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', price: '', location: '', category_id: '' });
  const [editImages, setEditImages] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const authHeaders = useCallback(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  useEffect(() => {
    const stored = localStorage.getItem('phone_seller_token');
    if (stored) {
      setToken(stored);
      api.get('/listings/phone-access/listings', { headers: { Authorization: `Bearer ${stored}` } })
        .then(({ data }) => {
          setListings(data.listings);
          setStep('listings');
          return api.get('/listings/categories');
        })
        .then(({ data }) => setCategories(data.categories))
        .catch(() => { localStorage.removeItem('phone_seller_token'); setToken(''); });
    }
  }, []);

  const handleRequestOtp = async () => {
    if (!phone.trim()) { setError('Please enter your phone number'); return; }
    setError(''); setLoading(true);
    try {
      await api.post('/listings/phone-access/request', { phone: phone.trim() });
      setStep('otp');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (!code.trim()) { setError('Please enter the OTP code'); return; }
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
      setError(msg || 'Invalid code');
    } finally { setLoading(false); }
  };

  const openEdit = (l: Listing) => {
    setEditListing(l);
    setEditForm({
      title: l.title,
      description: l.description || '',
      price: l.price != null ? String(l.price) : '',
      location: l.location || '',
      category_id: String(l.category_id),
    });
    setEditImages([]);
  };

  const handleUpdate = async () => {
    if (!editListing) return;
    setSaving(true); setError('');
    try {
      const form = new FormData();
      form.append('title', editForm.title);
      form.append('description', editForm.description);
      form.append('price', editForm.price);
      form.append('price_type', editListing.price_type || 'fixed');
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
      setError(msg || 'Failed to update listing');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/listings/phone-access/${id}`, authHeaders());
      setListings(prev => prev.filter(l => l.id !== id));
      setConfirmDelete(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to delete');
    }
  };

  const handleRepost = async (id: number) => {
    try {
      const { data } = await api.post(`/listings/phone-access/${id}/repost`, {}, authHeaders());
      setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'active', expires_at: data.expires_at } : l));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to repost');
    }
  };

  if (step === 'phone') {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <div className="bg-white rounded-2xl shadow p-8 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#FFF3E8' }}>
            <FileText size={32} />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">My Listings</h1>
          <p className="text-gray-500 text-sm mb-6">Enter the phone number you used when posting</p>
          {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="e.g. 0788123456"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-orange-300"
            onKeyDown={e => e.key === 'Enter' && handleRequestOtp()}
          />
          <button
            onClick={handleRequestOtp}
            disabled={loading}
            className="w-full text-white font-semibold py-3 rounded-xl text-sm transition disabled:opacity-60"
            style={{ background: NAVY }}
          >
            {loading ? 'Sending...' : 'Send OTP'}
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
          <h1 className="text-xl font-bold text-gray-900 mb-2">Verify Your Phone</h1>
          <p className="text-gray-500 text-sm mb-1">Enter the 6-digit code sent to</p>
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
            {loading ? 'Verifying...' : 'Verify'}
          </button>
          <button
            onClick={() => { setStep('phone'); setCode(''); setError(''); }}
            className="w-full text-gray-500 text-sm py-2 mt-2 hover:underline"
          >
            Change phone number
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
          <p className="text-sm text-gray-500">{phone} &middot; {listings.length} listing{listings.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/listings/create" className="text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition" style={{ background: ORG }}>
            + New Listing
          </Link>
          <button
            onClick={() => { setStep('phone'); setToken(''); setListings([]); setPhone(''); setCode(''); localStorage.removeItem('phone_seller_token'); }}
            className="text-gray-600 text-sm font-medium px-4 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
          >
            Switch Account
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}

      {listings.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-5xl mb-4"><FileText size={48} /></p>
          <p className="font-medium">No listings found for this phone number</p>
          <Link href="/listings/create" className="mt-3 inline-block text-sm font-medium hover:underline" style={{ color: ORG }}>Post your first listing</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map(l => {
            const expired = new Date(l.expires_at) < new Date();
            const statusColor = expired ? 'bg-red-100 text-red-700'
              : l.status === 'active' ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-600';
            return (
              <div key={l.id} className="bg-white rounded-xl shadow-sm flex items-center gap-4 p-4">
                <Link href={`/listings/${l.id}`} className="h-16 w-16 rounded-lg bg-gray-100 overflow-hidden shrink-0 block">
                  {l.primary_image
                    ? <img src={l.primary_image} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><Package size={24} className="opacity-30" /></div>
                  }
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/listings/${l.id}`} className="font-semibold text-gray-900 truncate block hover:underline" style={{ color: NAVY }}>{l.title}</Link>
                  <p className="text-xs text-gray-500">{l.category_name} &middot; {l.location || 'Kigali'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor}`}>
                      {expired ? 'Expired' : l.status === 'active' ? 'Active' : l.status}
                    </span>
                    {l.price != null && (
                      <span className="text-xs font-bold" style={{ color: ORG }}>{Number(l.price).toLocaleString()} RWF</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(l)} className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition" title="Edit">
                    Edit
                  </button>
                  {(expired || l.status !== 'active') && (
                    <button onClick={() => handleRepost(l.id)} className="text-xs font-medium px-3 py-1.5 rounded-lg text-white transition" style={{ background: ORG }} title="Repost">
                      Repost
                    </button>
                  )}
                  {confirmDelete === l.id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleDelete(l.id)} className="text-xs font-medium px-2 py-1.5 rounded-lg bg-red-600 text-white">Yes</button>
                      <button onClick={() => setConfirmDelete(null)} className="text-xs font-medium px-2 py-1.5 rounded-lg border border-gray-200">No</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDelete(l.id)} className="text-xs font-medium px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition" title="Delete">
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editListing && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4" onClick={() => setEditListing(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6 relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setEditListing(null)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 text-sm">&times;</button>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Edit Listing</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                  rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select value={editForm.category_id} onChange={e => setEditForm(p => ({ ...p, category_id: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none">
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (RWF)</label>
                  <input type="number" value={editForm.price} onChange={e => setEditForm(p => ({ ...p, price: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none" placeholder="Leave blank if negotiable" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input value={editForm.location} onChange={e => setEditForm(p => ({ ...p, location: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Replace Photos (optional, up to 6)</label>
                <input type="file" accept="image/*" multiple onChange={e => setEditImages(Array.from(e.target.files || []).slice(0, 6))}
                  className="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-orange-50 file:text-[#E85D04] file:font-medium" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditListing(null)} className="flex-1 text-gray-600 font-medium py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm">
                Cancel
              </button>
              <button onClick={handleUpdate} disabled={saving || !editForm.title.trim()}
                className="flex-1 text-white font-semibold py-2.5 rounded-lg text-sm transition disabled:opacity-60"
                style={{ background: NAVY }}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
