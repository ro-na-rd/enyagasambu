'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import {
  MousePointerClick, Plus, Trash2, Edit3, X, Check, Save,
  ChevronDown, ChevronUp
} from '@/lib/icons';

const BRAND = { navy: '#0f1e42', navyLight: '#1a2d5a', orange: '#E85D04', orangeDark: '#c44d00' };

interface HomeButton {
  id: number;
  label: string;
  href: string;
  sort_order: number;
  active: number;
  updated_at: string;
  updated_by_name?: string | null;
}

const emptyForm = { label: '', href: '', sort_order: 0 };

export default function AdminHomeButtonsPage() {
  const [buttons, setButtons] = useState<HomeButton[]>([]);
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

  const fetchButtons = useCallback(() => {
    api.get('/home-buttons')
      .then(({ data }) => setButtons(data.buttons || []))
      .catch(() => flash('error', 'Failed to load buttons'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchButtons(); }, [fetchButtons]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, sort_order: buttons.length + 1 });
    setShowModal(true);
  };

  const openEdit = (b: HomeButton) => {
    setEditingId(b.id);
    setForm({ label: b.label, href: b.href, sort_order: b.sort_order });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.label.trim()) return flash('error', 'Label is required');
    if (!form.href.trim()) return flash('error', 'Link is required');
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/home-buttons/${editingId}`, form);
        flash('success', 'Button updated');
      } else {
        await api.post('/home-buttons', form);
        flash('success', 'Button created');
      }
      setShowModal(false);
      fetchButtons();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Save failed';
      flash('error', message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async (id: number) => {
    try {
      await api.delete(`/home-buttons/${id}`);
      flash('success', 'Button deleted');
      fetchButtons();
    } catch {
      flash('error', 'Failed to delete button');
    } finally {
      setDeleting(null);
    }
  };

  const move = (id: number, dir: -1 | 1) => {
    const group = [...buttons].sort((a, b) => a.sort_order - b.sort_order);
    const idx = group.findIndex((m) => m.id === id);
    const swapWith = group[idx + dir];
    if (!swapWith) return;
    const a = group[idx].sort_order;
    const b = swapWith.sort_order;
    Promise.all([
      api.put(`/home-buttons/${id}`, { sort_order: b }),
      api.put(`/home-buttons/${swapWith.id}`, { sort_order: a }),
    ]).then(fetchButtons).catch(() => flash('error', 'Failed to reorder'));
  };

  const sorted = [...buttons].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="p-4 lg:p-8 animate-fadeInUp">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${BRAND.orange}15` }}>
            <MousePointerClick size={18} style={{ color: BRAND.orange }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Join Section Buttons</h1>
            <p className="text-sm text-gray-600 mt-0.5">Edit the “Join E-Nyagasambu” buttons shown on the homepage — change their label and link, or delete them</p>
          </div>
        </div>
        <button onClick={openCreate}
          className="text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition flex items-center gap-2 hover:opacity-90"
          style={{ background: `linear-gradient(135deg, ${BRAND.orange}, ${BRAND.orangeDark})` }}>
          <Plus size={16} /> Add Button
        </button>
      </div>

      {msg && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold shadow-lg transition-all ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {msg.type === 'success' ? <Check size={16} /> : <X size={16} />}
          {msg.text}
        </div>
      )}

      <div className="rounded-2xl mb-4 p-4 flex items-center gap-2 text-xs text-gray-500" style={{ background: '#f0f2f5' }}>
        <MousePointerClick size={14} className="text-[#E85D04]" />
        These buttons appear under <b>Join E-Nyagasambu</b> on the homepage. The “Join E-Nyagasambu” title and description text are edited in Admin → Content (section: Home).
      </div>

      {loading ? (
        <div className="rounded-2xl p-12 text-center text-gray-400" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.05)' }}>
          Loading buttons...
        </div>
      ) : sorted.length === 0 ? (
        <div className="rounded-2xl p-12 text-center text-gray-400" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.05)' }}>
          No buttons yet. Click “Add Button” to create one.
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200" style={{ background: '#f0f2f5' }}>
                  <th className="text-left px-4 py-3 text-gray-400 text-xs uppercase font-semibold tracking-wider">Order</th>
                  <th className="text-left px-4 py-3 text-gray-400 text-xs uppercase font-semibold tracking-wider">Button Label</th>
                  <th className="text-left px-4 py-3 text-gray-400 text-xs uppercase font-semibold tracking-wider">Link</th>
                  <th className="text-center px-4 py-3 text-gray-400 text-xs uppercase font-semibold tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sorted.map((b, i) => (
                  <tr key={b.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => move(b.id, -1)} disabled={i === 0}
                          className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 text-gray-500" title="Move up">
                          <ChevronUp size={15} />
                        </button>
                        <button onClick={() => move(b.id, 1)} disabled={i === sorted.length - 1}
                          className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 text-gray-500" title="Move down">
                          <ChevronDown size={15} />
                        </button>
                        <span className="ml-1 text-xs font-bold text-gray-400">{b.sort_order}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-block text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
                        style={{ background: `linear-gradient(135deg, ${BRAND.orange}, ${BRAND.orangeDark})` }}>
                        {b.label} →
                      </span>
                      {b.active === 0 && <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-700 text-white">Hidden</span>}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-500 font-mono">{b.href}</td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEdit(b)}
                          className="p-1.5 rounded-lg transition hover:bg-gray-100" style={{ color: BRAND.orange }}>
                          <Edit3 size={15} />
                        </button>
                        {deleting === b.id ? (
                          <span className="flex items-center gap-1">
                            <button onClick={() => confirmDelete(b.id)}
                              className="text-[10px] font-bold px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600 transition">Yes</button>
                            <button onClick={() => setDeleting(null)}
                              className="text-[10px] font-bold px-2 py-1 rounded bg-gray-200 text-gray-600 hover:bg-gray-300 transition">No</button>
                          </span>
                        ) : (
                          <button onClick={() => setDeleting(b.id)}
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
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{editingId ? 'Edit Button' : 'Add Button'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100 transition">
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Button Label *</label>
                <input type="text" value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                  placeholder="e.g. Buyer Registration"
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-orange-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Link (URL) *</label>
                <input type="text" value={form.href}
                  onChange={(e) => setForm((f) => ({ ...f, href: e.target.value }))}
                  placeholder="e.g. /register  or  https://example.com/page"
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-orange-400 font-mono" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Sort Order (lower = shown first)</label>
                <input type="number" value={form.sort_order}
                  onChange={(e) => setForm((f) => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-orange-400" />
              </div>
              <div className="text-xs text-gray-400">
                Preview: <span className="inline-block ml-1 text-white font-semibold px-3 py-1.5 rounded-lg"
                  style={{ background: `linear-gradient(135deg, ${BRAND.orange}, ${BRAND.orangeDark})` }}>
                  {form.label || 'Button'} →
                </span>
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
                {saving ? 'Saving...' : editingId ? 'Update Button' : 'Create Button'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}