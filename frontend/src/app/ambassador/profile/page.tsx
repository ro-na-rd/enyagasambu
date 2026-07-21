'use client';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import api from '@/lib/api';
import { Check, X } from '@/lib/icons';

const NAVY = '#0f1e42';
const ORG = '#E85D04';

export default function AmbassadorProfilePage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
  const [msg, setMsg] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    try {
      await api.put('/auth/update-profile', form);
      setMsg('Profile updated');
    } catch {
      setMsg('Failed to update');
    }
  };

  if (!user) return null;

  const initials = user.name?.split(' ').map((p: string) => p[0]).join('').toUpperCase().slice(0, 2) || 'A';

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your ambassador account information</p>
      </div>

      <div className="max-w-2xl">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-6">
          <div className="h-20" style={{ background: `linear-gradient(90deg, ${NAVY}, ${ORG})` }} />
          <div className="px-6 pb-6 -mt-10">
            <div className="flex items-end gap-4 mb-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl border-4 border-white shadow-md" style={{ background: NAVY }}>
                {initials}
              </div>
              <div className="pb-1">
                <p className="text-lg font-bold text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-400">{user.email}</p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-4">Edit Profile</h2>
          {msg && <p className="text-sm mb-3 flex items-center gap-1">{msg.includes('updated') ? <Check size={14} className="text-green-600" /> : <X size={14} className="text-red-600" />}{msg}</p>}
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Full Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:border-[#E85D04]" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Email</label>
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:border-[#E85D04]" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+250..." className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:border-[#E85D04]" />
            </div>
            <button type="submit" className="bg-[#E85D04] text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-[#c04a00] transition">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}
