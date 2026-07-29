'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '@/lib/api';
import {
  CheckCircle, AlertCircle, Coins, Ticket, Plus, Search, Filter,
  Edit3, Trash2, X, Clock, Ban, CheckSquare
} from '@/lib/icons';

const BRAND = {
  navy: '#0f1e42',
  orange: '#E85D04',
  orangeDark: '#c44d00',
};

interface Promo {
  id: number; code: string; discount_coins: number; max_uses: number;
  uses: number; expires_at: string | null; created_at: string; status: string;
}
interface PromoForm { code: string; discount_coins: string; max_uses: string; expires_at: string; }

const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  active: { label: 'Active', icon: <CheckSquare size={12} />, color: '#2ea043', bg: 'rgba(46,160,67,0.1)' },
  expired: { label: 'Expired', icon: <Clock size={12} />, color: '#d29922', bg: 'rgba(210,153,34,0.1)' },
  depleted: { label: 'Depleted', icon: <Ban size={12} />, color: '#f85149', bg: 'rgba(248,81,73,0.1)' },
};

export default function AdminPromosPage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState<React.ReactNode>('');
  const [editModal, setEditModal] = useState<Promo | null>(null);
  const [editForm, setEditForm] = useState({ code: '', discount_coins: '', max_uses: '', expires_at: '' });
  const [editSaving, setEditSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<PromoForm>();

  const loadPromos = (q = '') => {
    const params = new URLSearchParams();
    if (q) params.set('search', q);
    api.get(`/admin/promos?${params.toString()}`).then(({ data }) => setPromos(data.promos));
  };
  useEffect(() => { loadPromos(); }, []);

  const handleSearch = () => { loadPromos(search); };

  const onSubmit = async (data: PromoForm) => {
    setMsg('');
    try {
      await api.post('/admin/promos', {
        code: data.code,
        discount_coins: parseInt(data.discount_coins),
        max_uses: parseInt(data.max_uses) || 100,
        expires_at: data.expires_at || null,
      });
      setMsg(<><CheckCircle size={14} className="inline" style={{ color: '#2ea043' }} /> Promo code created successfully</>);
      reset();
      loadPromos(search);
    } catch (err: unknown) {
      const m = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setMsg(<><AlertCircle size={14} className="inline" style={{ color: '#f85149' }} /> {m || 'Failed to create'}</>);
    }
  };

  const openEdit = (p: Promo) => {
    setEditModal(p);
    setEditForm({
      code: p.code,
      discount_coins: String(p.discount_coins),
      max_uses: String(p.max_uses),
      expires_at: p.expires_at ? p.expires_at.slice(0, 10) : '',
    });
  };

  const handleEdit = async () => {
    if (!editModal) return;
    setEditSaving(true);
    try {
      await api.put(`/admin/promos/${editModal.id}`, {
        code: editForm.code,
        discount_coins: parseInt(editForm.discount_coins),
        max_uses: parseInt(editForm.max_uses) || 100,
        expires_at: editForm.expires_at || null,
      });
      setEditModal(null);
      loadPromos(search);
    } catch (err: unknown) {
      const m = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setMsg(<><AlertCircle size={14} className="inline" style={{ color: '#f85149' }} /> {m || 'Failed to update'}</>);
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/admin/promos/${id}`);
      setDeleteConfirm(null);
      loadPromos(search);
    } catch (err: unknown) {
      const m = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setMsg(<><AlertCircle size={14} className="inline" style={{ color: '#f85149' }} /> {m || 'Failed to delete'}</>);
    }
  };

  const activeCount = promos.filter(p => p.status === 'active').length;
  const totalUses = promos.reduce((s, p) => s + p.uses, 0);
  const totalCoins = promos.reduce((s, p) => s + (p.uses * p.discount_coins), 0);

  return (
    <div className="p-4 lg:p-8 animate-fadeInUp">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${BRAND.orange}15` }}>
            <Ticket size={18} style={{ color: BRAND.orange }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Promo Codes</h1>
            <p className="text-sm text-gray-600 mt-0.5">Create and manage discount promo codes</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Active Codes', value: activeCount, icon: <CheckSquare size={18} />, gradient: 'linear-gradient(135deg, #059669, #047857)' },
          { label: 'Total Redemptions', value: totalUses, icon: <Ticket size={18} />, gradient: 'linear-gradient(135deg, #7c3aed, #6d28d9)' },
          { label: 'Coins Given Away', value: totalCoins.toLocaleString(), icon: <Coins size={18} />, gradient: `linear-gradient(135deg, ${BRAND.orange}, ${BRAND.orangeDark})` },
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

      <div className="rounded-2xl p-6 mb-6" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Create Promo Code</h2>
        {msg && <p className="text-sm mb-3 text-gray-700">{msg}</p>}
        <form onSubmit={handleSubmit(onSubmit)} className="grid sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Code</label>
            <input {...register('code', { required: true })} placeholder="SAVE200"
              className="border rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-orange-500/30 uppercase"
              style={{ background: '#f6f8fa', borderColor: '#d0d7de', color: '#1a1a1a' }} />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Coins discount</label>
            <input type="number" {...register('discount_coins', { required: true })} placeholder="200"
              className="border rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              style={{ background: '#f6f8fa', borderColor: '#d0d7de', color: '#1a1a1a' }} />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Max uses</label>
            <input type="number" {...register('max_uses')} placeholder="100"
              className="border rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              style={{ background: '#f6f8fa', borderColor: '#d0d7de', color: '#1a1a1a' }} />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Expires (optional)</label>
            <input type="date" {...register('expires_at')}
              className="border rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              style={{ background: '#f6f8fa', borderColor: '#d0d7de', color: '#1a1a1a', colorScheme: 'light' }} />
          </div>
          <button type="submit" disabled={isSubmitting}
            className="sm:col-span-4 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: `linear-gradient(135deg, ${BRAND.orange}, ${BRAND.orangeDark})` }}>
            {isSubmitting ? 'Creating...' : <><Plus size={16} /> Create Code</>}
          </button>
        </form>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search promo code..."
            className="border rounded-lg pl-9 pr-3 py-2 text-sm w-full"
            style={{ background: '#f6f8fa', borderColor: '#d0d7de', color: '#1a1a1a' }} />
        </div>
        <button onClick={handleSearch}
          className="text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          style={{ background: BRAND.orange }}>
          <Filter size={14} className="inline mr-1" /> Search
        </button>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200" style={{ background: '#f0f2f5' }}>
                <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase font-semibold tracking-wider">Code</th>
                <th className="text-center px-4 py-3 text-gray-500 text-xs uppercase font-semibold tracking-wider">Coins</th>
                <th className="text-center px-4 py-3 text-gray-500 text-xs uppercase font-semibold tracking-wider">Uses</th>
                <th className="text-center px-4 py-3 text-gray-500 text-xs uppercase font-semibold tracking-wider">Max Uses</th>
                <th className="text-center px-4 py-3 text-gray-500 text-xs uppercase font-semibold tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase font-semibold tracking-wider">Expires</th>
                <th className="text-center px-4 py-3 text-gray-500 text-xs uppercase font-semibold tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {promos.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-600 text-sm">No promo codes found</td></tr>
              ) : promos.map((p) => {
                const sc = statusConfig[p.status] || statusConfig.active;
                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3.5 font-mono font-bold" style={{ color: BRAND.orange }}>{p.code}</td>
                    <td className="px-4 py-3.5 text-center text-gray-800">
                      <Coins size={14} className="inline mr-1" style={{ color: BRAND.orange }} /> {p.discount_coins}
                    </td>
                    <td className="px-4 py-3.5 text-center text-gray-500">{p.uses}</td>
                    <td className="px-4 py-3.5 text-center text-gray-500">{p.max_uses}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: sc.bg, color: sc.color }}>
                        {sc.icon} {sc.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-600 text-xs">
                      {p.expires_at ? new Date(p.expires_at).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {deleteConfirm === p.id ? (
                          <>
                            <button onClick={() => handleDelete(p.id)}
                              className="text-xs font-semibold px-2 py-1 rounded text-white bg-red-500 hover:bg-red-600 transition">
                              Confirm
                            </button>
                            <button onClick={() => setDeleteConfirm(null)}
                              className="text-xs font-semibold px-2 py-1 rounded text-gray-600 hover:bg-gray-100 transition">
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => openEdit(p)}
                              className="p-1.5 rounded-lg transition hover:bg-gray-100" style={{ color: BRAND.navy }}>
                              <Edit3 size={15} />
                            </button>
                            <button onClick={() => setDeleteConfirm(p.id)}
                              className="p-1.5 rounded-lg transition hover:bg-red-50 text-red-500">
                              <Trash2 size={15} />
                            </button>
                          </>
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

      {editModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setEditModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fadeInUp"
            onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">Edit Promo Code</h3>
              <button onClick={() => setEditModal(null)} className="text-gray-400 hover:text-gray-600 transition p-1 rounded-lg hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Code</label>
                <input value={editForm.code} onChange={(e) => setEditForm({ ...editForm, code: e.target.value.toUpperCase() })}
                  className="border rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-orange-500/30 uppercase font-mono"
                  style={{ background: '#f6f8fa', borderColor: '#d0d7de', color: '#1a1a1a' }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Coins discount</label>
                  <input type="number" value={editForm.discount_coins}
                    onChange={(e) => setEditForm({ ...editForm, discount_coins: e.target.value })}
                    className="border rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                    style={{ background: '#f6f8fa', borderColor: '#d0d7de', color: '#1a1a1a' }} />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Max uses</label>
                  <input type="number" value={editForm.max_uses}
                    onChange={(e) => setEditForm({ ...editForm, max_uses: e.target.value })}
                    className="border rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                    style={{ background: '#f6f8fa', borderColor: '#d0d7de', color: '#1a1a1a' }} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Expires (optional)</label>
                <input type="date" value={editForm.expires_at}
                  onChange={(e) => setEditForm({ ...editForm, expires_at: e.target.value })}
                  className="border rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                  style={{ background: '#f6f8fa', borderColor: '#d0d7de', color: '#1a1a1a', colorScheme: 'light' }} />
              </div>
              <button onClick={handleEdit} disabled={editSaving}
                className="w-full text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-60"
                style={{ background: `linear-gradient(135deg, ${BRAND.orange}, ${BRAND.orangeDark})` }}>
                {editSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
