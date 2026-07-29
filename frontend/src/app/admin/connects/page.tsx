'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import {
  Phone, Search, Filter, Coins, Smartphone, Lock,
  Clock, CheckCircle, AlertCircle, AlertTriangle,
  User, Store, ChevronLeft, ChevronRight as ChevronRightIcon,
  Eye, Link as LinkIcon, Download, ExternalLink
} from '@/lib/icons';

const ORG = '#E85D04';
const NAVY = '#0f1e42';

interface Connect {
  id: number;
  buyer_id: number | null;
  listing_id: number;
  buyer_phone: string;
  buyer_name: string | null;
  buyer_email: string | null;
  seller_name: string;
  seller_phone: string;
  seller_email: string;
  listing_title: string;
  listing_price: number | null;
  listing_status: string;
  listing_type: string;
  connect_type: 'coin' | 'momo' | 'otp';
  status: string;
  sale_status: string;
  unlocked_at: string;
  expires_at?: string | null;
  amount_rwf?: number;
  payment_status?: string;
  otp_verified?: boolean;
}

interface ConnectStats {
  totalCoinConnects: number;
  totalMomoConnects: number;
  totalOtpConnects: number;
  pendingOtps: number;
  pendingPayments: number;
  totalAll: number;
  moMoRevenue: number;
}

interface SellerSummary {
  seller_id: number;
  seller_name: string;
  seller_phone: string;
  connect_count: number;
  sold_count: number;
  rented_count: number;
}

const typeConfig: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  coin: { label: 'Coin', icon: <Coins size={12} />, color: '#d29922', bg: 'rgba(210,153,34,0.1)' },
  momo: { label: 'MoMo', icon: <Smartphone size={12} />, color: '#2ea043', bg: 'rgba(46,160,67,0.1)' },
  otp: { label: 'OTP', icon: <Lock size={12} />, color: '#58a6ff', bg: 'rgba(88,166,255,0.1)' },
};

const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  active: { label: 'Active', icon: <CheckCircle size={12} />, color: '#2ea043', bg: 'rgba(46,160,67,0.1)' },
  permanent: { label: 'Permanent', icon: <CheckCircle size={12} />, color: '#2ea043', bg: 'rgba(46,160,67,0.1)' },
  completed: { label: 'Completed', icon: <CheckCircle size={12} />, color: '#2ea043', bg: 'rgba(46,160,67,0.1)' },
  expired: { label: 'Expired', icon: <Clock size={12} />, color: '#d29922', bg: 'rgba(210,153,34,0.1)' },
  pending: { label: 'Pending', icon: <AlertTriangle size={12} />, color: '#f0883e', bg: 'rgba(240,136,62,0.1)' },
  otp_pending: { label: 'OTP Pending', icon: <Lock size={12} />, color: '#58a6ff', bg: 'rgba(88,166,255,0.1)' },
  failed: { label: 'Failed', icon: <AlertCircle size={12} />, color: '#f85149', bg: 'rgba(248,81,73,0.1)' },
};

const saleStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Available', color: '#6e7781', bg: 'rgba(110,119,129,0.1)' },
  sold: { label: 'Sold', color: '#2ea043', bg: 'rgba(46,160,67,0.1)' },
  rented: { label: 'Rented', color: '#58a6ff', bg: 'rgba(88,166,255,0.1)' },
};

const listingStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: 'Active', color: '#2ea043', bg: 'rgba(46,160,67,0.1)' },
  sold: { label: 'Sold', color: '#d29922', bg: 'rgba(210,153,34,0.1)' },
  expired: { label: 'Expired', color: '#f85149', bg: 'rgba(248,81,73,0.1)' },
  disabled: { label: 'Disabled', color: '#6e7781', bg: 'rgba(110,119,129,0.1)' },
};

export default function AdminConnectsPage() {
  const [connects, setConnects] = useState<Connect[]>([]);
  const [stats, setStats] = useState<ConnectStats | null>(null);
  const [sellerSummary, setSellerSummary] = useState<SellerSummary[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [saleStatusFilter, setSaleStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [fetching, setFetching] = useState(true);
  const [detailModal, setDetailModal] = useState<Connect | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const load = useCallback((p = 1) => {
    setFetching(true);
    const params = new URLSearchParams();
    params.set('page', String(p));
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    if (typeFilter) params.set('type', typeFilter);
    if (saleStatusFilter) params.set('sale_status', saleStatusFilter);
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);
    api.get(`/admin/connects?${params.toString()}`)
      .then(({ data }) => {
        setConnects(data.connects);
        setTotal(data.total);
        setStats(data.stats);
        setSellerSummary(data.sellerSummary || []);
      })
      .finally(() => setFetching(false));
  }, [search, statusFilter, typeFilter, saleStatusFilter, dateFrom, dateTo]);

  useEffect(() => { load(); }, []);

  const handleSearch = () => { setPage(1); load(1); };
  const handleFilter = () => { setPage(1); load(1); };
  const handlePage = (p: number) => { setPage(p); load(p); };

  const handleSaleStatus = async (id: number, newStatus: string) => {
    setUpdatingId(id);
    try {
      await api.patch(`/admin/connects/${id}/sale-status`, { sale_status: newStatus });
      setConnects(prev => prev.map(c => c.id === id ? { ...c, sale_status: newStatus } : c));
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleExport = async () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    if (typeFilter) params.set('type', typeFilter);
    if (saleStatusFilter) params.set('sale_status', saleStatusFilter);
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);
    try {
      const { data } = await api.get(`/admin/connects/export?${params.toString()}`);
      const rows = data.connects;
      const csv = [
        'Buyer Name,Buyer Phone,Buyer Email,Seller Name,Seller Phone,Listing,Price,Type,Payment,Date,Listing Status,Sale Status',
        ...rows.map((r: Connect) =>
          `"${r.buyer_name || 'Guest'}","${r.buyer_phone}","${r.buyer_email || ''}","${r.seller_name}","${r.seller_phone}","${r.listing_title}","${r.listing_price || ''}","${r.connect_type}","${r.amount_rwf || '300 coins'}","${new Date(r.unlocked_at).toLocaleDateString()}","${r.listing_status}","${r.sale_status}"`
        )
      ].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `connects-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-4 lg:p-8 animate-fadeInUp">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.12)' }}>
            <LinkIcon size={18} style={{ color: '#7c3aed' }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Connects <span className="text-gray-600 text-base font-normal">({total})</span></h1>
            <p className="text-sm text-gray-600 mt-0.5">Buyer-seller connections &mdash; coin unlocks, MoMo payments, and OTP verifications</p>
          </div>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
          {[
            { label: 'Total Connects', value: stats.totalAll, icon: <LinkIcon size={18} />, gradient: 'linear-gradient(135deg, #7c3aed, #6d28d9)' },
            { label: 'Coin Unlocks', value: stats.totalCoinConnects, icon: <Coins size={18} />, gradient: 'linear-gradient(135deg, #d29922, #b8860b)' },
            { label: 'MoMo Payments', value: stats.totalMomoConnects, icon: <Smartphone size={18} />, gradient: 'linear-gradient(135deg, #059669, #047857)' },
            { label: 'OTP Verifications', value: stats.totalOtpConnects, icon: <Lock size={18} />, gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)' },
            { label: 'Pending Actions', value: stats.pendingOtps + stats.pendingPayments, icon: <AlertTriangle size={18} />, gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
            { label: 'MoMo Revenue', value: `${(stats.moMoRevenue || 0).toLocaleString()} RWF`, icon: <Coins size={18} />, gradient: 'linear-gradient(135deg, #10b981, #059669)' },
          ].map((card) => (
            <div key={card.label} className="relative overflow-hidden rounded-2xl p-4 text-white"
              style={{ background: card.gradient }}>
              <div className="absolute top-0 right-0 w-20 h-20 opacity-10"
                style={{ background: 'radial-gradient(circle, white, transparent 70%)', transform: 'translate(30%, -30%)' }} />
              <div className="relative z-10">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/15 mb-3">
                  {card.icon}
                </div>
                <p className="text-lg font-extrabold">{card.value}</p>
                <p className="text-[10px] font-medium text-white/60 mt-0.5">{card.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search buyer, seller, listing, phone..."
            className="border rounded-lg pl-9 pr-3 py-2 text-sm w-full"
            style={{ background: '#f6f8fa', borderColor: '#d0d7de', color: '#1a1a1a' }}
          />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); }}
          className="border rounded-lg px-3 py-2 text-sm"
          style={{ background: '#f6f8fa', borderColor: '#d0d7de', color: '#1a1a1a' }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="pending">Pending</option>
        </select>
        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); }}
          className="border rounded-lg px-3 py-2 text-sm"
          style={{ background: '#f6f8fa', borderColor: '#d0d7de', color: '#1a1a1a' }}>
          <option value="">All Types</option>
          <option value="coin">Coin Unlock</option>
          <option value="momo">MoMo Payment</option>
          <option value="otp">OTP Verify</option>
        </select>
        <select value={saleStatusFilter} onChange={(e) => { setSaleStatusFilter(e.target.value); }}
          className="border rounded-lg px-3 py-2 text-sm"
          style={{ background: '#f6f8fa', borderColor: '#d0d7de', color: '#1a1a1a' }}>
          <option value="">All Sale Status</option>
          <option value="pending">Available</option>
          <option value="sold">Sold</option>
          <option value="rented">Rented</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-600">From:</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
            style={{ background: '#f6f8fa', borderColor: '#d0d7de', color: '#1a1a1a', colorScheme: 'light' }} />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-600">To:</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
            style={{ background: '#f6f8fa', borderColor: '#d0d7de', color: '#1a1a1a', colorScheme: 'light' }} />
        </div>
        <button onClick={handleFilter}
          className="text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          style={{ background: ORG }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#c44d00'}
          onMouseLeave={(e) => e.currentTarget.style.background = ORG}>
          <Filter size={14} className="inline mr-1" /> Filter
        </button>
        <button onClick={handleExport}
          className="text-sm font-semibold px-4 py-2 rounded-lg transition border"
          style={{ borderColor: '#d0d7de', color: NAVY, background: '#fff' }}>
          <Download size={14} className="inline mr-1" /> Export CSV
        </button>
      </div>

      {sellerSummary.length > 0 && (
        <div className="mb-5 p-4 rounded-xl" style={{ background: '#f6f8fa', border: '1px solid #e1e4e8' }}>
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Seller Summary</h3>
          <div className="flex flex-wrap gap-3">
            {sellerSummary.slice(0, 10).map((s) => (
              <div key={s.seller_id} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                style={{ background: '#fff', border: '1px solid #e1e4e8' }}>
                <Store size={12} style={{ color: '#d29922' }} />
                <span className="font-semibold text-gray-800">{s.seller_name}</span>
                <span className="text-gray-500">({s.seller_phone})</span>
                <span className="text-gray-400">&mdash;</span>
                <span className="font-medium" style={{ color: NAVY }}>{s.connect_count} connects</span>
                {s.sold_count > 0 && <span className="text-green-600">{s.sold_count} sold</span>}
                {s.rented_count > 0 && <span className="text-blue-600">{s.rented_count} rented</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200" style={{ background: '#f0f2f5' }}>
                <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase font-semibold tracking-wider">#</th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase font-semibold tracking-wider">Listing</th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase font-semibold tracking-wider">Seller (Posted)</th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase font-semibold tracking-wider">Buyer (Viewed)</th>
                <th className="text-center px-4 py-3 text-gray-500 text-xs uppercase font-semibold tracking-wider">Type</th>
                <th className="text-center px-4 py-3 text-gray-500 text-xs uppercase font-semibold tracking-wider">Payment</th>
                <th className="text-center px-4 py-3 text-gray-500 text-xs uppercase font-semibold tracking-wider">Listing Status</th>
                <th className="text-center px-4 py-3 text-gray-500 text-xs uppercase font-semibold tracking-wider">Sale Status</th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase font-semibold tracking-wider">Date</th>
                <th className="text-center px-4 py-3 text-gray-500 text-xs uppercase font-semibold tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {fetching ? (
                <tr><td colSpan={10} className="text-center py-12 text-gray-600">Loading...</td></tr>
              ) : connects.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-12 text-gray-600">No connects found</td></tr>
              ) : connects.map((c, idx) => {
                const tc = typeConfig[c.connect_type] || typeConfig.coin;
                const sc = listingStatusConfig[c.listing_status] || listingStatusConfig.active;
                const ssc = saleStatusConfig[c.sale_status] || saleStatusConfig.pending;
                return (
                  <tr key={`${c.connect_type}-${c.id}`} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-gray-500 text-xs">{(page - 1) * 20 + idx + 1}</td>
                    <td className="px-4 py-3.5">
                      <Link href={`/listings/${c.listing_id}`} target="_blank"
                        className="group flex items-center gap-1.5 text-gray-800 hover:text-orange-600 transition">
                        <span className="font-medium truncate max-w-[160px]">{c.listing_title}</span>
                        <ExternalLink size={11} className="opacity-0 group-hover:opacity-100 transition shrink-0" />
                      </Link>
                      {c.listing_price != null && (
                        <p className="text-xs text-gray-600">{Number(c.listing_price).toLocaleString()} RWF</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <Store size={11} className="text-amber-500 shrink-0" />
                        <div>
                          <p className="font-medium text-gray-800 text-xs">{c.seller_name}</p>
                          <p className="text-[11px] text-gray-600">{c.seller_phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                          style={{ background: `linear-gradient(135deg, ${NAVY}, #0f1e42)` }}>
                          {(c.buyer_name || 'G').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 text-xs">{c.buyer_name || 'Guest'}</p>
                          <p className="text-[11px] text-gray-600">{c.buyer_phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: tc.bg, color: tc.color }}>
                        {tc.icon} {tc.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <p className="text-xs font-medium text-gray-800">
                        {c.connect_type === 'momo' ? `${c.amount_rwf?.toLocaleString()} RWF` : '300 coins'}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: sc.bg, color: sc.color }}>
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <select
                        value={c.sale_status}
                        onChange={(e) => handleSaleStatus(c.id, e.target.value)}
                        disabled={updatingId === c.id}
                        className="text-[10px] font-semibold px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-300"
                        style={{ background: ssc.bg, color: ssc.color }}>
                        <option value="pending">Available</option>
                        <option value="sold">Sold</option>
                        <option value="rented">Rented</option>
                      </select>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-xs text-gray-600">
                        {new Date(c.unlocked_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {new Date(c.unlocked_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button onClick={() => setDetailModal(c)}
                        className="p-1.5 rounded-lg transition hover:bg-gray-100"
                        style={{ color: NAVY }}>
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-xs text-gray-600">
              Showing {((page - 1) * 20) + 1}-{Math.min(page * 20, total)} of {total}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => handlePage(page - 1)} disabled={page <= 1}
                className="p-1.5 rounded-lg transition disabled:opacity-30 hover:bg-gray-100">
                <ChevronLeft size={16} className="text-gray-600" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p = page <= 3 ? i + 1 : page + i - 2;
                if (p < 1 || p > totalPages) return null;
                return (
                  <button key={p} onClick={() => handlePage(p)}
                    className="w-8 h-8 rounded-lg text-xs font-semibold transition"
                    style={p === page ? { background: ORG, color: 'white' } : { color: '#6e7781' }}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => handlePage(page + 1)} disabled={page >= totalPages}
                className="p-1.5 rounded-lg transition disabled:opacity-30 hover:bg-gray-100">
                <ChevronRightIcon size={16} className="text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {detailModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setDetailModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fadeInUp"
            onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200"
              style={{ background: 'linear-gradient(135deg, #f8f9fa, #ffffff)' }}>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900">Connection Details</h3>
                <button onClick={() => setDetailModal(null)}
                  className="text-gray-400 hover:text-gray-600 transition p-1 rounded-lg hover:bg-gray-100">
                  <AlertCircle size={18} />
                </button>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                  style={{ background: typeConfig[detailModal.connect_type]?.bg, color: typeConfig[detailModal.connect_type]?.color }}>
                  {typeConfig[detailModal.connect_type]?.icon} {typeConfig[detailModal.connect_type]?.label}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                  style={{ background: saleStatusConfig[detailModal.sale_status]?.bg, color: saleStatusConfig[detailModal.sale_status]?.color }}>
                  {saleStatusConfig[detailModal.sale_status]?.label}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                  style={{ background: listingStatusConfig[detailModal.listing_status]?.bg, color: listingStatusConfig[detailModal.listing_status]?.color }}>
                  {listingStatusConfig[detailModal.listing_status]?.label}
                </span>
              </div>

              <div className="rounded-xl p-4" style={{ background: '#f6f8fa', border: '1px solid #e1e4e8' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Store size={14} style={{ color: '#d29922' }} />
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Seller (Posted)</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">{detailModal.seller_name}</p>
                <p className="text-xs text-gray-600 mt-0.5">{detailModal.seller_phone}</p>
                {detailModal.seller_email && (
                  <p className="text-xs text-gray-600">{detailModal.seller_email}</p>
                )}
              </div>

              <div className="rounded-xl p-4" style={{ background: '#f6f8fa', border: '1px solid #e1e4e8' }}>
                <div className="flex items-center gap-2 mb-2">
                  <User size={14} style={{ color: NAVY }} />
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Buyer (Viewed)</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">{detailModal.buyer_name || 'Guest User'}</p>
                <p className="text-xs text-gray-600 mt-0.5">{detailModal.buyer_phone}</p>
                {detailModal.buyer_email && (
                  <p className="text-xs text-gray-600">{detailModal.buyer_email}</p>
                )}
              </div>

              <div className="rounded-xl p-4" style={{ background: '#f6f8fa', border: '1px solid #e1e4e8' }}>
                <div className="flex items-center gap-2 mb-2">
                  <LinkIcon size={14} style={{ color: ORG }} />
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Listing</span>
                </div>
                <Link href={`/listings/${detailModal.listing_id}`} target="_blank"
                  className="text-sm font-semibold text-orange-600 hover:underline">
                  {detailModal.listing_title}
                </Link>
                {detailModal.listing_price != null && (
                  <p className="text-xs text-gray-600 mt-0.5">{Number(detailModal.listing_price).toLocaleString()} RWF</p>
                )}
              </div>

              {detailModal.connect_type === 'momo' && (
                <div className="rounded-xl p-4" style={{ background: 'rgba(46,160,67,0.05)', border: '1px solid rgba(46,160,67,0.15)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Smartphone size={14} style={{ color: '#059669' }} />
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Payment</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">Amount</p>
                      <p className="text-sm font-bold" style={{ color: '#059669' }}>{detailModal.amount_rwf?.toLocaleString()} RWF</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">Payment Status</p>
                      <p className="text-sm font-semibold text-gray-800 capitalize">{detailModal.payment_status}</p>
                    </div>
                  </div>
                </div>
              )}

              {detailModal.connect_type === 'coin' && detailModal.expires_at && (
                <div className="rounded-xl p-4" style={{ background: 'rgba(210,153,34,0.05)', border: '1px solid rgba(210,153,34,0.15)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Coins size={14} style={{ color: '#d29922' }} />
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Coin Unlock</span>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase">Expires At</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {new Date(detailModal.expires_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              <div className="rounded-xl p-4" style={{ background: '#f6f8fa', border: '1px solid #e1e4e8' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Phone size={14} style={{ color: '#7c3aed' }} />
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Contact Used</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">{detailModal.buyer_phone}</p>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-gray-200">
                <Clock size={12} />
                <span>Connected: {new Date(detailModal.unlocked_at).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
