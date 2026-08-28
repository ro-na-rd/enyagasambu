'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { UserPlus, Phone, Mail, Plus, Trash2 } from '@/lib/icons';

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: '#d97706', bg: '#fffbeb' },
  contacted: { label: 'Contacted', color: '#2563eb', bg: '#eff6ff' },
  interested: { label: 'Interested', color: '#7c3aed', bg: '#f5f3ff' },
  onboarded: { label: 'Onboarded', color: '#059669', bg: '#ecfdf5' },
  declined: { label: 'Declined', color: '#dc2626', bg: '#fef2f2' },
};

const typeConfig: Record<string, { label: string; color: string }> = {
  supplier: { label: 'Supplier', color: '#0f1e42' },
  vendor: { label: 'Vendor', color: '#7c3aed' },
  user: { label: 'User', color: '#059669' },
};

interface Recruitment {
  id: number;
  name: string;
  email: string;
  phone: string;
  type: string;
  status: string;
  notes: string;
  recruited_name: string;
  created_at: string;
}

export default function AmbassadorRecruitmentsPage() {
  const [recruitments, setRecruitments] = useState<Recruitment[]>([]);
  const [stats, setStats] = useState<{ total: number; suppliers: number; vendors: number; onboarded: number; pending: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', type: 'supplier', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const loadData = () => {
    Promise.all([
      api.get('/ambassador/recruitments'),
      api.get('/ambassador/recruitments/stats'),
    ])
      .then(([r, s]) => {
        setRecruitments(r.data.recruitments);
        setStats(s.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/ambassador/recruitments', form);
      setForm({ name: '', email: '', phone: '', type: 'supplier', notes: '' });
      setShowForm(false);
      loadData();
    } catch { }
    setSubmitting(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this recruitment record?')) return;
    await api.delete(`/ambassador/recruitments/${id}`);
    loadData();
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="grid gap-4">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recruitments</h1>
          <p className="text-sm text-gray-500 mt-1">Track suppliers and vendors you recruit</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-[#E85D04] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#c04a00] transition"
        >
          <Plus size={16} /> Add Recruitment
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Total', value: stats.total, color: NAVY },
            { label: 'Suppliers', value: stats.suppliers, color: '#0f1e42' },
            { label: 'Vendors', value: stats.vendors, color: '#7c3aed' },
            { label: 'Onboarded', value: stats.onboarded, color: '#059669' },
            { label: 'Pending', value: stats.pending, color: '#d97706' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-4">New Recruitment</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid lg:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Name *</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#E85D04] focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Type *</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#E85D04] focus:border-transparent outline-none">
                  <option value="supplier">Supplier</option>
                  <option value="vendor">Vendor</option>
                  <option value="user">User</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Email</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#E85D04] focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Phone</label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#E85D04] focus:border-transparent outline-none" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Notes</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#E85D04] focus:border-transparent outline-none" />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={submitting}
                className="bg-[#E85D04] text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-[#c04a00] transition disabled:opacity-50">
                {submitting ? 'Saving...' : 'Save Recruitment'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300 transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {recruitments.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
            <UserPlus size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-500">No recruitments yet</p>
            <p className="text-xs text-gray-400 mt-1">Start adding suppliers and vendors you recruit</p>
          </div>
        )}
        {recruitments.map((r) => {
          const st = statusConfig[r.status] || statusConfig.pending;
          const tp = typeConfig[r.type] || typeConfig.supplier;
          return (
            <div key={r.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                  style={{ background: tp.color }}>
                  {r.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{r.name}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                    <span className="capitalize">{tp.label}</span>
                    {r.email && <span className="flex items-center gap-1"><Mail size={12} />{r.email}</span>}
                    {r.phone && <span className="flex items-center gap-1"><Phone size={12} />{r.phone}</span>}
                  </div>
                  {r.notes && <p className="text-xs text-gray-400 mt-1 truncate">{r.notes}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: st.bg, color: st.color }}>
                  {st.label}
                </span>
                <button onClick={() => handleDelete(r.id)} className="text-gray-400 hover:text-red-500 transition p-1">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
