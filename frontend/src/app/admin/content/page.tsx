'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { stripHtml } from '@/lib/text';
import {
  FileText, Edit3, Trash2, Plus, X, Check, Eye, Clock,
  CheckCircle, AlertCircle, Search, BookOpen, HelpCircle, Shield,
  Globe, LayoutDashboard, Save, List
} from '@/lib/icons';

const BRAND = { navy: '#0f1e42', orange: '#E85D04', orangeDark: '#c44d00' };

interface ContentPage {
  id: number; title: string; slug: string; type: string; content: string;
  status: string; meta_description: string | null; created_by_name: string | null;
  created_at: string; updated_at: string;
}

interface SiteContentItem {
  id: number; content_key: string; section: string; label: string;
  content: string; status: string; updated_by_name: string | null;
  created_at: string; updated_at: string;
}

const emptyForm = { title: '', slug: '', type: 'page', content: '', status: 'draft', meta_description: '' };
const emptySiteForm = { content_key: '', section: 'general', label: '', content: '', status: 'published' };

const typeConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  page: { icon: <FileText size={12} />, color: '#0f1e42', bg: 'rgba(15,30,66,0.08)' },
  guide: { icon: <BookOpen size={12} />, color: '#059669', bg: 'rgba(5,150,105,0.08)' },
  faq: { icon: <HelpCircle size={12} />, color: '#7c3aed', bg: 'rgba(124,58,237,0.08)' },
  policy: { icon: <Shield size={12} />, color: '#d29922', bg: 'rgba(210,153,34,0.08)' },
};

export default function AdminContentPage() {
  const [tab, setTab] = useState<'pages' | 'site'>('site');

  return (
    <div className="p-4 lg:p-8 animate-fadeInUp">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${BRAND.orange}15` }}>
            <FileText size={18} style={{ color: BRAND.orange }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Content Management</h1>
            <p className="text-sm text-gray-600 mt-0.5">Manage every piece of content across the site — plain text, no HTML</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('site')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition ${tab === 'site' ? 'text-white' : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-50'}`}
          style={tab === 'site' ? { background: `linear-gradient(135deg, ${BRAND.orange}, ${BRAND.orangeDark})` } : {}}>
          <Globe size={16} /> All Site Content
        </button>
        <button onClick={() => setTab('pages')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition ${tab === 'pages' ? 'text-white' : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-50'}`}
          style={tab === 'pages' ? { background: `linear-gradient(135deg, ${BRAND.navy}, #1a2d5a)` } : {}}>
          <LayoutDashboard size={16} /> Pages (Legal / FAQ)
        </button>
      </div>

      {tab === 'site' ? <SiteContentManager /> : <PagesManager />}
    </div>
  );
}

/* ────────────────────────── ALL SITE CONTENT ────────────────────────── */

function SiteContentManager() {
  const [items, setItems] = useState<SiteContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptySiteForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [search, setSearch] = useState('');
  const [filterSection, setFilterSection] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const flash = (type: 'success' | 'error', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3000);
  };

  const fetchItems = useCallback(async () => {
    api.get('/site-content')
      .then(({ data }) => setItems(data))
      .catch(() => flash('error', 'Failed to load site content'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptySiteForm);
    setShowModal(true);
  };

  const openEdit = (item: SiteContentItem) => {
    setEditingId(item.id);
    setForm({
      content_key: item.content_key, section: item.section, label: item.label,
      content: item.content || '', status: item.status,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.content_key.trim()) return flash('error', 'Content key is required');
    if (!form.label.trim()) return flash('error', 'Label is required');
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/site-content/${editingId}`, form);
        flash('success', 'Content updated successfully');
      } else {
        await api.post('/site-content', form);
        flash('success', 'Content created successfully');
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
      await api.patch(`/site-content/${id}/status`);
      flash('success', 'Status toggled');
      fetchItems();
    } catch {
      flash('error', 'Failed to toggle status');
    }
  };

  const confirmDelete = async (id: number) => {
    try {
      await api.delete(`/site-content/${id}`);
      flash('success', 'Content deleted');
      fetchItems();
    } catch {
      flash('error', 'Failed to delete content');
    } finally {
      setDeleting(null);
    }
  };

  const sections = [...new Set(items.map((i) => i.section))];
  const grouped = sections
    .map((s) => ({ section: s, items: items.filter((i) => i.section === s) }))
    .map((g) => ({
      ...g,
      items: g.items.filter((item) => {
        const matchSearch = !search ||
          item.label.toLowerCase().includes(search.toLowerCase()) ||
          item.content_key.toLowerCase().includes(search.toLowerCase()) ||
          item.content.toLowerCase().includes(search.toLowerCase());
        const matchStatus = filterStatus === 'all' || item.status === filterStatus;
        return matchSearch && matchStatus;
      }),
    }))
    .filter((g) => g.items.length > 0 && (filterSection === 'all' || g.section === filterSection));

  const publishedCount = items.filter(i => i.status === 'published').length;
  const draftCount = items.filter(i => i.status === 'draft').length;

  return (
    <div>
      {msg && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold shadow-lg transition-all ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {msg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Items', value: items.length, icon: <Globe size={18} />, gradient: `linear-gradient(135deg, ${BRAND.navy}, #1a2d5a)` },
          { label: 'Published', value: publishedCount, icon: <CheckCircle size={18} />, gradient: 'linear-gradient(135deg, #059669, #047857)' },
          { label: 'Drafts', value: draftCount, icon: <Clock size={18} />, gradient: 'linear-gradient(135deg, #d29922, #b8860b)' },
          { label: 'Sections', value: sections.length, icon: <List size={18} />, gradient: 'linear-gradient(135deg, #7c3aed, #6d28d9)' },
        ].map((card) => (
          <div key={card.label} className="relative overflow-hidden rounded-2xl p-4 text-white"
            style={{ background: card.gradient }}>
            <div className="absolute top-0 right-0 w-20 h-20 opacity-10"
              style={{ background: 'radial-gradient(circle, white, transparent 70%)', transform: 'translate(30%, -30%)' }} />
            <div className="relative z-10">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/15 mb-3">{card.icon}</div>
              <p className="text-xl font-extrabold">{card.value}</p>
              <p className="text-[10px] font-medium text-white/60 mt-0.5">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text" placeholder="Search all site content..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-orange-400 bg-white"
            />
          </div>
        </div>
        <select value={filterSection} onChange={(e) => setFilterSection(e.target.value)}
          className="px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-orange-400">
          <option value="all">All Sections</option>
          {sections.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-orange-400">
          <option value="all">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <button onClick={openCreate}
          className="text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition flex items-center gap-2 hover:opacity-90"
          style={{ background: `linear-gradient(135deg, ${BRAND.orange}, ${BRAND.orangeDark})` }}>
          <Plus size={16} /> New Content
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl p-12 text-center text-gray-400" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.05)' }}>
          Loading content...
        </div>
      ) : grouped.length === 0 ? (
        <div className="rounded-2xl p-12 text-center text-gray-400" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.05)' }}>
          No content found
        </div>
      ) : (
        grouped.map((g) => (
          <div key={g.section} className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                style={{ background: `${BRAND.orange}15`, color: BRAND.orange }}>
                {g.section}
              </div>
              <span className="text-xs text-gray-400">{g.items.length} item{g.items.length !== 1 ? 's' : ''}</span>
            </div>

            <div className="rounded-xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200" style={{ background: '#f0f2f5' }}>
                      <th className="text-left px-4 py-3 text-gray-400 text-xs uppercase font-semibold tracking-wider">Label / Key</th>
                      <th className="text-left px-4 py-3 text-gray-400 text-xs uppercase font-semibold tracking-wider">Content (plain text)</th>
                      <th className="text-center px-4 py-3 text-gray-400 text-xs uppercase font-semibold tracking-wider">Status</th>
                      <th className="text-left px-4 py-3 text-gray-400 text-xs uppercase font-semibold tracking-wider">Last Updated</th>
                      <th className="text-center px-4 py-3 text-gray-400 text-xs uppercase font-semibold tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {g.items.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3.5 max-w-[220px]">
                          <div className="font-medium text-gray-800">{item.label}</div>
                          <div className="text-[11px] text-gray-400 mt-0.5 font-mono">{item.content_key}</div>
                          <div className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                            <UserBadge name={item.updated_by_name} />
                          </div>
                        </td>
                        <td className="px-4 py-3.5 max-w-[380px]">
                          <p className="text-gray-600 whitespace-pre-wrap line-clamp-3 leading-relaxed text-[13px]">
                            {item.content || <span className="text-gray-300 italic">Empty</span>}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <button onClick={() => handleToggleStatus(item.id)}
                            className={`text-[10px] font-semibold px-2.5 py-1 rounded-full cursor-pointer transition hover:opacity-80 ${
                              item.status === 'published' ? 'bg-green-500/10 text-green-600' : 'bg-yellow-500/10 text-yellow-600'
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
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => openEdit(item)}
                              className="p-1.5 rounded-lg transition hover:bg-gray-100" style={{ color: BRAND.orange }}>
                              <Edit3 size={15} />
                            </button>
                            {deleting === item.id ? (
                              <span className="flex items-center gap-1">
                                <button onClick={() => confirmDelete(item.id)}
                                  className="text-[10px] font-bold px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600 transition">
                                  Yes
                                </button>
                                <button onClick={() => setDeleting(null)}
                                  className="text-[10px] font-bold px-2 py-1 rounded bg-gray-200 text-gray-600 hover:bg-gray-300 transition">
                                  No
                                </button>
                              </span>
                            ) : (
                              <button onClick={() => setDeleting(item.id)}
                                className="p-1.5 rounded-lg transition hover:bg-red-50 text-red-500">
                                <Trash2 size={15} />
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
          </div>
        ))
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{editingId ? 'Edit Content' : 'Create New Content'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100 transition">
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Content Key *</label>
                  <input type="text" value={form.content_key}
                    onChange={(e) => setForm((f) => ({ ...f, content_key: e.target.value }))}
                    placeholder="e.g. home.hero_title"
                    disabled={!!editingId}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-orange-400 disabled:bg-gray-50 disabled:text-gray-400 font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Label *</label>
                  <input type="text" value={form.label}
                    onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                    placeholder="e.g. Home · Hero Title"
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-orange-400" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Section</label>
                  <select value={form.section}
                    onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-orange-400">
                    <option value="home">Home</option>
                    <option value="about">About</option>
                    <option value="guide">Guide</option>
                    <option value="support">Support</option>
                    <option value="footer">Footer</option>
                    <option value="general">General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Status</label>
                  <select value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-orange-400">
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Content (plain text)</label>
                <textarea value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  placeholder="Write your content as plain text. Line breaks are preserved."
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
                <Save size={14} />
                {saving ? 'Saving...' : editingId ? 'Update Content' : 'Create Content'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UserBadge({ name }: { name: string | null }) {
  return (
    <span className="text-[11px] text-gray-400">
      {name ? <>by <span className="text-gray-500 font-medium">{name}</span></> : 'by Unknown'}
    </span>
  );
}

/* ────────────────────────── PAGES (LEGAL / FAQ) ────────────────────────── */

function PagesManager() {
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
  const [previewItem, setPreviewItem] = useState<ContentPage | null>(null);

  const flash = (type: 'success' | 'error', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3000);
  };

  const fetchItems = useCallback(async () => {
    api.get('/content')
      .then(({ data }) => setItems(data))
      .catch(() => flash('error', 'Failed to load pages'))
      .finally(() => setLoading(false));
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
        title: data.title, slug: data.slug, type: data.type,
        content: stripHtml(data.content || ''), status: data.status,
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
  const publishedCount = items.filter(i => i.status === 'published').length;
  const draftCount = items.filter(i => i.status === 'draft').length;

  return (
    <div>
      {msg && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold shadow-lg transition-all ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {msg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Pages', value: items.length, icon: <FileText size={18} />, gradient: `linear-gradient(135deg, ${BRAND.navy}, #1a2d5a)` },
          { label: 'Published', value: publishedCount, icon: <CheckCircle size={18} />, gradient: 'linear-gradient(135deg, #059669, #047857)' },
          { label: 'Drafts', value: draftCount, icon: <Clock size={18} />, gradient: 'linear-gradient(135deg, #d29922, #b8860b)' },
          { label: 'Content Types', value: types.length, icon: <BookOpen size={18} />, gradient: 'linear-gradient(135deg, #7c3aed, #6d28d9)' },
        ].map((card) => (
          <div key={card.label} className="relative overflow-hidden rounded-2xl p-4 text-white"
            style={{ background: card.gradient }}>
            <div className="absolute top-0 right-0 w-20 h-20 opacity-10"
              style={{ background: 'radial-gradient(circle, white, transparent 70%)', transform: 'translate(30%, -30%)' }} />
            <div className="relative z-10">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/15 mb-3">{card.icon}</div>
              <p className="text-xl font-extrabold">{card.value}</p>
              <p className="text-[10px] font-medium text-white/60 mt-0.5">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text" placeholder="Search pages..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-orange-400 bg-white"
            />
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
        <button onClick={openCreate}
          className="text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition flex items-center gap-2 hover:opacity-90"
          style={{ background: `linear-gradient(135deg, ${BRAND.orange}, ${BRAND.orangeDark})` }}>
          <Plus size={16} /> New Page
        </button>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200" style={{ background: '#f0f2f5' }}>
                <th className="text-left px-4 py-3 text-gray-400 text-xs uppercase font-semibold tracking-wider">Title</th>
                <th className="text-center px-4 py-3 text-gray-400 text-xs uppercase font-semibold tracking-wider">Type</th>
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
              ) : filtered.map((item) => {
                const tc = typeConfig[item.type] || typeConfig.page;
                return (
                  <tr key={item.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-gray-800">{item.title}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">/{item.slug}</div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: tc.bg, color: tc.color }}>
                        {tc.icon} {item.type}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button onClick={() => handleToggleStatus(item.id)}
                        className={`text-[10px] font-semibold px-2.5 py-1 rounded-full cursor-pointer transition hover:opacity-80 ${
                          item.status === 'published' ? 'bg-green-500/10 text-green-600' : 'bg-yellow-500/10 text-yellow-600'
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
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => setPreviewItem(item)}
                          className="p-1.5 rounded-lg transition hover:bg-gray-100" style={{ color: BRAND.navy }}>
                          <Eye size={15} />
                        </button>
                        <button onClick={() => openEdit(item.id)}
                          className="p-1.5 rounded-lg transition hover:bg-gray-100" style={{ color: BRAND.orange }}>
                          <Edit3 size={15} />
                        </button>
                        {deleting === item.id ? (
                          <span className="flex items-center gap-1">
                            <button onClick={() => confirmDelete(item.id)}
                              className="text-[10px] font-bold px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600 transition">
                              Yes
                            </button>
                            <button onClick={() => setDeleting(null)}
                              className="text-[10px] font-bold px-2 py-1 rounded bg-gray-200 text-gray-600 hover:bg-gray-300 transition">
                              No
                            </button>
                          </span>
                        ) : (
                          <button onClick={() => setDeleting(item.id)}
                            className="p-1.5 rounded-lg transition hover:bg-red-50 text-red-500">
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-400 text-right">
        {filtered.length} page{filtered.length !== 1 ? 's' : ''} total
      </div>

      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setPreviewItem(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{previewItem.title}</h2>
                <p className="text-xs text-gray-500">/{previewItem.slug} &middot; {previewItem.type}</p>
              </div>
              <button onClick={() => setPreviewItem(null)} className="p-2 rounded-lg hover:bg-gray-100 transition">
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {previewItem.meta_description && (
                <p className="text-sm text-gray-500 mb-4 italic">{previewItem.meta_description}</p>
              )}
              <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {stripHtml(previewItem.content) || <span className="text-gray-400">No content</span>}
              </div>
            </div>
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 text-xs text-gray-400">
              <span>By {previewItem.created_by_name || 'Unknown'}</span>
              <span>Updated {new Date(previewItem.updated_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      )}

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
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Content (plain text)</label>
                <textarea value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  placeholder="Write your page content as plain text. Line breaks are preserved."
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