'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';

interface User { id: number; name: string; email: string; phone: string; coins: number; role: string; created_at: string; }

export default function AdminUsersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [fetching, setFetching] = useState(true);
  const [grantTarget, setGrantTarget] = useState<number | null>(null);
  const [grantAmount, setGrantAmount] = useState('');

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) router.push('/');
  }, [user, loading, router]);

  const load = (q = '') => {
    setFetching(true);
    api.get(`/admin/users?search=${q}`)
      .then(({ data }) => { setUsers(data.users); setTotal(data.total); })
      .finally(() => setFetching(false));
  };

  useEffect(() => { if (user?.role === 'admin') load(); }, [user]);

  const handleRole = async (userId: number, role: string) => {
    await api.patch(`/admin/users/${userId}/role`, { role });
    load(search);
  };

  const handleGrant = async (userId: number) => {
    if (!grantAmount) return;
    await api.post(`/admin/users/${userId}/coins`, { coins: grantAmount, reason: 'admin_grant' });
    setGrantTarget(null); setGrantAmount('');
    load(search);
  };

  if (loading) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-[#FF6B00] text-sm hover:underline">← Dashboard</Link>
        <h1 className="text-2xl font-bold text-gray-900">Users <span className="text-gray-400 text-base font-normal">({total})</span></h1>
      </div>

      <div className="flex gap-3 mb-5">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load(search)}
          placeholder="Search by name, email or phone…"
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none "
        />
        <button onClick={() => load(search)} className="bg-[#FF6B00] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#e05d00]">Search</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">User</th>
              <th className="text-left px-4 py-3">Phone</th>
              <th className="text-center px-4 py-3">Coins</th>
              <th className="text-center px-4 py-3">Role</th>
              <th className="text-center px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {fetching ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">Loading…</td></tr>
            ) : users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{u.name}</p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </td>
                <td className="px-4 py-3 text-gray-600">{u.phone || '—'}</td>
                <td className="px-4 py-3 text-center font-medium text-[#FF6B00]">🪙 {u.coins}</td>
                <td className="px-4 py-3 text-center">
                  <select
                    value={u.role}
                    onChange={(e) => handleRole(u.id, e.target.value)}
                    className="border border-gray-200 rounded px-2 py-1 text-xs"
                    disabled={u.id === user?.id}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-center">
                  {grantTarget === u.id ? (
                    <div className="flex items-center gap-1 justify-center">
                      <input
                        type="number"
                        value={grantAmount}
                        onChange={(e) => setGrantAmount(e.target.value)}
                        placeholder="coins"
                        className="border rounded px-2 py-1 text-xs w-20"
                      />
                      <button onClick={() => handleGrant(u.id)} className="text-green-600 text-xs font-semibold hover:underline">Grant</button>
                      <button onClick={() => setGrantTarget(null)} className="text-gray-400 text-xs hover:underline">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setGrantTarget(u.id)} className="text-[#FF6B00] text-xs hover:underline">+ Coins</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
