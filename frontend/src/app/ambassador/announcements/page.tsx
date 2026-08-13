'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Announcement {
  id: number;
  title: string;
  body: string;
  audience: string;
  created_at: string;
}

const badgeColors: Record<string, string> = {
  all: 'bg-blue-50 text-blue-700',
  ambassador: 'bg-orange-50 text-orange-700',
  broker: 'bg-purple-50 text-purple-700',
  supplier: 'bg-green-50 text-green-700',
  staff: 'bg-gray-100 text-gray-600',
};

export default function AmbassadorAnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/announcements')
      .then(({ data }) => setItems(data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
        <p className="text-sm text-gray-500 mt-1">Latest updates and news for ambassadors</p>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center">
          <p className="text-sm text-gray-400 animate-pulse">Loading announcements...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center">
          <p className="text-sm text-gray-400">No announcements yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((a) => (
            <div key={a.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-base font-bold text-gray-900">{a.title}</h3>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ml-3 shrink-0 ${badgeColors[a.audience] || badgeColors.all}`}>
                  {a.audience === 'all' ? 'General' : a.audience}
                </span>
              </div>
              <p className="text-sm text-gray-600 whitespace-pre-line">{a.body}</p>
              <p className="text-xs text-gray-400 mt-2">
                {new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
