'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

const ORG = '#E85D04';
const NAVY = '#0f1e42';

interface User { id: number; name: string; email: string; phone: string; coins: number; role: string; created_at: string; }

const roleColors: Record<string, string> = {
  user: 'bg-gray-100 text-gray-700',
  seller: 'bg-yellow-50 text-yellow-700',
  broker: 'bg-blue-50 text-blue-700',
  ambassador: 'bg-cyan-50 text-cyan-700',
  admin: 'bg-purple-50 text-purple-700',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [total, setTotal] = useState(0);
  const [fetching, setFetching] = useState(true);
  const [grantTarget, setGrantTarget] = useState<number | null>(null);
  const [grantAmount, setGrantAmount] = useState('');

  const load = (q = '', role = '') => {
    setFetching(true);
    const params = new URLSearchParams();
    if (q) params.set('search', q);
    if (role) params.set('role', role);
    api.get(`/admin/users?${params.toString()}`)
      .then(({ data }) => { setUsers(data.users); setTotal(data.total); })
      .finally(() => setFetching(false));
  };

  useEffect(() => { load(); }, []);

  const handleRole = async (userId: number, role: string) => {
    await api.patch(`/admin/users/${userId}/role`, { role });
    load(search, roleFilter);
  };

  const handleGrant = async (userId: number) => {
    if (!grantAmount) return;
    await api.post(`/admin/users/${userId}/coins`, { coins: grantAmount, reason: 'admin_grant' });
    setGrantTarget(null); setGrantAmount('');
    load(search, roleFilter);
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users <span className="text-gray-400 text-base font-normal">({total})</span></h1>
        <p className="text-sm text-gray-500 mt-1">Manage all platform users &mdash; assign roles, grant coins</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load(search, roleFilter)}
          placeholder="Search by name, email or phone…"
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px]"
        />
        <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); load(search, e.target.value); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">All Roles</option>
          <option value="user">User</option>
          <option value="seller">Seller</option>
          <option value="broker">Broker</option>
          <option value="ambassador">Ambassador</option>
          <option value="admin">Admin</option>
        </select>
        <button onClick={() => load(search, roleFilter)} className="bg-[#FF6B00] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#e05d00]">Search</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
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
                  <td className="px-4 py-3 text-center font-medium" style={{ color: ORG }}>🪙 {u.coins}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${roleColors[u.role] || 'bg-gray-100 text-gray-500'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-center flex-wrap">
                      <select
                        value={u.role}
                        onChange={(e) => handleRole(u.id, e.target.value)}
                        className="border border-gray-200 rounded px-2 py-1 text-xs"
                      >
                        <option value="user">User</option>
                        <option value="seller">Seller</option>
                        <option value="broker">Broker</option>
                        <option value="ambassador">Ambassador</option>
                        <option value="admin">Admin</option>
                      </select>
                      {grantTarget === u.id ? (
                        <div className="flex items-center gap-1">
                          <input type="number" value={grantAmount}
                            onChange={(e) => setGrantAmount(e.target.value)}
                            placeholder="coins" className="border rounded px-2 py-1 text-xs w-16" />
                          <button onClick={() => handleGrant(u.id)} className="text-green-600 text-xs font-semibold hover:underline">Grant</button>
                          <button onClick={() => setGrantTarget(null)} className="text-gray-400 text-xs hover:underline">X</button>
                        </div>
                      ) : (
                        <button onClick={() => setGrantTarget(u.id)} className="text-[#FF6B00] text-xs hover:underline">+ Coins</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
