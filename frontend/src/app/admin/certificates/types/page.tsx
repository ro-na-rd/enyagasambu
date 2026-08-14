'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Award, Plus, Edit3, Trash2, Check, X } from '@/lib/icons';
import { useCurrency } from '@/context/CurrencyContext';

const BRAND = {
  navy: '#0f1e42',
  navyLight: '#1a2d5a',
  orange: '#E85D04',
};

interface CertType {
  id: number;
  code: string;
  name: string;
  description: string;
  category: 'broker' | 'ambassador' | 'supplier';
  price_rwf: number;
  duration_years: number;
  active: number;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  { value: 'broker', label: 'Broker' },
  { value: 'ambassador', label: 'Ambassador' },
  { value: 'supplier', label: 'Supplier' },
];

const emptyForm = { code: '', name: '', description: '', category: 'broker' as CertType['category'], price_rwf: 2000, duration_years: 1, active: 1 };

export default function AdminCertificateTypesPage() {
  const { format } = useCurrency();
  const [types, setTypes] = useState<CertType[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CertType | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchTypes = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/certificate-types');
      setTypes(data.types);
    } catch {
      setErr('Failed to load certificate types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTypes(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setMsg(''); setErr('');
    setModalOpen(true);
  };

  const openEdit = (t: CertType) => {
    setEditing(t);
    setForm({
      code: t.code,
      name: t.name,
      description: t.description || '',
      category: t.category,
      price_rwf: t.price_rwf,
      duration_years: t.duration_years,
      active: t.active,
    });
    setMsg(''); setErr('');
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      setErr('Code and name are required');
      return;
    }
    setSaving(true); setErr(''); setMsg('');
    try {
      const payload = {
        ...form,
        code: form.code.trim().toUpperCase(),
        price_rwf: Number(form.price_rwf),
        duration_years: Number(form.duration_years),
        active: form.active,
      };
      if (editing) {
        const { data } = await api.put(`/admin/certificate-types/${editing.id}`, payload);
        setMsg(data.message);
      } else {
        const { data } = await api.post('/admin/certificate-types', payload);
        setMsg(data.message);
      }
      setModalOpen(false);
      fetchTypes();
    } catch (e: unknown) {
      setErr((e as { response?: { data?: { message?: string } } })?.response?.data?.message || (e instanceof Error ? e.message : 'Failed to save'));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (t: CertType) => {
    setErr(''); setMsg('');
    try {
      const { data } = await api.put(`/admin/certificate-types/${t.id}`, {
        code: t.code,
        name: t.name,
        description: t.description,
        category: t.category,
        price_rwf: t.price_rwf,
        duration_years: t.duration_years,
        active: t.active ? 0 : 1,
      });
      setMsg(data.message);
      fetchTypes();
    } catch (e: unknown) {
      setErr((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update');
    }
  };

  const remove = async (t: CertType) => {
    if (!confirm(`Delete certificate type "${t.name}"?`)) return;
    setErr(''); setMsg('');
    try {
      const { data } = await api.delete(`/admin/certificate-types/${t.id}`);
      setMsg(data.message);
      fetchTypes();
    } catch (e: unknown) {
      setErr((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to delete');
    }
  };

  const catColor = (c: string) => {
    const m: Record<string, string> = { broker: '#0f1e42', ambassador: '#E85D04', supplier: '#059669' };
    return m[c] || '#6b7280';
  };

  return (
    <div className="p-4 lg:p-8 animate-fadeInUp">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${BRAND.orange}15` }}>
            <Award size={18} style={{ color: BRAND.orange }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Certificate Types</h1>
            <p className="text-sm text-gray-600 mt-0.5">Manage the certificates users can purchase</p>
          </div>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-lg text-white transition hover:opacity-90"
          style={{ background: `linear-gradient(135deg, ${BRAND.navy}, ${BRAND.navyLight})` }}>
          <Plus size={14} /> New Certificate Type
        </button>
      </div>

      {msg && <div className="bg-green-900/30 border border-green-700/50 text-green-400 text-sm rounded-lg px-4 py-3 mb-4">{msg}</div>}
      {err && <div className="bg-red-900/30 border border-red-700/50 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">{err}</div>}

      <div className="rounded-xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200" style={{ background: '#f0f2f5' }}>
                <th className="px-4 py-3 text-left text-gray-500 text-xs uppercase font-semibold tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-gray-500 text-xs uppercase font-semibold tracking-wider">Code</th>
                <th className="px-4 py-3 text-center text-gray-500 text-xs uppercase font-semibold tracking-wider">Category</th>
                <th className="px-4 py-3 text-right text-gray-500 text-xs uppercase font-semibold tracking-wider">Price</th>
                <th className="px-4 py-3 text-center text-gray-500 text-xs uppercase font-semibold tracking-wider">Validity</th>
                <th className="px-4 py-3 text-center text-gray-500 text-xs uppercase font-semibold tracking-wider">Status</th>
                <th className="px-4 py-3 text-center text-gray-500 text-xs uppercase font-semibold tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-600">Loading...</td></tr>
              ) : types.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-600">No certificate types. Create your first one.</td></tr>
              ) : types.map(t => (
                <tr key={t.id} className={`hover:bg-gray-50 transition ${t.active ? '' : 'opacity-50'}`}>
                  <td className="px-4 py-3.5">
                    <p className="font-medium text-gray-800">{t.name}</p>
                    <p className="text-[11px] text-gray-400 max-w-xs truncate">{t.description}</p>
                  </td>
                  <td className="px-4 py-3.5"><span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{t.code}</span></td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase"
                      style={{ background: `${catColor(t.category)}18`, color: catColor(t.category) }}>
                      {t.category}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right font-bold text-gray-800">{format(t.price_rwf)}</td>
                  <td className="px-4 py-3.5 text-center text-gray-600">{t.duration_years} yr{t.duration_years > 1 ? 's' : ''}</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${t.active ? 'bg-green-500/10 text-green-600' : 'bg-gray-500/10 text-gray-500'}`}>
                      {t.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => toggleActive(t)} title={t.active ? 'Deactivate' : 'Activate'}
                        className="p-2 rounded-lg border transition hover:bg-gray-50"
                        style={{ borderColor: t.active ? '#059669' : '#d0d7de', color: t.active ? '#059669' : '#6e7781' }}>
                        {t.active ? <Check size={14} /> : <X size={14} />}
                      </button>
                      <button onClick={() => openEdit(t)} title="Edit"
                        className="p-2 rounded-lg border transition hover:bg-gray-50"
                        style={{ borderColor: '#d0d7de', color: '#6e7781' }}>
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => remove(t)} title="Delete"
                        className="p-2 rounded-lg border transition hover:bg-red-50"
                        style={{ borderColor: '#d0d7de', color: '#dc2626' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setModalOpen(false)}>
          <div className="rounded-2xl max-w-lg w-full p-6 shadow-xl" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900">{editing ? 'Edit Certificate Type' : 'New Certificate Type'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-600 hover:text-gray-700 text-xl">&times;</button>
            </div>

            {err && <div className="bg-red-900/30 border border-red-700/50 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">{err}</div>}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Code *</label>
                  <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. BROKER"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Category *</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value as CertType['category'] })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white">
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Certified Broker"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="What this certificate authorizes or represents"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Price (RWF) *</label>
                  <input type="number" min={0} value={form.price_rwf} onChange={e => setForm({ ...form, price_rwf: Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Validity (years)</label>
                  <input type="number" min={1} value={form.duration_years} onChange={e => setForm({ ...form, duration_years: Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={!!form.active} onChange={e => setForm({ ...form, active: e.target.checked ? 1 : 0 })}
                      className="w-4 h-4 accent-[#E85D04]" />
                    <span className="text-xs font-medium text-gray-600">Active</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={() => setModalOpen(false)}
                  className="text-sm font-medium px-4 py-2.5 rounded-lg border transition hover:bg-gray-50"
                  style={{ color: '#6b7280', borderColor: '#d1d5db' }}>
                  Cancel
                </button>
                <button onClick={save} disabled={saving}
                  className="flex-1 text-sm font-bold px-4 py-2.5 rounded-lg text-white transition hover:opacity-90"
                  style={{ background: BRAND.orange }}>
                  {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Type'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
