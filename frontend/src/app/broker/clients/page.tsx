'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { Plus, Search, Edit3, Trash2, X, Users, Loader2, AlertCircle, Phone, Mail, Calendar } from '@/lib/icons';

const ORG = '#E85D04';

interface Client {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  status: 'active' | 'inactive';
  deals: number;
  notes: string | null;
  created_at: string;
}

interface ClientForm {
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  deals: string;
  notes: string;
}

const emptyForm: ClientForm = { name: '', email: '', phone: '', status: 'active', deals: '0', notes: '' };

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

export default function BrokerClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [modal, setModal] = useState<null | 'add' | 'edit'>(null);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState<ClientForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleting, setDeleting] = useState<Client | null>(null);
  const [notice, setNotice] = useState('');

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/broker/clients');
      setClients(data.clients || []);
    } catch {
      setError('Could not load your clients. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openAdd = () => {
    setForm(emptyForm);
    setFormError('');
    setEditing(null);
    setModal('add');
  };

  const openEdit = (c: Client) => {
    setEditing(c);
    setForm({
      name: c.name,
      email: c.email || '',
      phone: c.phone || '',
      status: c.status,
      deals: String(c.deals || 0),
      notes: c.notes || '',
    });
    setFormError('');
    setModal('edit');
  };

  const set = (k: keyof ClientForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name.trim()) {
      setFormError('Client name is required.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        status: form.status,
        deals: parseInt(form.deals, 10) || 0,
        notes: form.notes.trim(),
      };
      if (modal === 'add') {
        const { data } = await api.post('/broker/clients', payload);
        setClients((prev) => [data.client, ...prev]);
        setNotice('Client added successfully.');
      } else if (editing) {
        const { data } = await api.put(`/broker/clients/${editing.id}`, payload);
        setClients((prev) => prev.map((c) => (c.id === editing.id ? data.client : c)));
        setNotice('Client updated successfully.');
      }
      setModal(null);
      setEditing(null);
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setSaving(true);
    try {
      await api.delete(`/broker/clients/${deleting.id}`);
      setClients((prev) => prev.filter((c) => c.id !== deleting.id));
      setNotice('Client removed.');
      setDeleting(null);
    } catch {
      setFormError('Could not remove the client. Please try again.');
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
          <h1 className="text-2xl font-bold text-gray-900">My Clients</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your client relationships.</p>
        </div>
        <button
          onClick={openAdd}
          className="bg-[#E85D04] text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-[#c04a00] transition inline-flex items-center gap-2"
        >
          <Plus size={16} /> Add Client
        </button>
      </div>

      {notice && (
        <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
          {notice}
        </div>
      )}

      {error && (
        <div className="mb-4 flex items-center justify-between text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <span>{error}</span>
          <button onClick={fetchClients} className="font-semibold underline">Retry</button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
          <div className="relative w-full max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients..."
              className="w-full pl-9 pr-3 border border-gray-300 rounded-lg py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E85D04]/40"
            />
          </div>
          <div className="flex items-center gap-2">
            {(['all', 'active', 'inactive'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition ${
                  statusFilter === s
                    ? 'bg-[#E85D04] text-white border-[#E85D04]'
                    : 'text-gray-500 border-gray-200 hover:border-gray-300'
                }`}
              >
                {s === 'all' ? 'All' : s[0].toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-16 text-gray-400">
              <Loader2 size={20} className="animate-spin" /> Loading clients…
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Users size={36} className="mb-3" />
              <p className="text-sm">
                {clients.length === 0 ? 'No clients yet. Add your first client.' : 'No clients match your search.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Deals</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                    <td className="px-4 py-3 text-gray-500">{c.email || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{c.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${c.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {c.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{c.deals}</td>
                    <td className="px-4 py-3 text-gray-400">{formatDate(c.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(c)}
                          className="p-2 text-gray-400 hover:text-[#E85D04] hover:bg-orange-50 rounded-lg transition"
                          title="Edit client"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => { setDeleting(c); setFormError(''); }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Remove client"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {(modal === 'add' || modal === 'edit') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => { if (!saving) { setModal(null); setEditing(null); } }} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{modal === 'add' ? 'Add Client' : 'Edit Client'}</h2>
              <button onClick={() => { if (!saving) { setModal(null); setEditing(null); } }} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition">
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
                <label className="block text-xs font-semibold text-gray-500 mb-1">Full name *</label>
                <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Alice Uwimana" className={field} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Email</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="alice@example.com" className={`${field} pl-9`} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Phone</label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+250 788 000 000" className={`${field} pl-9`} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
                  <select value={form.status} onChange={(e) => set('status', e.target.value)} className={field}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Deals</label>
                  <input value={form.deals} onChange={(e) => set('deals', e.target.value.replace(/[^0-9]/g, ''))} type="number" min="0" className={field} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} placeholder="Optional notes about this client" className={field} />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => { if (!saving) { setModal(null); setEditing(null); } }}
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
                {modal === 'add' ? 'Add Client' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => { if (!saving) setDeleting(null); }} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-5 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600 mb-3">
                <Trash2 size={22} />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Remove client?</h2>
              <p className="text-sm text-gray-500 mb-1">
                This will permanently remove <span className="font-semibold text-gray-800">{deleting.name}</span>.
              </p>
              {formError && <p className="text-xs text-red-600 mt-2">{formError}</p>}
            </div>
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => { if (!saving) setDeleting(null); }}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={saving}
                className="bg-red-600 text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-red-700 transition inline-flex items-center gap-2 disabled:opacity-60"
              >
                {saving && <Loader2 size={15} className="animate-spin" />}
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
