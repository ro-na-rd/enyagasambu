'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { Store, Loader2, BadgeCheck, Search } from '@/lib/icons';

const BRAND = {
  navy: '#0f1e42',
  orange: '#E85D04',
};

interface Supplier {
  id: number;
  name: string;
  email: string;
  phone: string;
  business_name: string | null;
  business_location: string | null;
  description: string | null;
  verified: number | boolean;
  created_at: string;
}

export default function AdminSuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/admin/suppliers');
      setSuppliers(data.suppliers);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleVerify = async (s: Supplier) => {
    setBusyId(s.id);
    setError('');
    try {
      await api.patch(`/admin/suppliers/${s.id}/verify`, { verified: !(s.verified === 1 || s.verified === true) });
      load();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update supplier');
    } finally {
      setBusyId(null);
    }
  };

  const filtered = suppliers.filter((s) =>
    !search ||
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    (s.business_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-8 animate-fadeInUp">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${BRAND.orange}15` }}>
            <Store size={18} style={{ color: BRAND.orange }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Suppliers</h1>
            <p className="text-sm text-gray-600 mt-0.5">Manage supplier accounts and verification</p>
          </div>
        </div>

        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Search size={14} />
          </div>
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search suppliers..."
            className="pl-9 pr-4 py-2 text-sm rounded-xl border focus:outline-none"
            style={{ background: '#f6f8fa', borderColor: '#d0d7de' }} />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm rounded-xl px-4 py-3 mb-4" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 size={20} className="animate-spin mr-2" /> Loading suppliers...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl py-20 text-center" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
          <Store size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">No suppliers found.</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                  <th className="px-5 py-3.5 font-bold">Business</th>
                  <th className="px-5 py-3.5 font-bold">Contact</th>
                  <th className="px-5 py-3.5 font-bold">Location</th>
                  <th className="px-5 py-3.5 font-bold">Status</th>
                  <th className="px-5 py-3.5 font-bold">Joined</th>
                  <th className="px-5 py-3.5 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((s) => {
                  const verified = s.verified === 1 || s.verified === true;
                  return (
                    <tr key={s.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-4">
                        <p className="text-sm font-bold text-gray-900">{s.business_name || s.name}</p>
                        <p className="text-xs text-gray-500">{s.name}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-gray-700">{s.email}</p>
                        <p className="text-xs text-gray-400">{s.phone}</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">{s.business_location || '—'}</td>
                      <td className="px-5 py-4">
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                          style={{ background: verified ? '#dcfce7' : '#fef3c7', color: verified ? '#059669' : '#d97706' }}>
                          {verified ? 'Verified' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500">{new Date(s.created_at).toLocaleDateString()}</td>
                      <td className="px-5 py-4 text-right">
                        <button onClick={() => toggleVerify(s)} disabled={busyId === s.id}
                          className="text-xs font-semibold px-3 py-2 rounded-lg text-white transition disabled:opacity-50 inline-flex items-center gap-1.5"
                          style={{ background: verified ? '#6b7280' : BRAND.orange }}>
                          {busyId === s.id ? <Loader2 size={12} className="animate-spin" /> : <BadgeCheck size={12} />}
                          {verified ? 'Unverify' : 'Verify'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
