'use client';
import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { Bell } from '@/lib/icons';

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

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [count, setCount] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const ref = useRef<HTMLDivElement>(null);

  const loadCount = () => {
    api.get('/notifications/unread-count')
      .then(({ data }) => setCount(data.count || 0))
      .catch(() => {});
  };

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000);
    loadCount();
    const t2 = setInterval(loadCount, 30000);
    return () => { clearInterval(t); clearInterval(t2); };
  }, []);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen((prev) => {
      const next = !prev;
      if (next) {
        api.get('/notifications').then(({ data }) => {
          setItems(data || []);
          api.post('/notifications/read-all').catch(() => {});
        }).catch(() => {});
        setCount(0);
      }
      return next;
    });
  };

  const timeAgo = (iso: string) => {
    const d = new Date(iso);
    const diff = Math.floor((now - d.getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff} min ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={toggle}
        className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
        title="Notifications">
        <Bell size={20} />
        {count > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-orange-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed right-4 top-16 w-[calc(100vw-32px)] max-w-[320px] z-50 bg-white rounded-xl shadow-lg border border-gray-100 lg:absolute lg:right-0 lg:top-full lg:mt-1 lg:w-80 lg:max-w-none"
          onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-bold text-gray-800">Notifications</span>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {items.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">No notifications yet</p>
            ) : items.map((n) => (
              <div key={n.id} className="flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${COLORS[n.type] || COLORS.info}`}>
                  {(n.title || '?').charAt(0).toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{n.title}</p>
                  {n.message && <p className="text-xs text-gray-600 mt-0.5 leading-snug">{n.message}</p>}
                  <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
