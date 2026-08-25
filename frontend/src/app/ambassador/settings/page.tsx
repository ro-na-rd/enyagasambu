'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Check, Lock, Download, Trash2, Eye, EyeOff, Loader2 } from '@/lib/icons';

const NAVY = '#0f1e42';
const ORG = '#E85D04';

export default function AmbassadorSettingsPage() {
  const { logout } = useAuth();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    email_referrals: true,
    push_rewards: true,
    weekly_summary: false,
    announcements: true,
  });

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    api.get('/ambassador/settings')
      .then(({ data }) => {
        if (data.preferences) setPreferences(data.preferences);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/ambassador/settings', { preferences });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { }
    setSaving(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwMsg({ type: 'error', text: 'New password must be at least 6 characters' });
      return;
    }
    setPwLoading(true);
    setPwMsg(null);
    try {
      await api.post('/ambassador/settings/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwMsg({ type: 'success', text: 'Password changed successfully' });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
    } catch (err: any) {
      setPwMsg({ type: 'error', text: err.response?.data?.message || 'Failed to change password' });
    }
    setPwLoading(false);
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const { data } = await api.get('/ambassador/settings/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `enyagasambu-ambassador-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { }
    setExporting(false);
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;
    if (!confirm('This will permanently delete all your data. Type "DELETE" to confirm.')) return;
    alert('Account deletion request submitted. Please contact support@enyagasambu.rw to complete the process.');
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-48 bg-gray-100 rounded-xl" />
          <div className="h-48 bg-gray-100 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your ambassador preferences</p>
      </div>

      <div className="max-w-2xl space-y-6">
        <form onSubmit={handleSavePreferences} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-4">Notifications</h2>
          <div className="space-y-3">
            {[
              { key: 'email_referrals' as const, label: 'Email notifications for new referrals' },
              { key: 'push_rewards' as const, label: 'Push notifications for rewards' },
              { key: 'weekly_summary' as const, label: 'Weekly referral summary email' },
              { key: 'announcements' as const, label: 'Announcements and updates' },
            ].map((item) => (
              <div key={item.key} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id={`pref-${item.key}`}
                  checked={preferences[item.key]}
                  onChange={e => setPreferences({ ...preferences, [item.key]: e.target.checked })}
                  className="rounded border-gray-300 accent-[#E85D04]"
                />
                <label htmlFor={`pref-${item.key}`} className="text-sm text-gray-700">{item.label}</label>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-6">
            <button type="submit" disabled={saving}
              className="bg-[#E85D04] text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-[#c04a00] transition disabled:opacity-50 flex items-center gap-2">
              {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <>Save Preferences</>}
            </button>
            {saved && <span className="text-sm text-green-600 font-medium flex items-center gap-1"><Check size={14} /> Saved</span>}
          </div>
        </form>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-4">Account Security</h2>
          <p className="text-sm text-gray-500 mb-4">Manage your account security and privacy</p>

          {pwMsg && (
            <div className={`mb-4 text-sm font-medium px-3 py-2 rounded-lg ${pwMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {pwMsg.text}
            </div>
          )}

          {showPasswordForm ? (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    required
                    value={pwForm.currentPassword}
                    onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-[#E85D04] focus:border-transparent outline-none"
                  />
                  <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={pwForm.newPassword}
                    onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-[#E85D04] focus:border-transparent outline-none"
                  />
                  <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Confirm New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={pwForm.confirmPassword}
                  onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#E85D04] focus:border-transparent outline-none"
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={pwLoading}
                  className="bg-[#E85D04] text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-[#c04a00] transition disabled:opacity-50 flex items-center gap-2">
                  {pwLoading ? <><Loader2 size={14} className="animate-spin" /> Changing...</> : 'Change Password'}
                </button>
                <button type="button" onClick={() => { setShowPasswordForm(false); setPwMsg(null); }}
                  className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg border border-gray-200 transition">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <button onClick={() => setShowPasswordForm(true)}
                className="w-full text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100 flex items-center gap-2 transition">
                <Lock size={16} /> Change Password
              </button>
              <button onClick={handleExportData} disabled={exporting}
                className="w-full text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100 flex items-center gap-2 transition disabled:opacity-50">
                <Download size={16} /> {exporting ? 'Exporting...' : 'Export My Data'}
              </button>
              <button onClick={handleDeleteAccount}
                className="w-full text-left text-sm text-red-600 hover:bg-red-50 rounded-lg px-3 py-2.5 border border-red-100 flex items-center gap-2 transition">
                <Trash2 size={16} /> Delete Account
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
