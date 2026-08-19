'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import {
  Users, Plus, Trash2, Edit3, X, Check, Save, Camera,
  Globe, LayoutDashboard, ChevronDown, ChevronUp
} from '@/lib/icons';
import PhotoCropEditor from '@/components/PhotoCropEditor';

const BRAND = { navy: '#0f1e42', navyLight: '#1a2d5a', orange: '#E85D04', orangeDark: '#c44d00' };

interface TeamMember {
  id: number;
  category: 'team' | 'board';
  name: string;
  role: string;
  photo_url: string | null;
  photo_position?: string | null;
  photo_zoom?: number | null;
  sort_order: number;
  active: number;
  updated_at: string;
  updated_by_name?: string | null;
}

const emptyForm = {
  category: 'team' as 'team' | 'board',
  name: '',
  role: '',
  sort_order: 0,
  photoFile: null as File | null,
  photoPreview: '',
  photoPosition: 'center' as string | null,
  photoZoom: 1 as number | null,
};

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('') || '?';
}

export default function AdminTeamPage() {
  const [tab, setTab] = useState<'team' | 'board'>('team');
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const flash = (type: 'success' | 'error', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3000);
  };

  const fetchMembers = useCallback(() => {
    api.get('/team')
      .then(({ data }) => setMembers(data.members || []))
      .catch(() => flash('error', 'Failed to load members'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const openCreate = (category: 'team' | 'board') => {
    setEditingId(null);
    setForm({ ...emptyForm, category });
    setShowModal(true);
  };

  const openEdit = (m: TeamMember) => {
    setEditingId(m.id);
    setForm({
      category: m.category,
      name: m.name,
      role: m.role || '',
      sort_order: m.sort_order,
      photoFile: null,
      photoPreview: m.photo_url || '',
      photoPosition: m.photo_position || 'center',
      photoZoom: m.photo_zoom && m.photo_zoom > 0 ? m.photo_zoom : 1,
    });
    setShowModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setForm((f) => ({
      ...f,
      photoFile: file,
      photoPreview: file ? URL.createObjectURL(file) : f.photoPreview,
      photoPosition: 'center',
      photoZoom: 1,
    }));
  };

  const handleCropChange = (position: string, zoom: number) => {
    setForm((f) => ({ ...f, photoPosition: position, photoZoom: zoom }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) return flash('error', 'Name is required');
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('category', form.category);
      fd.append('name', form.name.trim());
      fd.append('role', form.role.trim());
      fd.append('sort_order', String(form.sort_order || 0));
      fd.append('photo_position', form.photoPosition || 'center');
      fd.append('photo_zoom', String(form.photoZoom || 1));
      if (form.photoFile) fd.append('photo', form.photoFile);

      if (editingId) {
        await api.put(`/team/${editingId}`, fd);
        flash('success', 'Member updated');
      } else {
        await api.post('/team', fd);
        flash('success', 'Member created');
      }
      setShowModal(false);
      fetchMembers();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Save failed';
      flash('error', message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async (id: number) => {
    try {
      await api.delete(`/team/${id}`);
      flash('success', 'Member deleted');
      fetchMembers();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to delete member';
      flash('error', message);
    } finally {
      setDeleting(null);
    }
  };

  const move = (id: number, dir: -1 | 1) => {
    const group = members.filter((m) => m.category === tab).sort((a, b) => a.sort_order - b.sort_order);
    const idx = group.findIndex((m) => m.id === id);
    const swapWith = group[idx + dir];
    if (!swapWith) return;
    const a = group[idx].sort_order;
    const b = swapWith.sort_order;
    Promise.all([
      api.put(`/team/${id}`, new URLSearchParams({ sort_order: String(b) }).toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }),
      api.put(`/team/${swapWith.id}`, new URLSearchParams({ sort_order: String(a) }).toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }),
    ]).then(fetchMembers).catch(() => flash('error', 'Failed to reorder'));
  };

  const filtered = members.filter((m) => m.category === tab).sort((a, b) => a.sort_order - b.sort_order);
  const teamCount = members.filter((m) => m.category === 'team').length;
  const boardCount = members.filter((m) => m.category === 'board').length;

  return (
    <div className="p-4 lg:p-8 animate-fadeInUp">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${BRAND.orange}15` }}>
            <Users size={18} style={{ color: BRAND.orange }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Team & Board Profiles</h1>
            <p className="text-sm text-gray-600 mt-0.5">Manage the leadership team and board members shown on the About page</p>
          </div>
        </div>
      </div>

      {msg && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold shadow-lg transition-all ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {msg.type === 'success' ? <Check size={16} /> : <X size={16} />}
          {msg.text}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex gap-2">
          <button onClick={() => setTab('team')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition ${tab === 'team' ? 'text-white' : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-50'}`}
            style={tab === 'team' ? { background: `linear-gradient(135deg, ${BRAND.orange}, ${BRAND.orangeDark})` } : {}}>
            <Globe size={16} /> Leadership Team ({teamCount})
          </button>
          <button onClick={() => setTab('board')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition ${tab === 'board' ? 'text-white' : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-50'}`}
            style={tab === 'board' ? { background: `linear-gradient(135deg, ${BRAND.navy}, ${BRAND.navyLight})` } : {}}>
            <LayoutDashboard size={16} /> Board Members ({boardCount})
          </button>
        </div>
        <button onClick={() => openCreate(tab)}
          className="text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition flex items-center gap-2 hover:opacity-90"
          style={{ background: `linear-gradient(135deg, ${BRAND.orange}, ${BRAND.orangeDark})` }}>
          <Plus size={16} /> Add {tab === 'team' ? 'Team Member' : 'Board Member'}
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl p-12 text-center text-gray-400" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.05)' }}>
          Loading members...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl p-12 text-center text-gray-400" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.05)' }}>
          No {tab} members yet. Click “Add {tab === 'team' ? 'Team Member' : 'Board Member'}” to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((m, i) => (
            <div key={m.id} className="rounded-2xl p-4 flex flex-col items-center text-center" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
              <div className="relative mb-3">
                <div className="w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl font-bold overflow-hidden"
                  style={{ background: m.photo_url ? 'transparent' : BRAND.navy, border: `3px solid ${BRAND.orange}` }}>
                  {m.photo_url
                    ? <img src={m.photo_url} alt={m.name} className="w-full h-full object-cover"
                        style={{
                          objectPosition: m.photo_position && m.photo_position !== 'center' ? (m.photo_position as string) : 'center',
                          transform: m.photo_zoom && m.photo_zoom > 0 ? `scale(${m.photo_zoom})` : undefined,
                          transformOrigin: m.photo_position && m.photo_position !== 'center' ? (m.photo_position as string) : 'center',
                        }} />
                    : initialsOf(m.name)}
                </div>
                {m.active === 0 && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-gray-700 text-white">Hidden</span>
                )}
              </div>
              <p className="font-bold text-sm text-gray-800">{m.name}</p>
              <p className="text-xs text-gray-500 mb-2">{m.role || '—'}</p>

              <div className="flex items-center gap-1 mt-auto pt-2">
                <button onClick={() => move(m.id, -1)} disabled={i === 0}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 text-gray-500" title="Move up">
                  <ChevronUp size={15} />
                </button>
                <button onClick={() => move(m.id, 1)} disabled={i === filtered.length - 1}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 text-gray-500" title="Move down">
                  <ChevronDown size={15} />
                </button>
                <button onClick={() => openEdit(m)}
                  className="p-1.5 rounded-lg transition hover:bg-gray-100" style={{ color: BRAND.orange }} title="Edit">
                  <Edit3 size={15} />
                </button>
                {deleting === m.id ? (
                  <span className="flex items-center gap-1">
                    <button onClick={() => confirmDelete(m.id)}
                      className="text-[10px] font-bold px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600 transition">Yes</button>
                    <button onClick={() => setDeleting(null)}
                      className="text-[10px] font-bold px-2 py-1 rounded bg-gray-200 text-gray-600 hover:bg-gray-300 transition">No</button>
                  </span>
                ) : (
                  <button onClick={() => setDeleting(m.id)}
                    className="p-1.5 rounded-lg transition hover:bg-red-50 text-red-500" title="Delete">
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {editingId ? 'Edit Member' : 'Add ' + (form.category === 'team' ? 'Team Member' : 'Board Member')}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100 transition">
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="mb-1">
                <label className="relative cursor-pointer group block text-center">
                  <div className="w-24 h-24 rounded-full mx-auto flex items-center justify-center text-white text-3xl font-bold overflow-hidden relative"
                    style={{ background: form.photoPreview ? 'transparent' : BRAND.navy, border: `3px solid ${BRAND.orange}` }}>
                    {form.photoPreview
                      ? <img src={form.photoPreview} alt="preview" className="w-full h-full object-cover"
                          style={{
                            objectPosition: form.photoPosition && form.photoPosition !== 'center' ? form.photoPosition : 'center',
                            transform: form.photoZoom && form.photoZoom > 0 ? `scale(${form.photoZoom})` : undefined,
                            transformOrigin: form.photoPosition && form.photoPosition !== 'center' ? form.photoPosition : 'center',
                          }} />
                      : initialsOf(form.name || '?')}
                  </div>
                  <span className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition text-white"
                    style={{ inset: 'auto 0 0 0', height: '100%', margin: '0 auto', width: 96 }}>
                    <Camera size={20} />
                  </span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
                <p className="text-center text-xs text-gray-400 -mt-1 mb-2">
                  Click to upload a profile photo
                </p>
              </div>

              {form.photoPreview && (
                <div className="rounded-2xl p-4" style={{ background: '#fafbff', border: '1px solid rgba(0,0,0,0.05)' }}>
                  <p className="text-center text-xs font-semibold text-gray-600 mb-3">
                    Adjust how the photo is displayed
                  </p>
                  <PhotoCropEditor
                    src={form.photoPreview}
                    initialPosition={form.photoPosition}
                    initialZoom={form.photoZoom}
                    onChange={handleCropChange}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Category</label>
                <select value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as 'team' | 'board' }))}
                  disabled={!!editingId}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-orange-400 disabled:bg-gray-50 disabled:text-gray-400">
                  <option value="team">Leadership Team</option>
                  <option value="board">Board Members</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Name *</label>
                <input type="text" value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Jane Doe"
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-orange-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Title / Role</label>
                <input type="text" value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  placeholder="e.g. Chairman of the Board"
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-orange-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Sort Order (lower = shown first)</label>
                <input type="number" value={form.sort_order}
                  onChange={(e) => setForm((f) => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-orange-400" />
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
                {saving ? 'Saving...' : editingId ? 'Update Member' : 'Create Member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}