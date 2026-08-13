'use client';
import { useState, useEffect } from 'react';
import { Bell } from '@/lib/icons';
import api from '@/lib/api';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

const COLORS: Record<string, string> = {
  user: 'bg-green-100 text-green-700',
  cert: 'bg-blue-100 text-blue-700',
  alert: 'bg-red-100 text-red-700',
  support: 'bg-purple-100 text-purple-700',
  reward: 'bg-amber-100 text-amber-700',
  info: 'bg-gray-100 text-gray-600',
};

interface Props {
  title: string;
  subtitle: string;
  emptyText: string;
  onRead?: () => void;
}

export default function NotificationsPage({ title, subtitle, emptyText, onRead }: Props) {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    api.get('/notifications')
      .then(({ data }) => setItems(data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
    api.post('/notifications/read-all').then(() => onRead?.()).catch(() => {});
  }, [onRead]);

  const timeAgo = (iso: string) => {
    const d = new Date(iso);
    const diff = Math.floor((now - d.getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff} min ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="p-4 lg:p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center">
          <p className="text-sm text-gray-400 animate-pulse">Loading notifications...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Bell size={20} className="text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-700">No notifications yet</p>
          <p className="text-xs text-gray-400 mt-1">{emptyText}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {items.map((n) => (
            <div key={n.id} className="flex items-start gap-3 px-5 py-4 border-b border-gray-50 last:border-b-0">
              <span className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${COLORS[n.type] || COLORS.info}`}>
                {(n.title || '?').charAt(0).toUpperCase()}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                  {!n.is_read && <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />}
                </div>
                {n.message && <p className="text-sm text-gray-600 mt-0.5">{n.message}</p>}
                <p className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}