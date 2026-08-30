'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Package, Search, Filter, Plus, X, Loader2, CheckCircle, AlertCircle, Upload, Camera } from '@/lib/icons';

const ORG = '#E85D04';
const NAVY = '#0f1e42';

interface Listing { id: number; title: string; status: string; listing_type: string; is_featured: boolean; seller_name: string; category_name: string; created_at: string; }

interface Category { id: number; name: string; slug: string; type: string; }

const statusColors: Record<string, string> = {
  active: 'bg-green-500/10 text-green-400',
  disabled: 'bg-red-500/10 text-red-400',
  sold: 'bg-blue-500/10 text-blue-400',
  expired: 'bg-gray-500/10 text-gray-500',
  deleted: 'bg-red-500/10 text-red-400',
};

const CURRENCIES = ['RWF', 'USD', 'EUR', 'GBP', 'KES', 'TZS', 'UGX', 'ZAR', 'XAF', 'CHF', 'CAD', 'AUD'];

export default function AdminListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [total, setTotal] = useState(0);
  const [fetching, setFetching] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    category_id: '',
    listing_type: 'sell',
    price: '',
    currency: 'RWF',
    location: '',
  });
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const load = (q = '', status = '') => {
    const params = new URLSearchParams();
    if (q) params.set('search', q);
    if (status) params.set('status', status);
    api.get(`/admin/listings?${params.toString()}`)
      .then(({ data }) => { setListings(data.listings); setTotal(data.total); })
      .finally(() => setFetching(false));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    api.get('/listings/categories').then(({ data }) => setCategories(data.categories)).catch(() => { });
  }, []);

  const openCreate = () => {
    setForm({ title: '', description: '', category_id: '', listing_type: 'sell', price: '', currency: 'RWF', location: '' });
    setImages([]);
    setPreviews([]);
    setCreateError('');
    setCreateSuccess('');
    setShowCreate(true);
  };

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 6);
    setImages(files);
    setPreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const removeImage = (idx: number) => {
    const next = images.filter((_, i) => i !== idx);
    const nextPrev = previews.filter((_, i) => i !== idx);
    setImages(next);
    setPreviews(nextPrev);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.category_id) {
      setCreateError('Title and category are required.');
      return;
    }
    setCreateLoading(true);
    setCreateError('');
    setCreateSuccess('');
    try {
      if (images.length > 0) {
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => fd.append(k, v));
        images.forEach((f) => fd.append('images', f));
        await api.post('/admin/listings/with-files', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('/admin/listings', form);
      }
      setCreateSuccess('Listing posted successfully. Free for Admin, featured, 90-day duration.');
      setShowCreate(false);
      setFetching(true);
      load(search, statusFilter);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setCreateError(msg || 'Failed to create listing.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remove this listing permanently?')) return;
    await api.delete(`/admin/listings/${id}`);
    load(search, statusFilter);
  };

  const handleToggleStatus = async (id: number, newStatus: string) => {
    await api.patch(`/admin/listings/${id}/status`, { status: newStatus });
    load(search, statusFilter);
  };

  const inputCls = "w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E85D04] bg-white";

  return (
    <div className="p-4 lg:p-8 animate-fadeInUp">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${ORG}15` }}>
            <Package size={18} style={{ color: ORG }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Listings <span className="text-gray-600 text-base font-normal">({total})</span></h1>
            <p className="text-sm text-gray-600 mt-0.5">Manage all platform listings &mdash; activate, disable, mark as sold, or remove</p>
          </div>
        </div>
      </div>

      {createSuccess && (
        <div className="mb-4 flex items-center gap-2 rounded-lg px-4 py-3 text-sm" style={{ background: '#ecfdf5', color: '#047857' }}>
          <CheckCircle size={16} /> {createSuccess}
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setFetching(true); load(search, statusFilter); } }}
            placeholder="Search listings…"
            className="border rounded-lg pl-9 pr-3 py-2 text-sm w-full"
            style={{ background: '#f6f8fa', borderColor: '#d0d7de', color: '#1a1a1a' }} />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setFetching(true); load(search, e.target.value); }}
          className="border rounded-lg px-3 py-2 text-sm"
          style={{ background: '#f6f8fa', borderColor: '#d0d7de', color: '#1a1a1a' }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
          <option value="sold">Sold</option>
          <option value="expired">Expired</option>
        </select>
        <button onClick={() => { setFetching(true); load(search, statusFilter); }}
          className="text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          style={{ background: ORG }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#c44d00'}
          onMouseLeave={(e) => e.currentTarget.style.background = ORG}>
          <Filter size={14} className="inline mr-1" /> Filter
        </button>
        <button onClick={openCreate}
          className="text-white text-sm font-bold px-4 py-2 rounded-lg transition flex items-center gap-1.5 shadow-md"
          style={{ background: NAVY }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#1a2d5a'}
          onMouseLeave={(e) => e.currentTarget.style.background = NAVY}>
          <Plus size={16} /> Post Listing
        </button>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200" style={{ background: '#f0f2f5' }}>
                <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase font-semibold tracking-wider">Listing</th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase font-semibold tracking-wider">Seller</th>
                <th className="text-center px-4 py-3 text-gray-500 text-xs uppercase font-semibold tracking-wider">Status</th>
                <th className="text-center px-4 py-3 text-gray-500 text-xs uppercase font-semibold tracking-wider">Date</th>
                <th className="text-center px-4 py-3 text-gray-500 text-xs uppercase font-semibold tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {fetching ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-600">Loading…</td></tr>
              ) : listings.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-600">No listings found</td></tr>
              ) : listings.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `${ORG}10`, color: ORG }}>
                        <Package size={14} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 truncate max-w-[200px]">{l.title}</p>
                        <p className="text-xs text-gray-600">{l.category_name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-gray-500">{l.seller_name}</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[l.status] || 'bg-gray-500/10 text-gray-600'}`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center text-xs text-gray-600">{new Date(l.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2 justify-center flex-wrap">
                      {l.status === 'active' ? (
                        <>
                          <button onClick={() => handleToggleStatus(l.id, 'sold')}
                            className="text-xs font-semibold hover:underline text-blue-400 hover:text-blue-300">Mark Sold</button>
                          <button onClick={() => handleToggleStatus(l.id, 'disabled')}
                            className="text-xs font-semibold hover:underline text-red-400 hover:text-red-300">Disable</button>
                        </>
                      ) : l.status === 'disabled' ? (
                        <button onClick={() => handleToggleStatus(l.id, 'active')}
                          className="text-xs font-semibold hover:underline text-green-400 hover:text-green-300">Enable</button>
                      ) : l.status === 'sold' ? (
                        <button onClick={() => handleToggleStatus(l.id, 'active')}
                          className="text-xs font-semibold hover:underline text-green-400 hover:text-green-300">Reactivate</button>
                      ) : null}
                      <button onClick={() => handleDelete(l.id)}
                        className="text-xs font-semibold hover:underline text-red-500 hover:text-red-400 ml-1">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Post Listing Modal ── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !createLoading && setShowCreate(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-fadeInUp">
            <div className="relative px-6 py-5 flex items-center justify-between"
              style={{ background: `linear-gradient(135deg, ${NAVY}, #1a2d5a)` }}>
              <div>
                <h2 className="text-lg font-bold text-white">Post Listing</h2>
                <p className="text-white/60 text-xs mt-0.5">Free for Admin &middot; Featured &middot; 90-day duration</p>
              </div>
              <button onClick={() => !createLoading && setShowCreate(false)}
                className="p-1.5 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4 overflow-y-auto">
              {createError && (
                <div className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm" style={{ background: '#fef2f2', color: '#b91c1c' }}>
                  <AlertCircle size={16} /> {createError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className={inputCls} placeholder="e.g. Executive House in Kicukiro" maxLength={200} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                    className={inputCls}>
                    <option value="">Select…</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={form.listing_type} onChange={(e) => setForm({ ...form, listing_type: e.target.value as 'sell' | 'rent' })}
                    className={inputCls}>
                    <option value="sell">For Sale</option>
                    <option value="rent">For Rent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                  <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className={inputCls} placeholder="e.g. 45,000,000" min={0} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className={inputCls}>
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className={inputCls} placeholder="e.g. Kicukiro, Kigali" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4} className={inputCls} placeholder="Describe the listing…" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Photos (up to 6)</label>
                <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl px-4 py-6 cursor-pointer transition ${images.length > 0 ? 'border-green-400 bg-green-50/40' : 'border-gray-300 hover:border-[#E85D04] hover:bg-orange-50/30'}`}>
                  <Upload size={22} className={images.length > 0 ? 'text-green-600' : 'text-gray-400'} />
                  <p className="text-xs text-gray-500">
                    {images.length > 0 ? `${images.length} image(s) selected — click to change` : 'Click to upload pictures'}
                  </p>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleImages} />
                </label>
                {previews.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {previews.map((p, i) => (
                      <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden group">
                        <img src={p} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removeImage(i)}
                          className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 rounded-lg px-4 py-3 text-xs" style={{ background: '#fff3ec', color: ORG }}>
                <Camera size={14} /> Admin posts are always free, featured and stay live for 90 days.
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="px-5 py-2.5 rounded-lg text-sm font-semibold border transition"
                  style={{ borderColor: '#d0d7de', color: '#555' }}>
                  Cancel
                </button>
                <button type="submit" disabled={createLoading}
                  className="px-6 py-2.5 rounded-lg text-sm font-bold text-white flex items-center gap-2 transition disabled:opacity-60"
                  style={{ background: ORG }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#c44d00'}
                  onMouseLeave={(e) => e.currentTarget.style.background = ORG}>
                  {createLoading ? <><Loader2 size={16} className="animate-spin" /> Posting…</> : <>Post Listing</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}