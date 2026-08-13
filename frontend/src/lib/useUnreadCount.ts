'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

export function useUnreadCount(refreshKey?: number) {
  const [count, setCount] = useState(0);

  const load = useCallback(() => {
    api.get('/notifications/unread-count')
      .then(({ data }) => setCount(data.count || 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load, refreshKey]);

  return { count, refresh: load };
}