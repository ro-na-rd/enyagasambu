'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { FileText, Edit3, Trash2, Plus, X, Check, Eye, Clock, CheckCircle, AlertCircle } from '@/lib/icons';

const BRAND = { navy: '#0f1e42', orange: '#E85D04', orangeDark: '#c44d00' };

interface ContentPage {
  id: number;
  title: string;
  slug: string;
  type: string;
  content: string;
  status: string;
  meta_description: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

const emptyForm = { title: '', slug: '', type: 'page', content: '', status: 'draft', meta_description: '' };

export default function AdminContentPage() {
  const [items, setItems] = useState<ContentPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const flash = (type: 'success' | 'error', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3000);
  };

  const fetchItems = useCallback(async () => {
    try {
      const { data } = await api.get('/content');
      setItems(data);
    } catch {
      flash('error', 'Failed to load content');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = async (id: number) => {
    try {
      const { data } = await api.get(`/content/${id}`);
      setEditingId(id);
      setForm({
        title: data.title,
        slug: data.slug,
        type: data.type,
        content: data.content || '',
        status: data.status,
        meta_description: data.meta_description || '',
      });
      setShowModal(true);
    } catch {
      flash('error', 'Failed to load page details');
    }
  };

  const autoSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleSave = async () => {
    if (!form.title.trim()) return flash('error', 'Title is required');
    if (!form.slug.trim()) return flash('error', 'Slug is required');
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/content/${editingId}`, form);
        flash('success', 'Page updated successfully');
      } else {
        await api.post('/content', form);
        flash('success', 'Page created successfully');
      }
      setShowModal(false);
      fetchItems();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Save failed';
      flash('error', message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await api.patch(`/content/${id}/status`);
      flash('success', 'Status toggled');
      fetchItems();
    } catch {
      flash('error', 'Failed to toggle status');
    }
  };

  const handleDelete = async (id: number) => {
    setDeleting(id);
  };

  const confirmDelete = async (id: number) => {
    try {
      await api.delete(`/content/${id}`);
      flash('success', 'Page deleted');
      fetchItems();
    } catch {
      flash('error', 'Failed to delete page');
    } finally {
      setDeleting(null);
    }
  };

  const filtered = items.filter((item) => {
    const matchSearch = !search || item.title.toLowerCase().includes(search.toLowerCase()) || item.slug.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || item.type === filterType;
    const matchStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  const types = [...new Set(items.map((i) => i.type))];

  return (
    <div className="p-4 lg:p-8 animate-fadeInUp">
      {msg && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold shadow-lg transition-all ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {msg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {msg.text}
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${BRAND.orange}15` }}>
            <FileText size={18} style={{ color: BRAND.orange }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Content Management</h1>
            <p className="text-sm text-gray-600 mt-0.5">Manage pages, guides, and site content</p>
          </div>
        </div>
        <button onClick={openCreate}
          className="text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition flex items-center gap-2 mt-3 hover:opacity-90"
          style={{ background: `linear-gradient(135deg, ${BRAND.orange}, ${BRAND.orangeDark})` }}>
          <Plus size={16} /> New Page
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <input
              type="text"
              placeholder="Search pages..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-orange-400 bg-white"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><FileText size={14} /></span>
          </div>
        </div>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-orange-400">
          <option value="all">All Types</option>
          {types.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-orange-400">
          <option value="all">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200" style={{ background: '#f0f2f5' }}>
                <th className="text-left px-4 py-3 text-gray-400 text-xs uppercase font-semibold tracking-wider">Title</th>
                <th className="text-left px-4 py-3 text-gray-400 text-xs uppercase font-semibold tracking-wider">Type</th>
                <th className="text-center px-4 py-3 text-gray-400 text-xs uppercase font-semibold tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-gray-400 text-xs uppercase font-semibold tracking-wider">Updated</th>
                <th className="text-center px-4 py-3 text-gray-400 text-xs uppercase font-semibold tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">No pages found</td></tr>
              ) : filtered.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3.5">
                    <div className="font-medium text-gray-800">{item.title}</div>
                    <div className="text-[11px] text-gray-400 mt-0.5">/{item.slug}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: `${BRAND.navy}10`, color: BRAND.navy }}>
                      {item.type}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <button onClick={() => handleToggleStatus(item.id)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full cursor-pointer transition hover:opacity-80 ${
                        item.status === 'published'
                          ? 'bg-green-500/10 text-green-600'
                          : 'bg-yellow-500/10 text-yellow-600'
                      }`}>
                      {item.status === 'published' ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock size={12} className="text-gray-400" />
                      {new Date(item.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {item.status === 'published' && (
                        <a href={`/guide`} target="_blank" rel="noopener noreferrer"
                          className="text-xs font-semibold flex items-center gap-1 hover:underline" style={{ color: BRAND.navy }}>
                          <Eye size={12} /> View
                        </a>
                      )}
                      <button onClick={() => openEdit(item.id)}
                        className="text-xs font-semibold flex items-center gap-1 hover:underline"
                        style={{ color: BRAND.orange }}>
                        <Edit3 size={12} /> Edit
                      </button>
                      {deleting === item.id ? (
                        <span className="flex items-center gap-1 text-[11px]">
                          <button onClick={() => confirmDelete(item.id)} className="text-red-600 font-bold hover:underline">Yes</button>
                          <span className="text-gray-400">/</span>
                          <button onClick={() => setDeleting(null)} className="text-gray-500 font-bold hover:underline">No</button>
                        </span>
                      ) : (
                        <button onClick={() => handleDelete(item.id)}
                          className="text-xs font-semibold flex items-center gap-1 hover:underline"
                          style={{ color: '#f85149' }}>
                          <Trash2 size={12} /> Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-400 text-right">
        {filtered.length} page{filtered.length !== 1 ? 's' : ''} total
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{editingId ? 'Edit Page' : 'Create New Page'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100 transition">
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Title *</label>
                  <input type="text" value={form.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      setForm((f) => ({ ...f, title, slug: editingId ? f.slug : autoSlug(title) }));
                    }}
                    placeholder="Page title"
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-orange-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Slug *</label>
                  <input type="text" value={form.slug}
                    onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                    placeholder="page-url-slug"
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-orange-400" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Type</label>
                  <select value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-orange-400">
                    <option value="page">Page</option>
                    <option value="guide">Guide</option>
                    <option value="faq">FAQ</option>
                    <option value="policy">Policy</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Status</label>
                  <select value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-orange-400">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Meta Description</label>
                <input type="text" value={form.meta_description}
                  onChange={(e) => setForm((f) => ({ ...f, meta_description: e.target.value }))}
                  placeholder="Short description for SEO"
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-orange-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Content (HTML)</label>
                <textarea value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  placeholder="Write your page content here (HTML supported)..."
                  rows={12}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-orange-400 font-mono resize-y" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2.5 text-sm font-semibold text-gray-600 rounded-xl hover:bg-gray-100 transition">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition hover:opacity-90 disabled:opacity-50"
                style={{ background: `linear-gradient(135deg, ${BRAND.orange}, ${BRAND.orangeDark})` }}>
                <Check size={14} />
                {saving ? 'Saving...' : editingId ? 'Update Page' : 'Create Page'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
