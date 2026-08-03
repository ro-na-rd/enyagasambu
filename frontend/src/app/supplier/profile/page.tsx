'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Loader2, CheckCircle, AlertCircle, Save } from '@/lib/icons';

const ORG = '#E85D04';
const NAVY = '#0f1e42';

export default function SupplierProfilePage() {
  const [form, setForm] = useState({ name: '', phone: '', business_name: '', business_phone: '', business_location: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/auth/supplier/me')
      .then(({ data }) => {
        const u = data.user;
        setForm({
          name: u.name || '',
          phone: u.phone || '',
          business_name: u.business_name || '',
          business_phone: u.business_phone || '',
          business_location: u.business_location || '',
          description: u.description || '',
        });
      })
      .catch(() => setError('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    setError('');
    try {
      await api.put('/auth/supplier/me', form);
      setMsg('Profile updated successfully');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 size={20} className="animate-spin mr-2" /> Loading profile...
      </div>
    );
  }

  const inputCls = "w-full rounded-xl px-4 py-3 text-sm bg-white border border-gray-200 outline-none focus:border-[#E85D04] transition";

  return (
    <div className="p-4 lg:p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500 mt-0.5">Update your personal and business details</p>
      </div>

      {msg && (
        <div className="flex items-center gap-2 text-sm rounded-xl px-4 py-3 mb-4" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#059669' }}>
          <CheckCircle size={16} /> {msg}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 text-sm rounded-xl px-4 py-3 mb-4" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl p-6" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: NAVY }}>Personal</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-gray-500">Full Name</label>
              <input name="name" value={form.name} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-gray-500">Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange} className={inputCls} />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-5">
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: NAVY }}>Business</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-gray-500">Business Name</label>
              <input name="business_name" value={form.business_name} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-gray-500">Business Phone</label>
              <input name="business_phone" value={form.business_phone} onChange={handleChange} className={inputCls} />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-semibold mb-1.5 text-gray-500">Business Location</label>
            <input name="business_location" value={form.business_location} onChange={handleChange} className={inputCls} placeholder="e.g. Kigali, Nyarugenge" />
          </div>
          <div className="mt-4">
            <label className="block text-xs font-semibold mb-1.5 text-gray-500">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={4}
              className={`${inputCls} resize-y`} placeholder="Tell buyers about your products and services..." />
          </div>
        </div>

        <button type="submit" disabled={saving}
          className="w-full text-white font-bold py-3 rounded-xl text-sm transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ background: `linear-gradient(135deg, ${NAVY}, ${ORG})` }}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
