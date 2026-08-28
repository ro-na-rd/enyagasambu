'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/api';
import { Plus, Search, X, Home, Loader2, AlertCircle, CheckCircle } from '@/lib/icons';
import { useCurrency } from '@/context/CurrencyContext';

interface Listing {
  id: number;
  title: string;
  price: string | null;
  price_type: string;
  currency: string;
  location: string | null;
  listing_type: string;
  status: string;
  client_name: string | null;
  views: number;
  created_at: string;
  expires_at: string;
  category_name: string;
  category_type: string;
  primary_image: string | null;
}

interface Category { id: number; name: string; slug: string; type: string; }

interface Client { id: number; name: string; }

const statusColor: Record<string, string> = {
  active: 'bg-green-50 text-green-700',
  expired: 'bg-gray-100 text-gray-500',
  sold: 'bg-blue-50 text-blue-700',
  disabled: 'bg-red-50 text-red-600',
};

const statusLabel: Record<string, string> = {
  active: 'Active',
  expired: 'Expired',
  sold: 'Sold',
  disabled: 'Disabled',
};

const typeLabel: Record<string, string> = {
  sell: 'For Sale',
  rent: 'For Rent',
  auction: 'Auction',
};

const emptyForm = {
  title: '',
  description: '',
  category_id: '',
  listing_type: 'sell',
  price: '',
  negotiable: false,
  currency: 'RWF',
  location: '',
  client_name: '',
};

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

export default function BrokerListingsPage() {
  const { format } = useCurrency();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'sold'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/broker/listings');
      setListings(data.listings || []);
    } catch {
      setError('Could not load your listings. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchListings();
    api.get('/listings/categories').then(({ data }) => setCategories(data.categories || [])).catch(() => {});
    api.get('/broker/clients').then(({ data }) => setClients((data.clients || []).map((c: { id: number; name: string }) => ({ id: c.id, name: c.name })))).catch(() => {});
  }, [fetchListings]);

  const filtered = listings.filter((l) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      l.title.toLowerCase().includes(q) ||
      (l.client_name || '').toLowerCase().includes(q) ||
      l.category_name.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openModal = () => {
    setForm(emptyForm);
    setImages([]);
    setPreviews([]);
    setFormError('');
    setModalOpen(true);
  };

  const set = (k: keyof typeof emptyForm, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 6);
    setImages(files);
    setPreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const submit = async () => {
    if (!form.title.trim()) { setFormError('Title is required.'); return; }
    if (!form.category_id) { setFormError('Please select a category.'); return; }
    setSaving(true);
    setFormError('');
    const fd = new FormData();
    fd.append('title', form.title.trim());
    fd.append('description', form.description.trim());
    fd.append('category_id', form.category_id);
    fd.append('listing_type', form.listing_type);
    fd.append('price', form.price.trim());
    fd.append('price_type', form.negotiable ? 'negotiable' : 'fixed');
    fd.append('currency', form.currency);
    fd.append('location', form.location.trim());
    fd.append('client_name', form.client_name.trim());
    images.forEach((f) => fd.append('images', f));
    try {
      await api.post('/broker/listings', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setModalOpen(false);
      setNotice('Listing created successfully.');
      fetchListings();
    } catch (err: unknown) {
      setFormError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(''), 3000);
    return () => clearTimeout(t);
  }, [notice]);

  const field = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E85D04]/40 focus:border-[#E85D04]';

  return (
    <div className="p-4 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Properties/Listings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your property listings.</p>
        </div>
        <button
          onClick={openModal}
          className="bg-[#E85D04] text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-[#c04a00] transition inline-flex items-center gap-2"
        >
          <Plus size={16} /> New Listing
        </button>
      </div>

      {notice && (
        <div className="mb-4 flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
          <CheckCircle size={16} /> {notice}
        </div>
      )}

      {error && (
        <div className="mb-4 flex items-center justify-between text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <span>{error}</span>
          <button onClick={fetchListings} className="font-semibold underline">Retry</button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
          <div className="relative w-full max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search listings..."
              className="w-full pl-9 pr-3 border border-gray-300 rounded-lg py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E85D04]/40"
            />
          </div>
          <div className="flex items-center gap-2">
            {(['all', 'active', 'expired', 'sold'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition ${
                  statusFilter === s
                    ? 'bg-[#E85D04] text-white border-[#E85D04]'
                    : 'text-gray-500 border-gray-200 hover:border-gray-300'
                }`}
              >
                {s[0].toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-16 text-gray-400">
              <Loader2 size={20} className="animate-spin" /> Loading listings…
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Home size={36} className="mb-3" />
              <p className="text-sm">
                {listings.length === 0 ? 'No listings yet. Click "New Listing" to add your first one.' : 'No listings match your search.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 min-w-[180px]">
                        {l.primary_image ? (
                          <img src={l.primary_image} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-100 shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                            <Home size={16} />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900 leading-tight">{l.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{l.location || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      <p className="font-medium text-gray-700">{l.category_name}</p>
                      <p className="text-xs text-gray-400">{typeLabel[l.listing_type] || l.listing_type}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap">
                      {l.price ? format(Number(l.price)) : l.price_type === 'negotiable' ? 'Negotiable' : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusColor[l.status] || 'bg-gray-100 text-gray-500'}`}>
                        {statusLabel[l.status] || l.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{l.client_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{formatDate(l.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => { if (!saving) setModalOpen(false); }} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b border-gray-100 z-10">
              <h2 className="text-lg font-bold text-gray-900">New Listing</h2>
              <button onClick={() => { if (!saving) setModalOpen(false); }} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertCircle size={16} /> {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Title *</label>
                <input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. 3-Bedroom House in Kacyiru" className={field} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} placeholder="Describe the property..." className={field} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Category *</label>
                  <select value={form.category_id} onChange={(e) => set('category_id', e.target.value)} className={field}>
                    <option value="">Select…</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Type</label>
                  <select value={form.listing_type} onChange={(e) => set('listing_type', e.target.value)} className={field}>
                    <option value="sell">For Sale</option>
                    <option value="rent">For Rent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Price {!form.negotiable && <span className="text-red-500">*</span>}</label>
                  <input
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={(e) => set('price', e.target.value)}
                    placeholder={form.negotiable ? 'Leave blank if negotiable' : 'Enter price'}
                    className={field}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Currency</label>
                  <select value={form.currency} onChange={(e) => set('currency', e.target.value)} className={field}>
                    {['RWF', 'USD', 'EUR', 'GBP', 'KES', 'TZS', 'UGX', 'ZAR', 'XAF', 'CHF', 'CAD', 'AUD'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Price type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => set('negotiable', false)}
                    className={`border rounded-lg px-3 py-2 text-sm font-medium transition ${!form.negotiable ? 'border-[#E85D04] bg-orange-50 text-[#E85D04]' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                  >
                    Not Negotiable
                  </button>
                  <button
                    type="button"
                    onClick={() => set('negotiable', true)}
                    className={`border rounded-lg px-3 py-2 text-sm font-medium transition ${form.negotiable ? 'border-[#E85D04] bg-orange-50 text-[#E85D04]' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                  >
                    Negotiable
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Location</label>
                <input value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="e.g. Kacyiru, Kigali" className={field} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Client</label>
                <input
                  value={form.client_name}
                  onChange={(e) => set('client_name', e.target.value)}
                  list="broker-client-names"
                  placeholder="Select or type the client name"
                  className={field}
                />
                <datalist id="broker-client-names">
                  {clients.map((c) => <option key={c.id} value={c.name} />)}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Photos (up to 6)</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImages}
                  className="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-orange-50 file:text-[#E85D04] file:font-medium hover:file:bg-orange-100"
                />
                {previews.length > 0 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {previews.map((url, i) => (
                      <div key={i} className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 relative">
                        <img src={url} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => { if (!saving) setModalOpen(false); }}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={saving}
                className="bg-[#E85D04] text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-[#c04a00] transition inline-flex items-center gap-2 disabled:opacity-60"
              >
                {saving && <Loader2 size={15} className="animate-spin" />}
                Publish Listing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
