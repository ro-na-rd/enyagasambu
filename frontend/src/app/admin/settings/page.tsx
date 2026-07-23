'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Check, Coins, CheckCircle, Settings as SettingsIcon } from '@/lib/icons';

const BRAND = {
  navy: '#0f1e42',
  navyLight: '#1a2d5a',
  orange: '#E85D04',
  orangeDark: '#c44d00',
};

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

  if (loading) return <div className="p-8 text-gray-600 text-sm">Loading settings…</div>;

  return (
    <div className="p-4 lg:p-8 animate-fadeInUp">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${BRAND.orange}15` }}>
            <SettingsIcon size={18} style={{ color: BRAND.orange }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-600 mt-0.5">Platform configuration and preferences</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl space-y-6">
        <form onSubmit={handleSave} className="rounded-2xl p-6" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">General Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Platform Name</label>
              <input defaultValue="E-Nyagasambu"
                className="border rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                style={{ background: '#f6f8fa', borderColor: '#d0d7de', color: '#1a1a1a' }} />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Support Email</label>
              <input type="email" defaultValue="support@enyagasambu.rw"
                className="border rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                style={{ background: '#f6f8fa', borderColor: '#d0d7de', color: '#1a1a1a' }} />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="reg" defaultChecked className="rounded accent-orange-500"
                style={{ background: '#f6f8fa', borderColor: '#d0d7de' }} />
              <label htmlFor="reg" className="text-sm text-gray-500">Allow new user registration</label>
            </div>
          </div>
          <div className="mt-6 flex items-center gap-3">
            <button type="submit" className="text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition"
              style={{ background: `linear-gradient(135deg, ${BRAND.orange}, ${BRAND.orangeDark})` }}>Save Changes</button>
            {saved && <span className="text-sm font-medium" style={{ color: '#2ea043' }}><Check size={14} className="inline" /> Saved</span>}
          </div>
        </form>

        <div className="rounded-2xl p-6" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4"><Coins size={16} className="inline mr-1" style={{ color: BRAND.orange }} /> Seller Posting Fee</h2>
          <p className="text-xs text-gray-600 mb-4">Control whether sellers pay coins to post listings. Admin always posts for free.</p>

          <div className="space-y-5">
            <div className="flex items-center justify-between p-4 rounded-xl"
              style={{ background: postingFeeEnabled ? 'rgba(232,93,4,0.1)' : 'rgba(46,160,67,0.1)' }}>
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {postingFeeEnabled ? <><CheckCircle size={14} className="inline" style={{ color: '#2ea043' }} /> Fee Enabled — Sellers pay to post</> : <><CheckCircle size={14} className="inline" style={{ color: '#2ea043' }} /> Fee Disabled — Sellers post for FREE</>}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  {postingFeeEnabled
                    ? `Sellers must pay ${postingFee} coins per listing`
                    : 'Sellers can post listings without paying coins'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPostingFeeEnabled(!postingFeeEnabled)}
                className={`relative w-14 h-7 rounded-full transition-colors duration-200 ${postingFeeEnabled ? 'bg-orange-600' : 'bg-green-500'}`}
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
                  className="border rounded-lg px-3 py-2.5 text-sm w-full max-w-[200px] focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                  style={{ background: '#f6f8fa', borderColor: '#d0d7de', color: '#1a1a1a' }} />
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button onClick={handleSave} className="text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition"
                style={{ background: `linear-gradient(135deg, ${BRAND.orange}, ${BRAND.orangeDark})` }}>
                Save Posting Settings
              </button>
              {saved && <span className="text-sm font-medium" style={{ color: '#2ea043' }}><Check size={14} className="inline" /> Saved</span>}
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-6" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Other Pricing</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Connect Fee (coins)</label>
              <input type="number" defaultValue="300"
                className="border rounded-lg px-3 py-2.5 text-sm w-full max-w-[200px] focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                style={{ background: '#f6f8fa', borderColor: '#d0d7de', color: '#1a1a1a' }} />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Boost Fee (coins)</label>
              <input type="number" defaultValue="200"
                className="border rounded-lg px-3 py-2.5 text-sm w-full max-w-[200px] focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                style={{ background: '#f6f8fa', borderColor: '#d0d7de', color: '#1a1a1a' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
