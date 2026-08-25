'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import {
  CheckCircle, Ban, FileText, Clock, Shield, AlertTriangle,
  Sparkles, Calendar
} from '@/lib/icons';

const BRAND = {
  navy: '#0f1e42',
  navyLight: '#1a2d5a',
  navyDark: '#0a1430',
  orange: '#E85D04',
  orangeLight: '#FF8A3D',
  orangeDark: '#c44d00',
};

interface Approval {
  id: number;
  type: string;
  title: string;
  description: string;
  requested_by: string;
  role: string;
  created_at: string;
  status: string;
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);

  const fetchApprovals = () => {
    api.get('/executive/approvals')
      .then(({ data }) => setApprovals(data.approvals || data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleReview = async (id: number, status: 'approved' | 'rejected') => {
    setProcessing(id);
    try {
      await api.post(`/executive/approvals/${id}/review`, { status });
      setApprovals(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error('Review failed:', err);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 rounded-2xl" style={{ background: '#ffffff' }} />
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-32 rounded-2xl" style={{ background: '#ffffff' }} />)}
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
              <span className="text-xs font-bold tracking-widest uppercase" style={{ color: `${BRAND.orange}bb` }}>Approvals</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white mb-1 tracking-tight">Pending Approvals</h1>
            <p className="text-sm text-white/40">Review and act on pending requests.</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10">
            <Clock size={14} className="text-white/50" />
            <span className="text-xs font-medium text-white/60">
              {approvals.length} pending
            </span>
          </div>
        </div>
      </div>

      {/* Approval Cards */}
      {approvals.length === 0 ? (
        <div className="rounded-2xl p-12 text-center"
          style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
          <CheckCircle size={48} className="mx-auto mb-4" style={{ color: '#2ea043' }} />
          <h3 className="text-lg font-bold text-gray-900 mb-1">All caught up!</h3>
          <p className="text-sm text-gray-600">No pending approvals at the moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {approvals.map((item) => (
            <div key={item.id}
              className="rounded-2xl p-6 transition-all hover:shadow-lg"
              style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${BRAND.orange}15`, color: BRAND.orange }}>
                  <FileText size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-[14px] font-bold text-gray-900">{item.title}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
                      style={{ background: `${BRAND.navy}15`, color: BRAND.navy }}>
                      {item.type}
                    </span>
                  </div>
                  <p className="text-[12px] text-gray-600 mb-2">{item.description}</p>
                  <div className="flex items-center gap-4 text-[11px] text-gray-600">
                    <span className="flex items-center gap-1">
                      <Shield size={12} className="text-gray-700" />
                      {item.requested_by} ({item.role})
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} className="text-gray-700" />
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleReview(item.id, 'approved')}
                    disabled={processing === item.id}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold transition-all hover:shadow-md disabled:opacity-50"
                    style={{ background: 'rgba(46,160,67,0.1)', color: '#2ea043' }}>
                    <CheckCircle size={14} />
                    Approve
                  </button>
                  <button
                    onClick={() => handleReview(item.id, 'rejected')}
                    disabled={processing === item.id}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold transition-all hover:shadow-md disabled:opacity-50"
                    style={{ background: 'rgba(248,81,73,0.1)', color: '#f85149' }}>
                    <Ban size={14} />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
