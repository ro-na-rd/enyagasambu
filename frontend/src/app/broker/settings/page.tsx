'use client';
import { useState } from 'react';

export default function BrokerSettingsPage() {
  const [notifPrefs, setNotifPrefs] = useState({
    email: true,
    sms: false,
    push: true,
    weeklyReport: true,
  });

  return (
    <div className="p-4 lg:p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Settings</h1>
      <p className="text-sm text-gray-500 mb-6">Manage your broker account preferences.</p>

      <div className="space-y-6">
        {/* Notification Preferences */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 text-sm mb-4">Notification Preferences</h2>
          <div className="space-y-3">
            {[
              { key: 'email', label: 'Email Notifications' },
              { key: 'sms', label: 'SMS Notifications' },
              { key: 'push', label: 'Push Notifications' },
              { key: 'weeklyReport', label: 'Weekly Report Digest' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{label}</span>
                <input
                  type="checkbox"
                  checked={notifPrefs[key as keyof typeof notifPrefs]}
                  onChange={() => setNotifPrefs({ ...notifPrefs, [key]: !notifPrefs[key as keyof typeof notifPrefs] })}
                  className="rounded border-gray-300 text-[#E85D04] focus:ring-[#E85D04]"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Account Actions */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 text-sm mb-4">Account Actions</h2>
          <div className="space-y-3">
            <button className="w-full text-left text-sm text-gray-700 px-4 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
              Change Password
            </button>
            <button className="w-full text-left text-sm text-gray-700 px-4 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
              Export My Data
            </button>
            <button className="w-full text-left text-sm text-red-600 px-4 py-2.5 rounded-lg border border-red-200 hover:bg-red-50 transition">
              Deactivate Account
            </button>
          </div>
        </div>

        <button className="bg-[#E85D04] text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-[#c04a00] transition">
          Save Settings
        </button>
      </div>
    </div>
  );
}
