'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Megaphone, Plus, Play, Pause, Check, Trash2, Calendar, Target, FileText } from '@/lib/icons';

const NAVY = '#0f1e42';
const ORG = '#E85D04';

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  draft: { label: 'Draft', color: '#6b7280', bg: '#f3f4f6', icon: <FileText size={14} /> },
  active: { label: 'Active', color: '#059669', bg: '#ecfdf5', icon: <Play size={14} /> },
  completed: { label: 'Completed', color: '#0f1e42', bg: '#eef2ff', icon: <Check size={14} /> },
  paused: { label: 'Paused', color: '#d97706', bg: '#fffbeb', icon: <Pause size={14} /> },
};

interface Campaign {
  id: number;
  title: string;
  description: string;
  target_audience: string;
  status: string;
  start_date: string;
  end_date: string;
  action_count: number;
  created_at: string;
}

export default function AmbassadorCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<{ total: number; active: number; completed: number; totalActions: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', target_audience: 'general', start_date: '', end_date: '' });
  const [submitting, setSubmitting] = useState(false);

  const loadData = () => {
    Promise.all([
      api.get('/ambassador/campaigns'),
      api.get('/ambassador/campaigns/stats'),
    ])
      .then(([c, s]) => {
        setCampaigns(c.data.campaigns);
        setStats(s.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/ambassador/campaigns', form);
      setForm({ title: '', description: '', target_audience: 'general', start_date: '', end_date: '' });
      setShowForm(false);
      loadData();
    } catch { }
    setSubmitting(false);
  };

  const toggleStatus = async (camp: Campaign) => {
    const next = camp.status === 'active' ? 'paused' : camp.status === 'paused' ? 'active' : camp.status;
    if (next === camp.status) return;
    await api.put(`/ambassador/campaigns/${camp.id}`, { status: next });
    loadData();
  };

  const completeCampaign = async (id: number) => {
    await api.put(`/ambassador/campaigns/${id}`, { status: 'completed' });
    loadData();
  };

  const deleteCampaign = async (id: number) => {
    if (!confirm('Delete this campaign?')) return;
    await api.delete(`/ambassador/campaigns/${id}`);
    loadData();
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="grid gap-4">{[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Awareness Campaigns</h1>
          <p className="text-sm text-gray-500 mt-1">Plan and track your E-Nyagasambu awareness campaigns</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-[#E85D04] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#c04a00] transition"
        >
          <Plus size={16} /> New Campaign
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Campaigns', value: stats.total, color: NAVY },
            { label: 'Active', value: stats.active, color: '#059669' },
            { label: 'Completed', value: stats.completed, color: '#0f1e42' },
            { label: 'Actions Logged', value: stats.totalActions, color: ORG },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-4">New Campaign</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid lg:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Title *</label>
                <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#E85D04] focus:border-transparent outline-none"
                  placeholder="e.g., Campus Awareness Week" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Target Audience</label>
                <select value={form.target_audience} onChange={e => setForm({ ...form, target_audience: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#E85D04] focus:border-transparent outline-none">
                  <option value="general">General</option>
                  <option value="students">Students</option>
                  <option value="businesses">Businesses</option>
                  <option value="community">Community</option>
                  <option value="online">Online</option>
                </select>
              </div>
              <div className="lg:col-span-2">
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#E85D04] focus:border-transparent outline-none"
                  placeholder="Describe your campaign goals and activities..." />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Start Date</label>
                <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#E85D04] focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">End Date</label>
                <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#E85D04] focus:border-transparent outline-none" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={submitting}
                className="bg-[#E85D04] text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-[#c04a00] transition disabled:opacity-50">
                {submitting ? 'Creating...' : 'Create Campaign'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg border border-gray-200 transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {campaigns.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
            <Megaphone size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-500">No campaigns yet</p>
            <p className="text-xs text-gray-400 mt-1">Create your first awareness campaign</p>
          </div>
        )}
        {campaigns.map((c) => {
          const st = statusConfig[c.status] || statusConfig.draft;
          return (
            <div key={c.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-gray-800">{c.title}</h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: st.bg, color: st.color }}>
                      {st.icon} {st.label}
                    </span>
                  </div>
                  {c.description && <p className="text-xs text-gray-500 mb-2 line-clamp-2">{c.description}</p>}
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Target size={12} /> {c.target_audience}</span>
                    {c.start_date && <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(c.start_date).toLocaleDateString('en-GB')}</span>}
                    {c.end_date && <span>to {new Date(c.end_date).toLocaleDateString('en-GB')}</span>}
                    <span>{c.action_count} actions</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {c.status !== 'completed' && c.status !== 'draft' && (
                    <button onClick={() => toggleStatus(c)} className="text-gray-400 hover:text-[#E85D04] transition p-1.5 rounded-lg hover:bg-gray-50" title={c.status === 'active' ? 'Pause' : 'Resume'}>
                      {c.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                    </button>
                  )}
                  {(c.status === 'active' || c.status === 'paused') && (
                    <button onClick={() => completeCampaign(c.id)} className="text-gray-400 hover:text-green-500 transition p-1.5 rounded-lg hover:bg-gray-50" title="Complete">
                      <Check size={14} />
                    </button>
                  )}
                  <button onClick={() => deleteCampaign(c.id)} className="text-gray-400 hover:text-red-500 transition p-1.5 rounded-lg hover:bg-gray-50" title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
