'use client';
import { useState } from 'react';
import { Check } from '@/lib/icons';

const NAVY = '#0f1e42';
const ORG = '#E85D04';

export default function AmbassadorSettingsPage() {
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your ambassador preferences</p>
      </div>

      <div className="max-w-2xl space-y-6">
        <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-4">Notifications</h2>
          <div className="space-y-3">
            {[
              { label: 'Email notifications for new referrals', default: true },
              { label: 'Push notifications for rewards', default: true },
              { label: 'Weekly referral summary email', default: false },
              { label: 'Announcements and updates', default: true },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <input type="checkbox" id={`notif-${i}`} defaultChecked={item.default} className="rounded border-gray-300 accent-[#E85D04]" />
                <label htmlFor={`notif-${i}`} className="text-sm text-gray-700">{item.label}</label>
              </div>
            ))}
          </div>
          <button type="submit" className="mt-6 bg-[#E85D04] text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-[#c04a00] transition">
            Save Preferences
          </button>
          {saved && <span className="ml-3 text-sm text-green-600 font-medium flex items-center gap-1"><Check size={14} /> Saved</span>}
        </form>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-4">Account</h2>
          <p className="text-sm text-gray-500 mb-4">Manage your account security and privacy</p>
          <div className="space-y-3">
            <button className="w-full text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100">Change Password</button>
            <button className="w-full text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100">Export My Data</button>
            <button className="w-full text-left text-sm text-red-600 hover:bg-red-50 rounded-lg px-3 py-2.5 border border-red-100">Delete Account</button>
          </div>
        </div>
      </div>
    </div>
  );
}
