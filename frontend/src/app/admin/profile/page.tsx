'use client';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import api from '@/lib/api';
import { CheckCircle, AlertCircle, User } from '@/lib/icons';

const BRAND = {
  navy: '#0f1e42',
  navyDark: '#0a1430',
  orange: '#E85D04',
  orangeDark: '#c44d00',
};

export default function AdminProfilePage() {
  const { user } = useAuth();
  const [msg, setMsg] = useState<React.ReactNode>('');
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    try {
      await api.put('/admin/profile', form);
      setMsg(<><CheckCircle size={14} className="inline" style={{ color: '#2ea043' }} /> Profile updated</>);
    } catch {
      setMsg(<><AlertCircle size={14} className="inline" style={{ color: '#f85149' }} /> Failed to update</>);
    }
  };

  if (!user) return null;

  return (
    <div className="p-4 lg:p-8 animate-fadeInUp">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${BRAND.orange}15` }}>
            <User size={18} style={{ color: BRAND.orange }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Profile</h1>
            <p className="text-sm text-gray-600 mt-0.5">Your account information</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl">
        <div className="rounded-2xl overflow-hidden mb-6" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
          <div className="h-20" style={{ background: `linear-gradient(90deg, ${BRAND.navy}, ${BRAND.orange})` }} />
          <div className="px-6 pb-6 -mt-10">
            <div className="flex items-end gap-4 mb-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl border-4 border-white/20 shadow-md"
                style={{ background: `linear-gradient(135deg, ${BRAND.navy}, ${BRAND.orange})` }}>
                {user.name?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="pb-1">
                <p className="text-lg font-bold text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-600">{user.email}</p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="rounded-2xl p-6" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Edit Profile</h2>
          {msg && <p className="text-sm mb-3 text-gray-700">{msg}</p>}
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="border rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                style={{ background: '#f6f8fa', borderColor: '#d0d7de', color: '#1a1a1a' }} />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Email</label>
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="border rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                style={{ background: '#f6f8fa', borderColor: '#d0d7de', color: '#1a1a1a' }} />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="border rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                style={{ background: '#f6f8fa', borderColor: '#d0d7de', color: '#1a1a1a' }} />
            </div>
            <button type="submit" className="text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition"
              style={{ background: `linear-gradient(135deg, ${BRAND.orange}, ${BRAND.orangeDark})` }}>Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}
