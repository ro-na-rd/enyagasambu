'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import api from '@/lib/api';
import Link from 'next/link';

interface Promo { id: number; code: string; discount_coins: number; max_uses: number; uses: number; expires_at: string | null; created_at: string; }
interface PromoForm { code: string; discount_coins: string; max_uses: string; expires_at: string; }

export default function AdminPromosPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [promos, setPromos] = useState<Promo[]>([]);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<PromoForm>();
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) router.push('/');
  }, [user, loading, router]);

  const loadPromos = () => api.get('/admin/promos').then(({ data }) => setPromos(data.promos));

  useEffect(() => { if (user?.role === 'admin') loadPromos(); }, [user]);

  const onSubmit = async (data: PromoForm) => {
    setMsg('');
    try {
      await api.post('/admin/promos', {
        code: data.code,
        discount_coins: parseInt(data.discount_coins),
        max_uses: parseInt(data.max_uses) || 100,
        expires_at: data.expires_at || null,
      });
      setMsg('✅ Promo code created');
      reset();
      loadPromos();
    } catch (err: unknown) {
      const m = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setMsg(`❌ ${m || 'Failed to create'}`);
    }
  };

  if (loading) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-[#FF6B00] text-sm hover:underline">← Dashboard</Link>
        <h1 className="text-2xl font-bold text-gray-900">Promo Codes</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5 mb-8">
        <h2 className="font-semibold text-gray-800 mb-4">Create Promo Code</h2>
        {msg && <p className="text-sm mb-3">{msg}</p>}
        <form onSubmit={handleSubmit(onSubmit)} className="grid sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Code</label>
            <input {...register('code', { required: true })} placeholder="SAVE200" className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none  uppercase" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Coins discount</label>
            <input type="number" {...register('discount_coins', { required: true })} placeholder="200" className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none " />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Max uses</label>
            <input type="number" {...register('max_uses')} placeholder="100" className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none " />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Expires (optional)</label>
            <input type="date" {...register('expires_at')} className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none " />
          </div>
          <button type="submit" disabled={isSubmitting} className="sm:col-span-4 bg-[#FF6B00] text-white font-semibold py-2.5 rounded-lg hover:bg-[#e05d00] disabled:opacity-60">
            {isSubmitting ? 'Creating…' : 'Create Code'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Code</th>
              <th className="text-center px-4 py-3">Coins</th>
              <th className="text-center px-4 py-3">Uses</th>
              <th className="text-center px-4 py-3">Max Uses</th>
              <th className="text-left px-4 py-3">Expires</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {promos.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono font-bold text-[#FF6B00]">{p.code}</td>
                <td className="px-4 py-3 text-center">🪙 {p.discount_coins}</td>
                <td className="px-4 py-3 text-center">{p.uses}</td>
                <td className="px-4 py-3 text-center">{p.max_uses}</td>
                <td className="px-4 py-3 text-gray-500">{p.expires_at ? new Date(p.expires_at).toLocaleDateString() : 'Never'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
