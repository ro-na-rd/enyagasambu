'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { AlertOctagon, Check, X, Eye, Search, Loader2, Package } from '@/lib/icons';
import Link from 'next/link';

const BRAND = {
  navy: '#0f1e42',
  navyDark: '#0a1430',
  orange: '#E85D04',
  orangeDark: '#c44d00',
};

const STATUS_COLORS: Record<string, string> = {
  open: '#d97706',
  reviewing: '#2563eb',
  actioned: '#059669',
  dismissed: '#6b7280',
};

interface Report {
  id: number;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  listing_id: number;
  listing_title: string;
  reporter_name: string | null;
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/reports', { params: statusFilter ? { status: statusFilter } : {} });
      setReports(data.reports);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (report: Report, status: string, disableListing = false) => {
    setBusyId(report.id);
    setError('');
    try {
      await api.patch(`/reports/${report.id}`, { status, disableListing });
      load();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update report');
    } finally {
      setBusyId(null);
    }
  };

  const filterTabs = ['', 'open', 'reviewing', 'actioned', 'dismissed'];

  return (
    <div className="p-4 lg:p-8 animate-fadeInUp">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${BRAND.orange}15` }}>
            <AlertOctagon size={18} style={{ color: BRAND.orange }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Moderation Queue</h1>
            <p className="text-sm text-gray-600 mt-0.5">Review user reports and take action on flagged listings</p>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {filterTabs.map((s) => (
          <button key={s || 'all'} onClick={() => setStatusFilter(s)}
            className={`text-xs font-semibold px-4 py-2 rounded-lg capitalize transition ${statusFilter === s ? 'text-white' : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-50'}`}
            style={statusFilter === s ? { background: BRAND.navy } : {}}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm rounded-xl px-4 py-3 mb-4" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
          <AlertOctagon size={16} /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 size={20} className="animate-spin mr-2" /> Loading reports...
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-2xl py-20 text-center" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
          <Package size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">No reports found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="rounded-2xl p-5" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full capitalize" style={{ background: `${STATUS_COLORS[r.status]}15`, color: STATUS_COLORS[r.status] }}>
                      {r.status}
                    </span>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full capitalize bg-gray-100 text-gray-600">{r.reason}</span>
                    <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleString()}</span>
                  </div>
                  <Link href={`/listings/${r.listing_id}`} className="block text-sm font-bold text-gray-900 mt-2 hover:underline">
                    #{r.listing_id} — {r.listing_title}
                  </Link>
                  {r.details && <p className="text-sm text-gray-600 mt-1">{r.details}</p>}
                  <p className="text-xs text-gray-400 mt-1.5">
                    {r.reporter_name ? `Reported by ${r.reporter_name}` : 'Reported anonymously'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {r.status !== 'reviewing' && (
                    <button onClick={() => updateStatus(r, 'reviewing')} disabled={busyId === r.id}
                      className="text-xs font-semibold px-3 py-2 rounded-lg text-white transition disabled:opacity-50 flex items-center gap-1.5"
                      style={{ background: '#2563eb' }}>
                      <Eye size={12} /> Reviewing
                    </button>
                  )}
                  {r.status !== 'dismissed' && (
                    <button onClick={() => updateStatus(r, 'dismissed')} disabled={busyId === r.id}
                      className="text-xs font-semibold px-3 py-2 rounded-lg transition disabled:opacity-50 flex items-center gap-1.5"
                      style={{ background: '#f3f4f6', color: '#374151' }}>
                      <X size={12} /> Dismiss
                    </button>
                  )}
                  {r.status !== 'actioned' && (
                    <button onClick={() => updateStatus(r, 'actioned', true)} disabled={busyId === r.id}
                      className="text-xs font-semibold px-3 py-2 rounded-lg text-white transition disabled:opacity-50 flex items-center gap-1.5"
                      style={{ background: '#dc2626' }}>
                      <Check size={12} /> Action & Disable
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
