'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function AdminSettingsPage() {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [postingFee, setPostingFee] = useState('400');
  const [postingFeeEnabled, setPostingFeeEnabled] = useState(true);

  useEffect(() => {
    api.get('/settings').then(({ data }) => {
      const s = data.settings;
      setPostingFee(s.posting_fee || '400');
      setPostingFeeEnabled(s.posting_free === 'false');
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put('/settings', {
        settings: {
          posting_fee: postingFee,
          posting_free: postingFeeEnabled ? 'false' : 'true'
        }
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { setSaved(false); }
  };

  if (loading) return <div className="p-8 text-gray-500 text-sm">Loading settings…</div>;

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Platform configuration and preferences</p>
      </div>

      <div className="max-w-2xl space-y-6">
        <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-4">General Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Platform Name</label>
              <input defaultValue="E-Nyagasambu" className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:border-[#E85D04]" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Support Email</label>
              <input type="email" defaultValue="support@enyagasambu.rw" className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:border-[#E85D04]" />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="reg" defaultChecked className="rounded border-gray-300" />
              <label htmlFor="reg" className="text-sm text-gray-600">Allow new user registration</label>
            </div>
          </div>
          <div className="mt-6 flex items-center gap-3">
            <button type="submit" className="bg-[#E85D04] text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-[#c04a00] transition">Save Changes</button>
            {saved && <span className="text-sm text-green-600 font-medium">✓ Saved</span>}
          </div>
        </form>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-4">💰 Seller Posting Fee</h2>
          <p className="text-xs text-gray-500 mb-4">Control whether sellers pay coins to post listings. Admin always posts for free.</p>

          <div className="space-y-5">
            {/* Toggle Switch */}
            <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: postingFeeEnabled ? '#fff7ed' : '#f0fdf4' }}>
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {postingFeeEnabled ? '🟢 Fee Enabled — Sellers pay to post' : '🟢 Fee Disabled — Sellers post for FREE'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {postingFeeEnabled
                    ? `Sellers must pay ${postingFee} coins per listing`
                    : 'Sellers can post listings without paying coins'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPostingFeeEnabled(!postingFeeEnabled)}
                className={`relative w-14 h-7 rounded-full transition-colors duration-200 ${postingFeeEnabled ? 'bg-[#E85D04]' : 'bg-green-500'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 ${postingFeeEnabled ? 'translate-x-7' : 'translate-x-0'}`} />
              </button>
            </div>

            {postingFeeEnabled && (
              <div>
                <label className="block text-xs text-gray-600 mb-1">Listing Fee (coins)</label>
                <input
                  type="number"
                  value={postingFee}
                  onChange={(e) => setPostingFee(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full max-w-[200px] focus:outline-none focus:border-[#E85D04]"
                />
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button onClick={handleSave} className="bg-[#E85D04] text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-[#c04a00] transition">
                Save Posting Settings
              </button>
              {saved && <span className="text-sm text-green-600 font-medium">✓ Saved</span>}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-4">Other Pricing</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Connect Fee (coins)</label>
              <input type="number" defaultValue="300" className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full max-w-[200px] focus:outline-none focus:border-[#E85D04]" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Boost Fee (coins)</label>
              <input type="number" defaultValue="200" className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full max-w-[200px] focus:outline-none focus:border-[#E85D04]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
