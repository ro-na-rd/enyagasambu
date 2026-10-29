'use client';
import { useEffect, useRef, useState } from 'react';
import api from '@/lib/api';
import AppImage from '@/components/AppImage';
import { Megaphone, Plus, Trash2, Check, Image as ImageIcon, X, TrendingUp } from '@/lib/icons';

const BRAND = {
  navy: '#0f1e42',
  orange: '#E85D04',
  orangeDark: '#c44d00',
};

interface Announcement {
  id: number;
  title: string;
  body: string;
  image_url: string | null;
  audience: string;
  is_published: boolean;
  is_trending: boolean;
  created_at: string;
  created_by_name?: string;
}

const AUDIENCES = [
  { value: 'all', label: 'All users' },
  { value: 'ambassador', label: 'Ambassadors' },
  { value: 'broker', label: 'Brokers' },
  { value: 'supplier', label: 'Suppliers' },
];

const audienceBadge = (a: string) => {
  const m: Record<string, string> = {
    all: 'bg-blue-500/10 text-blue-400',
    ambassador: 'bg-orange-500/10 text-orange-400',
    broker: 'bg-purple-500/10 text-purple-400',
    supplier: 'bg-green-500/10 text-green-400',
  };
  return `text-[11px] font-bold px-2.5 py-1 rounded-full ${m[a] || 'bg-gray-500/10 text-gray-400'}`;
};

export default function AdminAnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState('all');
  const [isTrending, setIsTrending] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchList = () => {
    api.get('/admin/announcements')
      .then(({ data }) => setItems(data || []))
      .catch(() => { })
      .finally(() => setLoading(false));
  };

  useEffect(fetchList, []);

  const handleImage = (file: File | null) => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    if (!file) {
      setImageFile(null);
      setImagePreview('');
      return;
    }
    if (!file.type.startsWith('image/')) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const resetForm = () => {
    setTitle('');
    setBody('');
    setAudience('all');
    setIsTrending(false);
    handleImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setCreating(true);
    setMsg('');
    try {
      const form = new FormData();
      form.append('title', title.trim());
      form.append('body', body.trim());
      form.append('audience', audience);
      form.append('is_trending', isTrending ? 'true' : 'false');
      if (imageFile) form.append('image', imageFile);
      await api.post('/admin/announcements', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      resetForm();
      setMsg('Announcement published');
      setTimeout(() => setMsg(''), 2500);
      fetchList();
    } catch (err: unknown) {
      setMsg((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create announcement');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this announcement?')) return;
    setMsg('');
    try {
      await api.delete(`/admin/announcements/${id}`);
      fetchList();
    } catch (err: unknown) {
      setMsg((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${BRAND.orange}1a`, color: BRAND.orange }}>
          <Megaphone size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Announcements</h1>
          <p className="text-sm text-gray-500">Broadcast updates to users by role</p>
        </div>
      </div>

      {msg && <div className={`text-sm font-medium rounded-lg px-4 py-3 flex items-center gap-2 ${msg.includes('published') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
        {msg.includes('published') ? <Check size={15} /> : null}{msg}
      </div>}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-4 flex items-center gap-2">
          <Plus size={15} className="text-[#E85D04]" /> New Announcement
        </h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required
              placeholder="e.g. New Ambassador Feature"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#E85D04]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Message</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} required rows={4}
              placeholder="Write the announcement message..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#E85D04]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Image (stored in object storage)</label>
            {imagePreview ? (
              <div className="relative w-full sm:w-72 rounded-lg overflow-hidden border border-gray-200">
                <AppImage src={imagePreview} alt="Advert image preview" className="w-full h-40 object-cover" />
                <button type="button" onClick={() => { handleImage(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full sm:w-72 h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#E85D04] hover:bg-orange-50/40 transition text-gray-400">
                <ImageIcon size={26} />
                <span className="text-xs font-medium mt-2">Click to upload an image</span>
                <span className="text-[10px] mt-0.5">PNG, JPG up to 5MB</span>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => handleImage(e.target.files?.[0] || null)} />
              </label>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Audience</label>
            <select value={audience} onChange={(e) => setAudience(e.target.value)}
              className="w-full sm:w-64 border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#E85D04]">
              {AUDIENCES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>
          <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 cursor-pointer hover:border-[#E85D04] transition">
            <input type="checkbox" checked={isTrending} onChange={(e) => setIsTrending(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-[#E85D04]" />
            <span>
              <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                <TrendingUp size={15} className="text-[#E85D04]" /> Best trending product
              </span>
              <span className="text-xs text-gray-500">Highlight this advert at the top of the Adverts page.</span>
            </span>
          </label>
          <button type="submit" disabled={creating}
            className="bg-[#E85D04] text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-[#c44d00] transition disabled:opacity-60">
            {creating ? 'Publishing...' : 'Publish Announcement'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800">Published</h2>
          <span className="text-xs text-gray-400">{items.length} announcement(s)</span>
        </div>

        {loading ? (
          <p className="text-sm text-gray-400 text-center py-10 animate-pulse">Loading announcements...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">No announcements yet</p>
        ) : (
          items.map((a) => (
            <div key={a.id} className="px-5 py-4 border-b border-gray-50 last:border-b-0 flex items-start gap-3 hover:bg-gray-50/60 transition">
              {a.image_url && (
                <AppImage src={a.image_url} alt={a.title}
                  className="w-16 h-16 rounded-lg object-cover shrink-0 border border-gray-100" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-gray-900">{a.title}</p>
                  {a.is_trending && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white flex items-center gap-1">
                      <TrendingUp size={11} /> Trending
                    </span>
                  )}
                  <span className={audienceBadge(a.audience)}>{a.audience === 'all' ? 'General' : a.audience}</span>
                  {!a.is_published && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">draft</span>}
                </div>
                <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{a.body}</p>
                <p className="text-xs text-gray-400 mt-1.5">
                  {new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  {a.created_by_name ? ` · by ${a.created_by_name}` : ''}
                </p>
              </div>
              <button onClick={() => handleDelete(a.id)} title="Delete"
                className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition">
                <Trash2 size={15} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
