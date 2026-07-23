'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '@/lib/api';
import { CheckCircle, AlertCircle, Coins, Ticket, Plus } from '@/lib/icons';

const BRAND = {
  navy: '#0f1e42',
  orange: '#E85D04',
  orangeDark: '#c44d00',
};

interface Promo { id: number; code: string; discount_coins: number; max_uses: number; uses: number; expires_at: string | null; created_at: string; }
interface PromoForm { code: string; discount_coins: string; max_uses: string; expires_at: string; }

export default function AdminPromosPage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<PromoForm>();
  const [msg, setMsg] = useState<React.ReactNode>('');

  const loadPromos = () => api.get('/admin/promos').then(({ data }) => setPromos(data.promos));
  useEffect(() => { loadPromos(); }, []);

  const onSubmit = async (data: PromoForm) => {
    setMsg('');
    try {
      await api.post('/admin/promos', {
        code: data.code,
        discount_coins: parseInt(data.discount_coins),
        max_uses: parseInt(data.max_uses) || 100,
        expires_at: data.expires_at || null,
      });
      setMsg(<><CheckCircle size={14} className="inline" style={{ color: '#2ea043' }} /> Promo code created</>);
      reset();
      loadPromos();
    } catch (err: unknown) {
      const m = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setMsg(<><AlertCircle size={14} className="inline" style={{ color: '#f85149' }} /> {m || 'Failed to create'}</>);
    }
  };

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

      <div className="rounded-2xl p-6 mb-8" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
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
            className="sm:col-span-4 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-60"
            style={{ background: `linear-gradient(135deg, ${BRAND.orange}, ${BRAND.orangeDark})` }}>
            {isSubmitting ? 'Creating…' : 'Create Code'}
          </button>
        </form>
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
                <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase font-semibold tracking-wider">Expires</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {promos.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3.5 font-mono font-bold" style={{ color: BRAND.orange }}>{p.code}</td>
                  <td className="px-4 py-3.5 text-center text-gray-800">
                    <Coins size={14} className="inline mr-1" style={{ color: BRAND.orange }} /> {p.discount_coins}
                  </td>
                  <td className="px-4 py-3.5 text-center text-gray-500">{p.uses}</td>
                  <td className="px-4 py-3.5 text-center text-gray-500">{p.max_uses}</td>
                  <td className="px-4 py-3.5 text-gray-600">{p.expires_at ? new Date(p.expires_at).toLocaleDateString() : 'Never'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {promos.length === 0 && <p className="text-center py-8 text-gray-600 text-sm">No promo codes yet</p>}
      </div>
    </div>
  );
}
