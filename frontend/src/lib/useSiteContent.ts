'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface SiteContent {
  content: Record<string, string>;
  get: (key: string, fallback: string) => string;
}

const cache: Record<string, string> = {};

export function useSiteContent(): SiteContent {
  const [content, setContent] = useState<Record<string, string>>(() => ({ ...cache }));

  useEffect(() => {
    if (Object.keys(cache).length > 0) return;
    let active = true;
    api.get('/site-content/public')
      .then(({ data }) => {
        if (!active) return;
        Object.assign(cache, data);
        setContent({ ...cache });
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  return {
    content,
    get: (key: string, fallback: string) =>
      content[key] && content[key].trim() ? content[key] : fallback,
  };
}