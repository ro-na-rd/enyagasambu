'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Coins, Search, Users as UsersIcon, Filter } from '@/lib/icons';

const ORG = '#E85D04';
const NAVY = '#0f1e42';

interface User { id: number; name: string; email: string; phone: string; coins: number; role: string; created_at: string; }

const roleColors: Record<string, string> = {
  user: 'bg-gray-500/10 text-gray-500',
  seller: 'bg-amber-500/10 text-amber-400',
  broker: 'bg-blue-500/10 text-blue-400',
  ambassador: 'bg-cyan-500/10 text-cyan-400',
  admin: 'bg-purple-500/10 text-purple-400',
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
    <div className="p-4 lg:p-8 animate-fadeInUp">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${ORG}15` }}>
            <UsersIcon size={18} style={{ color: ORG }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Users <span className="text-gray-600 text-base font-normal">({total})</span></h1>
            <p className="text-sm text-gray-600 mt-0.5">Manage all platform users &mdash; assign roles, grant coins</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load(search, roleFilter)}
            placeholder="Search by name, email or phone…"
            className="border rounded-lg pl-9 pr-3 py-2 text-sm w-full"
            style={{ background: '#f6f8fa', borderColor: '#d0d7de', color: '#1a1a1a' }}
          />
        </div>
        <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); load(search, e.target.value); }}
          className="border rounded-lg px-3 py-2 text-sm"
          style={{ background: '#f6f8fa', borderColor: '#d0d7de', color: '#1a1a1a' }}>
          <option value="">All Roles</option>
          <option value="user">User</option>
          <option value="seller">Seller</option>
          <option value="broker">Broker</option>
          <option value="ambassador">Ambassador</option>
          <option value="admin">Admin</option>
        </select>
        <button onClick={() => load(search, roleFilter)}
          className="text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          style={{ background: ORG }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#c44d00'}
          onMouseLeave={(e) => e.currentTarget.style.background = ORG}>
          <Filter size={14} className="inline mr-1" /> Filter
        </button>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200" style={{ background: '#f0f2f5' }}>
                <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase font-semibold tracking-wider">User</th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase font-semibold tracking-wider">Phone</th>
                <th className="text-center px-4 py-3 text-gray-500 text-xs uppercase font-semibold tracking-wider">Coins</th>
                <th className="text-center px-4 py-3 text-gray-500 text-xs uppercase font-semibold tracking-wider">Role</th>
                <th className="text-center px-4 py-3 text-gray-500 text-xs uppercase font-semibold tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {fetching ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-600">Loading…</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-600">No users found</td></tr>
              ) : users.map((u, idx) => (
                <tr key={u.id} className="hover:bg-gray-50 transition" style={{ animationDelay: `${idx * 0.03}s` }}>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ background: `linear-gradient(135deg, ${NAVY}, #0f1e42)` }}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{u.name}</p>
                        <p className="text-xs text-gray-600">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-gray-500">{u.phone || '—'}</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="font-semibold" style={{ color: ORG }}>
                      <Coins size={14} className="inline mr-0.5" /> {u.coins}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${roleColors[u.role] || 'bg-gray-500/10 text-gray-600'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2 justify-center flex-wrap">
                      <select
                        value={u.role}
                        onChange={(e) => handleRole(u.id, e.target.value)}
                        className="border rounded px-2 py-1 text-xs"
                        style={{ background: '#f6f8fa', borderColor: '#d0d7de', color: '#1a1a1a' }}>
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
                            placeholder="coins" className="border rounded px-2 py-1 text-xs w-16"
                            style={{ background: '#f6f8fa', borderColor: '#d0d7de', color: '#1a1a1a' }} />
                          <button onClick={() => handleGrant(u.id)} className="text-green-400 text-xs font-semibold hover:underline">Grant</button>
                          <button onClick={() => setGrantTarget(null)} className="text-gray-600 text-xs hover:underline">X</button>
                        </div>
                      ) : (
                        <button onClick={() => setGrantTarget(u.id)}
                          className="text-xs font-semibold hover:underline"
                          style={{ color: ORG }}>+ Coins</button>
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
