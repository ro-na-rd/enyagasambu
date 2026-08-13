'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Sparkles, FileText, User, Coins, Award } from '@/lib/icons';

const NAVY = '#0f1e42';
const ORG = '#E85D04';

interface Activity {
  type: 'action' | 'reward' | 'achievement' | 'referral' | 'certificate';
  title: string;
  description: string;
  createdAt: string;
}

const typeIcon: Record<string, React.ReactNode> = {
  referral: <User size={16} />,
  reward: <Coins size={16} />,
  certificate: <Award size={16} />,
  achievement: <Sparkles size={16} />,
  action: <FileText size={16} />,
};

const timeAgo = (iso: string) => {
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diff < 1) return 'Just now';
  if (diff < 60) return `${diff} min ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function AmbassadorActivitiesPage() {
  const [items, setItems] = useState<Activity[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/ambassador/activities')
      .then(({ data }) => setItems(data.activities || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? items : items.filter((a) => a.type === filter);

  return (
    <div className="p-4 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Activities</h1>
          <p className="text-sm text-gray-500 mt-1">Your recent actions and events</p>
        </div>
        <div className="flex gap-1">
          {['all', 'referral', 'reward', 'certificate', 'action'].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${filter === f ? 'bg-[#E85D04] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        {loading ? (
          <p className="text-sm text-gray-400 text-center py-8 animate-pulse">Loading activities...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No activities found</p>
        ) : (
          <div className="space-y-5">
            {filtered.map((a, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: a.type === 'reward' ? '#ecfdf5' : '#f0f2f9', color: a.type === 'reward' ? '#059669' : NAVY }}>
                    {typeIcon[a.type] || typeIcon.action}
                  </div>
                  {i < filtered.length - 1 && <div className="w-0.5 flex-1 bg-gray-100 mt-1" />}
                </div>
                <div className="pb-5">
                  <p className="text-sm font-medium text-gray-800">{a.title}</p>
                  {a.description && <p className="text-xs text-gray-500 mt-0.5">{a.description}</p>}
                  <p className="text-xs text-gray-400 mt-0.5">{timeAgo(a.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
