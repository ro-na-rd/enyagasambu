'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Check } from '@/lib/icons';

const AVAILABLE_SERVICES = [
  'Product Brokerage',
  'Property Brokerage',
  'Vehicle Brokerage',
  'Marketplace Verification',
  'Customer Support',
];

export default function BrokerProfilePage() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [services, setServices] = useState<string[]>(user?.services || []);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(user.name || '');
      setPhone(user.phone || '');
      setServices(user.services || []);
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      await api.put('/auth/broker/me', { name, phone, services });
      await refreshUser();
      setMsg('Profile updated successfully.');
    } catch {
      setMsg('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">My Profile</h1>
      <p className="text-sm text-gray-500 mb-6">Manage your broker account information.</p>

      {msg && (
        <div className={`text-sm rounded-lg px-4 py-3 mb-4 ${msg.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {msg}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <input value={user?.email || ''} disabled
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-500 bg-gray-50" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Role</label>
            <input value="Broker" disabled
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-500 bg-gray-50" />
          </div>

          {/* Authorized Services */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Authorized Services</label>
            <p className="text-xs text-gray-500 mb-3">Select the services you offer. These will appear on your certificate.</p>
            <div className="space-y-2">
              {AVAILABLE_SERVICES.map(service => (
                <label
                  key={service}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                    services.includes(service)
                      ? 'border-[#E85D04] bg-[#fff7ed]'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                    services.includes(service)
                      ? 'bg-[#E85D04] border-[#E85D04]'
                      : 'border-gray-300 bg-white'
                  }`}>
                    {services.includes(service) && <Check size={12} className="text-white" />}
                  </div>
                  <span className="text-sm text-gray-700">{service}</span>
                </label>
              ))}
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="bg-[#E85D04] text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-[#c04a00] transition disabled:opacity-60">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
