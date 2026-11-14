'use client';
import AppImage from '@/components/AppImage';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Camera, Loader2, CheckCircle, AlertCircle, Save, User, Mail, Phone } from '@/lib/icons';

const NAVY = '#0f1e42';
const ORG = '#E85D04';

export default function AccountProfilePage() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState(() => ({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' }));
  const [photoPreview, setPhotoPreview] = useState(user?.photo_url || '');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setPhotoFile(file);
    setPhotoPreview(file ? URL.createObjectURL(file) : user?.photo_url || '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name.trim());
      fd.append('phone', form.phone.trim());
      if (photoFile) fd.append('photo', photoFile);
      const { data } = await api.put('/auth/me', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (data.user?.photo_url) setPhotoPreview(data.user.photo_url);
      setPhotoFile(null);
      await refreshUser();
      setMsg({ type: 'success', text: 'Profile updated successfully' });
    } catch (err: unknown) {
      const text = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update profile';
      setMsg({ type: 'error', text });
    } finally {
      setSaving(false);
    }
  };

  const initials = (form.name || user?.name || '?').split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-4 lg:p-8">
      <div className="rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm">
        <div className="h-24" style={{ background: `linear-gradient(135deg, ${NAVY}, ${ORG})` }} />
        <div className="px-6 pb-6 -mt-12">
          <div className="flex items-end gap-4">
            <label className="relative cursor-pointer group shrink-0">
              <span
                className="w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-3xl border-4 border-white shadow-lg overflow-hidden"
                style={{ background: photoPreview ? 'transparent' : `linear-gradient(135deg, ${NAVY}, ${ORG})` }}
              >
                {photoPreview
                  ? <AppImage src={photoPreview} alt="Profile photo" className="w-full h-full object-cover" />
                  : initials}
              </span>
              <span className="absolute inset-0 rounded-full flex items-center justify-center bg-black/45 opacity-0 group-hover:opacity-100 transition text-white">
                <Camera size={22} />
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </label>
            <div className="pb-1 min-w-0">
              <p className="text-xl font-bold text-gray-900 truncate">{form.name || user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{form.email || user?.email}</p>
              <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full" style={{ background: `${ORG}15`, color: ORG }}>
                Member Account
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">Click the photo to upload a profile image. It appears in the dashboard header and navbar.</p>
        </div>
      </div>

      <div className="rounded-2xl p-6 bg-white border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <User size={18} style={{ color: ORG }} />
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Edit Profile</h2>
        </div>
        {msg && (
          <div className={`flex items-center gap-2 mb-4 px-3 py-2 rounded-lg text-sm ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {msg.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            {msg.text}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1 font-medium">Full Name</label>
            <div className="relative">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                className="border rounded-lg pl-9 pr-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                style={{ background: '#f6f8fa', borderColor: '#d0d7de', color: '#1a1a1a' }}
                placeholder="Your name" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1 font-medium">Email</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={form.email} disabled
                className="border rounded-lg pl-9 pr-3 py-2.5 text-sm w-full bg-gray-50 text-gray-400 cursor-not-allowed"
                style={{ background: '#f6f8fa', borderColor: '#d0d7de' }}
                placeholder="your@email.com" />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Email is set at registration and cannot be changed here.</p>
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
            style={{ background: `linear-gradient(135deg, ${ORG}, #c44d00)` }}>
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
