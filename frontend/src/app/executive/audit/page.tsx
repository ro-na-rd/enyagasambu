'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { FileText, Clock, Shield, Filter, Sparkles, Calendar } from '@/lib/icons';

const BRAND = {
  navy: '#0f1e42',
  navyLight: '#1a2d5a',
  navyDark: '#0a1430',
  orange: '#E85D04',
  orangeLight: '#FF8A3D',
  orangeDark: '#c44d00',
};

interface AuditEntry {
  id: number;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  module: string;
  record_id: string | number;
  ip_address: string;
}

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (roleFilter) params.role = roleFilter;
    if (actionFilter) params.action = actionFilter;

    api.get('/executive/audit-log', { params })
      .then(({ data }) => setEntries(data.entries || data))
      .finally(() => setLoading(false));
  }, [roleFilter, actionFilter]);

  const uniqueRoles = [...new Set(entries.map(e => e.role))].filter(Boolean);
  const uniqueActions = [...new Set(entries.map(e => e.action))].filter(Boolean);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 rounded-2xl" style={{ background: '#ffffff' }} />
        <div className="h-12 rounded-2xl" style={{ background: '#ffffff' }} />
        <div className="space-y-2">
          {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-16 rounded-xl" style={{ background: '#ffffff' }} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px] animate-fadeInUp">

      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl p-6 lg:p-8"
        style={{ background: `linear-gradient(135deg, ${BRAND.navyDark} 0%, ${BRAND.navy} 50%, #1a2d5a 100%)` }}>
        <div className="absolute top-0 right-0 w-72 h-72 opacity-15"
          style={{ background: `radial-gradient(circle, ${BRAND.orange}, transparent 70%)`, transform: 'translate(30%, -30%)' }} />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={18} style={{ color: BRAND.orange }} />
              <span className="text-xs font-bold tracking-widest uppercase" style={{ color: `${BRAND.orange}bb` }}>Audit Log</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white mb-1 tracking-tight">System Audit Trail</h1>
            <p className="text-sm text-white/40">Track all system actions and changes.</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10">
            <Calendar size={14} className="text-white/50" />
            <span className="text-xs font-medium text-white/60">
              {entries.length} entries
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl"
        style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-700" />
          <span className="text-[13px] font-semibold text-gray-700">Filters:</span>
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
          className="border rounded-xl px-3 py-1.5 text-xs font-medium text-gray-500 focus:outline-none focus:ring-2"
          style={{ background: '#f6f8fa', borderColor: '#d0d7de' }}>
          <option value="">All Roles</option>
          {uniqueRoles.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}
          className="border rounded-xl px-3 py-1.5 text-xs font-medium text-gray-500 focus:outline-none focus:ring-2"
          style={{ background: '#f6f8fa', borderColor: '#d0d7de' }}>
          <option value="">All Actions</option>
          {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        {(roleFilter || actionFilter) && (
          <button onClick={() => { setRoleFilter(''); setActionFilter(''); }}
            className="text-[11px] font-bold px-3 py-1 rounded-lg transition"
            style={{ color: BRAND.orange, background: `${BRAND.orange}10` }}>
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <FileText size={40} className="text-gray-700 mb-3" />
            <p className="text-sm text-gray-600">No audit entries found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                  <th className="px-5 py-3 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Timestamp</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Actor</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Module</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Record ID</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">IP Address</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b last:border-0 hover:bg-gray-50 transition"
                    style={{ borderColor: 'rgba(0,0,0,0.03)' }}>
                    <td className="px-5 py-3 text-[12px] text-gray-600 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} className="text-gray-700" />
                        {new Date(entry.timestamp).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[12px] font-medium text-gray-800">{entry.actor}</td>
                    <td className="px-5 py-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize"
                        style={{ background: `${BRAND.navy}15`, color: BRAND.navy }}>
                        {entry.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[12px] text-gray-600">{entry.action}</td>
                    <td className="px-5 py-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: `${BRAND.orange}15`, color: BRAND.orange }}>
                        {entry.module}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[12px] text-gray-600">{entry.record_id}</td>
                    <td className="px-5 py-3 text-[12px] text-gray-600 font-mono">{entry.ip_address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
