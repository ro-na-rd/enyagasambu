'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { User, Mail, Phone, Lock, Key, CheckCircle, AlertCircle, Save, Eye, EyeOff } from '@/lib/icons';

const BRAND = {
  navy: '#0f1e42',
  navyDark: '#0a1430',
  orange: '#E85D04',
  orangeDark: '#c44d00',
};

export default function ExecutiveProfilePage() {
  const { refreshUser } = useAuth();
  const [profile, setProfile] = useState<{ username?: string; email?: string; phone?: string; role?: string; executive_role?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [savingPw, setSavingPw] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  useEffect(() => {
    api.get('/executive/profile')
      .then(({ data }) => {
        setProfile(data.user);
        setForm({ name: data.user.username || '', email: data.user.email || '', phone: data.user.phone || '' });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setSaving(true);
    try {
      const { data } = await api.put('/executive/profile', form);
      setProfile(data.user);
      setMsg({ type: 'success', text: 'Profile updated successfully' });
      await refreshUser();
    } catch (err: unknown) {
      setMsg({ type: 'error', text: (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwMsg({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }
    setSavingPw(true);
    try {
      await api.post('/executive/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwMsg({ type: 'success', text: 'Password changed successfully' });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: unknown) {
      setPwMsg({ type: 'error', text: (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to change password' });
    } finally {
      setSavingPw(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="rounded-2xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="h-24" style={{ background: `linear-gradient(135deg, ${BRAND.navy}, ${BRAND.orange})` }} />
        <div className="px-6 pb-6 -mt-12">
          <div className="flex items-end gap-4 mb-6">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl border-4 border-white shadow-lg"
              style={{ background: `linear-gradient(135deg, ${BRAND.navy}, ${BRAND.orange})` }}>
              {profile?.username?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="pb-1">
              <p className="text-xl font-bold text-gray-900">{profile?.username}</p>
              <p className="text-xs text-gray-500">{profile?.email}</p>
              <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full"
                style={{ background: `${BRAND.orange}15`, color: BRAND.orange }}>
                {profile?.executive_role || profile?.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl p-6" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="flex items-center gap-2 mb-5">
          <User size={18} style={{ color: BRAND.orange }} />
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Edit Profile</h2>
        </div>
        {msg && (
          <div className={`flex items-center gap-2 mb-4 px-3 py-2 rounded-lg text-sm ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {msg.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            {msg.text}
          </div>
        )}
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1 font-medium">Name / Username</label>
            <div className="relative">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="border rounded-lg pl-9 pr-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                style={{ background: '#f6f8fa', borderColor: '#d0d7de', color: '#1a1a1a' }}
                placeholder="Your name" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1 font-medium">Email</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="border rounded-lg pl-9 pr-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                style={{ background: '#f6f8fa', borderColor: '#d0d7de', color: '#1a1a1a' }}
                placeholder="your@email.com" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1 font-medium">Phone</label>
            <div className="relative">
              <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="border rounded-lg pl-9 pr-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                style={{ background: '#f6f8fa', borderColor: '#d0d7de', color: '#1a1a1a' }}
                placeholder="+250700000000" />
            </div>
          </div>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition disabled:opacity-50"
            style={{ background: `linear-gradient(135deg, ${BRAND.orange}, ${BRAND.orangeDark})` }}>
            <Save size={15} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      <div className="rounded-2xl p-6" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="flex items-center gap-2 mb-5">
          <Lock size={18} style={{ color: BRAND.orange }} />
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Change Password</h2>
        </div>
        {pwMsg && (
          <div className={`flex items-center gap-2 mb-4 px-3 py-2 rounded-lg text-sm ${pwMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {pwMsg.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            {pwMsg.text}
          </div>
        )}
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1 font-medium">Current Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type={showCurrentPw ? 'text' : 'password'} value={pwForm.currentPassword}
                onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                className="border rounded-lg pl-9 pr-10 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                style={{ background: '#f6f8fa', borderColor: '#d0d7de', color: '#1a1a1a' }} />
              <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showCurrentPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1 font-medium">New Password</label>
            <div className="relative">
              <Key size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type={showNewPw ? 'text' : 'password'} value={pwForm.newPassword}
                onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                className="border rounded-lg pl-9 pr-10 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                style={{ background: '#f6f8fa', borderColor: '#d0d7de', color: '#1a1a1a' }} />
              <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1 font-medium">Confirm New Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="password" value={pwForm.confirmPassword}
                onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                className="border rounded-lg pl-9 pr-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                style={{ background: '#f6f8fa', borderColor: '#d0d7de', color: '#1a1a1a' }} />
            </div>
          </div>
          <button type="submit" disabled={savingPw}
            className="flex items-center gap-2 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition disabled:opacity-50"
            style={{ background: `linear-gradient(135deg, ${BRAND.navy}, ${BRAND.navyDark})` }}>
            <Lock size={15} />
            {savingPw ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
