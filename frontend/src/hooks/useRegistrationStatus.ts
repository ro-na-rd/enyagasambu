'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export function useRegistrationStatus() {
  const [open, setOpen] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    api.get('/settings')
      .then(({ data }) => {
        if (!active) return;
        setOpen(data?.settings?.allow_registration !== 'false');
      })
      .catch(() => {
        if (active) setOpen(true);
      });
    return () => { active = false; };
  }, []);

  return open;
}