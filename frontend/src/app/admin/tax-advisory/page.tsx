'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface Request {
  id: number;
  reference: string;
  full_name: string;
  email: string;
  phone: string;
  customer_type: string;
  description: string;
  urgency: string;
  status: string;
  services: string[];
  assigned_to_name?: string;
  approved_at?: string | null;
  created_at: string;
}

interface Specialist { id: number; username: string; email?: string; phone?: string; }
type ApiError = { response?: { data?: { message?: unknown } } };

function errorMessage(error: unknown, fallback: string) {
  const message = (error as ApiError)?.response?.data?.message;
  return typeof message === 'string' ? message : fallback;
}

const statusStyle: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700', under_review: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700', awaiting_documents: 'bg-orange-100 text-orange-700',
  scheduled: 'bg-purple-100 text-purple-700', in_progress: 'bg-cyan-100 text-cyan-700',
  resolved: 'bg-emerald-100 text-emerald-700', closed: 'bg-gray-100 text-gray-700',
};

export default function TaxAdvisoryAdminPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [requests, setRequests] = useState<Request[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [selected, setSelected] = useState<Request | null>(null);
  const [specialistId, setSpecialistId] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [requestResponse, specialistResponse] = await Promise.all([
        api.get('/tax-advisory'),
        isAdmin ? api.get('/tax-advisory/specialists/list') : Promise.resolve({ data: { specialists: [] } }),
      ]);
      setRequests(requestResponse.data || []);
      setSpecialists(specialistResponse.data.specialists || []);
    } catch (err: unknown) {
      setError(errorMessage(err, 'Unable to load tax advisory requests.'));
    } finally { setLoading(false); }
  }, [isAdmin]);

  useEffect(() => { if (user) load(); }, [user, load]);

  const pendingCount = useMemo(() => requests.filter((r) => ['new', 'under_review'].includes(r.status)).length, [requests]);

  const approve = async () => {
    if (!selected || !specialistId) { setError('Select a Tax Advisory Client Support Specialist first.'); return; }
    setSaving(true); setError('');
    try {
      await api.patch(`/tax-advisory/${selected.id}/approve`, { specialistId: Number(specialistId), note });
      setMessage(`${selected.reference} was approved and assigned.`);
      setSelected(null); setSpecialistId(''); setNote('');
      await load();
    } catch (err: unknown) { setError(errorMessage(err, 'Approval failed.')); }
    finally { setSaving(false); }
  };

  const updateStatus = async (request: Request, status: string) => {
    setSaving(true); setError('');
    try {
      await api.patch(`/tax-advisory/${request.id}/status`, { status });
      setMessage(`${request.reference} updated to ${status.replace(/_/g, ' ')}.`);
      await load();
    } catch (err: unknown) { setError(errorMessage(err, 'Could not update request status.')); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div><p className="text-xs font-bold tracking-widest uppercase text-[#E85D04]">Client workflow</p><h1 className="text-2xl font-extrabold text-[#0f1e42]">Tax Advisory Requests</h1><p className="text-sm text-gray-500 mt-1">{isAdmin ? `${pendingCount} request(s) awaiting review or approval.` : 'Your approved client support requests.'}</p></div>
        <button onClick={load} disabled={loading} className="rounded-xl bg-[#0f1e42] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">Refresh</button>
      </div>
      {message && <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700">{message}</div>}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</div>}
      {isAdmin && specialists.length === 0 && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Create an active staff account with the executive role <strong>Tax Advisory Client Support Specialist</strong> before approving a request.</div>}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500"><tr><th className="px-5 py-3">Client</th><th className="px-5 py-3">Request</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Assigned to</th><th className="px-5 py-3">Received</th><th className="px-5 py-3 text-right">Action</th></tr></thead><tbody className="divide-y divide-gray-100">
          {loading ? <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-500">Loading requests...</td></tr> : requests.length === 0 ? <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-500">No requests found.</td></tr> : requests.map((request) => <tr key={request.id} className="hover:bg-gray-50"><td className="px-5 py-4"><p className="font-bold text-gray-900">{request.full_name}</p><a href={`mailto:${request.email}`} className="text-xs text-[#E85D04]">{request.email}</a><p className="text-xs text-gray-500">{request.phone}</p></td><td className="px-5 py-4 max-w-xs"><p className="font-semibold text-gray-800">{request.reference}</p><p className="mt-1 line-clamp-2 text-xs text-gray-500">{request.description}</p></td><td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${statusStyle[request.status] || statusStyle.new}`}>{request.status.replace(/_/g, ' ')}</span></td><td className="px-5 py-4 text-xs text-gray-600">{request.assigned_to_name || 'Not assigned'}</td><td className="px-5 py-4 text-xs text-gray-500">{new Date(request.created_at).toLocaleDateString()}</td><td className="px-5 py-4 text-right">{isAdmin && !request.approved_at ? <button onClick={() => { setSelected(request); setMessage(''); setError(''); }} className="rounded-lg bg-[#E85D04] px-3 py-2 text-xs font-bold text-white">Approve & assign</button> : <select disabled={saving} value={request.status} onChange={(e) => updateStatus(request, e.target.value)} className="rounded-lg border border-gray-300 bg-white px-2 py-2 text-xs font-semibold text-gray-700"><option value="approved">Approved</option><option value="awaiting_documents">Awaiting documents</option><option value="scheduled">Scheduled</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select>}</td></tr>)}</tbody></table></div>
      </div>
      {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><h2 className="text-xl font-extrabold text-[#0f1e42]">Approve and assign request</h2><p className="mt-1 text-sm text-gray-600">{selected.reference} from {selected.full_name}</p><label className="mt-5 block text-sm font-bold text-gray-700">Tax Advisory Client Support Specialist</label><select value={specialistId} onChange={(e) => setSpecialistId(e.target.value)} className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm"><option value="">Select specialist</option>{specialists.map((specialist) => <option key={specialist.id} value={specialist.id}>{specialist.username}{specialist.email ? ` (${specialist.email})` : ''}</option>)}</select><label className="mt-4 block text-sm font-bold text-gray-700">Approval note (optional)</label><textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={3} className="mt-2 w-full rounded-xl border border-gray-300 p-3 text-sm" placeholder="Record the call or approval details"/><div className="mt-6 flex justify-end gap-3"><button onClick={() => setSelected(null)} className="rounded-xl px-4 py-2.5 text-sm font-bold text-gray-600">Cancel</button><button onClick={approve} disabled={saving || !specialistId} className="rounded-xl bg-[#E85D04] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{saving ? 'Approving...' : 'Approve & assign'}</button></div></div></div>}
    </div>
  );
}
